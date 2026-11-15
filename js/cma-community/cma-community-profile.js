
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   COMPLETE FRIENDS INTEGRATION
   PART 1 OF 3
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;
  const db = window.cmaSupabase;

  let activeTab = "posts";
  let lastRenderedRoot = null;
  let lastRenderedUser = null;
  let currentFriendState = null;

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

      if (
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
      ) {
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

  function getAvatar(user) {
    const metadata = getMetadata(user);

    return safeImage(
      metadata.avatar_url || metadata.picture || ""
    );
  }

  function showNotice(message, type) {
    if (Core && Core.showNotice) {
      Core.showNotice(message, type || "info");
    } else {
      alert(message);
    }
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
          type="button" data-cma-profile-page="home">
          <span class="cma-nav-icon">${Icons.home}</span>
          <span>Home</span>
        </button>

        <button class="cma-nav-item active"
          type="button" data-cma-profile-page="profile"
          aria-current="page">
          <span class="cma-nav-icon">${Icons.profile}</span>
          <span>Profile</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="friends">
          <span class="cma-nav-icon">${Icons.friends}</span>
          <span>Friends</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="creator">
          <span class="cma-nav-icon">${Icons.creator}</span>
          <span>Creator Panel</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="notifications">
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
        cursor: pointer;
        background: linear-gradient(135deg,#08494B,#052D3B,#08C99A);
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

      .cma-profile-photo-edit,
      .cma-profile-cover-edit {
        display: none !important;
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

      .cma-profile .cma-composer {
        margin-bottom: 15px;
      }

      .cma-profile .cma-composer .cma-avatar {
        flex-shrink: 0;
        overflow: hidden;
      }

      .cma-profile .cma-composer .cma-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .cma-profile-photo-preview {
        display: none;
        padding: 0 12px 12px;
      }

      .cma-profile-photo-preview.show {
        display: block;
      }

      .cma-profile-photo-preview img {
        display: block;
        width: auto;
        max-width: 100%;
        max-height: 220px;
        object-fit: contain;
        border-radius: 12px;
      }

      .cma-profile-photo-remove {
        margin-top: 7px;
        padding: 6px 10px;
        border: 1px solid #245563;
        border-radius: 16px;
        background: #052D3B;
        color: #A8C0CE;
        font-size: 11px;
        cursor: pointer;
      }

      .cma-profile-posts {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Profile friend actions */

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
    `;

    document.head.appendChild(style);
  }

  function renderProfileContent(user, isOwnProfile) {
    const metadata = getMetadata(user);

    const name = metadata.full_name ||
      metadata.display_name || "Community Member";

    const description = metadata.short_description || "";
    const institution = metadata.institution || "";
    const mobile = metadata.mobile_number ||
      metadata.phone_number || "";
    const address = metadata.address || "";

    const avatar = getAvatar(user);
    const cover = safeImage(metadata.cover_url);

    return `
      <div class="cma-profile">

        <div class="cma-profile-cover" id="cmaCoverArea">
          ${cover ? `<img src="${cover}" alt="Cover photo">` : ""}

          <div class="cma-profile-avatar" id="cmaAvatarArea">
            ${avatar
              ? `<img src="${avatar}" alt="Profile photo">`
              : "👤"}
          </div>
        </div>

        ${isOwnProfile ? `
          <input class="cma-profile-file-input"
            type="file" id="cmaAvatarFile"
            accept="image/jpeg,image/png,image/webp">

          <input class="cma-profile-file-input"
            type="file" id="cmaCoverFile"
            accept="image/jpeg,image/png,image/webp">
        ` : ""}

        <div class="cma-profile-heading">
          <div>
            <div class="cma-profile-name">${escape(name)}</div>
            <div class="cma-profile-id">
              Member ID: ${escape(user.id || "")}
            </div>
            <div class="cma-profile-description">
              ${escape(description || "Welcome to Change Maker Community.")}
            </div>
          </div>

          ${isOwnProfile ? `
            <button class="cma-profile-edit"
              id="cmaEditProfile" type="button">
              Edit
            </button>
          ` : ""}
        </div>

        ${!isOwnProfile ? `
          <div class="cma-profile-actions"
            id="cmaProfileFriendActions">
            <button type="button"
              class="cma-profile-action-button"
              disabled>
              Loading...
            </button>
          </div>
        ` : ""}

        <section class="cma-profile-section">
          <div class="cma-profile-section-title">
            Personal Information
          </div>

          <div class="cma-profile-info-row">
            <span class="cma-profile-info-label">Institution</span>
            ${escape(institution || "Not added yet")}
          </div>

          ${isOwnProfile ? `
            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Mobile Number</span>
              ${escape(mobile || "Not added yet")}
            </div>

            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Address</span>
              ${escape(address || "Not added yet")}
            </div>
          ` : ""}
        </section>

        ${isOwnProfile ? `
        <section class="cma-composer">

          <div class="cma-composer-top">
            <div class="cma-avatar">
              ${avatar
                ? `<img src="${avatar}" alt="Your profile picture">`
                : "👤"}
            </div>

            <textarea
              class="cma-post-input"
              id="cmaProfilePostInput"
              placeholder="What's on your mind?"
              rows="1"
              aria-label="Write a post"
            ></textarea>
          </div>

          <div id="cmaProfilePhotoPreview"
            class="cma-profile-photo-preview"></div>

          <div class="cma-composer-bottom">
            <button
              type="button"
              class="cma-photo-button"
              data-cma-profile-action="photo"
            >
              <span aria-hidden="true">▧</span>
              Photo
            </button>

            <button
              type="button"
              class="cma-post-button"
              data-cma-profile-action="post"
            >
              Post
            </button>
          </div>

        </section>
        ` : ""}

        <div class="cma-profile-tabs">
          <button class="cma-profile-tab active"
            data-tab="posts" type="button">Posts</button>

          <button class="cma-profile-tab"
            data-tab="photos" type="button">Photos</button>

          <button class="cma-profile-tab"
            data-tab="reacted" type="button">React On</button>

          <button class="cma-profile-tab"
            data-tab="friends" type="button">Friends</button>
        </div>

        <div id="cmaProfileTabContent">
          <div class="cma-profile-empty">
            Loading posts...
          </div>
        </div>

      </div>

      ${isOwnProfile ? `
      <div class="cma-profile-modal" id="cmaProfileModal">
        <div class="cma-profile-modal-content">

          <div class="cma-profile-modal-title">
            Edit Personal Information
          </div>

          <form id="cmaProfileEditForm">

            <label class="cma-profile-field">
              <span>Full Name</span>
              <input name="full_name" maxlength="80"
                value="${escape(name)}" required>
            </label>

            <label class="cma-profile-field">
              <span>Short Description</span>
              <textarea name="short_description"
                maxlength="180">${escape(description)}</textarea>
            </label>

            <label class="cma-profile-field">
              <span>Institution</span>
              <input name="institution" maxlength="120"
                value="${escape(institution)}">
            </label>

            <label class="cma-profile-field">
              <span>Mobile Number</span>
              <input name="mobile_number" type="tel"
                maxlength="25" value="${escape(mobile)}">
            </label>

            <label class="cma-profile-field">
              <span>Address</span>
              <textarea name="address"
                maxlength="250">${escape(address)}</textarea>
            </label>

            <button class="cma-profile-save" type="submit">
              Save Changes
            </button>

            <button class="cma-profile-cancel"
              type="button" id="cmaProfileCancel">
              Cancel
            </button>

          </form>
        </div>
      </div>
      ` : ""}
    `;
  }

/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 2 OF 3
========================================= */

  // -----------------------------------------
  // FRIENDSHIP STATUS
  // -----------------------------------------

  async function loadFriendship(viewedUserId, currentUserId) {
    if (!db || !viewedUserId || !currentUserId) {
      return { status: "none", relationship: null };
    }

    try {
      const { data, error } = await db
        .from("cma_community_friendships")
        .select("id, requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${viewedUserId}),and(requester_id.eq.${viewedUserId},addressee_id.eq.${currentUserId})`
        )
        .limit(1);

      if (error) throw error;

      const relationship = data && data.length
        ? data[0]
        : null;

      if (!relationship) {
        return { status: "none", relationship: null };
      }

      if (relationship.status === "accepted") {
        return {
          status: "accepted",
          relationship
        };
      }

      if (relationship.requester_id === currentUserId) {
        return {
          status: "sent",
          relationship
        };
      }

      return {
        status: "incoming",
        relationship
      };

    } catch (error) {
      console.error("Profile friendship load error:", error);

      return {
        status: "error",
        relationship: null
      };
    }
  }

  // -----------------------------------------
  // RENDER FRIEND ACTION BUTTONS
  // -----------------------------------------

  async function renderFriendActions(root, viewedUserId) {
    const container = root.querySelector(
      "#cmaProfileFriendActions"
    );

    const currentUser = getUser();

    if (!container || !currentUser || !viewedUserId) {
      return;
    }

    const state = await loadFriendship(
      viewedUserId,
      currentUser.id
    );

    if (!container.isConnected) return;

    currentFriendState = state;

    let friendButton = "";

    if (state.status === "none") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button"
          data-cma-friend-action="add">
          Add Friend
        </button>
      `;
    }

    else if (state.status === "sent") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button secondary"
          disabled>
          Request Sent
        </button>

        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="cancel">
          Cancel Request
        </button>
      `;
    }

    else if (state.status === "incoming") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button"
          data-cma-friend-action="accept">
          Accept Request
        </button>

        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="delete">
          Delete Request
        </button>
      `;
    }

    else if (state.status === "accepted") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button"
          disabled>
          ✓ Friends
        </button>
      `;
    }

    else {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button secondary"
          disabled>
          Try Again
        </button>
      `;
    }

    container.innerHTML = `
      ${friendButton}

      <button type="button"
        class="cma-profile-action-button secondary"
        data-cma-profile-message="${escape(viewedUserId)}">
        Message
      </button>
    `;
  }

  // -----------------------------------------
  // FRIENDSHIP ACTIONS
  // -----------------------------------------

  async function performFriendAction(action, root, viewedUserId) {
    const currentUser = getUser();

    if (!currentUser || !currentUser.id) {
      showNotice("Please login first.", "error");
      return;
    }

    if (!viewedUserId || viewedUserId === currentUser.id) {
      return;
    }

    const state = await loadFriendship(
      viewedUserId,
      currentUser.id
    );

    try {
      if (action === "add") {
        if (state.status !== "none") {
          await renderFriendActions(root, viewedUserId);
          return;
        }

        const { error } = await db
          .from("cma_community_friendships")
          .insert({
            requester_id: currentUser.id,
            addressee_id: viewedUserId,
            status: "pending"
          });

        if (error) throw error;

        showNotice("Friend request sent.", "success");
      }

      else if (action === "accept") {
        if (
          state.status !== "incoming" ||
          !state.relationship
        ) return;

        const { error } = await db
          .from("cma_community_friendships")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString()
          })
          .eq("id", state.relationship.id)
          .eq("addressee_id", currentUser.id)
          .eq("status", "pending");

        if (error) throw error;

        showNotice("Friend request accepted.", "success");
      }

      else if (
        action === "delete" ||
        action === "cancel"
      ) {
        if (!state.relationship) return;

        const { error } = await db
          .from("cma_community_friendships")
          .delete()
          .eq("id", state.relationship.id);

        if (error) throw error;

        showNotice(
          action === "cancel"
            ? "Friend request cancelled."
            : "Friend request deleted.",
          "success"
        );
      }

      await renderFriendActions(root, viewedUserId);

    } catch (error) {
      console.error("Friend action error:", error);

      showNotice(
        error.message || "Could not complete this action.",
        "error"
      );

      await renderFriendActions(root, viewedUserId);
    }
  }

  // -----------------------------------------
  // LOAD ACCEPTED FRIENDS OF PROFILE OWNER
  // -----------------------------------------

  async function loadProfileFriends(ownerId, root) {
    const container = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!container || !ownerId) return;

    container.innerHTML = `
      <div class="cma-profile-empty">
        Loading friends...
      </div>
    `;

    try {
      const { data: relationships, error } = await db
        .from("cma_community_friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${ownerId},addressee_id.eq.${ownerId}`
        );

      if (error) throw error;

      if (!container.isConnected) return;

      const friendIds = Array.from(
        new Set(
          (relationships || []).map(function (item) {
            return item.requester_id === ownerId
              ? item.addressee_id
              : item.requester_id;
          })
        )
      );

      if (!friendIds.length) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No friends to show yet.
          </div>
        `;
        return;
      }

      const { data: profiles, error: profileError } = await db
        .from("cma_community_profiles")
        .select(
          "user_id, full_name, short_description, avatar_url"
        )
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      if (!container.isConnected) return;

      const profileMap = new Map(
        (profiles || []).map(function (profile) {
          return [profile.user_id, profile];
        })
      );

      const orderedProfiles = friendIds
        .map(function (id) {
          return profileMap.get(id);
        })
        .filter(Boolean);

      if (!orderedProfiles.length) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No friends to show yet.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="cma-profile-section">
          <div class="cma-profile-section-title">
            Friends (${orderedProfiles.length})
          </div>

          <div class="cma-profile-friends-list">
            ${orderedProfiles.map(function (profile) {
              const name = profile.full_name ||
                "Community Member";

              const avatar = safeImage(profile.avatar_url);

              return `
                <div class="cma-profile-friend-card">

                  ${avatar
                    ? `<img class="cma-profile-friend-avatar"
                        src="${avatar}" alt="">`
                    : `<div class="cma-profile-friend-avatar"
                        aria-hidden="true"
                        style="display:flex;align-items:center;justify-content:center;">👤</div>`
                  }

                  <div class="cma-profile-friend-details">
                    <div class="cma-profile-friend-name">
                      ${escape(name)}
                    </div>

                    <div class="cma-profile-friend-description">
                      ${escape(
                        profile.short_description || "Community Member"
                      )}
                    </div>
                  </div>

                  <button type="button"
                    class="cma-profile-friend-view"
                    data-cma-open-friend="${escape(profile.user_id)}">
                    View
                  </button>

                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

    } catch (error) {
      console.error("Profile friends error:", error);

      container.innerHTML = `
        <div class="cma-profile-empty">
          Could not load friends. Please try again.
        </div>
      `;
    }
  }

  // -----------------------------------------
  // LOAD PROFILE POSTS
  // -----------------------------------------

  async function loadUserPosts(user, root) {
    const container = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!container || !user || !user.id) return;

    container.innerHTML = `
      <div class="cma-profile-empty">
        Loading posts...
      </div>
    `;

    try {
      const { data: posts, error } = await db
        .from("cma_community_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!container.isConnected) return;

      if (!posts || !posts.length) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No posts yet.
          </div>
        `;
        return;
      }

      const Feed = window.CMACommunityFeed;

      if (!Feed || typeof Feed.createPostCard !== "function") {
        container.innerHTML = `
          <div class="cma-profile-empty">
            Posts are temporarily unavailable.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="cma-profile-posts">
          ${posts.map(function (post) {
            return Feed.createPostCard({
              ...post,
              id: post.id,
              user_id: post.user_id,
              content: post.content,
              image_url: post.image_url,
              created_at: post.created_at,
              author: user
            });
          }).join("")}
        </div>
      `;

      if (typeof Feed.bindEvents === "function") {
        Feed.bindEvents(container);
      }

    } catch (error) {
      console.error("Profile posts error:", error);

      container.innerHTML = `
        <div class="cma-profile-empty">
          Could not load posts.
        </div>
      `;
    }
    }
          
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   PART 3 OF 3
========================================= */

  // -----------------------------------------
  // LOAD PUBLIC PROFILE
  // -----------------------------------------

  async function loadPublicProfile(userId) {
    const { data, error } = await db
      .from("cma_community_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  function makeProfileUser(profile) {
    if (!profile) return null;

    return {
      id: profile.user_id,
      user_metadata: {
        full_name: profile.full_name,
        short_description: profile.short_description,
        institution: profile.institution,
        avatar_url: profile.avatar_url
      }
    };
  }

  // -----------------------------------------
  // PROFILE NAVIGATION
  // -----------------------------------------

  function navigateCommunity(page, userId) {
    document.dispatchEvent(
      new CustomEvent("cma:navigate", {
        detail: {
          page: page,
          userId: userId || null
        }
      })
    );
  }

  // -----------------------------------------
  // PROFILE TAB SWITCHING
  // -----------------------------------------

  async function loadTab(tab, user, root) {
    activeTab = tab;

    root.querySelectorAll(".cma-profile-tab").forEach(
      function (button) {
        button.classList.toggle(
          "active",
          button.dataset.tab === tab
        );
      }
    );

    if (tab === "posts") {
      await loadUserPosts(user, root);
      return;
    }

    if (tab === "friends") {
      await loadProfileFriends(user.id, root);
      return;
    }

    const container = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!container) return;

    if (tab === "photos") {
      container.innerHTML = `
        <div class="cma-profile-empty">
          Photos will appear here.
        </div>
      `;
      return;
    }

    if (tab === "reacted") {
      container.innerHTML = `
        <div class="cma-profile-empty">
          Reacted posts will appear here.
        </div>
      `;
    }
  }

  // -----------------------------------------
  // EDIT PROFILE MODAL
  // -----------------------------------------

  function openEditModal(root) {
    const modal = root.querySelector("#cmaProfileModal");

    if (modal) modal.classList.add("show");
  }

  function closeEditModal(root) {
    const modal = root.querySelector("#cmaProfileModal");

    if (modal) modal.classList.remove("show");
  }

  async function saveProfileChanges(form, root, user) {
    const formData = new FormData(form);

    const values = {
      full_name: String(
        formData.get("full_name") || ""
      ).trim(),

      short_description: String(
        formData.get("short_description") || ""
      ).trim(),

      institution: String(
        formData.get("institution") || ""
      ).trim(),

      mobile_number: String(
        formData.get("mobile_number") || ""
      ).trim(),

      address: String(
        formData.get("address") || ""
      ).trim()
    };

    if (!values.full_name) {
      showNotice("Please enter your full name.", "error");
      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
    }

    try {
      // Public profile information.
      const { error: profileError } = await db
        .from("cma_community_profiles")
        .upsert({
          user_id: user.id,
          full_name: values.full_name,
          short_description: values.short_description,
          institution: values.institution,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (profileError) throw profileError;

      // Private information is stored separately.
      const { error: privateError } = await db
        .from("cma_community_private_info")
        .upsert({
          user_id: user.id,
          mobile_number: values.mobile_number,
          address: values.address,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (privateError) throw privateError;

      // Keep Auth metadata synchronized for existing features.
      const { error: metadataError } = await db.auth.updateUser({
        data: {
          full_name: values.full_name,
          short_description: values.short_description,
          institution: values.institution
        }
      });

      if (metadataError) {
        console.warn(
          "Profile metadata sync warning:",
          metadataError
        );
      }

      showNotice("Profile updated successfully.", "success");

      closeEditModal(root);

      await Profile.render(root, user.id);

    } catch (error) {
      console.error("Profile save error:", error);

      showNotice(
        error.message || "Could not save profile.",
        "error"
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Save Changes";
      }
    }
  }

  // -----------------------------------------
  // PROFILE IMAGE UPLOAD
  // -----------------------------------------

  async function uploadProfileImage(file, user, type, root) {
    if (!file || !user) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotice("Use JPG, PNG or WEBP image.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice("Image must be smaller than 5 MB.", "error");
      return;
    }

    try {
      const extension = file.name.split(".").pop()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";

      const path =
        `${user.id}/${type}_${Date.now()}.${extension}`;

      const { error: uploadError } = await db.storage
        .from("community-media")
        .upload(path, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = db.storage
        .from("community-media")
        .getPublicUrl(path);

      const imageUrl = publicData.publicUrl;

      const { data: existingProfile, error: readError } =
        await db
          .from("cma_community_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (readError) throw readError;

      const metadata = getMetadata(user);

      const updateValues = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (type === "avatar") {
        updateValues.avatar_url = imageUrl;
      } else {
        updateValues.cover_url = imageUrl;
      }

      const { error: updateError } = await db
        .from("cma_community_profiles")
        .upsert(updateValues, {
          onConflict: "user_id"
        });

      if (updateError) throw updateError;

      if (type === "avatar") {
        await db.auth.updateUser({
          data: {
            ...metadata,
            avatar_url: imageUrl
          }
        });
      }

      showNotice(
        type === "avatar"
          ? "Profile photo updated."
          : "Cover photo updated.",
        "success"
      );

      await Profile.render(root, user.id);

    } catch (error) {
      console.error("Profile image upload error:", error);

      showNotice(
        error.message || "Image upload failed.",
        "error"
      );
    }
  }

  // -----------------------------------------
  // PROFILE POST CREATION
  // -----------------------------------------

  async function createProfilePost(root, user) {
    const input = root.querySelector("#cmaProfilePostInput");

    if (!input) return;

    const content = input.value.trim();

    if (!content) {
      showNotice("Write something before posting.", "error");
      return;
    }

    const postButton = root.querySelector(
      '[data-cma-profile-action="post"]'
    );

    if (postButton) {
      postButton.disabled = true;
      postButton.textContent = "Posting...";
    }

    try {
      const { error } = await db
        .from("cma_community_posts")
        .insert({
          user_id: user.id,
          content: content
        });

      if (error) throw error;

      showNotice("Post published.", "success");

      input.value = "";

      await loadUserPosts(user, root);

    } catch (error) {
      console.error("Profile post error:", error);

      showNotice(
        error.message || "Could not publish post.",
        "error"
      );

    } finally {
      if (postButton) {
        postButton.disabled = false;
        postButton.textContent = "Post";
      }
    }
  }

  // -----------------------------------------
  // PROFILE EVENT HANDLERS
  // -----------------------------------------

  function bindEvents(root, user, isOwnProfile) {

    // Main Community navigation.
    root.querySelectorAll("[data-cma-profile-page]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          navigateCommunity(
            button.dataset.cmaProfilePage
          );
        });
      });

    // Search button.
    const searchButton = root.querySelector(
      '[data-cma-profile-action="search"]'
    );

    if (searchButton) {
      searchButton.addEventListener("click", function () {
        navigateCommunity("search");
      });
    }

    // Profile tabs.
    root.querySelectorAll(".cma-profile-tab")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          loadTab(button.dataset.tab, user, root);
        });
      });

    // Open another member's profile from Friends list.
    root.querySelectorAll("[data-cma-open-friend]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          navigateCommunity(
            "profile",
            button.dataset.cmaOpenFriend
          );
        });
      });

    // Friend action buttons.
    root.addEventListener("click", function (event) {
      const actionButton = event.target.closest(
        "[data-cma-friend-action]"
      );

      if (!actionButton || !root.contains(actionButton)) {
        return;
      }

      const action = actionButton.dataset.cmaFriendAction;

      actionButton.disabled = true;

      performFriendAction(
        action,
        root,
        user.id
      );
    });

    // Message action.
    root.addEventListener("click", function (event) {
      const messageButton = event.target.closest(
        "[data-cma-profile-message]"
      );

      if (!messageButton || !root.contains(messageButton)) {
        return;
      }

      const targetUserId =
        messageButton.dataset.cmaProfileMessage;

      const Messaging = window.CMACommunityMessaging;

      if (
        Messaging &&
        typeof Messaging.openConversation === "function"
      ) {
        Messaging.openConversation(targetUserId);
      } else {
        showNotice(
          "Messaging is not available yet.",
          "info"
        );
      }
    });

    // Load friendship state for another member.
    if (!isOwnProfile) {
      renderFriendActions(root, user.id);
      return;
    }

    // Edit information.
    const editButton = root.querySelector("#cmaEditProfile");

    if (editButton) {
      editButton.addEventListener("click", function () {
        openEditModal(root);
      });
    }

    const cancelButton = root.querySelector(
      "#cmaProfileCancel"
    );

    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        closeEditModal(root);
      });
    }

    const modal = root.querySelector("#cmaProfileModal");

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          closeEditModal(root);
        }
      });
    }

    const editForm = root.querySelector(
      "#cmaProfileEditForm"
    );

    if (editForm) {
      editForm.addEventListener("submit", function (event) {
        event.preventDefault();

        saveProfileChanges(
          editForm,
          root,
          user
        );
      });
    }

    // Profile avatar upload.
    const avatarArea = root.querySelector("#cmaAvatarArea");
    const avatarInput = root.querySelector("#cmaAvatarFile");

    if (avatarArea && avatarInput) {
      avatarArea.addEventListener("click", function () {
        avatarInput.click();
      });

      avatarInput.addEventListener("change", function () {
        const file = avatarInput.files[0];

        if (file) {
          uploadProfileImage(
            file,
            user,
            "avatar",
            root
          );
        }
      });
    }

    // Cover upload.
    const coverArea = root.querySelector("#cmaCoverArea");
    const coverInput = root.querySelector("#cmaCoverFile");

    if (coverArea && coverInput) {
      coverArea.addEventListener("dblclick", function () {
        coverInput.click();
      });

      coverInput.addEventListener("change", function () {
        const file = coverInput.files[0];

        if (file) {
          uploadProfileImage(
            file,
            user,
            "cover",
            root
          );
        }
      });
    }

    // Create profile post.
    const postButton = root.querySelector(
      '[data-cma-profile-action="post"]'
    );

    if (postButton) {
      postButton.addEventListener("click", function () {
        createProfilePost(root, user);
      });
    }

    // Feed photo selector.
    const photoButton = root.querySelector(
      '[data-cma-profile-action="photo"]'
    );

    if (photoButton) {
      photoButton.addEventListener("click", function () {
        showNotice(
          "Photo posting is not connected in this profile composer yet.",
          "info"
        );
      });
    }
  }

  // -----------------------------------------
  // PROFILE RENDER
  // -----------------------------------------

  const Profile = {

    async render(root, targetUserId) {
      if (!root) {
        root = Core && Core.getRoot
          ? Core.getRoot()
          : document.getElementById("communityRoot");
      }

      if (!root) {
        console.error("Community profile root not found.");
        return;
      }

      if (!Core || !db) {
        root.innerHTML = `
          <div class="cma-profile-empty">
            Community is not ready. Please refresh.
          </div>
        `;
        return;
      }

      try {
        if (Core.loadSession) {
          await Core.loadSession();
        }

        const currentUser = getUser();

        if (!currentUser) {
          if (Core.requireLogin) {
            Core.requireLogin();
          }
          return;
        }

        const viewedUserId = targetUserId || currentUser.id;

        const isOwnProfile =
          viewedUserId === currentUser.id;

        let profileUser;

        if (isOwnProfile) {
          const profile = await loadPublicProfile(
            currentUser.id
          );

          profileUser = profile
            ? makeProfileUser(profile)
            : currentUser;

          // Keep existing Auth metadata if the public
          // profile does not contain a value.
          profileUser.user_metadata = {
            ...getMetadata(currentUser),
            ...getMetadata(profileUser)
          };

          profileUser.id = currentUser.id;

        } else {
          const profile = await loadPublicProfile(
            viewedUserId
          );

          if (!profile) {
            root.innerHTML = `
              <div class="cma-profile-empty">
                This member profile could not be found.
              </div>
            `;
            return;
          }

          profileUser = makeProfileUser(profile);
        }

        activeTab = "posts";

        injectStyles();

        root.innerHTML =
          renderNavigation() +
          renderProfileContent(
            profileUser,
            isOwnProfile
          );

        lastRenderedRoot = root;
        lastRenderedUser = profileUser;

        bindEvents(
          root,
          profileUser,
          isOwnProfile
        );

        await loadUserPosts(profileUser, root);

      } catch (error) {
        console.error("Community profile render error:", error);

        root.innerHTML = `
          <div class="cma-profile-empty">
            Could not load this profile. Please refresh.
          </div>
        `;
      }
    },

    getCurrentProfile() {
      return lastRenderedUser;
    },

    refresh() {
      if (lastRenderedRoot && lastRenderedUser) {
        return this.render(
          lastRenderedRoot,
          lastRenderedUser.id
        );
      }
    }

  };

  // -----------------------------------------
  // EXPORT
  // -----------------------------------------

  window.CMACommunityProfile = Profile;

})();
       
