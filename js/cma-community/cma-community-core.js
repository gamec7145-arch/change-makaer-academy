
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY CORE
   Shared utilities and session management
   SESSION RACE CONDITION FIX
========================================= */

(function () {
  "use strict";

  const db = window.cmaSupabase || null;
  const BUCKET = "community-media";

  let currentUser = null;
  let sessionRevision = 0;
  let sessionReady = false;

  // =========================================
  // HTML SECURITY
  // =========================================

  function escapeHTML(value) {
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

  // =========================================
  // ELEMENT HELPERS
  // =========================================

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }

  function getRoot() {
    return document.getElementById("pageContent");
  }

  // =========================================
  // PUBLIC PROFILE METADATA
  // =========================================

  function getProfileMetadata(user) {
    const metadata = user?.user_metadata || {};

    const fullName =
      metadata.full_name ||
      metadata.name ||
      metadata.display_name ||
      "";

    const avatarURL =
      metadata.avatar_url ||
      metadata.picture ||
      metadata.avatar ||
      "";

    return {
      full_name: String(fullName).trim(),
      avatar_url: String(avatarURL).trim()
    };
  }

  // =========================================
  // PUBLIC PROFILE SYNC
  // =========================================

  async function syncPublicProfile(user, expectedRevision = null) {
    if (!db || !user?.id) return false;

    // Prevent an old session from updating profile data.
    if (
      expectedRevision !== null &&
      expectedRevision !== sessionRevision
    ) {
      return false;
    }

    if (
      currentUser &&
      currentUser.id !== user.id
    ) {
      return false;
    }

    try {
      const metadata = getProfileMetadata(user);

      const { data: existing, error: readError } = await db
        .from("cma_community_profiles")
        .select(
          "user_id,full_name,short_description,institution,avatar_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (readError) throw readError;

      // Check session again after asynchronous database read.
      if (
        expectedRevision !== null &&
        expectedRevision !== sessionRevision
      ) {
        return false;
      }

      if (
        currentUser &&
        currentUser.id !== user.id
      ) {
        return false;
      }

      const fullName =
        metadata.full_name ||
        existing?.full_name ||
        "";

      const avatarURL =
        metadata.avatar_url ||
        existing?.avatar_url ||
        "";

      if (!fullName) {
        console.warn(
          "Profile sync skipped: member name is not available."
        );

        return false;
      }

      const profileData = {
        user_id: user.id,
        full_name: fullName,

        // Preserve existing profile information.
        short_description:
          existing?.short_description || "",

        institution:
          existing?.institution || "",

        avatar_url: avatarURL,
        updated_at: new Date().toISOString()
      };

      const { error: saveError } = await db
        .from("cma_community_profiles")
        .upsert(profileData, {
          onConflict: "user_id"
        });

      if (saveError) throw saveError;

      if (
        expectedRevision !== null &&
        expectedRevision !== sessionRevision
      ) {
        return false;
      }

      console.log(
        "Community public profile synced:",
        user.id
      );

      return true;

    } catch (error) {
      console.error("Public profile sync error:", error);
      return false;
    }
  }

  // =========================================
  // SESSION MANAGEMENT
  // =========================================

  async function loadSession() {

    if (!db || !db.auth) {
      sessionRevision++;
      currentUser = null;
      sessionReady = true;

      return {
        user: null,
        error: new Error(
          "Supabase connection is unavailable."
        )
      };
    }

    // Each request gets a unique revision.
    const requestRevision = ++sessionRevision;

    try {
      const { data, error } = await db.auth.getUser();

      if (error) throw error;

      // Ignore outdated requests.
      if (requestRevision !== sessionRevision) {
        return {
          user: currentUser,
          error: null,
          stale: true
        };
      }

      currentUser = data.user || null;
      sessionReady = true;

      if (currentUser) {
        await syncPublicProfile(
          currentUser,
          requestRevision
        );
      }

      // An auth event may have changed the session
      // while public profile sync was running.
      if (requestRevision !== sessionRevision) {
        return {
          user: currentUser,
          error: null,
          stale: true
        };
      }

      return {
        user: currentUser,
        error: null
      };

    } catch (error) {

      // Never let an old failed request clear a newer session.
      if (requestRevision !== sessionRevision) {
        return {
          user: currentUser,
          error: null,
          stale: true
        };
      }

      currentUser = null;
      sessionReady = true;

      return {
        user: null,
        error
      };
    }
  }

  // =========================================
  // SESSION ACCESS
  // =========================================

  function getCurrentUser() {
    return currentUser;
  }

  function setCurrentUser(user) {
    // Invalidate pending session requests.
    sessionRevision++;

    currentUser = user || null;
    sessionReady = true;
  }

  function isSessionReady() {
    return sessionReady;
  }

  // =========================================
  // RELATIVE TIME
  // =========================================

  function formatRelativeTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return minutes +
        (minutes === 1 ? " minute ago" : " minutes ago");
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return hours +
        (hours === 1 ? " hour ago" : " hours ago");
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return days +
        (days === 1 ? " day ago" : " days ago");
    }

    const weeks = Math.floor(days / 7);

    if (days < 30) {
      return weeks +
        (weeks === 1 ? " week ago" : " weeks ago");
    }

    const months = Math.floor(days / 30);

    if (days < 365) {
      return months +
        (months === 1 ? " month ago" : " months ago");
    }

    const years = Math.floor(days / 365);

    return years +
      (years === 1 ? " year ago" : " years ago");
  }

  // =========================================
  // NOTICE SYSTEM
  // =========================================

  function showNotice(message, type = "info") {
    let notice = document.getElementById(
      "cmaCommunityNotice"
    );

    if (!notice) {
      notice = createElement(
        "div",
        "cma-community-notice"
      );

      notice.id = "cmaCommunityNotice";
      notice.setAttribute("role", "status");

      document.body.appendChild(notice);
    }

    notice.textContent = String(message || "");
    notice.dataset.type = type;
    notice.classList.add("show");

    clearTimeout(notice._timer);

    notice._timer = setTimeout(function () {
      notice.classList.remove("show");
    }, 3000);
  }

  // =========================================
  // LOGIN PROTECTION
  // =========================================

  function requireLogin() {
    if (currentUser) return true;

    showNotice(
      "Please log in from the Account page to continue.",
      "error"
    );

    return false;
  }

  // =========================================
  // SAFE IMAGE URL
  // =========================================

  function safeImageURL(value) {
    if (!value) return "";

    try {
      const url = new URL(
        String(value),
        window.location.origin
      );

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        return "";
      }

      return url.href;

    } catch (error) {
      return "";
    }
  }

  // =========================================
  // CORE PUBLIC API
  // =========================================

  window.CMACommunityCore = {
    db,
    BUCKET,

    escapeHTML,
    createElement,
    getRoot,

    loadSession,
    getCurrentUser,
    setCurrentUser,
    isSessionReady,

    formatRelativeTime,
    showNotice,
    requireLogin,
    safeImageURL,

    syncPublicProfile
  };

  // =========================================
  // SUPABASE AUTH STATE LISTENER
  // =========================================

  if (
    db &&
    db.auth &&
    typeof db.auth.onAuthStateChange === "function"
  ) {

    db.auth.onAuthStateChange(function (_event, session) {

      // Every auth event invalidates older requests.
      const eventRevision = ++sessionRevision;

      currentUser = session?.user || null;
      sessionReady = true;

      // Capture the user associated with this event.
      const userToSync = currentUser;

      if (userToSync) {

        // Run database work after the auth callback.
        Promise.resolve().then(function () {

          // Do not sync if another auth event has occurred.
          if (eventRevision !== sessionRevision) {
            return false;
          }

          if (
            !currentUser ||
            currentUser.id !== userToSync.id
          ) {
            return false;
          }

          return syncPublicProfile(
            userToSync,
            eventRevision
          );

        }).catch(function (error) {
          console.error(
            "CMA Auth Profile Sync Error:",
            error
          );
        });
      }
    });
  }

})();
     
