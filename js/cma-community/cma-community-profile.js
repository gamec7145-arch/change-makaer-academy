/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   UPDATED COMPLETE VERSION
   PART 1 OF 4
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

      <nav class="cma-navigation"
        aria-label="Community navigation">

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
        cursor: pointer;
        background: linear-gradient(
          135deg,
          #08494B,
          #052D3B,
          #08C99A
        );
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
     /* =========================================
     PART 2 — PROFILE CONTENT
  ========================================= */

  function renderProfileContent(user, isOwnProfile) {
    const metadata = getMetadata(user);
    const name = escape(
      metadata.full_name ||
      user.email ||
      "Community Member"
    );

    const description = escape(
      metadata.short_description || ""
    );

    const institution = escape(
      metadata.institution || ""
    );

    const avatar = getAvatar(user);

    const memberId = escape(
      String(user.id || "").slice(0, 8).toUpperCase()
    );

    const cover = safeImage(metadata.cover_url || "");

    const avatarHTML = avatar
      ? `<img src="${avatar}" alt="Profile photo">`
      : "👤";

    const coverHTML = cover
      ? `<img src="${cover}" alt="Profile cover">`
      : "";

    const editButton = isOwnProfile
      ? `
        <button type="button"
          class="cma-profile-edit"
          data-cma-profile-action="edit-info">
          Edit Profile
        </button>
      `
      : "";

    const privacy = metadata;

    const institutionHTML = institution
      ? `
        <div class="cma-profile-info-row">
          <span class="cma-profile-info-label">Institution</span>
          ${institution}
        </div>
      `
      : "";

    const mobileHTML = isOwnProfile
      ? `
        <div class="cma-profile-info-row">
          <span class="cma-profile-info-label">Mobile Number</span>
          ${escape(privacy.mobile_number || "Not added")}
        </div>
      `
      : (
        privacy.mobile_number_is_public
          ? `
            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Mobile Number</span>
              ${escape(privacy.mobile_number || "Not available")}
            </div>
          `
          : ""
      );

    const addressHTML = isOwnProfile
      ? `
        <div class="cma-profile-info-row">
          <span class="cma-profile-info-label">Address</span>
          ${escape(privacy.address || "Not added")}
        </div>
      `
      : (
        privacy.address_is_public
          ? `
            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Address</span>
              ${escape(privacy.address || "Not available")}
            </div>
          `
          : ""
      );

    const friendActions = isOwnProfile
      ? ""
      : `
        <div class="cma-profile-actions"
          id="cmaProfileFriendActions"
          data-profile-user-id="${escape(user.id)}">
          <div class="cma-profile-empty">
            Loading...
          </div>
        </div>
      `;

    const composer = isOwnProfile
      ? renderProfileComposer(user)
      : "";

    return `
      <main class="cma-profile"
        data-profile-user-id="${escape(user.id)}">

        <section class="cma-profile-cover"
          data-cma-profile-action="change-cover">
          ${coverHTML}

          <div class="cma-profile-avatar"
            data-cma-profile-action="change-avatar">
            ${avatarHTML}
          </div>
        </section>

        <section class="cma-profile-heading">
          <div>
            <div class="cma-profile-name">${name}</div>

            <div class="cma-profile-id">
              Member ID: ${memberId}
            </div>

            ${
              description
                ? `<div class="cma-profile-description">${description}</div>`
                : ""
            }
          </div>

          ${editButton}
        </section>

        ${friendActions}

        <section class="cma-profile-section">
          <div class="cma-profile-section-title">
            Personal Information
          </div>

          ${
            institutionHTML ||
            mobileHTML ||
            addressHTML
              ? institutionHTML + mobileHTML + addressHTML
              : `
                <div class="cma-profile-empty">
                  No public information available.
                </div>
              `
          }
        </section>

        ${composer}

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
            Reacted
          </button>

          <button type="button"
            class="cma-profile-tab ${activeTab === "friends" ? "active" : ""}"
            data-cma-profile-tab="friends">
            Friends
          </button>

        </div>

        <section class="cma-profile-posts"
          id="cmaProfileTabContent">
          <div class="cma-profile-empty">
            Loading...
          </div>
        </section>

      </main>
    `;
  }


  /* =========================================
     PROFILE COMPOSER STRUCTURE
     Feed integration will be connected
     in the following parts.
  ========================================= */

  function renderProfileComposer(user) {
    const avatar = getAvatar(user);

    const avatarHTML = avatar
      ? `<img src="${avatar}" alt="">`
      : "👤";

    return `
      <section class="cma-profile-section cma-composer"
        id="cmaProfileComposer">

        <div class="cma-composer-top"
          style="display:flex;align-items:center;gap:10px;">

          <div class="cma-avatar"
            style="width:40px;height:40px;border-radius:50%;
            background:#103E4C;display:flex;align-items:center;
            justify-content:center;overflow:hidden;">
            ${avatarHTML}
          </div>

          <textarea
            id="cmaProfilePostInput"
            placeholder="What's on your mind?"
            rows="2"
            style="flex:1;min-width:0;resize:vertical;
            border:0;outline:none;border-radius:12px;
            padding:12px;background:#052D3B;color:#fff;
            font:inherit;font-size:13px;"></textarea>

        </div>

        <div class="cma-profile-photo-preview"
          id="cmaProfilePhotoPreview">
          <img id="cmaProfilePreviewImage" src="" alt="Selected photo">

          <button type="button"
            class="cma-profile-photo-remove"
            data-cma-profile-action="remove-photo">
            Remove Photo
          </button>
        </div>

        <input
          type="file"
          id="cmaProfilePhotoInput"
          class="cma-profile-file-input"
          accept="image/jpeg,image/png,image/webp">

        <div class="cma-composer-actions"
          style="display:flex;align-items:center;
          justify-content:space-between;gap:8px;
          margin-top:12px;padding-top:10px;
          border-top:1px solid #245563;">

          <button type="button"
            data-cma-profile-action="select-photo"
            style="border:0;background:transparent;
            color:#68DDB9;font:inherit;font-size:12px;
            font-weight:700;cursor:pointer;">
            📷 Photo
          </button>

          <button type="button"
            data-cma-profile-action="publish-post"
            class="cma-profile-save"
            style="width:auto;padding:9px 20px;">
            Post
          </button>

        </div>
      </section>
    `;
  }


  /* =========================================
     FRIENDSHIP STATE
  ========================================= */

  async function loadFriendship(viewedUserId) {
    const currentUser = getUser();

    if (!currentUser || !viewedUserId) {
      return {
        status: "none",
        relationship: null
      };
    }

    if (currentUser.id === viewedUserId) {
      return {
        status: "self",
        relationship: null
      };
    }

    const { data, error } = await db
      .from("cma_community_friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${currentUser.id},addressee_id.eq.${viewedUserId}),and(requester_id.eq.${viewedUserId},addressee_id.eq.${currentUser.id})`
      )
      .limit(1);

    if (error) {
      console.error("Friendship load error:", error);

      return {
        status: "none",
        relationship: null
      };
    }

    const relationship = data && data.length
      ? data[0]
      : null;

    if (!relationship) {
      return {
        status: "none",
        relationship: null
      };
    }

    if (relationship.status === "accepted") {
      return {
        status: "accepted",
        relationship
      };
    }

    if (relationship.requester_id === currentUser.id) {
      return {
        status: "sent",
        relationship
      };
    }

    return {
      status: "incoming",
      relationship
    };
  }


  /* =========================================
     PROFILE FRIEND ACTION BUTTONS
  ========================================= */

  async function renderFriendActions(root, viewedUserId) {
    const container = root.querySelector(
      "#cmaProfileFriendActions"
    );

    if (!container) return;

    const currentUser = getUser();

    if (!currentUser || currentUser.id === viewedUserId) {
      container.innerHTML = "";
      return;
    }

    const state = await loadFriendship(viewedUserId);

    currentFriendState = state;

    let friendButton = "";

    if (state.status === "accepted") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="unfriend">
          ✓ Friends
        </button>
      `;
    } else if (state.status === "sent") {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button secondary"
          data-cma-friend-action="cancel">
          Request Sent
        </button>
      `;
    } else if (state.status === "incoming") {
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
    } else {
      friendButton = `
        <button type="button"
          class="cma-profile-action-button"
          data-cma-friend-action="add">
          + Add Friend
        </button>
      `;
    }

    container.innerHTML = `
      ${friendButton}

      <button type="button"
        class="cma-profile-action-button secondary"
        data-cma-profile-action="message">
        Message
      </button>
    `;
                                     }
    /* =========================================
     PART 3 — FRIEND ACTIONS
  ========================================= */

  async function performFriendAction(action, root, viewedUserId) {
    const currentUser = getUser();

    if (!currentUser || !viewedUserId) return;

    const state = await loadFriendship(viewedUserId);
    const relationship = state.relationship;

    try {
      if (action === "add") {
        if (state.status !== "none") return;

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
          !relationship
        ) return;

        const { error } = await db
          .from("cma_community_friendships")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString()
          })
          .eq("id", relationship.id)
          .eq("addressee_id", currentUser.id)
          .eq("status", "pending");

        if (error) throw error;

        showNotice("Friend request accepted.", "success");
      }

      else if (
        action === "delete" ||
        action === "cancel"
      ) {
        if (!relationship || state.status === "accepted") {
          return;
        }

        const { error } = await db
          .from("cma_community_friendships")
          .delete()
          .eq("id", relationship.id);

        if (error) throw error;

        showNotice(
          action === "cancel"
            ? "Friend request cancelled."
            : "Friend request deleted.",
          "success"
        );
      }

      else if (action === "unfriend") {
        if (
          state.status !== "accepted" ||
          !relationship
        ) return;

        const { error } = await db
          .from("cma_community_friendships")
          .delete()
          .eq("id", relationship.id);

        if (error) throw error;

        showNotice("Friend removed.", "success");

        window.dispatchEvent(
          new CustomEvent("cma:friendship-changed", {
            detail: {
              userId: currentUser.id,
              otherUserId: viewedUserId
            }
          })
        );
      }

      await renderFriendActions(root, viewedUserId);

      if (activeTab === "friends" && lastRenderedUser) {
        await loadProfileFriends(lastRenderedUser.id, root);
      }

    } catch (error) {
      console.error("Friend action error:", error);

      showNotice(
        error.message || "Friend action failed. Please try again.",
        "error"
      );

      await renderFriendActions(root, viewedUserId);
    }
  }


  /* =========================================
     PROFILE FRIENDS LIST
  ========================================= */

  async function loadProfileFriends(profileUserId, root) {
    const container = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!container) return;

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
          `requester_id.eq.${profileUserId},addressee_id.eq.${profileUserId}`
        );

      if (error) throw error;

      if (!relationships || relationships.length === 0) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No friends to show yet.
          </div>
        `;
        return;
      }

      const friendIds = relationships.map((item) =>
        item.requester_id === profileUserId
          ? item.addressee_id
          : item.requester_id
      );

      const { data: profiles, error: profileError } = await db
        .from("cma_community_profiles")
        .select("user_id, full_name, short_description, avatar_url")
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
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
            Friends (${profiles.length})
          </div>

          <div class="cma-profile-friends-list">
            ${profiles.map((friend) => {
              const avatar = safeImage(friend.avatar_url);

              return `
                <div class="cma-profile-friend-card">

                  ${
                    avatar
                      ? `<img class="cma-profile-friend-avatar"
                          src="${avatar}" alt="">`
                      : `<div class="cma-profile-friend-avatar"
                          style="display:flex;align-items:center;
                          justify-content:center;">👤</div>`
                  }

                  <div class="cma-profile-friend-details">
                    <div class="cma-profile-friend-name">
                      ${escape(friend.full_name || "Community Member")}
                    </div>

                    <div class="cma-profile-friend-description">
                      ${escape(friend.short_description || "")}
                    </div>
                  </div>

                  <button type="button"
                    class="cma-profile-friend-view"
                    data-cma-view-profile="${escape(friend.user_id)}">
                    View
                  </button>

                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

    } catch (error) {
      console.error("Profile friends load error:", error);

      container.innerHTML = `
        <div class="cma-profile-empty">
          Could not load friends. Please try again.
        </div>
      `;
    }
  }


  /* =========================================
     PROFILE POSTS
     Uses shared Feed Post Card
  ========================================= */

  async function loadUserPosts(profileUserId, root) {
    const container = root.querySelector(
      "#cmaProfileTabContent"
    );

    if (!container) return;

    container.innerHTML = `
      <div class="cma-profile-empty">
        Loading posts...
      </div>
    `;

    try {
      const { data: posts, error } = await db
        .from("cma_community_posts")
        .select("*")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!posts || posts.length === 0) {
        container.innerHTML = `
          <div class="cma-profile-empty">
            No posts yet.
          </div>
        `;
        return;
      }

      const Feed = window.CMACommunityFeed;

      if (!Feed || typeof Feed.createPostCard !== "function") {
        console.error(
          "CMACommunityFeed.createPostCard is unavailable."
        );

        container.innerHTML = `
          <div class="cma-profile-empty">
            Post display is temporarily unavailable.
          </div>
        `;
        return;
      }

      container.innerHTML = "";

      posts.forEach((post) => {
        const cardData = {
          ...post,
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          author: {
            id: profileUserId,
            user_metadata: {
              full_name:
                lastRenderedUser?.user_metadata?.full_name ||
                "Community Member",
              avatar_url:
                lastRenderedUser?.user_metadata?.avatar_url || ""
            }
          }
        };

        const card = Feed.createPostCard(cardData);

        if (card instanceof HTMLElement) {
          container.appendChild(card);
        } else if (typeof card === "string") {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = card;
          while (wrapper.firstChild) {
            container.appendChild(wrapper.firstChild);
          }
        }
      });

      if (typeof Feed.bindEvents === "function") {
        Feed.bindEvents(root);
      }

    } catch (error) {
      console.error("Profile posts error:", error);

      container.innerHTML = `
        <div class="cma-profile-empty">
          Could not load posts. Please try again.
        </div>
      `;
    }
  }


  /* =========================================
     PROFILE DATA
  ========================================= */

  async function loadPublicProfile(userId) {
    const { data, error } = await db
      .from("cma_community_profiles")
      .select(`
        user_id,
        full_name,
        short_description,
        institution,
        avatar_url,
        mobile_number_is_public,
        address_is_public
      `)
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
        full_name: profile.full_name || "",
        short_description: profile.short_description || "",
        institution: profile.institution || "",
        avatar_url: profile.avatar_url || "",
        mobile_number_is_public:
          profile.mobile_number_is_public === true,
        address_is_public:
          profile.address_is_public === true
      }
    };
  }


  /* =========================================
     COMMUNITY NAVIGATION
  ========================================= */

  function navigateCommunity(page, userId) {
    window.dispatchEvent(
      new CustomEvent("cma:navigate", {
        detail: {
          page: page,
          userId: userId || null
        }
      })
    );
  }


  /* =========================================
     PROFILE TAB LOADER
  ========================================= */

  async function loadTab(tab, user, root) {
    activeTab = tab;

    root.querySelectorAll("[data-cma-profile-tab]")
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.cmaProfileTab === tab
        );
      });

    if (tab === "posts") {
      await loadUserPosts(user.id, root);
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


  /* =========================================
     EDIT PROFILE MODAL
  ========================================= */

  function closeProfileModal(root) {
    const modal = root.querySelector("#cmaProfileEditModal");

    if (modal) {
      modal.remove();
    }
  }


  function openProfileEditModal(user, root) {
    closeProfileModal(root);

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
            maxlength="80"
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
            maxlength="120"
            value="${escape(metadata.institution || "")}">
        </label>

        <button type="button"
          class="cma-profile-save"
          data-cma-profile-action="save-info">
          Save Changes
        </button>

        <button type="button"
          class="cma-profile-cancel"
          data-cma-profile-action="close-modal">
          Cancel
        </button>

      </div>
    `;

    root.appendChild(modal);
  }


  async function saveProfileChanges(root) {
    const currentUser = getUser();

    if (!currentUser) {
      showNotice("Please login first.", "error");
      return;
    }

    const fullName = root.querySelector("#cmaEditFullName")?.value.trim();
    const description = root.querySelector("#cmaEditDescription")?.value.trim();
    const institution = root.querySelector("#cmaEditInstitution")?.value.trim();

    if (!fullName) {
      showNotice("Please enter your full name.", "error");
      return;
    }

    const saveButton = root.querySelector(
      '[data-cma-profile-action="save-info"]'
    );

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
    }

    try {
      const { error } = await db
        .from("cma_community_profiles")
        .upsert({
          user_id: currentUser.id,
          full_name: fullName,
          short_description: description,
          institution: institution,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      if (db.auth && db.auth.updateUser) {
        const { error: authError } = await db.auth.updateUser({
          data: {
            full_name: fullName,
            short_description: description,
            institution: institution
          }
        });

        if (authError) {
          console.warn("Auth metadata update warning:", authError);
        }
      }

      showNotice("Profile updated successfully.", "success");

      closeProfileModal(root);

      await Profile.render(root, currentUser.id);

    } catch (error) {
      console.error("Profile save error:", error);

      showNotice(
        error.message || "Could not save profile.",
        "error"
      );

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
      }
    }
           }
     /* =========================================
     PART 4 — PHOTO UPLOAD & POST PUBLISH
  ========================================= */

  let selectedProfilePhoto = null;


  async function uploadProfilePhoto(file, userId) {
    if (!file || !userId) {
      throw new Error("Photo is missing.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG and WEBP photos are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Photo size must be 5MB or less.");
    }

    const extension = file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const filePath =
      `community-posts/${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from("community-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data } = db.storage
      .from("community-media")
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      throw new Error("Could not get uploaded photo URL.");
    }

    return data.publicUrl;
  }


  function showSelectedPhoto(file, root) {
    const preview = root.querySelector(
      "#cmaProfilePhotoPreview"
    );

    const image = root.querySelector(
      "#cmaProfilePreviewImage"
    );

    if (!preview || !image || !file) return;

    if (image.dataset.objectUrl) {
      URL.revokeObjectURL(image.dataset.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);

    image.src = objectUrl;
    image.dataset.objectUrl = objectUrl;

    preview.classList.add("show");
  }


  function removeSelectedPhoto(root) {
    selectedProfilePhoto = null;

    const input = root.querySelector(
      "#cmaProfilePhotoInput"
    );

    const preview = root.querySelector(
      "#cmaProfilePhotoPreview"
    );

    const image = root.querySelector(
      "#cmaProfilePreviewImage"
    );

    if (input) input.value = "";

    if (image) {
      if (image.dataset.objectUrl) {
        URL.revokeObjectURL(image.dataset.objectUrl);
      }

      image.removeAttribute("src");
      delete image.dataset.objectUrl;
    }

    if (preview) {
      preview.classList.remove("show");
    }
  }


  /* =========================================
     CREATE PROFILE POST
  ========================================= */

  async function createProfilePost(root) {
    const currentUser = getUser();

    if (!currentUser) {
      showNotice("Please login first.", "error");
      return;
    }

    const input = root.querySelector("#cmaProfilePostInput");
    const postButton = root.querySelector(
      '[data-cma-profile-action="publish-post"]'
    );

    const content = input ? input.value.trim() : "";

    if (!content && !selectedProfilePhoto) {
      showNotice("Write something or select a photo first.", "error");
      return;
    }

    if (postButton) {
      postButton.disabled = true;
      postButton.textContent = "Posting...";
    }

    try {
      let imageUrl = null;

      if (selectedProfilePhoto) {
        imageUrl = await uploadProfilePhoto(
          selectedProfilePhoto,
          currentUser.id
        );
      }

      const { error } = await db
        .from("cma_community_posts")
        .insert({
          user_id: currentUser.id,
          content: content,
          image_url: imageUrl
        });

      if (error) throw error;

      if (input) input.value = "";

      removeSelectedPhoto(root);

      showNotice("Post published successfully.", "success");

      await loadUserPosts(currentUser.id, root);

    } catch (error) {
      console.error("Profile post publish error:", error);

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


  /* =========================================
     PROFILE EVENT HANDLERS
  ========================================= */

  function bindEvents(root, user, isOwnProfile) {
    if (root.dataset.cmaProfileEvents === "true") {
      return;
    }

    root.dataset.cmaProfileEvents = "true";

    root.addEventListener("click", async function (event) {
      const friendButton = event.target.closest(
        "[data-cma-friend-action]"
      );

      if (friendButton) {
        event.preventDefault();

        if (friendButton.disabled) return;

        friendButton.disabled = true;

        const action = friendButton.dataset.cmaFriendAction;
        const viewedUserId = root.querySelector(
          "#cmaProfileFriendActions"
        )?.dataset.profileUserId;

        await performFriendAction(
          action,
          root,
          viewedUserId
        );

        return;
      }

      const tabButton = event.target.closest(
        "[data-cma-profile-tab]"
      );

      if (tabButton) {
        event.preventDefault();

        await loadTab(
          tabButton.dataset.cmaProfileTab,
          user,
          root
        );

        return;
      }

      const viewProfileButton = event.target.closest(
        "[data-cma-view-profile]"
      );

      if (viewProfileButton) {
        navigateCommunity(
          "profile",
          viewProfileButton.dataset.cmaViewProfile
        );

        return;
      }

      const pageButton = event.target.closest(
        "[data-cma-profile-page]"
      );

      if (pageButton) {
        navigateCommunity(
          pageButton.dataset.cmaProfilePage
        );

        return;
      }

      const actionButton = event.target.closest(
        "[data-cma-profile-action]"
      );

      if (!actionButton) return;

      const action = actionButton.dataset.cmaProfileAction;

      if (action === "search") {
        navigateCommunity("search");
      }

      else if (action === "edit-info" && isOwnProfile) {
        openProfileEditModal(user, root);
      }

      else if (action === "close-modal") {
        closeProfileModal(root);
      }

      else if (action === "save-info") {
        await saveProfileChanges(root);
      }

      else if (action === "select-photo" && isOwnProfile) {
        root.querySelector("#cmaProfilePhotoInput")?.click();
      }

      else if (action === "remove-photo") {
        removeSelectedPhoto(root);
      }

      else if (action === "publish-post" && isOwnProfile) {
        await createProfilePost(root);
      }

      else if (action === "message" && !isOwnProfile) {
        if (
          window.CMACommunityMessaging &&
          typeof window.CMACommunityMessaging.openConversation === "function"
        ) {
          window.CMACommunityMessaging.openConversation(user.id);
        } else {
          showNotice(
            "Messaging is not available yet.",
            "info"
          );
        }
      }
    });


    root.addEventListener("change", function (event) {
      if (
        event.target &&
        event.target.id === "cmaProfilePhotoInput"
      ) {
        const file = event.target.files &&
          event.target.files[0];

        if (!file) return;

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
          showNotice(
            "Only JPG, PNG and WEBP photos are allowed.",
            "error"
          );

          event.target.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          showNotice(
            "Photo size must be 5MB or less.",
            "error"
          );

          event.target.value = "";
          return;
        }

        selectedProfilePhoto = file;

        showSelectedPhoto(file, root);
      }
    });


    root.addEventListener("click", function (event) {
      const modal = event.target;

      if (
        modal &&
        modal.id === "cmaProfileEditModal"
      ) {
        closeProfileModal(root);
      }
    });
  }


  /* =========================================
     PROFILE RENDER
  ========================================= */

  const Profile = {

    async render(root, targetUserId = null) {
      if (!root) {
        console.error("Profile root element is missing.");
        return;
      }

      try {
        if (Core && typeof Core.loadSession === "function") {
          await Core.loadSession();
        }

        const currentUser = getUser();

        if (!currentUser) {
          root.innerHTML = `
            <div class="cma-profile-empty">
              Please login to view the Community Profile.
            </div>
          `;
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

          if (
            profileUser &&
            currentUser.user_metadata
          ) {
            profileUser.user_metadata = {
              ...currentUser.user_metadata,
              ...profileUser.user_metadata
            };
          }

        } else {
          const profile = await loadPublicProfile(
            viewedUserId
          );

          if (!profile) {
            root.innerHTML = `
              <div class="cma-profile-empty">
                This profile could not be found.
              </div>
            `;
            return;
          }

          profileUser = makeProfileUser(profile);
        }

        if (!profileUser) {
          throw new Error("Could not load profile information.");
        }

        selectedProfilePhoto = null;

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

        if (!isOwnProfile) {
          await renderFriendActions(
            root,
            viewedUserId
          );
        }

        await loadTab(
          activeTab,
          profileUser,
          root
        );

        const Feed = window.CMACommunityFeed;

        if (
          Feed &&
          typeof Feed.bindEvents === "function"
        ) {
          Feed.bindEvents(root);
        }

      } catch (error) {
        console.error("Profile render error:", error);

        root.innerHTML = `
          <div class="cma-profile-empty">
            Profile could not be loaded. Please refresh and try again.
          </div>
        `;
      }
    }

  };


  /* =========================================
     MODULE EXPORT
  ========================================= */

  window.CMACommunityProfile = Profile;

})();
