/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MAIN
   Stable loading + post management
========================================== */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;
    const Feed = window.CMACommunityFeed;

    if (!Core || !Core.db || !Feed) {
        console.error("CMA Community modules not loaded.", {
            core: !!Core,
            database: !!Core?.db,
            feed: !!Feed
        });
        return;
    }

    const db = Core.db;
    const BUCKET = Core.BUCKET || "community-media";

    let currentUser = null;
    let selectedImage = null;
    let postsCache = [];
    let photoInput = null;
    let submittingPost = false;
    let eventsBound = false;

    function getRoot() {
        return Core.getRoot
            ? Core.getRoot()
            : document.getElementById("pageContent");
    }

    function getMetadata(user) {
        return user?.user_metadata || {};
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

    function notify(message, type = "info") {
        if (Core.showNotice) {
            Core.showNotice(message, type);
        } else {
            console.log(message);
        }
    }

    async function loadSession() {
        try {
            const { data, error } = await db.auth.getUser();

            if (error) throw error;

            currentUser = data?.user || null;

            if (Core.setCurrentUser) {
                Core.setCurrentUser(currentUser);
            }

            return currentUser;

        } catch (error) {
            console.error("Community session error:", error);
            currentUser = null;

            if (Core.setCurrentUser) {
                Core.setCurrentUser(null);
            }

            return null;
        }
    }

    async function ensureUser() {
        if (!currentUser) {
            await loadSession();
        }

        return currentUser;
    }

    async function syncCurrentUserProfile(user) {
        user = user || currentUser;

        if (!user?.id) return null;

        try {
            const { data: existing, error: readError } = await db
                .from("cma_community_profiles")
                .select(
                    "user_id, full_name, short_description, institution, avatar_url"
                )
                .eq("user_id", user.id)
                .maybeSingle();

            if (readError) {
                console.error("Existing profile lookup error:", readError);
            }

            const meta = getMetadata(user);

            const profileData = {
                user_id: user.id,
                full_name:
                    meta.full_name ||
                    meta.display_name ||
                    existing?.full_name ||
                    user.email?.split("@")[0] ||
                    "Community Member",
                avatar_url:
    existing?.avatar_url ||
    meta.avatar_url ||
    meta.picture ||
    meta.avatar ||
    "",
                short_description:
                    existing?.short_description || "",
                institution:
                    existing?.institution || "",
                updated_at: new Date().toISOString()
            };

            const { data, error } = await db
                .from("cma_community_profiles")
                .upsert(profileData, {
                    onConflict: "user_id"
                })
                .select(
                    "user_id, full_name, short_description, institution, avatar_url"
                )
                .single();

            if (error) {
                console.error("Profile sync error:", error);
                return existing || null;
            }

            return data;

        } catch (error) {
            console.error("Profile sync exception:", error);
            return null;
        }
    }

    async function loadPublicProfiles(userIds) {
        const profileMap = {};

        const uniqueIds = [
            ...new Set((userIds || []).filter(Boolean))
        ];

        if (!uniqueIds.length) return profileMap;

        if (
            currentUser?.id &&
            uniqueIds.includes(currentUser.id)
        ) {
            await syncCurrentUserProfile(currentUser);
        }

        try {
            const { data, error } = await db
                .from("cma_community_profiles")
                .select(
                    "user_id, full_name, short_description, institution, avatar_url"
                )
                .in("user_id", uniqueIds);

            if (error) throw error;

            (data || []).forEach(profile => {
                profileMap[profile.user_id] = profile;
            });

        } catch (error) {
            console.error("Public profile loading error:", error);
        }

        return profileMap;
    }

    function makeAuthor(userId, profileMap) {
        const profile = profileMap[userId];

        if (profile) {
            return {
                author_name: profile.full_name || "Community Member",
                avatar_url: profile.avatar_url || "",
                user_id: userId
            };
        }

        if (currentUser?.id === userId) {
            return {
                author_name: getDisplayName(currentUser),
                avatar_url: getAvatar(currentUser),
                user_id: userId
            };
        }

        return {
            author_name: "Community Member",
            avatar_url: "",
            user_id: userId
        };
    }

    function getPostList(root) {
        if (!root) return null;

        return root.querySelector(
            "#cmaFeedList, #cmaPostList, #cmaCommunityFeed, .cma-post-list"
        );
    }

    function getProfilePostList(root) {
        if (!root) return null;

        return root.querySelector(
            "#cmaProfilePosts, #cmaUserPosts, #cmaProfileTabContent .cma-profile-posts, .cma-profile-posts"
        );
    }

    function clearSelectedPhoto() {
        selectedImage = null;

        if (photoInput) {
            photoInput.value = "";
        }

        const preview = document.getElementById("cmaSelectedPhoto");

        if (preview) {
            preview.innerHTML = "";
        }
    }

    function createPhotoInput() {
        if (photoInput) return photoInput;

        photoInput = document.createElement("input");
        photoInput.type = "file";
        photoInput.accept = "image/jpeg,image/png,image/webp";
        photoInput.style.display = "none";
        photoInput.id = "cmaMainPhotoInput";

        photoInput.addEventListener("change", function () {
            const file = photoInput.files?.[0];

            if (!file) return;

            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowed.includes(file.type)) {
                notify("Only JPG, PNG and WEBP images are allowed.", "error");
                photoInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                notify("Image must be under 5MB.", "error");
                photoInput.value = "";
                return;
            }

            selectedImage = file;

            if (typeof Feed.showSelectedPhoto === "function") {
                Feed.showSelectedPhoto(file);
            }

            notify("Photo selected.", "success");
        });

        document.body.appendChild(photoInput);

        return photoInput;
    }

    const Main = {

        async init() {
            try {
                await loadSession();

                if (currentUser) {
                    await syncCurrentUserProfile(currentUser);
                }

                this.bindEvents();

                return await this.render();

            } catch (error) {
                console.error("Community initialization error:", error);
                notify("Community could not be loaded. Please refresh the page.", "error");
                throw error;
            }
        },

        async createPost(content, imageFile) {
            if (submittingPost) return false;

            submittingPost = true;

            try {
                const user = await ensureUser();

                if (!user) {
                    notify("Please login first.", "error");
                    return false;
                }

                await syncCurrentUserProfile(user);

                content = String(content || "").trim();

                if (!content && !imageFile) {
                    notify("Write something or select a photo first.", "error");
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

                    const extensions = {
                        "image/jpeg": "jpg",
                        "image/png": "png",
                        "image/webp": "webp"
                    };

                    const filePath =
                        user.id + "/" +
                        Date.now() + "." +
                        extensions[imageFile.type];

                    const { error: uploadError } = await db
                        .storage
                        .from(BUCKET)
                        .upload(filePath, imageFile, {
                            upsert: false,
                            contentType: imageFile.type
                        });

                    if (uploadError) throw uploadError;

                    const { data: publicData } = db
                        .storage
                        .from(BUCKET)
                        .getPublicUrl(filePath);

                    imageUrl = publicData?.publicUrl || "";

                    if (!imageUrl) {
                        throw new Error("Uploaded image URL is unavailable.");
                    }
                }

                const { error } = await db
                    .from("cma_community_posts")
                    .insert({
                        user_id: user.id,
                        content: content,
                        image_url: imageUrl
                    });

                if (error) throw error;

                clearSelectedPhoto();

                const input = document.getElementById("cmaPostInput");
                if (input) input.value = "";

                await this.loadPosts();

                if (window.CMACommunityProfile?.refreshPosts) {
                    await window.CMACommunityProfile.refreshPosts();
                }

                notify("Post published successfully.", "success");
                return true;

            } catch (error) {
                console.error("Create post error:", error);
                notify("Post could not be published. Please try again.", "error");
                return false;

            } finally {
                submittingPost = false;
            }
        },

        async loadPosts() {
            const root = getRoot();
            const list = getPostList(root);

            if (!list) return [];

            try {
                const { data, error } = await db
                    .from("cma_community_posts")
                    .select("*")
                    .order("created_at", {
                        ascending: false
                    });

                if (error) throw error;

                const posts = data || [];
                postsCache = posts;

                const profileMap = await loadPublicProfiles(
                    posts.map(post => post.user_id)
                );

                list.innerHTML = "";

                if (!posts.length) {
                    list.innerHTML =
                        '<p class="cma-empty-message">No posts yet.</p>';
                    return [];
                }

                posts.forEach(post => {
                    const author = makeAuthor(post.user_id, profileMap);

                    const card = Feed.createPostCard({
                        ...post,
                        ...author,
                        caption: post.content || "",
                        image_url: post.image_url || "",
                        created_at: post.created_at,
                        is_owner: currentUser?.id === post.user_id
                    });

                    if (card) {
                        if (typeof card === "string") {
                            list.insertAdjacentHTML("beforeend", card);
                        } else {
                            list.appendChild(card);
                        }
                    }
                });

                if (Feed.loadRandomComment) {
                    posts.forEach(post => {
                        Feed.loadRandomComment(post.id);
                    });
                }

                return posts;

            } catch (error) {
                console.error("Posts loading error:", error);

                list.innerHTML =
                    '<p class="cma-empty-message">Unable to load posts.</p>';

                throw error;
            }
        },
                async loadUserPosts(user, root) {
            user = user || currentUser;

            if (!user) {
                user = await ensureUser();
            }

            root = root || getRoot();

            if (!user || !root) return [];

            if (currentUser?.id === user.id) {
                await syncCurrentUserProfile(user);
            }

            const postsContainer = getProfilePostList(root);

            if (!postsContainer) return [];

            try {
                const { data, error } = await db
                    .from("cma_community_posts")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", {
                        ascending: false
                    });

                if (error) throw error;

                const posts = data || [];
                postsContainer.innerHTML = "";

                if (!posts.length) {
                    postsContainer.innerHTML =
                        '<p class="cma-empty-message">No posts yet.</p>';
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
                        created_at: post.created_at,
                        is_owner: currentUser?.id === post.user_id
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

                if (Feed.loadRandomComment) {
                    posts.forEach(post => {
                        Feed.loadRandomComment(post.id);
                    });
                }

                if (Feed.bindEvents) {
                    Feed.bindEvents(root);
                }

                return posts;

            } catch (error) {
                console.error("User posts loading error:", error);

                postsContainer.innerHTML =
                    '<p class="cma-empty-message">Unable to load posts.</p>';

                return [];
            }
        },

        async updatePost(postId, content) {
            const user = await ensureUser();

            if (!user || !postId) {
                notify("Post could not be identified.", "error");
                return false;
            }

            content = String(content || "").trim();

            if (!content) {
                notify("Post cannot be empty.", "error");
                return false;
            }

            try {
                const { data, error } = await db
                    .from("cma_community_posts")
                    .update({
                        content: content
                    })
                    .eq("id", postId)
                    .eq("user_id", user.id)
                    .select("id");

                if (error) throw error;

                if (!data || data.length === 0) {
                    notify("Post was not updated. Check ownership or permissions.", "error");
                    return false;
                }

                await this.loadPosts();

                if (window.CMACommunityProfile?.refreshPosts) {
                    await window.CMACommunityProfile.refreshPosts();
                }

                notify("Post updated successfully.", "success");
                return true;

            } catch (error) {
                console.error("Update post error:", error);
                notify("Post could not be updated.", "error");
                return false;
            }
        },

        async deletePost(postId) {
            const user = await ensureUser();

            if (!user || !postId) {
                notify("Post could not be identified.", "error");
                return false;
            }

            try {
                const { data, error } = await db
                    .from("cma_community_posts")
                    .delete()
                    .eq("id", postId)
                    .eq("user_id", user.id)
                    .select("id");

                if (error) throw error;

                if (!data || data.length === 0) {
                    notify("Post was not deleted. Check ownership or permissions.", "error");
                    return false;
                }

                postsCache = postsCache.filter(
                    post => post.id !== postId
                );

                document.querySelectorAll("[data-post-id]").forEach(card => {
                    if (card.dataset.postId === postId) {
                        card.remove();
                    }
                });

                await this.loadPosts();

                if (window.CMACommunityProfile?.refreshPosts) {
                    await window.CMACommunityProfile.refreshPosts();
                }

                notify("Post deleted successfully.", "success");
                return true;

            } catch (error) {
                console.error("Delete post error:", error);
                notify("Post could not be deleted. Check Supabase permissions.", "error");
                return false;
            }
        },

        async render() {
            const root = getRoot();

            if (!root) {
                console.error("Community root element was not found.");
                return false;
            }

            try {
                if (Feed.renderHome) {
                    await Feed.renderHome(root);
                }

                await this.loadPosts();
                return true;

            } catch (error) {
                console.error("Community render error:", error);

                root.innerHTML =
                    '<div class="cma-empty-message">Community could not be loaded. Please refresh the page.</div>';

                return false;
            }
        },

        bindEvents() {
            if (eventsBound) return;

            eventsBound = true;

            createPhotoInput();

            document.addEventListener(
                "cma:submit-post",
                async event => {
                    const detail = event.detail || {};

                    const content =
                        detail.content ??
                        document.querySelector(
                            "#cmaPostContent, #cmaPostInput, [name='post_content']"
                        )?.value ??
                        "";

                    const image = detail.image || selectedImage;

                    await this.createPost(content, image);
                }
            );

            document.addEventListener(
                "cma:select-photo",
                async event => {
                    if (event.detail?.file) {
                        selectedImage = event.detail.file;

                        if (Feed.showSelectedPhoto) {
                            Feed.showSelectedPhoto(selectedImage);
                        }

                        return;
                    }

                    const user = await ensureUser();

                    if (!user) {
                        notify("Please login first.", "error");
                        return;
                    }

                    createPhotoInput().click();
                }
            );

            document.addEventListener(
                "cma:remove-photo",
                () => {
                    clearSelectedPhoto();
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

            document.addEventListener(
                "cma:update-post",
                async event => {
                    const postId = event.detail?.postId;
                    const content = event.detail?.content;

                    if (postId) {
                        await this.updatePost(postId, content);
                    }
                }
            );
        },

        getModules() {
            return {
                core: Core,
                feed: Feed,
                main: Main
            };
        },

        getPostsCache() {
            return postsCache.slice();
        },

        syncCurrentUserProfile
    };

    window.CMACommunityMain = Main;

    window.renderCommunityPage = function () {
        return Main.init();
    };

})();
