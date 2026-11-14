
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY CORE
   Shared utilities and session management
========================================= */

(function () {
  "use strict";

  const db = window.cmaSupabase || null;
  const BUCKET = "community-media";

  let currentUser = null;

  // HTML নিরাপদভাবে দেখানোর জন্য
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

  // HTML element তৈরি
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

  // Community page-এর মূল content
  function getRoot() {
    return document.getElementById("pageContent");
  }

  // Supabase login session
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

  // Current user
  function getCurrentUser() {
    return currentUser;
  }

  function setCurrentUser(user) {
    currentUser = user || null;
  }

  // Relative time
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

  // Notification message
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

  // Login check
  function requireLogin() {
    if (currentUser) return true;

    showNotice(
      "Please log in from the Account page to continue.",
      "error"
    );

    return false;
  }

  // Safe image URL
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

  // Shared Community tools
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
    safeImageURL
  };

  // Keep session updated after login/logout
  if (db) {
    db.auth.onAuthStateChange(function (_event, session) {
      currentUser = session?.user || null;
    });
  }

})();
  
