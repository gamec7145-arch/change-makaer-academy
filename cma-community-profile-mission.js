/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 1 OF 4
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;
  const db = window.cmaSupabase;

  let activeTab = "posts";
  let lastRenderedRoot = null;
  let lastRenderedUser = null;
  let currentPrivateInfo = {
    mobile_number: "",
    address: ""
  };

  const Icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"></path><path d="M5 9v12h14V9"></path><path d="M9 21v-7h6v7"></path></svg>`,
    profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>`,
    friends: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    creator: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"></rect><rect x="13" y="3" width="8" height="5" rx="1.5"></rect><rect x="13" y="10" width="8" height="11" rx="1.5"></rect><rect x="3" y="13" width="8" height="8" rx="1.5"></rect></svg>`,
    notification: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>`
  };

  function escape(value) {
    if (Core && Core.escapeHTML) {
      return Core.escapeHTML(String(value ?? ""));
    }

    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function safeImage(url) {
    if (!url) return "";

    try {
      const parsed = new URL(url);

      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return escape(parsed.href);
      }
    } catch (error) {}

    return "";
  }

  function getUser() {
    return Core && Core.getCurrentUser
      ? Core.getCurrentUser()
      : null;
  }

  function getMetadata(user) {
    return user && user.user_metadata
      ? user.user_metadata
      : {};
  }

  function showNotice(message, type = "info") {
    if (Core && Core.showNotice) {
      Core.showNotice(message, type);
    } else {
      console.log(message);
    }
  }

  function navigateCommunity(page, userId = null) {
    window.dispatchEvent(new CustomEvent("cma:navigate", {
      detail: { page, userId }
    }));
  }

  function getProfileRoot() {
    return lastRenderedRoot ||
      (Core && Core.getRoot
        ? Core.getRoot()
        : document.getElementById("pageContent"));
  }

  function renderNavigation() {
    return `
      <header class="cma-header">
        <div class="cma-header-title">
          <span>Change Maker</span>
          <span class="cma-green">Community</span>
        </div>

        <button class="cma-icon-button"
          type="button"
          data-cma-profile-action="search"
          aria-label="Search">
          ${Icons.search}
        </button>
      </header>

      <nav class="cma-navigation" aria-label="Community navigation">
        <button class="cma-nav-item"
          type="button"
          data-cma-profile-page="home">
          <span class="cma-nav-icon">${Icons.home}</span>
          <span>Home</span>
        </button>

        <button class="cma-nav-item active"
          type="button"
          data-cma-profile-page="profile"
          aria-current="page">
          <span class="cma-nav-icon">${Icons.profile}</span>
          <span>Profile</span>
        </button>

        <button class="cma-nav-item"
          type="button"
          data-cma-profile-page="friends">
          <span class="cma-nav-icon">${Icons.friends}</span>
          <span>Friends</span>
        </button>

        <button class="cma-nav-item"
          type="button"
          data-cma-profile-page="creator">
          <span class="cma-nav-icon">${Icons.creator}</span>
          <span>Creator Panel</span>
        </button>

        <button class="cma-nav-item"
          type="button"
          data-cma-profile-page="notifications">
          <span class="cma-nav-icon">${Icons.notification}</span>
          <span>Notification</span>
        </button>
      </nav>
    `;
  }

  function injectStyles() {
    if (document.getElementById("cma-profile-styles")) return;

    const style = document.createElement("style");
    style.id = "cma-profile-styles";

    style.textContent = `
      .cma-profile {
        width: 100%;
        color: #fff;
      }

      .cma-profile-cover {
        position: relative;
        height: 155px;
        margin-bottom: 55px;
        border-radius: 16px;
        overflow: visible;
        background: linear-gradient(135deg,#08494B,#052D3B,#08C99A);
        cursor: pointer;
      }

      .cma-profile-cover > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 16px;
        pointer-events: none;
      }

      .cma-profile-avatar {
        position: absolute;
        left: 17px;
        bottom: -43px;
        z-index: 2;
        width: 86px;
        height: 86px;
        border: 4px solid #073746;
        border-radius: 50%;
        background: #103E4C;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-size: 35px;
        cursor: pointer;
      }

      .cma-profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
      }

      .cma-profile-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin: 0 2px 17px;
      }

      .cma-profile-name {
        font-size: 19px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .cma-profile-id {
        color: #A8C0CE;
        font-size: 11px;
        margin-top: 4px;
      }

      .cma-profile-description {
        color: #A8C0CE;
        font-size: 12px;
        line-height: 1.5;
        margin-top: 6px;
      }

      .cma-profile-edit {
        border: 1px solid #245563;
        border-radius: 20px;
        padding: 8px 12px;
        background: #08494B;
        color: #68DDB9;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
      }

      .cma-profile-section {
        background: #08494B;
        border-radius: 15px;
        padding: 14px;
        margin-bottom: 14px;
      }

      .cma-profile-section-title {
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .cma-profile-info-row {
        padding: 9px 0;
        border-bottom: 1px solid #245563;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .cma-profile-info-row:last-child {
        border-bottom: 0;
      }

      .cma-profile-info-label {
        color: #A8C0CE;
        display: block;
        font-size: 10px;
        margin-bottom: 4px;
      }

      .cma-profile-tabs {
        display: flex;
        justify-content: space-between;
        gap: 4px;
        border-bottom: 1px solid #245563;
        margin: 15px 0;
      }

      .cma-profile-tab {
        flex: 1;
        padding: 11px 2px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #A8C0CE;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .cma-profile-tab.active {
        color: #08C99A;
        border-bottom-color: #08C99A;
      }

      .cma-profile-empty {
        padding: 28px 12px;
        text-align: center;
        color: #A8C0CE;
        font-size: 12px;
      }

      .cma-profile-posts {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cma-profile-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 0 2px 17px;
      }

      .cma-profile-action-button {
        min-height: 38px;
        padding: 9px 15px;
        border: 0;
        border-radius: 20px;
        background: #08C99A;
        color: #052D3B;
        font-family: inherit;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .cma-profile-action-button.secondary {
        background: #245563;
        color: #fff;
      }

      .cma-profile-action-button:disabled {
        opacity: .65;
        cursor: not-allowed;
      }

      .cma-profile-friends-list {
        display: flex;
        flex-direction: column;
      }

      .cma-profile-friend-card {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px 0;
        border-bottom: 1px solid #245563;
      }

      .cma-profile-friend-card:last-child {
        border-bottom: 0;
      }

      .cma-profile-friend-avatar {
        width: 43px;
        height: 43px;
        flex-shrink: 0;
        border-radius: 50%;
        object-fit: cover;
        background: #103E4C;
      }

      .cma-profile-friend-details {
        min-width: 0;
        flex: 1;
      }

      .cma-profile-friend-name {
        color: #fff;
        font-size: 13px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .cma-profile-friend-description {
        color: #A8C0CE;
        font-size: 11px;
        margin-top: 3px;
      }

      .cma-profile-friend-view {
        padding: 7px 11px;
        border: 1px solid #245563;
        border-radius: 18px;
        background: transparent;
        color: #68DDB9;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .cma-profile-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: #000b;
      }

      .cma-profile-modal.show {
        display: flex;
      }

      .cma-profile-modal-content {
        width: 100%;
        max-width: 430px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 18px;
        border-radius: 17px;
        background: #073746;
        border: 1px solid #245563;
      }

      .cma-profile-modal-title {
        font-size: 17px;
        font-weight: 800;
        margin-bottom: 16px;
      }

      .cma-profile-field {
        display: block;
        width: 100%;
        margin-bottom: 13px;
      }

      .cma-profile-field span {
        display: block;
        color: #A8C0CE;
        font-size: 11px;
        margin-bottom: 6px;
      }

      .cma-profile-field input,
      .cma-profile-field textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 11px;
        border: 1px solid #245563;
        border-radius: 10px;
        outline: none;
        background: #052D3B;
        color: #fff;
        font-family: inherit;
        font-size: 13px;
      }

      .cma-profile-field textarea {
        min-height: 75px;
        resize: vertical;
      }

      .cma-profile-privacy-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: -5px 0 13px;
        color: #A8C0CE;
        font-size: 11px;
      }

      .cma-profile-privacy-row select {
        padding: 7px 9px;
        border: 1px solid #245563;
        border-radius: 8px;
        background: #052D3B;
        color: #fff;
        font: inherit;
      }

      .cma-profile-save {
        width: 100%;
        padding: 12px;
        border: 0;
        border-radius: 22px;
        background: #08C99A;
        color: #052D3B;
        font-family: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .cma-profile-save:disabled {
        opacity: .6;
      }

      .cma-profile-cancel {
        width: 100%;
        padding: 10px;
        margin-top: 7px;
        border: 0;
        background: transparent;
        color: #A8C0CE;
        font-family: inherit;
        cursor: pointer;
      }

      .cma-profile-file-input {
        display: none !important;
      }

      .cma-profile-composer {
        margin: 0 0 15px;
      }

      .cma-profile-composer .cma-avatar {
        flex-shrink: 0;
        overflow: hidden;
      }

      .cma-profile-composer .cma-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    `;

    document.head.appendChild(style);
  }

  function renderProfileComposer(user) {
    const Feed = window.CMACommunityFeed;

    if (!Feed || typeof Feed.renderComposer !== "function") {
        console.error("Community Feed Composer is not available.");
        return "";
    }

    return `
      <div class="cma-profile-composer">
        ${Feed.renderComposer()}
      </div>
    `;
  }

  async function loadProfileComposerAvatar(root) {
    const Feed = window.CMACommunityFeed;

    if (
      !root ||
      !root.querySelector(".cma-profile-composer") ||
      !Feed ||
      typeof Feed.loadComposerAvatar !== "function"
    ) {
      return;
    }

    await Feed.loadComposerAvatar(root);
  }

  function renderFriendActionsPlaceholder(isOwnProfile) {
    if (isOwnProfile) return "";

    return `
      <div class="cma-profile-actions" id="cmaProfileFriendActions">
        <button type="button"
          class="cma-profile-action-button secondary"
          disabled>
          Loading...
        </button>

        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-profile-action="message">
          Message
        </button>
      </div>
    `;
  }

  function renderProfileContent(user, isOwnProfile) {
    const metadata = getMetadata(user);
    const fullName = metadata.full_name || "Community Member";
    const description = metadata.short_description || "";
    const institution = metadata.institution || "";
    const avatar = safeImage(
      metadata.avatar_url || metadata.picture || ""
    );
    const cover = safeImage(metadata.cover_url || "");

    const memberId = user.id
      ? String(user.id).slice(0, 8).toUpperCase()
      : "MEMBER";

    const mobilePublic = metadata.mobile_number_is_public === true;
    const addressPublic = metadata.address_is_public === true;

    return `
      <main class="cma-profile">

        <section class="cma-profile-cover"
          ${
            isOwnProfile
              ? `data-cma-profile-action="change-cover"
                 role="button"
                 tabindex="0"
                 aria-label="Change cover photo"`
              : ""
          }>
          ${cover ? `<img src="${cover}" alt="Profile cover">` : ""}

          <div class="cma-profile-avatar"
            ${
              isOwnProfile
                ? `data-cma-profile-action="change-avatar"
                   role="button"
                   tabindex="0"
                   aria-label="Change profile photo"`
                : ""
            }>
            ${
              avatar
                ? `<img src="${avatar}" alt="${escape(fullName)}">`
                : `<span>${escape(fullName.charAt(0).toUpperCase())}</span>`
            }
          </div>
        </section>

        <input type="file"
          id="cmaProfileAvatarInput"
          class="cma-profile-file-input"
          accept="image/jpeg,image/png,image/webp">

        <input type="file"
          id="cmaProfileCoverInput"
          class="cma-profile-file-input"
          accept="image/jpeg,image/png,image/webp">

        <div class="cma-profile-heading">
          <div>
            <div class="cma-profile-name">${escape(fullName)}</div>
            <div class="cma-profile-id">
              Member ID: ${escape(memberId)}
            </div>
            ${
              description
                ? `<div class="cma-profile-description">${escape(description)}</div>`
                : ""
            }
          </div>

          ${
            isOwnProfile
              ? `<button type="button"
                  class="cma-profile-edit"
                  data-cma-profile-action="edit-profile">
                  Edit
                </button>`
              : ""
          }
        </div>

        ${renderFriendActionsPlaceholder(isOwnProfile)}

        <section class="cma-profile-section">
          <div class="cma-profile-section-title">
            Personal Information
          </div>

          <div class="cma-profile-info-row">
            <span class="cma-profile-info-label">Institution</span>
            ${institution ? escape(institution) : "Not added"}
          </div>

          <div class="cma-profile-info-row">
            <span class="cma-profile-info-label">Mobile Number</span>
            ${
              isOwnProfile
                ? escape(currentPrivateInfo.mobile_number || "Not added")
                : (mobilePublic ? "Public contact information" : "Private")
            }
          </div>

          <div class="cma-profile-info-row">
            <span class="cma-profile-info-label">Address</span>
            ${
              isOwnProfile
                ? escape(currentPrivateInfo.address || "Not added")
                : (addressPublic ? "Public address information" : "Private")
            }
          </div>
        </section>

        <div class="cma-profile-tabs">
          <button type="button"
            class="cma-profile-tab ${activeTab === "posts" ? "active" : ""}"
            data-cma-profile-tab="posts">
            Posts
          </button>

          <button type="button"
            class="cma-profile-tab ${activeTab === "photos" ? "active" : ""}"
            data-cma-profile-tab="photos">
            Photos
          </button>

          <button type="button"
            class="cma-profile-tab ${activeTab === "reacted" ? "active" : ""}"
            data-cma-profile-tab="reacted">
            Reacted On
          </button>

          <button type="button"
            class="cma-profile-tab ${activeTab === "friends" ? "active" : ""}"
            data-cma-profile-tab="friends">
            Friends
          </button>
        </div>

        ${
          isOwnProfile && activeTab === "posts"
            ? renderProfileComposer(user)
            : ""
        }

        <section id="cmaProfileTabContent">
          ${
            activeTab === "posts"
              ? `<div class="cma-profile-posts" id="cmaProfilePosts"></div>`
              : `<div class="cma-profile-empty">Loading...</div>`
          }
        </section>
      </main>
    `;
  }
   /* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 2 OF 4
========================================= */

  async function loadOwnPrivateInfo(userId) {
    currentPrivateInfo = {
      mobile_number: "",
      address: ""
    };

    if (!userId) return currentPrivateInfo;

    const { data, error } = await db
      .from("cma_community_private_info")
      .select("mobile_number,address")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn(
        "Private profile information could not be loaded:",
        error.message
      );

      return currentPrivateInfo;
    }

    if (data) {
      currentPrivateInfo = {
        mobile_number: data.mobile_number || "",
        address: data.address || ""
      };
    }

    return currentPrivateInfo;
  }

  async function loadFriendship(viewedUserId) {
    const currentUser = getUser();

    if (
      !currentUser ||
      !viewedUserId ||
      currentUser.id === viewedUserId
    ) {
      return {
        status: "none",
        relationship: null
      };
    }

    const { data, error } = await db
      .from("cma_community_friendships")
      .select("id,requester_id,addressee_id,status")
      .or(
        `and(requester_id.eq.${currentUser.id},addressee_id.eq.${viewedUserId}),and(requester_id.eq.${viewedUserId},addressee_id.eq.${currentUser.id})`
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Friendship lookup failed:", error.message);

      return {
        status: "error",
        relationship: null
      };
    }

    if (!data) {
      return {
        status: "none",
        relationship: null
      };
    }

    if (data.status === "accepted") {
      return {
        status: "accepted",
        relationship: data
      };
    }

    if (data.requester_id === currentUser.id) {
      return {
        status: "sent",
        relationship: data
      };
    }

    return {
      status: "incoming",
      relationship: data
    };
  }

  async function renderFriendActions(root, viewedUserId) {
    const container = root.querySelector(
      "#cmaProfileFriendActions"
    );

    if (!container) return;

    const state = await loadFriendship(viewedUserId);

    let button = "";

    if (state.status === "error") {
      button = `
        <button type="button"
          class="cma-profile-action-button secondary"
          disabled>
          Try Again Later
        </button>
      `;
    } else if (state.status === "accepted") {
      button = `
        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="unfriend">
          ✓ Friends
        </button>
      `;
    } else if (state.status === "sent") {
      button = `
        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="cancel">
          Request Sent
        </button>
      `;
    } else if (state.status === "incoming") {
      button = `
        <button type="button"
          class="cma-profile-action-button"
          data-cma-friend-action="accept">
          Accept Request
        </button>

        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="decline">
          Delete
        </button>
      `;
    } else {
      button = `
        <button type="button"
          class="cma-profile-action-button"
          data-cma-friend-action="add">
          Add Friend
        </button>
      `;
    }

    container.innerHTML = `
      ${button}

      <button type="button"
        class="cma-profile-action-button secondary"
        data-cma-profile-action="message">
        Message
      </button>
    `;
  }

  async function notifyFriendshipChanged(currentUserId, otherUserId) {
    window.dispatchEvent(new CustomEvent(
      "cma:friendship-changed",
      {
        detail: {
          userId: currentUserId,
          otherUserId
        }
      }
    ));
  }

  async function performFriendAction(
    root,
    viewedUserId,
    action
  ) {
    const currentUser = getUser();

    if (!currentUser || !viewedUserId) return;

    if (currentUser.id === viewedUserId) return;

    const state = await loadFriendship(viewedUserId);

    if (state.status === "error") {
      showNotice(
        "Could not check friendship status. Please try again.",
        "error"
      );
      return;
    }

    let result = null;

    try {
      if (action === "add") {
        if (state.status !== "none") return;

        result = await db
          .from("cma_community_friendships")
          .insert({
            requester_id: currentUser.id,
            addressee_id: viewedUserId,
            status: "pending"
          });

      } else if (action === "accept") {
        if (
          state.status !== "incoming" ||
          !state.relationship
        ) return;

        result = await db
          .from("cma_community_friendships")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString()
          })
          .eq("id", state.relationship.id)
          .eq("addressee_id", currentUser.id)
          .eq("status", "pending");

      } else if (
        action === "cancel" ||
        action === "decline" ||
        action === "unfriend"
      ) {
        if (!state.relationship) return;

        if (
          action === "unfriend" &&
          state.status !== "accepted"
        ) return;

        if (
          action === "cancel" &&
          state.status !== "sent"
        ) return;

        if (
          action === "decline" &&
          state.status !== "incoming"
        ) return;

        result = await db
          .from("cma_community_friendships")
          .delete()
          .eq("id", state.relationship.id);
      }

      if (!result) return;

      if (result.error) throw result.error;

      if (action === "add") {
        showNotice("Friend request sent.", "success");
      } else if (action === "accept") {
        showNotice("Friend request accepted.", "success");
      } else if (action === "unfriend") {
        showNotice("Friend removed.", "success");
      } else {
        showNotice("Friend request updated.", "success");
      }

      await notifyFriendshipChanged(
        currentUser.id,
        viewedUserId
      );

      await renderFriendActions(root, viewedUserId);

      if (activeTab === "friends" && lastRenderedUser) {
        await loadProfileFriends(
          lastRenderedUser.id,
          root
        );
      }

    } catch (error) {
      console.error("Friend action failed:", error);

      showNotice(
        error.message ||
        "Could not update friendship. Please try again.",
        "error"
      );

      await renderFriendActions(root, viewedUserId);
    }
  }

  async function loadProfileFriends(profileUserId, root) {
    const target = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!target) return;

    target.innerHTML = `
      <div class="cma-profile-empty">
        Loading friends...
      </div>
    `;

    const { data: relationships, error } = await db
      .from("cma_community_friendships")
      .select("requester_id,addressee_id")
      .eq("status", "accepted")
      .or(
        `requester_id.eq.${profileUserId},addressee_id.eq.${profileUserId}`
      );

    if (error) {
      console.error("Profile friends load failed:", error);

      target.innerHTML = `
        <div class="cma-profile-empty">
          Could not load friends right now.
        </div>
      `;

      return;
    }

    const friendIds = (relationships || []).map((item) => {
      return item.requester_id === profileUserId
        ? item.addressee_id
        : item.requester_id;
    });

    if (!friendIds.length) {
      target.innerHTML = `
        <div class="cma-profile-empty">
          No friends to show yet.
        </div>
      `;

      return;
    }

    const { data: profiles, error: profileError } = await db
      .from("cma_community_profiles")
      .select(
        "user_id,full_name,short_description,avatar_url"
      )
      .in("user_id", friendIds);

    if (profileError) {
      console.error(
        "Friend profiles load failed:",
        profileError
      );

      target.innerHTML = `
        <div class="cma-profile-empty">
          Could not load friend profiles.
        </div>
      `;

      return;
    }

    const profileMap = new Map(
      (profiles || []).map((profile) => [
        profile.user_id,
        profile
      ])
    );

    const orderedProfiles = friendIds
      .map((id) => profileMap.get(id))
      .filter(Boolean);

    if (!orderedProfiles.length) {
      target.innerHTML = `
        <div class="cma-profile-empty">
          No friends to show yet.
        </div>
      `;

      return;
    }

    target.innerHTML = `
      <div class="cma-profile-section">
        <div class="cma-profile-section-title">
          Friends (${orderedProfiles.length})
        </div>

        <div class="cma-profile-friends-list">
          ${orderedProfiles.map((friend) => {
            const avatar = safeImage(friend.avatar_url || "");
            const name = friend.full_name || "Community Member";

            return `
              <div class="cma-profile-friend-card">
                ${
                  avatar
                    ? `<img
                        class="cma-profile-friend-avatar"
                        src="${avatar}"
                        alt="">`
                    : `<div class="cma-profile-friend-avatar"></div>`
                }

                <div class="cma-profile-friend-details">
                  <div class="cma-profile-friend-name">
                    ${escape(name)}
                  </div>

                  <div class="cma-profile-friend-description">
                    ${escape(friend.short_description || "")}
                  </div>
                </div>

                <button type="button"
                  class="cma-profile-friend-view"
                  data-cma-open-profile="${escape(friend.user_id)}">
                  View
                </button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
       }
    /* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 3 OF 4
========================================= */

  async function loadUserPosts(profileUserId, root) {
    const container = root.querySelector("#cmaProfilePosts");

    if (!container) return;

    container.innerHTML = `
      <div class="cma-profile-empty">Loading posts...</div>
    `;

    const Main = window.CMACommunityMain;

    if (!Main || typeof Main.loadUserPosts !== "function") {
      container.innerHTML = `
        <div class="cma-profile-empty">
          Profile posts are temporarily unavailable.
        </div>
      `;
      return;
    }

    try {
      await Main.loadUserPosts(
        { id: profileUserId },
        root
      );

      if (!container.children.length) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No posts yet.
          </div>
        `;
      }

    } catch (error) {
      console.error("Profile post loading failed:", error);

      container.innerHTML = `
        <div class="cma-profile-empty">
          Could not load posts. Please try again.
        </div>
      `;
    }
  }

  async function loadPublicProfile(userId) {
    const { data, error } = await db
      .from("cma_community_profiles")
      .select(`
        user_id,
        full_name,
        short_description,
        institution,
        avatar_url,
        cover_url,
        mobile_number_is_public,
        address_is_public
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  function makeProfileUser(profile) {
    return {
      id: profile.user_id,

      user_metadata: {
        full_name: profile.full_name || "",
        short_description: profile.short_description || "",
        institution: profile.institution || "",
        avatar_url: profile.avatar_url || "",
        cover_url: profile.cover_url || "",

        mobile_number_is_public:
          profile.mobile_number_is_public === true,

        address_is_public:
          profile.address_is_public === true
      }
    };
  }

  async function loadTab(tab, root, profileUser) {
    activeTab = tab;

    root.querySelectorAll("[data-cma-profile-tab]")
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.cmaProfileTab === tab
        );
      });

    const target = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!target) return;

    if (tab === "posts") {
      target.innerHTML = `
        <div class="cma-profile-posts"
          id="cmaProfilePosts"></div>
      `;

      const currentUser = getUser();
      const isOwnProfile =
        !!currentUser &&
        !!profileUser &&
        currentUser.id === profileUser.id;

      const existingComposers = Array.from(
        root.querySelectorAll(".cma-profile-composer")
      );

      if (!isOwnProfile) {
        existingComposers.forEach((composer) => composer.remove());
      } else {
        // Keep exactly one Composer on the owner's Posts tab.
        existingComposers.slice(1).forEach(
          (composer) => composer.remove()
        );

        if (!existingComposers.length) {
          const tabs = root.querySelector(".cma-profile-tabs");

          if (tabs) {
            tabs.insertAdjacentHTML(
              "afterend",
              renderProfileComposer(profileUser)
            );
          }
        }

        await loadProfileComposerAvatar(root);
      }

      await loadUserPosts(profileUser.id, root);
      return;
    }

    // Composer must not appear on any other Profile tab.
    root.querySelectorAll(".cma-profile-composer")
      .forEach((composer) => composer.remove());

    if (tab === "friends") {
      await loadProfileFriends(profileUser.id, root);
      return;
    }

    const label = tab === "photos"
      ? "Photos"
      : "Reacted posts";

    target.innerHTML = `
      <div class="cma-profile-empty">
        ${label} will appear here.
      </div>
    `;
  }

  async function refreshPosts() {
    if (!lastRenderedRoot || !lastRenderedUser) return;

    if (activeTab === "posts") {
      await loadTab(
        "posts",
        lastRenderedRoot,
        lastRenderedUser
      );
    }
  }

  function closeEditModal(root) {
    const modal = root.querySelector(
      "#cmaProfileEditModal"
    );

    if (modal) modal.remove();
  }

  function openEditModal(root, user) {
    const metadata = getMetadata(user);

    const modal = document.createElement("div");
    modal.id = "cmaProfileEditModal";
    modal.className = "cma-profile-modal show";

    modal.innerHTML = `
      <div class="cma-profile-modal-content">
        <div class="cma-profile-modal-title">
          Edit Personal Information
        </div>

        <label class="cma-profile-field">
          <span>Full Name</span>
          <input id="cmaEditFullName"
            maxlength="100"
            value="${escape(metadata.full_name || "")}">
        </label>

        <label class="cma-profile-field">
          <span>Short Description</span>
          <textarea id="cmaEditDescription"
            maxlength="250">${escape(metadata.short_description || "")}</textarea>
        </label>

        <label class="cma-profile-field">
          <span>Institution</span>
          <input id="cmaEditInstitution"
            maxlength="150"
            value="${escape(metadata.institution || "")}">
        </label>

        <label class="cma-profile-field">
          <span>Mobile Number</span>
          <input id="cmaEditMobile"
            type="tel"
            maxlength="30"
            value="${escape(currentPrivateInfo.mobile_number || "")}">
        </label>

        <div class="cma-profile-privacy-row">
          <span>Mobile Number visibility</span>

          <select id="cmaEditMobilePrivacy">
            <option value="private"
              ${metadata.mobile_number_is_public === true ? "" : "selected"}>
              Private
            </option>

            <option value="public"
              ${metadata.mobile_number_is_public === true ? "selected" : ""}>
              Public
            </option>
          </select>
        </div>

        <label class="cma-profile-field">
          <span>Address</span>
          <textarea id="cmaEditAddress"
            maxlength="300">${escape(currentPrivateInfo.address || "")}</textarea>
        </label>

        <div class="cma-profile-privacy-row">
          <span>Address visibility</span>

          <select id="cmaEditAddressPrivacy">
            <option value="private"
              ${metadata.address_is_public === true ? "" : "selected"}>
              Private
            </option>

            <option value="public"
              ${metadata.address_is_public === true ? "selected" : ""}>
              Public
            </option>
          </select>
        </div>

        <button type="button"
          class="cma-profile-save"
          data-cma-profile-action="save-profile">
          Save Changes
        </button>

        <button type="button"
          class="cma-profile-cancel"
          data-cma-profile-action="close-edit">
          Cancel
        </button>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeEditModal(root);
      }
    });

    root.appendChild(modal);
  }

  async function saveProfileChanges(root, user) {
    const saveButton = root.querySelector(
      '[data-cma-profile-action="save-profile"]'
    );

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
    }

    const fullName =
      root.querySelector("#cmaEditFullName")?.value.trim() || "";

    const description =
      root.querySelector("#cmaEditDescription")?.value.trim() || "";

    const institution =
      root.querySelector("#cmaEditInstitution")?.value.trim() || "";

    const mobile =
      root.querySelector("#cmaEditMobile")?.value.trim() || "";

    const address =
      root.querySelector("#cmaEditAddress")?.value.trim() || "";

    const mobilePublic =
      root.querySelector("#cmaEditMobilePrivacy")?.value === "public";

    const addressPublic =
      root.querySelector("#cmaEditAddressPrivacy")?.value === "public";

    if (!fullName) {
      showNotice("Please enter your full name.", "error");

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
      }

      return;
    }

    try {
      const profileResult = await db
        .from("cma_community_profiles")
        .upsert({
          user_id: user.id,
          full_name: fullName,
          short_description: description,
          institution,
          mobile_number_is_public: mobilePublic,
          address_is_public: addressPublic,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (profileResult.error) {
        throw profileResult.error;
      }

      const privateResult = await db
        .from("cma_community_private_info")
        .upsert({
          user_id: user.id,
          mobile_number: mobile,
          address,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (privateResult.error) {
        throw privateResult.error;
      }

      const metadataResult = await db.auth.updateUser({
        data: {
          full_name: fullName,
          short_description: description,
          institution,
          mobile_number_is_public: mobilePublic,
          address_is_public: addressPublic
        }
      });

      if (metadataResult.error) {
        throw metadataResult.error;
      }

      currentPrivateInfo = {
        mobile_number: mobile,
        address
      };

      showNotice(
        "Profile updated successfully.",
        "success"
      );

      closeEditModal(root);

      await Profile.render(root, user.id);

    } catch (error) {
      console.error("Profile update failed:", error);

      showNotice(
        error.message || "Could not save profile changes.",
        "error"
      );

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
      }
    }
                              }
    /* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 4 OF 4
========================================= */

  async function uploadProfileImage(root, user, file, imageType) {
    if (!file || !user) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotice(
        "Choose a JPG, PNG or WEBP image.",
        "error"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice(
        "Image size must be 5MB or less.",
        "error"
      );
      return;
    }

    const isAvatar = imageType === "avatar";
    const column = isAvatar ? "avatar_url" : "cover_url";

    showNotice(
      isAvatar
        ? "Uploading profile photo..."
        : "Uploading cover photo...",
      "info"
    );

    try {
      const extension = file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

      const filePath =
        `profiles/${user.id}/${imageType}-${Date.now()}.${extension}`;

      const { error: uploadError } = await db.storage
        .from("community-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = db.storage
        .from("community-media")
        .getPublicUrl(filePath);

      const imageUrl = publicData?.publicUrl;

      if (!imageUrl) {
        throw new Error("Could not get uploaded image URL.");
      }

      const { error: profileError } = await db
        .from("cma_community_profiles")
        .upsert({
          user_id: user.id,
          [column]: imageUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (profileError) throw profileError;

      const metadataUpdate = isAvatar
        ? { avatar_url: imageUrl }
        : { cover_url: imageUrl };

      const { error: authError } = await db.auth.updateUser({
        data: metadataUpdate
      });

      if (authError) throw authError;

      showNotice(
        isAvatar
          ? "Profile photo updated."
          : "Cover photo updated.",
        "success"
      );

      await Profile.render(root, user.id);

    } catch (error) {
      console.error(
        `${imageType} upload failed:`,
        error
      );

      showNotice(
        error.message || "Could not upload image.",
        "error"
      );
    }
  }

  function bindEvents(root) {
    if (root.dataset.cmaProfileEvents === "true") {
      return;
    }

    root.dataset.cmaProfileEvents = "true";

    root.addEventListener("click", async (event) => {
      const navButton = event.target.closest(
        "[data-cma-profile-page]"
      );

      if (navButton) {
        navigateCommunity(
          navButton.dataset.cmaProfilePage
        );
        return;
      }

      const tabButton = event.target.closest(
        "[data-cma-profile-tab]"
      );

      if (tabButton) {
        if (!lastRenderedUser) return;

        await loadTab(
          tabButton.dataset.cmaProfileTab,
          root,
          lastRenderedUser
        );

        return;
      }

      const friendAction = event.target.closest(
        "[data-cma-friend-action]"
      );

      if (friendAction) {
        const action = friendAction.dataset.cmaFriendAction;

        if (!lastRenderedUser) return;

        friendAction.disabled = true;

        await performFriendAction(
          root,
          lastRenderedUser.id,
          action
        );

        return;
      }

      const profileAction = event.target.closest(
        "[data-cma-profile-action]"
      );

      if (profileAction) {
        const action = profileAction.dataset.cmaProfileAction;

        if (action === "search") {
          navigateCommunity("search");

        } else if (action === "edit-profile") {
          if (lastRenderedUser) {
            openEditModal(root, lastRenderedUser);
          }

        } else if (action === "close-edit") {
          closeEditModal(root);

        } else if (action === "save-profile") {
          if (lastRenderedUser) {
            await saveProfileChanges(
              root,
              lastRenderedUser
            );
          }

        } else if (action === "change-avatar") {
          root.querySelector(
            "#cmaProfileAvatarInput"
          )?.click();

        } else if (action === "change-cover") {
          root.querySelector(
            "#cmaProfileCoverInput"
          )?.click();

        } else if (action === "message") {
          showNotice(
            "Messaging is not available yet.",
            "info"
          );
        }

        return;
      }

      const openProfile = event.target.closest(
        "[data-cma-open-profile]"
      );

      if (openProfile) {
        navigateCommunity(
          "profile",
          openProfile.dataset.cmaOpenProfile
        );
      }
    });

    root.addEventListener("keydown", (event) => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      const imageTarget = event.target.closest(
        '[data-cma-profile-action="change-avatar"],' +
        '[data-cma-profile-action="change-cover"]'
      );

      if (!imageTarget) return;

      event.preventDefault();
      imageTarget.click();
    });

    root.addEventListener("change", async (event) => {
      if (!lastRenderedUser) return;

      if (event.target.id === "cmaProfileAvatarInput") {
        const file = event.target.files?.[0];

        await uploadProfileImage(
          root,
          lastRenderedUser,
          file,
          "avatar"
        );

        event.target.value = "";
      }

      if (event.target.id === "cmaProfileCoverInput") {
        const file = event.target.files?.[0];

        await uploadProfileImage(
          root,
          lastRenderedUser,
          file,
          "cover"
        );

        event.target.value = "";
      }
    });
  }

  const Profile = {
    async render(root, targetUserId = null) {
      if (!Core || !db) {
        console.error(
          "Community Core or Supabase is missing."
        );
        return;
      }

      root = root ||
        (Core.getRoot ? Core.getRoot() : null);

      if (!root) return;

      injectStyles();

      await Core.loadSession();

      const currentUser = getUser();

      if (!currentUser) {
        root.innerHTML = `
          <div class="cma-profile-empty">
            Please login to view the Community Profile.
          </div>
        `;
        return;
      }

      const profileUserId = targetUserId || currentUser.id;
      const isOwnProfile =
        profileUserId === currentUser.id;

      try {
        const profile = await loadPublicProfile(
          profileUserId
        );

        if (!profile) {
          root.innerHTML = `
            <div class="cma-profile-empty">
              This profile could not be found.
            </div>
          `;
          return;
        }

        const profileUser = makeProfileUser(profile);

        if (isOwnProfile) {
          await loadOwnPrivateInfo(currentUser.id);
        } else {
          currentPrivateInfo = {
            mobile_number: "",
            address: ""
          };
        }

        lastRenderedRoot = root;
        lastRenderedUser = profileUser;

        root.innerHTML =
          renderNavigation() +
          renderProfileContent(
            profileUser,
            isOwnProfile
          );

        bindEvents(root);

        if (!isOwnProfile) {
          await renderFriendActions(
            root,
            profileUserId
          );
        }

        await loadTab(
          activeTab,
          root,
          profileUser
        );

        if (
          window.CMACommunityFeed &&
          typeof window.CMACommunityFeed.bindEvents === "function"
        ) {
          window.CMACommunityFeed.bindEvents(root);
        }

      } catch (error) {
        console.error("Profile render failed:", error);

        root.innerHTML = `
          <div class="cma-profile-empty">
            Could not load this profile.
            Please refresh and try again.
          </div>
        `;
      }
    },

    refreshPosts,

    clearComposerPhoto() {
      const root = getProfileRoot();

      if (!root) return;

      const preview = root.querySelector(
        "#cmaSelectedPhoto"
      );

      if (preview) {
        preview.innerHTML = "";
        preview.classList.remove("show");
      }
    }
  };

  window.CMACommunityProfile = Profile;

})(); 
