
/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MAIN - PART 1
   Fix: Post Author Name, Avatar & Own Posts
========================================== */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;
    const Feed = window.CMACommunityFeed;

    if (!Core || !Core.db || !Feed) {
        console.error("CMA Community modules not loaded.");
        return;
    }

    const db = Core.db;
    const BUCKET = Core.BUCKET || "community-media";

    let currentUser = null;
    let selectedImage = null;
    let postsCache = [];

    function getRoot() {
        return Core.getRoot
            ? Core.getRoot()
            : document.getElementById("pageContent");
    }

    function getMetadata(user) {
        return user && user.user_metadata
            ? user.user_metadata
            : {};
    }

    function getDisplayName(user) {
        const meta = getMetadata(user);

        return (
            meta.full_name ||
            meta.display_name ||
            user?.email?.split("@")[0] ||
            "Community Member"
        );
    }

    function getAvatar(user) {
        const meta = getMetadata(user);

        return (
            meta.avatar_url ||
            meta.picture ||
            meta.avatar ||
            ""
        );
    }

    function notify(message, type) {
        if (Core.showNotice) {
            Core.showNotice(message, type || "info");
        } else {
            console.log(message);
        }
    }

    async function loadSession() {
        const result = await db.auth.getUser();

        if (result.error) {
            console.error(result.error);
            return null;
        }

        currentUser = result.data.user || null;

        if (Core.setCurrentUser) {
            Core.setCurrentUser(currentUser);
        }

        return currentUser;
    }

    async function loadPublicProfiles(userIds) {
        const profileMap = {};

        const uniqueIds = [...new Set(
            (userIds || []).filter(Boolean)
        )];

        if (!uniqueIds.length) return profileMap;

        const { data, error } = await db
            .from("cma_community_profiles")
            .select("user_id, full_name, short_description, institution, avatar_url")
            .in("user_id", uniqueIds);

        if (error) {
            console.error("Profile loading error:", error);
            return profileMap;
        }

        (data || []).forEach(profile => {
            profileMap[profile.user_id] = profile;
        });

        return profileMap;
    }

    function makeAuthor(userId, profileMap) {
        const profile = profileMap[userId];

        if (profile) {
            return {
                author_name:
                    profile.full_name || "Community Member",
                author_avatar:
                    profile.avatar_url || "",
                user_id: userId
            };
        }

        if (currentUser && currentUser.id === userId) {
            return {
                author_name: getDisplayName(currentUser),
                author_avatar: getAvatar(currentUser),
                user_id: userId
            };
        }

        return {
            author_name: "Community Member",
            author_avatar: "",
            user_id: userId
        };
    }

    const Main = {

        async init() {
            await loadSession();
            this.bindEvents();
            return this.render();
        },

        async createPost(content, imageFile) {
            if (!currentUser) {
                await loadSession();
            }

            if (!currentUser) {
                notify("Please login first.", "error");
                return false;
            }

            let imageUrl = "";

            if (imageFile) {
                const allowed = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowed.includes(imageFile.type)) {
                    notify("Only JPG, PNG and WEBP images are allowed.", "error");
                    return false;
                }

                if (imageFile.size > 5 * 1024 * 1024) {
                    notify("Image must be under 5MB.", "error");
                    return false;
                }

                const extension =
                    imageFile.name.split(".").pop() || "jpg";

                const filePath =
                    currentUser.id + "/" +
                    Date.now() + "." + extension;

                const { error: uploadError } = await db
                    .storage
                    .from(BUCKET)
                    .upload(filePath, imageFile, {
                        upsert: false,
                        contentType: imageFile.type
                    });

                if (uploadError) {
                    console.error(uploadError);
                    notify("Image upload failed.", "error");
                    return false;
                }

                const { data: publicData } = db
                    .storage
                    .from(BUCKET)
                    .getPublicUrl(filePath);

                imageUrl = publicData?.publicUrl || "";
            }

            const { error } = await db
                .from("cma_community_posts")
                .insert({
                    user_id: currentUser.id,
                    content: content || "",
                    image_url: imageUrl
                });

            if (error) {
                console.error(error);
                notify("Post could not be published.", "error");
                return false;
            }

            selectedImage = null;
            await this.loadPosts();

            if (window.CMACommunityProfile?.loadUserPosts) {
                await window.CMACommunityProfile.loadUserPosts();
            }

            notify("Post published successfully.", "success");
            return true;
        },

        async loadPosts() {
            const root = getRoot();

            if (!root) return [];

            const list = root.querySelector(
                "#cmaPostList, #cmaCommunityFeed, .cma-post-list"
            );

            if (!list) return [];

            const { data, error } = await db
                .from("cma_community_posts")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

            if (error) {
                console.error("Posts loading error:", error);
                list.innerHTML =
                    '<p class="cma-empty-message">Unable to load posts.</p>';
                return [];
            }

            const posts = data || [];
            postsCache = posts;

            const userIds = posts.map(post => post.user_id);
            const profileMap = await loadPublicProfiles(userIds);

            list.innerHTML = "";

            if (!posts.length) {
                list.innerHTML =
                    '<p class="cma-empty-message">No posts yet.</p>';
                return [];
            }

            posts.forEach(post => {
                const author = makeAuthor(
                    post.user_id,
                    profileMap
                );

                const card = Feed.createPostCard({
                    ...post,
                    ...author,
                    caption: post.content || "",
                    image_url: post.image_url || "",
                    created_at: post.created_at,
                    is_owner:
                        currentUser?.id === post.user_id
                });

                if (card) {
                    if (typeof card === "string") {
                        list.insertAdjacentHTML("beforeend", card);
                    } else {
                        list.appendChild(card);
                    }
                }
            });

            // Part 2 continues here.

            // Load reaction counts and comment previews
            if (Feed.loadReactionCounts) {
                posts.forEach(post => {
                    Feed.loadReactionCounts(post.id);
                });
            }

            if (Feed.loadRandomComment) {
                posts.forEach(post => {
                    Feed.loadRandomComment(post.id);
                });
            }

            return posts;
        },

        async loadUserPosts(user, root) {
            user = user || currentUser;

            if (!user) {
                user = await loadSession();
            }

            root = root || getRoot();

            if (!user || !root) return [];

            const postsContainer = root.querySelector(
                "#cmaProfilePosts, #cmaUserPosts, .cma-profile-posts"
            );

            if (!postsContainer) return [];

            const { data, error } = await db
                .from("cma_community_posts")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: false
                });

            if (error) {
                console.error("User posts loading error:", error);
                return [];
            }

            const posts = data || [];

            postsContainer.innerHTML = "";

            if (!posts.length) {
                postsContainer.innerHTML =
                    '<p class="cma-empty-message">You have not published any posts yet.</p>';
                return [];
            }

            const profileMap = await loadPublicProfiles([user.id]);

            posts.forEach(post => {
                const author = makeAuthor(user.id, profileMap);

                const card = Feed.createPostCard({
                    ...post,
                    ...author,
                    caption: post.content || "",
                    image_url: post.image_url || "",
                    is_owner: true
                });

                if (card) {
                    if (typeof card === "string") {
                        postsContainer.insertAdjacentHTML(
                            "beforeend",
                            card
                        );
                    } else {
                        postsContainer.appendChild(card);
                    }
                }
            });

            if (Feed.loadReactionCounts) {
                posts.forEach(post => {
                    Feed.loadReactionCounts(post.id);
                });
            }

            if (Feed.loadRandomComment) {
                posts.forEach(post => {
                    Feed.loadRandomComment(post.id);
                });
            }

            return posts;
        },

        async deletePost(postId) {
            if (!currentUser) {
                await loadSession();
            }

            if (!currentUser || !postId) return false;

            const { error } = await db
                .from("cma_community_posts")
                .delete()
                .eq("id", postId)
                .eq("user_id", currentUser.id);

            if (error) {
                console.error("Delete post error:", error);
                notify("Post could not be deleted.", "error");
                return false;
            }

            await this.loadPosts();

            if (window.CMACommunityProfile?.loadUserPosts) {
                await window.CMACommunityProfile.loadUserPosts();
            }

            notify("Post deleted.", "success");
            return true;
        },

        bindEvents() {
            if (this.eventsBound) return;
            this.eventsBound = true;

            document.addEventListener(
                "cma:submit-post",
                async event => {
                    const detail = event.detail || {};

                    const content =
                        detail.content ||
                        document.querySelector(
                            "#cmaPostContent, #cmaPostInput, [name='post_content']"
                        )?.value ||
                        "";

                    const image =
                        detail.image ||
                        selectedImage;

                    await this.createPost(content, image);
                }
            );

            document.addEventListener(
                "cma:select-photo",
                event => {
                    selectedImage =
                        event.detail?.file || null;
                }
            );

            document.addEventListener(
                "cma:delete-post",
                async event => {
                    const postId =
                        event.detail?.postId ||
                        event.detail?.id;

                    if (postId) {
                        await this.deletePost(postId);
                    }
                }
            );
        },

        async render() {
            const root = getRoot();

            if (!root) return;

            if (Feed.renderHome) {
                await Feed.renderHome(root);
            }

            await this.loadPosts();
        },

        getModules() {
            return {
                core: Core,
                feed: Feed,
                main: Main
            };
        }
    };

    window.CMACommunityMain = Main;

    window.renderCommunityPage = function () {
        return Main.init();
    };

})();
                    
