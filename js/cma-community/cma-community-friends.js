
/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY FRIENDS SYSTEM
   Friend Requests + Friends List
========================================== */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;

    if (!Core || !Core.db) {
        console.error("Community Core unavailable.");
        return;
    }

    const db = Core.db;

    let currentUser = null;
    let searchTimer = null;

    const escapeHTML = Core.escapeHTML;

    function notice(message, type = "info") {
        Core.showNotice(message, type);
    }

    function profileURL(userId) {
        return `
            <button
                type="button"
                class="cma-friend-profile"
                data-friend-profile="${escapeHTML(userId)}"
            >
                View Profile
            </button>
        `;
    }

    async function loadProfiles(ids) {
        const uniqueIds = [...new Set(ids.filter(Boolean))];

        if (!uniqueIds.length) return {};

        const { data, error } = await db
            .from("cma_community_profiles")
            .select(
                "user_id,full_name,avatar_url,short_description"
            )
            .in("user_id", uniqueIds);

        if (error) {
            console.error("Friend profiles:", error);
            return {};
        }

        const map = {};

        (data || []).forEach(profile => {
            map[profile.user_id] = profile;
        });

        return map;
    }

    function memberCard(profile, userId, actions = "") {
        const name = escapeHTML(
            profile?.full_name || "Community Member"
        );

        const avatar = Core.safeImageURL(
            profile?.avatar_url || ""
        );

        return `
            <article class="cma-friend-card">
                <div class="cma-friend-identity">
                    ${
                        avatar
                        ? `<img src="${avatar}" alt="">`
                        : `<div class="cma-friend-avatar">👤</div>`
                    }

                    <div class="cma-friend-info">
                        <strong>${name}</strong>
                        <span>
                            ${escapeHTML(
                                profile?.short_description || ""
                            )}
                        </span>
                    </div>
                </div>

                <div class="cma-friend-actions">
                    ${actions}
                    ${profileURL(userId)}
                </div>
            </article>
        `;
    }

    function styles() {
        return `
        <style>
        .cma-friends-page {
            padding: 16px;
            color: #fff;
        }

        .cma-friends-page h2 {
            margin: 0 0 16px;
            font-size: 21px;
        }

        .cma-friends-section {
            margin-top: 24px;
        }

        .cma-friends-section h3 {
            font-size: 16px;
            margin: 0 0 12px;
        }

        .cma-friend-search {
            display: flex;
            gap: 8px;
            margin-bottom: 14px;
        }

        .cma-friend-search input {
            min-width: 0;
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #245563;
            background: #052D3B;
            color: white;
            outline: none;
        }

        .cma-friend-card {
            padding: 13px 0;
            border-bottom: 1px solid #245563;
        }

        .cma-friend-identity {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .cma-friend-identity img,
        .cma-friend-avatar {
            width: 46px;
            height: 46px;
            flex-shrink: 0;
            border-radius: 50%;
            object-fit: cover;
            background: #08494B;
        }

        .cma-friend-avatar {
            display: grid;
            place-items: center;
        }

        .cma-friend-info {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .cma-friend-info span {
            color: #A8C0CE;
            font-size: 12px;
        }

        .cma-friend-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
        }

        .cma-friend-actions button,
        .cma-friend-search button {
            border: 0;
            border-radius: 9px;
            padding: 9px 13px;
            background: #08C99A;
            color: #052D3B;
            font-weight: 700;
            cursor: pointer;
        }

        .cma-friend-actions .secondary {
            background: #245563;
            color: white;
        }

        .cma-friend-profile {
            background: transparent !important;
            color: #68DDB9 !important;
            padding-left: 0 !important;
        }

        .cma-friends-empty {
            padding: 15px 0;
            color: #A8C0CE;
            font-size: 13px;
        }

        .cma-friends-message {
            color: #A8C0CE;
            font-size: 13px;
            padding: 10px 0;
        }
        </style>
        `;
    }

    async function getRelationships(userId) {
        const { data, error } = await db
            .from("cma_community_friendships")
            .select(
                "id,requester_id,addressee_id,status,created_at"
            )
            .or(
                `requester_id.eq.${userId},addressee_id.eq.${userId}`
            )
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data || [];
    }

    async function render(root) {
        root = root || Core.getRoot();

        if (!root) return;

        const session = await Core.loadSession();
        currentUser = session?.user || null;

        if (!currentUser) {
            root.innerHTML = `
                <main class="cma-community">
                    <div class="cma-friends-page">
                        Please log in to use Friends.
                    </div>
                </main>
            `;
            return;
        }

        root.innerHTML = `
            <main class="cma-community">
                ${styles()}

                <div class="cma-friends-page">
                    <h2>Friends</h2>

                    <form class="cma-friend-search"
                        id="cmaFriendSearchForm">

                        <input
                            id="cmaFriendSearchInput"
                            type="search"
                            placeholder="Search community members..."
                            autocomplete="off"
                        >

                        <button type="submit">Search</button>
                    </form>

                    <div id="cmaFriendSearchResults"></div>

                    <section class="cma-friends-section">
                        <h3>Friend Requests</h3>
                        <div id="cmaIncomingRequests"></div>
                    </section>

                    <section class="cma-friends-section">
                        <h3>Sent Requests</h3>
                        <div id="cmaOutgoingRequests"></div>
                    </section>

                    <section class="cma-friends-section">
                        <h3>My Friends</h3>
                        <div id="cmaAcceptedFriends"></div>
                    </section>
                </div>
            </main>
        `;

        bindEvents(root);
        await refresh(root);
    }

    async function refresh(root) {
        const incomingBox =
            root.querySelector("#cmaIncomingRequests");

        const outgoingBox =
            root.querySelector("#cmaOutgoingRequests");

        const friendsBox =
            root.querySelector("#cmaAcceptedFriends");

        incomingBox.innerHTML =
            `<p class="cma-friends-message">Loading...</p>`;

        outgoingBox.innerHTML =
            `<p class="cma-friends-message">Loading...</p>`;

        friendsBox.innerHTML =
            `<p class="cma-friends-message">Loading...</p>`;

        try {
            const rows = await getRelationships(currentUser.id);

            const incoming = rows.filter(row =>
                row.status === "pending" &&
                row.addressee_id === currentUser.id
            );

            const outgoing = rows.filter(row =>
                row.status === "pending" &&
                row.requester_id === currentUser.id
            );

            const friends = rows.filter(row =>
                row.status === "accepted"
            );

            const ids = rows.map(row =>
                row.requester_id === currentUser.id
                    ? row.addressee_id
                    : row.requester_id
            );

            const profiles = await loadProfiles(ids);

            incomingBox.innerHTML = incoming.length
                ? incoming.map(row => {
                    const id = row.requester_id;

                    return memberCard(
                        profiles[id],
                        id,
                        `
                        <button
                            data-friend-accept="${row.id}"
                        >Accept</button>

                        <button
                            class="secondary"
                            data-friend-delete="${row.id}"
                        >Delete</button>
                        `
                    );
                }).join("")
                : `<p class="cma-friends-empty">
                    No new friend requests.
                   </p>`;

            outgoingBox.innerHTML = outgoing.length
                ? outgoing.map(row => {
                    const id = row.addressee_id;

                    return memberCard(
                        profiles[id],
                        id,
                        `
                        <button
                            class="secondary"
                            data-friend-delete="${row.id}"
                        >Cancel Request</button>
                        `
                    );
                }).join("")
                : `<p class="cma-friends-empty">
                    No sent requests.
                   </p>`;

            friendsBox.innerHTML = friends.length
                ? friends.map(row => {
                    const id =
                        row.requester_id === currentUser.id
                            ? row.addressee_id
                            : row.requester_id;

                    return memberCard(
                        profiles[id],
                        id,
                        `
                        <button
                            class="secondary"
                            data-friend-delete="${row.id}"
                        >Remove Friend</button>
                        `
                    );
                }).join("")
                : `<p class="cma-friends-empty">
                    You have no friends yet.
                   </p>`;

        } catch (error) {
            console.error("Friends loading:", error);

            incomingBox.innerHTML =
                `<p class="cma-friends-message">
                    Could not load friend requests.
                 </p>`;

            outgoingBox.innerHTML = "";
            friendsBox.innerHTML = "";
        }
    }

    async function searchMembers(root, query) {
        const box =
            root.querySelector("#cmaFriendSearchResults");

        if (!query || query.length < 2) {
            box.innerHTML =
                `<p class="cma-friends-empty">
                    Enter at least 2 characters.
                 </p>`;
            return;
        }

        box.innerHTML =
            `<p class="cma-friends-message">Searching...</p>`;

        const { data, error } = await db
            .from("cma_community_profiles")
            .select(
                "user_id,full_name,avatar_url,short_description"
            )
            .ilike("full_name", `%${query}%`)
            .neq("user_id", currentUser.id)
            .limit(20);

        if (error) {
            console.error(error);
            box.innerHTML =
                `<p class="cma-friends-empty">
                    Search failed. Please try again.
                 </p>`;
            return;
        }

        const results = data || [];

        if (!results.length) {
            box.innerHTML =
                `<p class="cma-friends-empty">
                    No members found.
                 </p>`;
            return;
        }

        const relationships =
            await getRelationships(currentUser.id);

        box.innerHTML = results.map(profile => {
            const existing = relationships.find(row =>
                row.requester_id === profile.user_id ||
                row.addressee_id === profile.user_id
            );

            let action = "";

            if (!existing) {
                action = `
                    <button
                        data-friend-add="${profile.user_id}"
                    >Add Friend</button>
                `;
            } else if (existing.status === "accepted") {
                action = `
                    <span class="cma-friends-message">
                        Already Friends
                    </span>
                `;
            } else {
                action = `
                    <span class="cma-friends-message">
                        Request Pending
                    </span>
                `;
            }

            return memberCard(
                profile,
                profile.user_id,
                action
            );
        }).join("");
    }

    function bindEvents(root) {
        if (root.dataset.cmaFriendsBound === "true") return;

        root.dataset.cmaFriendsBound = "true";

        root.addEventListener("submit", async event => {
            if (event.target.id !== "cmaFriendSearchForm") {
                return;
            }

            event.preventDefault();

            const query = root.querySelector(
                "#cmaFriendSearchInput"
            ).value.trim();

            await searchMembers(root, query);
        });

        root.addEventListener("click", async event => {
            const button = event.target.closest("button");

            if (!button) return;

            const profileId = button.dataset.friendProfile;

            if (profileId) {
                window.dispatchEvent(
                    new CustomEvent("cma:navigate", {
                        detail: {
                            page: "profile",
                            userId: profileId
                        }
                    })
                );
                return;
            }

            const addId = button.dataset.friendAdd;

            if (addId) {
                button.disabled = true;

                const { error } = await db
                    .from("cma_community_friendships")
                    .insert({
                        requester_id: currentUser.id,
                        addressee_id: addId,
                        status: "pending"
                    });

                if (error) {
                    console.error(error);
                    notice(
                        "Could not send request. Please try again.",
                        "error"
                    );
                } else {
                    notice("Friend request sent.", "success");
                    await refresh(root);

                    const query = root.querySelector(
                        "#cmaFriendSearchInput"
                    ).value.trim();

                    await searchMembers(root, query);
                }

                button.disabled = false;
                return;
            }

            const acceptId = button.dataset.friendAccept;

            if (acceptId) {
                button.disabled = true;

                const { error } = await db
                    .from("cma_community_friendships")
                    .update({
                        status: "accepted",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", acceptId)
                    .eq("addressee_id", currentUser.id)
                    .eq("status", "pending");

                if (error) {
                    console.error(error);
                    notice("Could not accept request.", "error");
                } else {
                    notice("Friend request accepted.", "success");
                }

                await refresh(root);
                return;
            }

            const deleteId = button.dataset.friendDelete;

            if (deleteId) {
                if (!confirm("Are you sure?")) return;

                button.disabled = true;

                const { error } = await db
                    .from("cma_community_friendships")
                    .delete()
                    .eq("id", deleteId);

                if (error) {
                    console.error(error);
                    notice("Action failed.", "error");
                } else {
                    notice("Updated successfully.", "success");
                }

                await refresh(root);
            }
        });
    }

    window.CMACommunityFriends = {
        render
    };

})();
              
