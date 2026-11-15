
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY CORE
   Shared utilities and session management
   PUBLIC PROFILE SYNC UPDATE
========================================= */

(function () {
  "use strict";

  const db = window.cmaSupabase || null;
  const BUCKET = "community-media";

  let currentUser = null;

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

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) element.className = className;

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }

  function getRoot() {
    return document.getElementById("pageContent");
  }

  // Get public name and avatar from the member's own account metadata.
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

  // Sync only the currently logged-in member's public profile.
  async function syncPublicProfile(user) {
    if (!db || !user?.id) return false;

    try {
      const metadata = getProfileMetadata(user);

      const { data: existing, error: readError } = await db
        .from("cma_community_profiles")
        .select("user_id,full_name,avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (readError) throw readError;

      const fullName =
        metadata.full_name ||
        existing?.full_name ||
        "";

      const avatarURL =
        metadata.avatar_url ||
        existing?.avatar_url ||
        "";

      // Do not create an incomplete profile without a real name.
      if (!fullName) {
        console.warn(
          "Profile sync skipped: member name is not available."
        );
        return false;
      }

      const profileData = {
        user_id: user.id,
        full_name: fullName,
        short_description: "",
        institution: "",
        avatar_url: avatarURL,
        updated_at: new Date().toISOString()
      };

      // Preserve existing information that is not supplied by auth metadata.
      if (existing) {
        profileData.short_description =
          existing.short_description || "";

        profileData.institution =
          existing.institution || "";
      }

      const { error: saveError } = await db
        .from("cma_community_profiles")
        .upsert(profileData, {
          onConflict: "user_id"
        });

      if (saveError) throw saveError;

      console.log("Community public profile synced:", user.id);

      return true;

    } catch (error) {
      console.error("Public profile sync error:", error);
      return false;
    }
  }

  async function loadSession() {
    if (!db) {
      currentUser = null;

      return {
        user: null,
        error: new Error("Supabase connection is unavailable.")
      };
    }

    try {
      const { data, error } = await db.auth.getUser();

      if (error) throw error;

      currentUser = data.user || null;

      if (currentUser) {
        await syncPublicProfile(currentUser);
      }

      return {
        user: currentUser,
        error: null
      };

    } catch (error) {
      currentUser = null;

      return {
        user: null,
        error
      };
    }
  }

  function getCurrentUser() {
    return currentUser;
  }

  function setCurrentUser(user) {
    currentUser = user || null;
  }

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
      return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours + (hours === 1 ? " hour ago" : " hours ago");
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return days + (days === 1 ? " day ago" : " days ago");
    }

    const weeks = Math.floor(days / 7);
    if (days < 30) {
      return weeks + (weeks === 1 ? " week ago" : " weeks ago");
    }

    const months = Math.floor(days / 30);
    if (days < 365) {
      return months + (months === 1 ? " month ago" : " months ago");
    }

    const years = Math.floor(days / 365);
    return years + (years === 1 ? " year ago" : " years ago");
  }

  function showNotice(message, type = "info") {
    let notice = document.getElementById("cmaCommunityNotice");

    if (!notice) {
      notice = createElement("div", "cma-community-notice");
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

  function requireLogin() {
    if (currentUser) return true;

    showNotice(
      "Please log in from the Account page to continue.",
      "error"
    );

    return false;
  }

  function safeImageURL(value) {
    if (!value) return "";

    try {
      const url = new URL(String(value), window.location.origin);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return "";
      }

      return url.href;

    } catch (error) {
      return "";
    }
  }

  window.CMACommunityCore = {
    db,
    BUCKET,
    escapeHTML,
    createElement,
    getRoot,
    loadSession,
    getCurrentUser,
    setCurrentUser,
    formatRelativeTime,
    showNotice,
    requireLogin,
    safeImageURL,
    syncPublicProfile
  };

  if (db) {
    db.auth.onAuthStateChange(function (_event, session) {
      currentUser = session?.user || null;

      if (currentUser) {
        // Run after the auth callback completes.
        Promise.resolve().then(function () {
          return syncPublicProfile(currentUser);
        });
      }
    });
  }

})();
