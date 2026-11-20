
/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY CREATOR PANEL
   Role-secured publishing
========================================== */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;
    const Feed = window.CMACommunityFeed;

    if (!Core?.db || !Feed) {
        console.error("Creator Panel dependencies unavailable.");
        return;
    }

    const db = Core.db;
    const BUCKET = Core.BUCKET || "community-media";

    let currentUser = null;
    let creatorRole = null;
    let selectedImage = null;
    let submitting = false;

    const escapeHTML = Core.escapeHTML;

    function notice(message, type = "info") {
        Core.showNotice(message, type);
    }

    async function loadRole() {
        const { data, error } = await db
            .from("community_creator_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Creator role error:", error);
            throw error;
        }

        const allowed = ["admin", "developer", "moderator"];

        creatorRole = allowed.includes(data?.role)
            ? data.role
            : null;

        return creatorRole;
    }

    function styles() {
        return `
        <style>
        .cma-creator-page {
            padding: 16px;
            color: #fff;
        }

        .cma-creator-heading {
            margin: 0 0 5px;
            font-size: 21px;
        }

        .cma-creator-subtitle {
            color: #9FB0D0;
            font-size: 13px;
            margin-bottom: 20px;
        }

        .cma-creator-role {
            display: inline-block;
            padding: 6px 11px;
            border-radius: 20px;
            background: #0F1D3F;
            color: #7DB1FF;
            font-size: 12px;
            margin-bottom: 16px;
            text-transform: capitalize;
        }

        .cma-creator-composer {
            background: #0E1A36;
            border-radius: 16px;
            padding: 14px;
            margin-bottom: 22px;
        }

        .cma-creator-composer textarea {
            display: block;
            width: 100%;
            min-height: 105px;
            resize: vertical;
            box-sizing: border-box;
            border: 0;
            outline: none;
            border-radius: 11px;
            padding: 12px;
            background: #070D1F;
            color: white;
            font: inherit;
        }

        .cma-creator-composer textarea::placeholder {
            color: #9FB0D0;
        }

        .cma-creator-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 12px;
            flex-wrap: wrap;
        }

        .cma-creator-toolbar button {
            border: 0;
            border-radius: 10px;
            padding: 10px 14px;
            font-weight: 700;
            cursor: pointer;
        }

        .cma-creator-photo {
            background: #1F3263;
            color: white;
        }

        .cma-creator-publish {
            background: #3B82F6;
            color: #FFFFFF;
        }

        .cma-creator-publish:disabled {
            opacity: .5;
            cursor: not-allowed;
        }

        .cma-creator-preview img {
            max-width: 100%;
            max-height: 220px;
            object-fit: contain;
            border-radius: 12px;
            margin-top: 12px;
        }

        .cma-creator-remove {
            display: block;
            margin-top: 7px;
            background: transparent;
            color: #ffaaaa;
            border: 0;
        }

        .cma-creator-section-title {
            font-size: 16px;
            margin: 22px 0 12px;
        }

        .cma-creator-empty {
            color: #9FB0D0;
            font-size: 13px;
            padding: 15px 0;
        }

        .cma-creator-access {
            padding: 16px;
            border-bottom: 1px solid #1F3263;
            color: #9FB0D0;
            font-size: 13px;
            margin-bottom: 18px;
        }
        </style>
        `;
    }

    function renderCard(post, profile) {
        const card = Feed.createPostCard({
            ...post,
            caption: post.content || "",
            image_url: post.image_url || "",
            author_name: profile?.full_name || "Community Member",
            avatar_url: profile?.avatar_url || "",
            user_id: post.user_id,
            created_at: post.created_at
        });

        return typeof card === "string" ? card : "";
    }

    async function loadCreatorPosts(root) {
        const list = root.querySelector("#cmaCreatorPostList");

        if (!list) return;

        list.innerHTML =
            `<p class="cma-creator-empty">Loading posts...</p>`;

        const { data: posts, error } = await db
            .from("cma_community_posts")
            .select("*")
            .eq("post_scope", "creator_panel")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Creator posts error:", error);
            list.innerHTML =
                `<p class="cma-creator-empty">
                    Creator posts could not be loaded.
                 </p>`;
            return;
        }

        if (!posts?.length) {
            list.innerHTML =
                `<p class="cma-creator-empty">
                    No Creator Panel posts yet.
                 </p>`;
            return;
        }

        const userIds = [
            ...new Set(posts.map(post => post.user_id))
        ];

        const { data: profiles, error: profileError } = await db
            .from("cma_community_profiles")
            .select("user_id,full_name,avatar_url")
            .in("user_id", userIds);

        if (profileError) {
            console.error("Creator profile error:", profileError);
        }

        const profileMap = {};

        (profiles || []).forEach(profile => {
            profileMap[profile.user_id] = profile;
        });

        list.innerHTML = posts
            .map(post => renderCard(
                post,
                profileMap[post.user_id]
            ))
            .join("");

        if (Feed.loadRandomComment) {
            posts.forEach(post => {
                Feed.loadRandomComment(post.id);
            });
        }
    }

    async function publishPost(root) {
        if (submitting) return;

        if (!Core.requireLogin()) return;

        if (!creatorRole) {
            notice("You do not have Creator Panel permission.", "error");
            return;
        }

        const input = root.querySelector("#cmaCreatorContent");
        const content = input?.value.trim() || "";

        if (!content && !selectedImage) {
            notice("Write something or select a photo first.", "error");
            return;
        }

        submitting = true;

        const publishButton = root.querySelector(
            "#cmaCreatorPublish"
        );

        if (publishButton) publishButton.disabled = true;

        let uploadedPath = null;

        try {
            let imageUrl = "";

            if (selectedImage) {
                const extensions = {
                    "image/jpeg": "jpg",
                    "image/png": "png",
                    "image/webp": "webp"
                };

                const extension = extensions[selectedImage.type];

                if (!extension) {
                    throw new Error("Only JPG, PNG and WEBP are allowed.");
                }

                if (selectedImage.size > 5 * 1024 * 1024) {
                    throw new Error("Image must be under 5MB.");
                }

                uploadedPath =
                    currentUser.id + "/" +
                    Date.now() + "." + extension;

                const { error: uploadError } = await db
                    .storage
                    .from(BUCKET)
                    .upload(uploadedPath, selectedImage, {
                        upsert: false,
                        contentType: selectedImage.type
                    });

                if (uploadError) throw uploadError;

                const { data: publicData } = db
                    .storage
                    .from(BUCKET)
                    .getPublicUrl(uploadedPath);

                imageUrl = publicData?.publicUrl || "";

                if (!imageUrl) {
                    throw new Error("Image URL could not be created.");
                }
            }

            const { error } = await db
                .from("cma_community_posts")
                .insert({
                    user_id: currentUser.id,
                    content: content,
                    image_url: imageUrl,
                    post_scope: "creator_panel"
                });

            if (error) throw error;

            input.value = "";
            selectedImage = null;

            const preview = root.querySelector(
                "#cmaCreatorPreview"
            );

            if (preview) preview.innerHTML = "";

            const fileInput = root.querySelector(
                "#cmaCreatorPhotoInput"
            );

            if (fileInput) fileInput.value = "";

            notice("Creator post published successfully.", "success");

            await loadCreatorPosts(root);

        } catch (error) {
            console.error("Creator publishing error:", error);

            if (uploadedPath) {
                await db.storage
                    .from(BUCKET)
                    .remove([uploadedPath]);
            }

            notice(
                error.message || "Creator post could not be published.",
                "error"
            );

        } finally {
            submitting = false;

            if (publishButton) {
                publishButton.disabled = false;
            }
        }
    }

    function bindEvents(root) {
        if (root.dataset.cmaCreatorBound === "true") return;

        root.dataset.cmaCreatorBound = "true";

        root.addEventListener("submit", async event => {
            if (event.target.id !== "cmaCreatorForm") return;

            event.preventDefault();
            await publishPost(root);
        });

        root.addEventListener("change", event => {
            if (event.target.id !== "cmaCreatorPhotoInput") return;

            const file = event.target.files?.[0];

            if (!file) return;

            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowed.includes(file.type)) {
                notice("Only JPG, PNG and WEBP images are allowed.", "error");
                event.target.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                notice("Image must be under 5MB.", "error");
                event.target.value = "";
                return;
            }

            selectedImage = file;

            const preview = root.querySelector(
                "#cmaCreatorPreview"
            );

            const objectURL = URL.createObjectURL(file);

            preview.innerHTML = `
                <img src="${objectURL}" alt="Selected photo">
                <button type="button"
                    class="cma-creator-remove"
                    id="cmaCreatorRemovePhoto">
                    Remove photo
                </button>
            `;
        });

        root.addEventListener("click", event => {
            if (event.target.id === "cmaCreatorRemovePhoto") {
                selectedImage = null;

                const fileInput = root.querySelector(
                    "#cmaCreatorPhotoInput"
                );

                if (fileInput) fileInput.value = "";

                root.querySelector(
                    "#cmaCreatorPreview"
                ).innerHTML = "";
            }
        });
    }

    async function deleteCreatorPost(postId) {
        if (!currentUser || !postId) return;

        const { error } = await db
            .from("cma_community_posts")
            .delete()
            .eq("id", postId)
            .eq("user_id", currentUser.id)
            .eq("post_scope", "creator_panel");

        if (error) {
            console.error("Creator post delete:", error);
            notice("Post could not be deleted.", "error");
            return;
        }

        notice("Creator post deleted.", "success");

        const root = Core.getRoot();
        if (root) await loadCreatorPosts(root);
    }

    if (!window.cmaCreatorDeleteBound) {
        window.cmaCreatorDeleteBound = true;

        document.addEventListener("cma:delete-post", event => {
            const postId = event.detail?.postId || event.detail?.id;

            if (postId) {
                deleteCreatorPost(postId);
            }
        });
    }

    async function render(root) {
        root = root || Core.getRoot();

        if (!root) return;

        selectedImage = null;

        const session = await Core.loadSession();
        currentUser = session?.user || null;

        if (!currentUser) {
            root.innerHTML = `
                <main class="cma-community">
                    <div class="cma-creator-page">
                        Please log in to open Creator Panel.
                    </div>
                </main>
            `;
            return;
        }

        try {
            await loadRole();
        } catch (error) {
            root.innerHTML = `
                <main class="cma-community">
                    <div class="cma-creator-page">
                        Creator permissions could not be checked.
                        Please refresh and try again.
                    </div>
                </main>
            `;
            return;
        }

        root.innerHTML = `
            <main class="cma-community">
                ${styles()}

                <div class="cma-creator-page">
                    <h2 class="cma-creator-heading">
                        Creator Panel
                    </h2>

                    <p class="cma-creator-subtitle">
                        Community publishing space
                    </p>

                    ${
                        creatorRole
                        ? `
                            <span class="cma-creator-role">
                                ${escapeHTML(creatorRole)}
                            </span>

                            <form class="cma-creator-composer"
                                id="cmaCreatorForm">

                                <textarea
                                    id="cmaCreatorContent"
                                    placeholder="Write something for the Creator Panel..."
                                ></textarea>

                                <input
                                    type="file"
                                    id="cmaCreatorPhotoInput"
                                    accept="image/jpeg,image/png,image/webp"
                                    hidden
                                >

                                <div id="cmaCreatorPreview"
                                    class="cma-creator-preview"></div>

                                <div class="cma-creator-toolbar">
                                    <button type="button"
                                        class="cma-creator-photo"
                                        id="cmaCreatorChoosePhoto">
                                        ▧ Photo
                                    </button>

                                    <button type="submit"
                                        class="cma-creator-publish"
                                        id="cmaCreatorPublish">
                                        Publish
                                    </button>
                                </div>
                            </form>
                        `
                        : `
                            <div class="cma-creator-access">
                                You can view Creator Panel posts, but
                                publishing is limited to Admin,
                                Developer and Moderator.
                            </div>
                        `
                    }

                    <h3 class="cma-creator-section-title">
                        Creator Posts
                    </h3>

                    <section id="cmaCreatorPostList"></section>
                </div>

                <div id="cmaCommentsLayer"></div>
                <div id="cmaPostMenuLayer"></div>
            </main>
        `;

        bindEvents(root);

        if (creatorRole) {
            root.querySelector(
                "#cmaCreatorChoosePhoto"
            ).addEventListener("click", () => {
                root.querySelector(
                    "#cmaCreatorPhotoInput"
                ).click();
            });
        }

        if (Feed.bindEvents) {
            Feed.bindEvents(root);
        }

        await loadCreatorPosts(root);
    }

    window.CMACommunityCreator = {
        render,
        refresh: loadCreatorPosts
    };

})();
