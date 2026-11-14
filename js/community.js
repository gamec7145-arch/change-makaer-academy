(function () {
  "use strict";

  /* ==========================================
     CHANGE MAKER ACADEMY
     COMMUNITY SYSTEM
     PART 1/9 — CORE FOUNDATION
  ========================================== */

  const db = window.cmaSupabase;
  const BUCKET = "community-media";

  const LOGIN_ERROR =
    "Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";

  const THEME = {
    bg: "#073746",
    deep: "#052D3B",
    panel: "#08494B",
    card: "#103E4C",
    border: "#245563",
    green: "#08C99A",
    mint: "#68DDB9",
    white: "#FFFFFF",
    muted: "#A8C0CE"
  };

  const EMOJIS = ["👍", "❤️", "😂", "😮"];

  const POST_SCOPES = {
    COMMUNITY: "community",
    CREATOR: "creator",
    HOME: "home",
    STUDY: "study",
    EXAM: "exam",
    ONLINE: "online",
    OFFLINE: "offline"
  };

  const state = {
    page: "community",
    section: "home",

    previousPage: "home",

    activeProfileId: null,
    activeProfileTab: "Posts",
    activeSearchTab: "Profiles",

    searchQuery: "",
    recentSearches: [],

    activePost: null,
    activeCommentPost: null,

    loading: false,
    initialized: false,

    modalOpen: false,
    searchVersion: 0
  };

  let currentUser = null;
  let currentProfile = null;
  let currentPrivate = null;
  let currentRole = null;

  let posts = [];
  let reactions = [];
  let comments = [];
  let profiles = [];

  let friendRequests = [];
  let friendships = [];
  let notifications = [];

  let creatorRoles = [];

  let selectedPostImage = null;
  let selectedAvatar = null;
  let selectedCover = null;

  /* ==========================================
     DOM HELPERS
  ========================================== */

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== "") {
      element.textContent = text;
    }

    return element;
  }

  function clearElement(element) {
    if (element) {
      element.replaceChildren();
    }
  }

  function makeButton(text, className = "", onClick = null) {
    const button = createElement("button", className, text);
    button.type = "button";

    if (typeof onClick === "function") {
      button.addEventListener("click", onClick);
    }

    return button;
  }

  function makeInput(placeholder = "", className = "") {
    const input = createElement("input", className);
    input.type = "text";
    input.placeholder = placeholder;
    return input;
  }

  function makeTextarea(placeholder = "", className = "") {
    const textarea = createElement("textarea", className);
    textarea.placeholder = placeholder;
    return textarea;
  }

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeImage(url) {
    if (!url || typeof url !== "string") {
      return "";
    }

    try {
      const parsed = new URL(url, window.location.origin);

      if (
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
      ) {
        return parsed.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function getInitial(name) {
    const value = String(name || "M").trim();
    return value.charAt(0).toUpperCase() || "M";
  }

  function getCommunityRoot() {
    return (
      document.getElementById("communityRoot") ||
      document.getElementById("communityPage") ||
      document.querySelector("[data-community-root]") ||
      document.body
    );
  }

  function currentName() {
    return (
      currentProfile?.display_name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "Member"
    );
  }

  function getProfile(userId) {
    if (!userId) return null;

    return profiles.find(
      profile => String(profile.user_id) === String(userId)
    ) || (
      currentProfile &&
      String(currentProfile.user_id) === String(userId)
        ? currentProfile
        : null
    );
  }

  function getRole(userId) {
    if (!userId) return null;

    if (
      currentUser &&
      String(currentUser.id) === String(userId)
    ) {
      return currentRole;
    }

    return creatorRoles.find(
      item => String(item.user_id) === String(userId)
    )?.role || null;
  }

  function isCreator(userId = currentUser?.id) {
    const role = getRole(userId);

    return ["admin", "moderator", "developer"].includes(
      String(role || "").toLowerCase()
    );
  }

  function requireLogin() {
    if (!currentUser) {
      showNotice(LOGIN_ERROR, "error");
      return false;
    }

    return true;
  }

  function showNotice(message, type = "info") {
    const oldNotice = $(".cma-notice");

    if (oldNotice) {
      oldNotice.remove();
    }

    const notice = createElement(
      "div",
      `cma-notice cma-notice-${type}`
    );

    notice.textContent = message;
    notice.setAttribute("role", "status");

    getCommunityRoot().appendChild(notice);

    window.setTimeout(() => {
      notice.remove();
    }, 4500);
  }

  /* ==========================================
     DATE & TIME HELPERS
  ========================================== */

  function formatRelativeTime(dateValue) {
    if (!dateValue) return "Recently";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const seconds = Math.floor(
      (Date.now() - date.getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    if (days < 30) {
      return `${Math.floor(days / 7)}w ago`;
    }

    if (days < 365) {
      return `${Math.floor(days / 30)}mo ago`;
    }

    return `${Math.floor(days / 365)}y ago`;
  }

  function dateText(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  /* ==========================================
     DATABASE HELPERS
  ========================================== */

  function getDatabase() {
    return window.cmaSupabase || db || null;
  }

  async function runQuery(query) {
    if (!query || typeof query.then !== "function") {
      throw new Error("Invalid database query.");
    }

    const result = await query;

    if (result.error) {
      throw result.error;
    }

    return result;
  }

  function requireDatabase() {
    const client = getDatabase();

    if (!client) {
      showNotice(
        "Community database is not connected. Please check Supabase configuration.",
        "error"
      );

      return null;
    }

    return client;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function sortNewest(items, field = "created_at") {
    return [...asArray(items)].sort((a, b) => {
      return (
        new Date(b?.[field] || 0).getTime() -
        new Date(a?.[field] || 0).getTime()
      );
    });
  }

  function uniqueBy(items, key) {
    const seen = new Set();

    return asArray(items).filter(item => {
      const value = item?.[key];

      if (value == null || seen.has(String(value))) {
        return false;
      }

      seen.add(String(value));
      return true;
    });
  }

  function getErrorMessage(error) {
    return (
      error?.message ||
      error?.details ||
      "Something went wrong. Please try again."
    );
  }

  /* ==========================================
     END OF PART 1
     NEXT: SESSION + DATABASE LOADING
  ========================================== */
   
  /* ==========================================
     PART 2/9 — SESSION & DATA LOADING
  ========================================== */

  async function loadSession() {
    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client.auth.getSession();

      if (error) throw error;

      currentUser = data?.session?.user || null;

      return currentUser;
    } catch (error) {
      console.error("Community session error:", error);
      currentUser = null;
      return null;
    }
  }

  async function loadMyProfile() {
    if (!currentUser) {
      currentProfile = null;
      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      currentProfile = data || null;

      if (
        currentProfile &&
        !profiles.some(
          item => String(item.user_id) === String(currentUser.id)
        )
      ) {
        profiles.push(currentProfile);
      }

      return currentProfile;
    } catch (error) {
      console.error("My profile loading error:", error);
      currentProfile = null;
      return null;
    }
  }

  async function loadMyPrivateProfile() {
    if (!currentUser) {
      currentPrivate = null;
      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_private_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      currentPrivate = data || null;
      return currentPrivate;
    } catch (error) {
      console.error("Private profile loading error:", error);
      currentPrivate = null;
      return null;
    }
  }

  async function loadMyRole() {
    if (!currentUser) {
      currentRole = null;
      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_creator_roles")
        .select("user_id, role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      currentRole = data?.role || null;

      if (data) {
        creatorRoles = [
          ...creatorRoles.filter(
            item => String(item.user_id) !== String(currentUser.id)
          ),
          data
        ];
      }

      return currentRole;
    } catch (error) {
      console.error("Creator role loading error:", error);
      currentRole = null;
      return null;
    }
  }

  async function loadCreatorRoles() {
    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_creator_roles")
        .select("user_id, role");

      if (error) throw error;

      creatorRoles = asArray(data);

      if (currentUser) {
        const ownRole = creatorRoles.find(
          item => String(item.user_id) === String(currentUser.id)
        );

        currentRole = ownRole?.role || null;
      }

      return creatorRoles;
    } catch (error) {
      console.error("Creator roles loading error:", error);
      return creatorRoles;
    }
  }

  async function loadPosts() {
    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      posts = sortNewest(data);
      return posts;
    } catch (error) {
      console.error("Community posts loading error:", error);
      posts = [];
      return posts;
    }
  }

  async function loadReactions() {
    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_reactions")
        .select("*");

      if (error) throw error;

      reactions = asArray(data);
      return reactions;
    } catch (error) {
      console.error("Reactions loading error:", error);
      reactions = [];
      return reactions;
    }
  }

  async function loadComments() {
    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      comments = asArray(data);
      return comments;
    } catch (error) {
      console.error("Comments loading error:", error);
      comments = [];
      return comments;
    }
  }

  async function loadPublicProfiles() {
    const client = requireDatabase();
    if (!client) return [];

    const pageSize = 500;
    let from = 0;
    let allProfiles = [];

    try {
      while (true) {
        let result = await client
          .from("community_profiles")
          .select("*")
          .range(from, from + pageSize - 1);

        if (result.error) throw result.error;

        const batch = asArray(result.data);
        allProfiles = allProfiles.concat(batch);

        if (batch.length < pageSize) break;

        from += pageSize;
      }

      profiles = uniqueBy(allProfiles, "user_id");

      if (currentProfile) {
        profiles = uniqueBy(
          [currentProfile, ...profiles],
          "user_id"
        );
      }

      return profiles;
    } catch (error) {
      console.error("Public profiles loading error:", error);

      if (currentProfile) {
        profiles = uniqueBy(
          [currentProfile, ...profiles],
          "user_id"
        );
      }

      return profiles;
    }
  }

  async function fetchPublicProfile(userId) {
    if (!userId) return null;

    const client = requireDatabase();
    if (!client) return null;

    if (
      currentProfile &&
      String(currentProfile.user_id) === String(userId)
    ) {
      return currentProfile;
    }

    const cached = getProfile(userId);
    if (cached) return cached;

    try {
      const { data, error } = await client
        .from("community_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        profiles = uniqueBy(
          [data, ...profiles],
          "user_id"
        );
      }

      return data || null;
    } catch (error) {
      console.error("Single profile loading error:", error);
      return null;
    }
  }

  function getReaction(postId, userId = currentUser?.id) {
    return reactions.find(item =>
      String(item.post_id) === String(postId) &&
      String(item.user_id) === String(userId)
    ) || null;
  }

  function getPostReactions(postId) {
    return reactions.filter(
      item => String(item.post_id) === String(postId)
    );
  }

  function getPostComments(postId) {
    return sortNewest(
      comments.filter(
        item => String(item.post_id) === String(postId)
      ),
      "created_at"
    );
  }

  async function refreshCommunityData() {
    if (state.loading) return;

    state.loading = true;

    try {
      await loadSession();

      if (!currentUser) {
        currentProfile = null;
        currentPrivate = null;
        currentRole = null;
      } else {
        await Promise.all([
          loadMyProfile(),
          loadMyPrivateProfile(),
          loadMyRole()
        ]);
      }

      await Promise.all([
        loadPublicProfiles(),
        loadCreatorRoles(),
        loadPosts(),
        loadReactions(),
        loadComments()
      ]);

      state.initialized = true;

      return true;
    } catch (error) {
      console.error("Community refresh error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    } finally {
      state.loading = false;
    }
  }

  /* ==========================================
     END OF PART 2
     NEXT: IMAGE UPLOAD + PROFILE + POSTS
  ========================================== */
       
  /* ==========================================
     PART 3/9 — PROFILE + IMAGE + POST SYSTEM
  ========================================== */

  function validateCommunityImage(file) {
    if (!file) {
      throw new Error("Please select an image first.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG and WEBP images are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be 5 MB or less.");
    }

    return true;
  }

  async function uploadCommunityImage(file, folder = "posts") {
    validateCommunityImage(file);

    if (!requireLogin()) {
      throw new Error(LOGIN_ERROR);
    }

    const client = requireDatabase();
    if (!client) {
      throw new Error("Database connection is unavailable.");
    }

    const extension = file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";

    const safeFolder = String(folder).replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );

    const filePath =
      `${currentUser.id}/${safeFolder}/` +
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

    const { data, error } = await client.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data: publicData } = client.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    const imageUrl = safeImage(publicData?.publicUrl);

    if (!imageUrl) {
      throw new Error("Could not create the image URL.");
    }

    return imageUrl;
  }

  function chooseCommunityImage(callback, folder = "posts") {
    if (typeof callback !== "function") return;

    if (!requireLogin()) return;

    const input = createElement("input");

    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.hidden = true;

    document.body.appendChild(input);

    input.addEventListener("change", async () => {
      const file = input.files?.[0];

      if (!file) {
        input.remove();
        return;
      }

      try {
        validateCommunityImage(file);

        const imageUrl = await uploadCommunityImage(
          file,
          folder
        );

        await callback(imageUrl, file);
      } catch (error) {
        showNotice(getErrorMessage(error), "error");
      } finally {
        input.remove();
      }
    });

    input.click();
  }

  async function saveProfile(formData = {}) {
    if (!requireLogin()) return null;

    const client = requireDatabase();
    if (!client) return null;

    const displayName = String(
      formData.display_name ?? currentProfile?.display_name ?? ""
    ).trim();

    const shortDescription = String(
      formData.short_description ??
      currentProfile?.short_description ??
      ""
    ).trim();

    const school = String(
      formData.school ?? currentProfile?.school ?? ""
    ).trim();

    if (!displayName) {
      showNotice("Full name is required.", "error");
      return null;
    }

    const payload = {
      user_id: currentUser.id,
      display_name: displayName,
      short_description: shortDescription,
      school
    };

    if (formData.avatar_url !== undefined) {
      payload.avatar_url = safeImage(formData.avatar_url);
    }

    if (formData.cover_url !== undefined) {
      payload.cover_url = safeImage(formData.cover_url);
    }

    try {
      const { data, error } = await client
        .from("community_profiles")
        .upsert(payload, {
          onConflict: "user_id"
        })
        .select()
        .single();

      if (error) throw error;

      currentProfile = data;

      profiles = uniqueBy(
        [data, ...profiles],
        "user_id"
      );

      return data;
    } catch (error) {
      console.error("Profile saving error:", error);
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function savePrivateProfile(formData = {}) {
    if (!requireLogin()) return null;

    const client = requireDatabase();
    if (!client) return null;

    const payload = {
      user_id: currentUser.id,
      phone: String(
        formData.phone ?? currentPrivate?.phone ?? ""
      ).trim(),
      address: String(
        formData.address ?? currentPrivate?.address ?? ""
      ).trim()
    };

    try {
      const { data, error } = await client
        .from("community_private_profiles")
        .upsert(payload, {
          onConflict: "user_id"
        })
        .select()
        .single();

      if (error) throw error;

      currentPrivate = data;
      return data;
    } catch (error) {
      console.error("Private profile saving error:", error);
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function updateProfilePicture(file) {
    if (!requireLogin()) return null;

    try {
      const imageUrl = await uploadCommunityImage(
        file,
        "avatars"
      );

      const saved = await saveProfile({
        avatar_url: imageUrl
      });

      if (saved) {
        showNotice("Profile picture updated.", "success");
      }

      return saved;
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function updateCoverPhoto(file) {
    if (!requireLogin()) return null;

    try {
      const imageUrl = await uploadCommunityImage(
        file,
        "covers"
      );

      const saved = await saveProfile({
        cover_url: imageUrl
      });

      if (saved) {
        showNotice("Cover photo updated.", "success");
      }

      return saved;
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function publishPost({
    caption = "",
    imageUrl = "",
    imageFile = null,
    scope = POST_SCOPES.COMMUNITY
  } = {}) {
    if (!requireLogin()) return null;

    const client = requireDatabase();
    if (!client) return null;

    const allowedScopes = Object.values(POST_SCOPES);

    if (!allowedScopes.includes(scope)) {
      showNotice("Invalid publishing destination.", "error");
      return null;
    }

    if (
      scope !== POST_SCOPES.COMMUNITY &&
      !isCreator()
    ) {
      showNotice(
        "Only Admin, Moderator and Developer can publish here.",
        "error"
      );
      return null;
    }

    const content = String(caption || "").trim();

    if (!content && !imageUrl && !imageFile) {
      showNotice(
        "Write something or add a photo before publishing.",
        "error"
      );
      return null;
    }

    try {
      let finalImageUrl = "";

      if (imageFile) {
        finalImageUrl = await uploadCommunityImage(
          imageFile,
          "posts"
        );
      } else if (imageUrl) {
        finalImageUrl = safeImage(imageUrl);

        if (!finalImageUrl) {
          throw new Error("Invalid image URL.");
        }
      }

      const payload = {
        user_id: currentUser.id,
        content,
        image_url: finalImageUrl || null,
        post_scope: scope
      };

      const { data, error } = await client
        .from("community_posts")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      posts = sortNewest([data, ...posts]);

      selectedPostImage = null;

      showNotice("Post published successfully.", "success");

      return data;
    } catch (error) {
      console.error("Post publishing error:", error);
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function deletePost(postId) {
    if (!requireLogin()) return false;

    const post = posts.find(
      item => String(item.id) === String(postId)
    );

    if (!post) {
      showNotice("Post not found.", "error");
      return false;
    }

    const isOwner =
      String(post.user_id) === String(currentUser.id);

    if (!isOwner && !isCreator()) {
      showNotice(
        "You do not have permission to delete this post.",
        "error"
      );
      return false;
    }

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      posts = posts.filter(
        item => String(item.id) !== String(postId)
      );

      reactions = reactions.filter(
        item => String(item.post_id) !== String(postId)
      );

      comments = comments.filter(
        item => String(item.post_id) !== String(postId)
      );

      showNotice("Post deleted.", "success");
      return true;
    } catch (error) {
      console.error("Post deletion error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  async function toggleReaction(postId, emoji) {
    if (!requireLogin()) return false;

    if (!EMOJIS.includes(emoji)) {
      showNotice("Invalid reaction.", "error");
      return false;
    }

    const client = requireDatabase();
    if (!client) return false;

    const existing = getReaction(postId);

    try {
      if (existing?.emoji === emoji) {
        const { error } = await client
          .from("community_reactions")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;

        reactions = reactions.filter(
          item => String(item.id) !== String(existing.id)
        );
      } else if (existing) {
        const { data, error } = await client
          .from("community_reactions")
          .update({ emoji })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;

        reactions = reactions.map(item =>
          String(item.id) === String(existing.id)
            ? data
            : item
        );
      } else {
        const { data, error } = await client
          .from("community_reactions")
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            emoji
          })
          .select()
          .single();

        if (error) throw error;

        reactions.push(data);

        const post = posts.find(
          item => String(item.id) === String(postId)
        );

        if (
          post &&
          String(post.user_id) !== String(currentUser.id)
        ) {
          await createCommunityNotification(
            post.user_id,
            `${currentName()} reacted ${emoji} to your post.`
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Reaction update error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  /* ==========================================
     END OF PART 3
     NEXT: POST CARD + COMMENTS SYSTEM
  ========================================== */
      
  /* ==========================================
     PART 4/9 — POST CARD + COMMENTS SYSTEM
  ========================================== */

  function createMemberAvatar(userId, size = "normal") {
    const profile = getProfile(userId);
    const avatar = createElement(
      "div",
      `cma-avatar cma-avatar-${size}`
    );

    const imageUrl = safeImage(profile?.avatar_url);

    if (imageUrl) {
      const image = createElement("img");
      image.src = imageUrl;
      image.alt = "Member profile picture";
      image.loading = "lazy";

      image.onerror = () => {
        image.remove();
        avatar.textContent = getInitial(profile?.display_name);
      };

      avatar.appendChild(image);
    } else {
      avatar.textContent = getInitial(profile?.display_name);
    }

    return avatar;
  }

  function getMemberName(userId) {
    if (
      currentUser &&
      String(currentUser.id) === String(userId)
    ) {
      return currentName();
    }

    return (
      getProfile(userId)?.display_name ||
      "Community Member"
    );
  }

  function openCommunityProfile(userId) {
    if (!userId) return;

    if (typeof window.cmaOpenCommunityProfile === "function") {
      window.cmaOpenCommunityProfile(userId);
      return;
    }

    state.activeProfileId = userId;
    state.section = "profile";

    renderCommunityPage();
  }

  function renderPostHeader(post) {
    const header = createElement("div", "cma-post-header");

    const identity = createElement(
      "div",
      "cma-post-identity"
    );

    const avatarButton = makeButton(
      "",
      "cma-post-avatar-button",
      () => openCommunityProfile(post.user_id)
    );

    avatarButton.appendChild(
      createMemberAvatar(post.user_id, "small")
    );

    const details = createElement(
      "div",
      "cma-post-author-details"
    );

    const name = makeButton(
      getMemberName(post.user_id),
      "cma-post-author",
      () => openCommunityProfile(post.user_id)
    );

    const timestamp = createElement(
      "span",
      "cma-post-time",
      formatRelativeTime(post.created_at)
    );

    timestamp.title = dateText(post.created_at);

    details.append(name, timestamp);
    identity.append(avatarButton, details);

    const menuButton = makeButton(
      "⋯",
      "cma-post-menu-button",
      () => openPostMenu(post)
    );

    menuButton.setAttribute("aria-label", "Post options");

    header.append(identity, menuButton);

    return header;
  }

  function openPostMenu(post) {
    const canDelete =
      currentUser &&
      (
        String(post.user_id) === String(currentUser.id) ||
        isCreator()
      );

    if (!canDelete) {
      showNotice("No available post actions.", "info");
      return;
    }

    const confirmed = window.confirm(
      "Do you want to delete this post?"
    );

    if (!confirmed) return;

    deletePost(post.id).then(success => {
      if (success) {
        renderCommunityPage();
      }
    });
  }

  function renderPostMedia(post) {
    const imageUrl = safeImage(post.image_url);

    if (!imageUrl) return null;

    const wrapper = createElement(
      "div",
      "cma-post-media"
    );

    const image = createElement("img");

    image.src = imageUrl;
    image.alt = "Community post image";
    image.loading = "lazy";

    wrapper.appendChild(image);

    return wrapper;
  }

  function renderReactionBar(post) {
    const bar = createElement(
      "div",
      "cma-reaction-bar"
    );

    EMOJIS.forEach(emoji => {
      const button = makeButton(
        emoji,
        "cma-reaction-button",
        async () => {
          const success = await toggleReaction(
            post.id,
            emoji
          );

          if (success) {
            renderCommunityPage();
          }
        }
      );

      const selected = getReaction(post.id);

      if (selected?.emoji === emoji) {
        button.classList.add("is-active");
      }

      button.setAttribute(
        "aria-label",
        `React ${emoji}`
      );

      bar.appendChild(button);
    });

    return bar;
  }

  function renderReactionMembers(postId, emoji) {
    const members = getPostReactions(postId)
      .filter(item => item.emoji === emoji)
      .map(item => getMemberName(item.user_id));

    if (!members.length) {
      showNotice("No members have used this reaction yet.", "info");
      return;
    }

    const uniqueNames = [...new Set(members)];

    showNotice(
      `${emoji} ${uniqueNames.join(", ")}`,
      "info"
    );
  }

  function renderRandomCommentPreview(post) {
    const postComments = getPostComments(post.id);

    if (!postComments.length) return null;

    const randomIndex = Math.floor(
      Math.random() * postComments.length
    );

    const comment = postComments[randomIndex];

    const preview = createElement(
      "div",
      "cma-comment-preview"
    );

    const author = createElement(
      "span",
      "cma-comment-preview-author",
      getMemberName(comment.user_id)
    );

    const content = createElement(
      "span",
      "cma-comment-preview-text",
      comment.content || ""
    );

    preview.append(author, content);

    return preview;
  }

  async function addCommunityComment(postId, content) {
    if (!requireLogin()) return null;

    const text = String(content || "").trim();

    if (!text) {
      showNotice("Write a comment first.", "error");
      return null;
    }

    if (text.length > 3000) {
      showNotice("Comment is too long.", "error");
      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_comments")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: text
        })
        .select()
        .single();

      if (error) throw error;

      comments.push(data);

      const post = posts.find(
        item => String(item.id) === String(postId)
      );

      if (
        post &&
        String(post.user_id) !== String(currentUser.id)
      ) {
        await createCommunityNotification(
          post.user_id,
          `${currentName()} commented on your post.`
        );
      }

      showNotice("Comment added.", "success");

      return data;
    } catch (error) {
      console.error("Comment publishing error:", error);
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function deleteCommunityComment(commentId) {
    if (!requireLogin()) return false;

    const comment = comments.find(
      item => String(item.id) === String(commentId)
    );

    if (!comment) return false;

    const isOwner =
      String(comment.user_id) === String(currentUser.id);

    const post = posts.find(
      item => String(item.id) === String(comment.post_id)
    );

    const canDelete =
      isOwner ||
      isCreator() ||
      (
        post &&
        String(post.user_id) === String(currentUser.id)
      );

    if (!canDelete) {
      showNotice("You cannot delete this comment.", "error");
      return false;
    }

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      comments = comments.filter(
        item => String(item.id) !== String(commentId)
      );

      showNotice("Comment deleted.", "success");
      return true;
    } catch (error) {
      console.error("Comment deletion error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  function renderCommentItem(comment) {
    const item = createElement(
      "div",
      "cma-comment-item"
    );

    const avatar = createMemberAvatar(
      comment.user_id,
      "comment"
    );

    const body = createElement(
      "div",
      "cma-comment-body"
    );

    const top = createElement(
      "div",
      "cma-comment-top"
    );

    const author = makeButton(
      getMemberName(comment.user_id),
      "cma-comment-author",
      () => openCommunityProfile(comment.user_id)
    );

    const time = createElement(
      "span",
      "cma-comment-time",
      formatRelativeTime(comment.created_at)
    );

    time.title = dateText(comment.created_at);

    top.append(author, time);

    const content = createElement(
      "p",
      "cma-comment-content",
      comment.content || ""
    );

    body.append(top, content);

    const canDelete =
      currentUser &&
      (
        String(comment.user_id) === String(currentUser.id) ||
        isCreator()
      );

    if (canDelete) {
      const remove = makeButton(
        "Delete",
        "cma-comment-delete",
        async () => {
          const confirmed = window.confirm(
            "Delete this comment?"
          );

          if (!confirmed) return;

          const success = await deleteCommunityComment(
            comment.id
          );

          if (success) {
            openAllComments(comment.post_id);
          }
        }
      );

      body.appendChild(remove);
    }

    item.append(avatar, body);

    return item;
  }

  function openAllComments(postId) {
    state.activeCommentPost = postId;

    const existing = $(".cma-comments-overlay");

    if (existing) existing.remove();

    const overlay = createElement(
      "div",
      "cma-comments-overlay"
    );

    const sheet = createElement(
      "section",
      "cma-comments-sheet"
    );

    const header = createElement(
      "div",
      "cma-comments-sheet-header"
    );

    const title = createElement(
      "h3",
      "cma-comments-sheet-title",
      "Comments"
    );

    const close = makeButton(
      "×",
      "cma-comments-close",
      () => {
        overlay.remove();
        state.activeCommentPost = null;
      }
    );

    header.append(title, close);

    const list = createElement(
      "div",
      "cma-comments-list"
    );

    const postComments = [...getPostComments(postId)]
      .sort((a, b) =>
        new Date(a.created_at || 0) -
        new Date(b.created_at || 0)
      );

    if (!postComments.length) {
      list.appendChild(
        createElement(
          "p",
          "cma-comments-empty",
          "No comments yet. Be the first to comment."
        )
      );
    } else {
      postComments.forEach(comment => {
        list.appendChild(renderCommentItem(comment));
      });
    }

    const composer = createElement(
      "form",
      "cma-comments-composer"
    );

    const input = makeInput(
      "Write a comment...",
      "cma-comment-input"
    );

    input.maxLength = 3000;

    const send = makeButton(
      "Send",
      "cma-comment-send"
    );

    send.type = "submit";

    composer.append(input, send);

    composer.addEventListener("submit", async event => {
      event.preventDefault();

      if (!requireLogin()) return;

      const content = input.value.trim();

      if (!content) return;

      send.disabled = true;

      const result = await addCommunityComment(
        postId,
        content
      );

      send.disabled = false;

      if (result) {
        openAllComments(postId);
      }
    });

    sheet.append(header, list, composer);
    overlay.appendChild(sheet);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        overlay.remove();
        state.activeCommentPost = null;
      }
    });

    document.body.appendChild(overlay);
  }

  function renderPostCommentComposer(post) {
    const form = createElement(
      "form",
      "cma-post-comment-composer"
    );

    form.appendChild(
      createMemberAvatar(currentUser?.id, "comment")
    );

    const input = makeInput(
      "Write a comment...",
      "cma-post-comment-input"
    );

    input.maxLength = 3000;
    input.disabled = !currentUser;

    const send = makeButton(
      "➤",
      "cma-post-comment-send"
    );

    send.type = "submit";
    send.disabled = !currentUser;

    form.append(input, send);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!requireLogin()) return;

      const content = input.value.trim();

      if (!content) return;

      send.disabled = true;

      const result = await addCommunityComment(
        post.id,
        content
      );

      send.disabled = false;

      if (result) {
        renderCommunityPage();
      }
    });

    return form;
  }

  function renderPostCard(post) {
    const card = createElement(
      "article",
      "cma-post-card"
    );

    card.dataset.postId = post.id;

    card.appendChild(renderPostHeader(post));

    const caption = String(post.content || "").trim();

    if (caption) {
      card.appendChild(
        createElement(
          "p",
          "cma-post-caption",
          caption
        )
      );
    }

    const media = renderPostMedia(post);

    if (media) {
      card.appendChild(media);
    }

    const reactionBar = renderReactionBar(post);

    card.appendChild(reactionBar);

    const postComments = getPostComments(post.id);

    const preview = renderRandomCommentPreview(post);

    if (preview) {
      card.appendChild(preview);
    }

    if (postComments.length > 1) {
      const viewAll = makeButton(
        "View all comments",
        "cma-view-all-comments",
        () => openAllComments(post.id)
      );

      card.appendChild(viewAll);
    }

    card.appendChild(
      renderPostCommentComposer(post)
    );

    return card;
  }

  function renderFeed(feedItems = posts, scope = null) {
    const feed = createElement("div", "cma-post-feed");

    let filtered = sortNewest(feedItems);

    if (scope) {
      filtered = filtered.filter(
        post => post.post_scope === scope
      );
    }

    if (!filtered.length) {
      feed.appendChild(
        createElement(
          "div",
          "cma-empty-feed",
          "No posts to show yet."
        )
      );

      return feed;
    }

    filtered.forEach(post => {
      feed.appendChild(renderPostCard(post));
    });

    return feed;
  }

  /* ==========================================
     END OF PART 4
     NEXT: PROFILE + EDIT INFORMATION SYSTEM
  ========================================== */
           
  /* ==========================================
     PART 5/9 — PROFILE + EDIT INFORMATION
  ========================================== */

  function getMemberId(profile) {
    return (
      profile?.member_id ||
      profile?.user_id ||
      "Member"
    );
  }

  function renderProfileHeader(profile, isOwn = false) {
    const wrapper = createElement(
      "section",
      "cma-profile-header"
    );

    const cover = createElement(
      "div",
      "cma-profile-cover"
    );

    const coverUrl = safeImage(profile?.cover_url);

    if (coverUrl) {
      cover.style.backgroundImage = `url("${coverUrl}")`;
    }

    if (isOwn) {
      cover.addEventListener("click", () => {
        chooseCommunityImage(
          async (url) => {
            const saved = await saveProfile({
              cover_url: url
            });

            if (saved) renderCommunityPage();
          },
          "covers"
        );
      });

      cover.classList.add("cma-editable-cover");
    }

    const avatarArea = createElement(
      "div",
      "cma-profile-avatar-area"
    );

    const avatar = createMemberAvatar(
      profile?.user_id,
      "profile"
    );

    if (isOwn) {
      avatar.classList.add("cma-editable-avatar");

      avatar.addEventListener("click", event => {
        event.stopPropagation();

        chooseCommunityImage(
          async (url) => {
            const saved = await saveProfile({
              avatar_url: url
            });

            if (saved) renderCommunityPage();
          },
          "avatars"
        );
      });
    }

    avatarArea.appendChild(avatar);

    wrapper.append(cover, avatarArea);

    const details = createElement(
      "div",
      "cma-profile-main-details"
    );

    details.appendChild(
      createElement(
        "h2",
        "cma-profile-name",
        profile?.display_name || "Community Member"
      )
    );

    details.appendChild(
      createElement(
        "p",
        "cma-profile-member-id",
        `Member ID: ${getMemberId(profile)}`
      )
    );

    if (profile?.short_description) {
      details.appendChild(
        createElement(
          "p",
          "cma-profile-description",
          profile.short_description
        )
      );
    }

    if (isOwn) {
      const edit = makeButton(
        "✎",
        "cma-profile-edit-button",
        () => renderEditInformationPage()
      );

      edit.setAttribute(
        "aria-label",
        "Edit personal information"
      );

      details.appendChild(edit);
    } else {
      const actions = createElement(
        "div",
        "cma-profile-actions"
      );

      const addFriend = makeButton(
        "Add Friend",
        "cma-add-friend-button",
        () => sendFriendRequest(profile.user_id)
      );

      const message = makeButton(
        "Message",
        "cma-message-button",
        () => openMessageConversation(profile.user_id)
      );

      actions.append(addFriend, message);
      details.appendChild(actions);
    }

    wrapper.appendChild(details);

    return wrapper;
  }

  function renderPersonalInformation(profile, privateData = null) {
    const section = createElement(
      "section",
      "cma-personal-information"
    );

    const heading = createElement(
      "h3",
      "cma-section-heading",
      "Personal Information"
    );

    section.appendChild(heading);

    const rows = [
      {
        label: "Institution",
        value: profile?.school || "Not added"
      }
    ];

    if (
      currentUser &&
      String(currentUser.id) === String(profile?.user_id)
    ) {
      rows.push(
        {
          label: "Mobile Number",
          value: privateData?.phone || "Not added"
        },
        {
          label: "Address",
          value: privateData?.address || "Not added"
        }
      );
    }

    rows.forEach(row => {
      const item = createElement(
        "div",
        "cma-information-row"
      );

      item.append(
        createElement(
          "span",
          "cma-information-label",
          row.label
        ),
        createElement(
          "span",
          "cma-information-value",
          row.value
        )
      );

      section.appendChild(item);
    });

    return section;
  }

  function renderProfileComposer() {
    if (!requireLogin()) return null;

    const composer = createElement(
      "form",
      "cma-profile-post-composer"
    );

    const textarea = makeTextarea(
      "What's on your mind?",
      "cma-profile-post-input"
    );

    textarea.maxLength = 5000;

    const imageButton = makeButton(
      "＋ Photo",
      "cma-composer-photo-button",
      () => {
        chooseCommunityImage(
          async (url) => {
            selectedPostImage = url;

            const preview = $(".cma-profile-image-preview", composer);

            if (preview) preview.remove();

            const image = createElement("img");
            image.className = "cma-profile-image-preview";
            image.src = url;
            image.alt = "Selected post image";

            composer.insertBefore(image, actions);
          },
          "posts"
        );
      }
    );

    const publish = makeButton(
      "Post",
      "cma-composer-publish-button"
    );

    publish.type = "submit";

    const actions = createElement(
      "div",
      "cma-profile-composer-actions"
    );

    actions.append(imageButton, publish);

    composer.append(textarea, actions);

    composer.addEventListener("submit", async event => {
      event.preventDefault();

      publish.disabled = true;

      const result = await publishPost({
        caption: textarea.value,
        imageUrl: selectedPostImage || "",
        scope: POST_SCOPES.COMMUNITY
      });

      publish.disabled = false;

      if (result) {
        textarea.value = "";
        selectedPostImage = null;
        renderCommunityPage();
      }
    });

    return composer;
  }

  function renderProfileTabs() {
    const tabs = createElement(
      "div",
      "cma-profile-tabs"
    );

    ["Posts", "Photos", "React On", "Friends"].forEach(tab => {
      const button = makeButton(
        tab,
        "cma-profile-tab",
        () => {
          state.activeProfileTab = tab;
          renderCommunityPage();
        }
      );

      if (state.activeProfileTab === tab) {
        button.classList.add("active");
      }

      tabs.appendChild(button);
    });

    return tabs;
  }

  function renderProfileContent(profile) {
    const userId = profile.user_id;
    const content = createElement(
      "div",
      "cma-profile-content"
    );

    if (state.activeProfileTab === "Posts") {
      const userPosts = posts.filter(
        post => String(post.user_id) === String(userId) &&
          post.post_scope === POST_SCOPES.COMMUNITY
      );

      content.appendChild(renderFeed(userPosts));
    }

    if (state.activeProfileTab === "Photos") {
      const photos = posts.filter(
        post =>
          String(post.user_id) === String(userId) &&
          post.image_url &&
          post.post_scope === POST_SCOPES.COMMUNITY
      );

      const gallery = createElement(
        "div",
        "cma-profile-photo-grid"
      );

      photos.forEach(post => {
        const image = createElement("img");
        image.src = safeImage(post.image_url);
        image.alt = "Community photo";
        image.loading = "lazy";

        gallery.appendChild(image);
      });

      content.appendChild(gallery);
    }

    if (state.activeProfileTab === "React On") {
      const reactedPostIds = uniqueBy(
        reactions.filter(
          reaction => String(reaction.user_id) === String(userId)
        ),
        "post_id"
      );

      const reactedPosts = reactedPostIds
        .map(reaction =>
          posts.find(
            post => String(post.id) === String(reaction.post_id)
          )
        )
        .filter(Boolean);

      content.appendChild(renderFeed(reactedPosts));
    }

    if (state.activeProfileTab === "Friends") {
      content.appendChild(
        renderProfileFriends(userId)
      );
    }

    return content;
  }

  async function renderUserProfile(userId) {
    const root = getCommunityRoot();
    clearElement(root);

    const profile = await fetchPublicProfile(userId);

    if (!profile) {
      root.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "This member profile could not be found."
        )
      );

      return;
    }

    const isOwn =
      currentUser &&
      String(currentUser.id) === String(userId);

    const page = createElement(
      "main",
      "cma-profile-page"
    );

    page.appendChild(
      renderProfileHeader(profile, Boolean(isOwn))
    );

    page.appendChild(
      renderPersonalInformation(
        profile,
        isOwn ? currentPrivate : null
      )
    );

    if (isOwn) {
      const composer = renderProfileComposer();

      if (composer) page.appendChild(composer);
    }

    page.appendChild(renderProfileTabs());

    page.appendChild(
      renderProfileContent(profile)
    );

    root.appendChild(page);
  }

  function renderEditInformationPage() {
    if (!requireLogin()) return;

    const root = getCommunityRoot();
    clearElement(root);

    const page = createElement(
      "main",
      "cma-edit-information-page"
    );

    const header = createElement(
      "div",
      "cma-edit-information-header"
    );

    const back = makeButton(
      "←",
      "cma-edit-back-button",
      () => {
        state.section = "profile";
        state.activeProfileId = currentUser.id;
        renderCommunityPage();
      }
    );

    const title = createElement(
      "h2",
      "cma-edit-information-title",
      "Edit Personal Information"
    );

    header.append(back, title);

    const form = createElement(
      "form",
      "cma-edit-information-form"
    );

    function addField(labelText, value, name, placeholder = "") {
      const group = createElement(
        "label",
        "cma-edit-field"
      );

      group.appendChild(
        createElement(
          "span",
          "cma-edit-field-label",
          labelText
        )
      );

      const input = makeInput(
        placeholder,
        "cma-edit-field-input"
      );

      input.name = name;
      input.value = value || "";

      group.appendChild(input);

      form.appendChild(group);

      return input;
    }

    const fullName = addField(
      "Full Name",
      currentProfile?.display_name,
      "display_name",
      "Enter your full name"
    );

    const description = addField(
      "Short Description",
      currentProfile?.short_description,
      "short_description",
      "Write a short description"
    );

    const institution = addField(
      "Institution",
      currentProfile?.school,
      "school",
      "Enter your institution"
    );

    const phone = addField(
      "Mobile Number",
      currentPrivate?.phone,
      "phone",
      "Enter your mobile number"
    );

    const address = addField(
      "Address",
      currentPrivate?.address,
      "address",
      "Enter your address"
    );

    const save = makeButton(
      "Save Changes",
      "cma-save-information-button"
    );

    save.type = "submit";

    form.appendChild(save);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      save.disabled = true;

      try {
        const profileResult = await saveProfile({
          display_name: fullName.value,
          short_description: description.value,
          school: institution.value
        });

        if (!profileResult) {
          save.disabled = false;
          return;
        }

        const privateResult = await savePrivateProfile({
          phone: phone.value,
          address: address.value
        });

        if (!privateResult) {
          save.disabled = false;
          return;
        }

        showNotice(
          "Personal information saved successfully.",
          "success"
        );

        state.section = "profile";
        state.activeProfileId = currentUser.id;

        await renderCommunityPage();
      } catch (error) {
        showNotice(getErrorMessage(error), "error");
      } finally {
        save.disabled = false;
      }
    });

    page.append(header, form);
    root.appendChild(page);
  }

  /* ==========================================
     END OF PART 5
     NEXT: FRIENDS + NOTIFICATIONS
  ========================================== */
     
  /* ==========================================
     PART 6/9 — FRIENDS + NOTIFICATIONS
  ========================================== */

  async function loadFriendRequests() {
    if (!currentUser) {
      friendRequests = [];
      return [];
    }

    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_friend_requests")
        .select("*")
        .or(
          `sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      friendRequests = asArray(data);
      return friendRequests;
    } catch (error) {
      console.error("Friend requests loading error:", error);
      return friendRequests;
    }
  }

  async function loadFriendships() {
    if (!currentUser) {
      friendships = [];
      return [];
    }

    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_friendships")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) throw error;

      friendships = asArray(data);
      return friendships;
    } catch (error) {
      console.error("Friendships loading error:", error);
      return friendships;
    }
  }

  async function loadNotifications() {
    if (!currentUser) {
      notifications = [];
      return [];
    }

    const client = requireDatabase();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from("community_notifications")
        .select("*")
        .eq("recipient_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      notifications = asArray(data);
      return notifications;
    } catch (error) {
      console.error("Notifications loading error:", error);
      notifications = [];
      return notifications;
    }
  }

  async function createCommunityNotification(
    recipientId,
    message
  ) {
    if (
      !currentUser ||
      !recipientId ||
      String(recipientId) === String(currentUser.id)
    ) {
      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_notifications")
        .insert({
          recipient_id: recipientId,
          message: String(message || ""),
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      if (String(recipientId) === String(currentUser.id)) {
        notifications.unshift(data);
      }

      return data;
    } catch (error) {
      console.error("Notification creation error:", error);
      return null;
    }
  }

  function getFriendRequestBetween(userA, userB) {
    return friendRequests.find(request =>
      (
        String(request.sender_id) === String(userA) &&
        String(request.recipient_id) === String(userB)
      ) ||
      (
        String(request.sender_id) === String(userB) &&
        String(request.recipient_id) === String(userA)
      )
    ) || null;
  }

  function areFriends(userA, userB) {
    return friendships.some(friendship =>
      String(friendship.user_id) === String(userA) &&
      String(friendship.friend_id) === String(userB)
    );
  }

  function getFriendStatus(userId) {
    if (!currentUser || !userId) return "none";

    if (String(currentUser.id) === String(userId)) {
      return "self";
    }

    if (areFriends(currentUser.id, userId)) {
      return "friends";
    }

    const request = getFriendRequestBetween(
      currentUser.id,
      userId
    );

    if (!request) return "none";

    if (request.status === "accepted") {
      return "friends";
    }

    if (String(request.sender_id) === String(currentUser.id)) {
      return "sent";
    }

    if (String(request.recipient_id) === String(currentUser.id)) {
      return "received";
    }

    return "none";
  }

  async function sendFriendRequest(userId) {
    if (!requireLogin()) return null;

    if (String(userId) === String(currentUser.id)) {
      showNotice("You cannot add yourself.", "error");
      return null;
    }

    if (getFriendStatus(userId) === "friends") {
      showNotice("You are already friends.", "info");
      return null;
    }

    const existing = getFriendRequestBetween(
      currentUser.id,
      userId
    );

    if (existing) {
      if (
        String(existing.recipient_id) === String(currentUser.id) &&
        existing.status === "pending"
      ) {
        showNotice(
          "This member has already sent you a request.",
          "info"
        );
      } else {
        showNotice("Friend request already exists.", "info");
      }

      return null;
    }

    const client = requireDatabase();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("community_friend_requests")
        .insert({
          sender_id: currentUser.id,
          recipient_id: userId,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      friendRequests.unshift(data);

      await createCommunityNotification(
        userId,
        `${currentName()} sent you a friend request.`
      );

      showNotice("Friend request sent.", "success");

      return data;
    } catch (error) {
      console.error("Friend request error:", error);
      showNotice(getErrorMessage(error), "error");
      return null;
    }
  }

  async function acceptFriendRequest(requestId) {
    if (!requireLogin()) return false;

    const request = friendRequests.find(
      item => String(item.id) === String(requestId)
    );

    if (!request) {
      showNotice("Friend request not found.", "error");
      return false;
    }

    if (
      String(request.recipient_id) !== String(currentUser.id) ||
      request.status !== "pending"
    ) {
      showNotice("This request cannot be accepted.", "error");
      return false;
    }

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error: updateError } = await client
        .from("community_friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      const firstFriendship = {
        user_id: currentUser.id,
        friend_id: request.sender_id
      };

      const secondFriendship = {
        user_id: request.sender_id,
        friend_id: currentUser.id
      };

      const { error: friendshipError } = await client
        .from("community_friendships")
        .upsert(
          [firstFriendship, secondFriendship],
          { onConflict: "user_id,friend_id" }
        );

      if (friendshipError) throw friendshipError;

      request.status = "accepted";

      friendships = [
        ...friendships.filter(item =>
          !(
            String(item.user_id) === String(currentUser.id) &&
            String(item.friend_id) === String(request.sender_id)
          )
        ),
        firstFriendship
      ];

      await createCommunityNotification(
        request.sender_id,
        `${currentName()} accepted your friend request.`
      );

      showNotice("Friend request accepted.", "success");

      await Promise.all([
        loadFriendRequests(),
        loadFriendships()
      ]);

      renderCommunityPage();

      return true;
    } catch (error) {
      console.error("Accept friend request error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  async function deleteFriendRequest(requestId) {
    if (!requireLogin()) return false;

    const request = friendRequests.find(
      item => String(item.id) === String(requestId)
    );

    if (!request) return false;

    const isParticipant =
      String(request.sender_id) === String(currentUser.id) ||
      String(request.recipient_id) === String(currentUser.id);

    if (!isParticipant) {
      showNotice("You cannot remove this request.", "error");
      return false;
    }

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_friend_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      friendRequests = friendRequests.filter(
        item => String(item.id) !== String(requestId)
      );

      showNotice("Friend request removed.", "success");

      renderCommunityPage();

      return true;
    } catch (error) {
      console.error("Delete friend request error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  async function removeFriend(userId) {
    if (!requireLogin()) return false;

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_friendships")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("friend_id", userId);

      if (error) throw error;

      const { error: reverseError } = await client
        .from("community_friendships")
        .delete()
        .eq("user_id", userId)
        .eq("friend_id", currentUser.id);

      if (reverseError) throw reverseError;

      friendships = friendships.filter(item =>
        !(
          String(item.user_id) === String(currentUser.id) &&
          String(item.friend_id) === String(userId)
        )
      );

      showNotice("Friend removed.", "success");

      renderCommunityPage();

      return true;
    } catch (error) {
      console.error("Remove friend error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  function renderFriendMember(userId) {
    const profile = getProfile(userId);

    const card = createElement(
      "div",
      "cma-friend-member"
    );

    const identity = makeButton(
      "",
      "cma-friend-identity",
      () => openCommunityProfile(userId)
    );

    identity.appendChild(
      createMemberAvatar(userId, "small")
    );

    const details = createElement(
      "div",
      "cma-friend-details"
    );

    details.append(
      createElement(
        "span",
        "cma-friend-name",
        profile?.display_name || "Community Member"
      ),
      createElement(
        "span",
        "cma-friend-description",
        profile?.short_description || "Community Member"
      )
    );

    identity.appendChild(details);

    const view = makeButton(
      "View",
      "cma-friend-view-button",
      () => openCommunityProfile(userId)
    );

    card.append(identity, view);

    return card;
  }

  function renderProfileFriends(userId) {
    const section = createElement(
      "section",
      "cma-profile-friends"
    );

    const memberFriends = friendships
      .filter(item =>
        String(item.user_id) === String(userId)
      )
      .map(item => item.friend_id);

    const uniqueFriends = [...new Set(memberFriends)];

    if (!uniqueFriends.length) {
      section.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "No friends to show yet."
        )
      );

      return section;
    }

    uniqueFriends.forEach(friendId => {
      section.appendChild(
        renderFriendMember(friendId)
      );
    });

    return section;
  }

  function renderFriendRequestCard(request) {
    const card = createElement(
      "div",
      "cma-friend-request-card"
    );

    const senderId = request.sender_id;

    const identity = makeButton(
      "",
      "cma-friend-identity",
      () => openCommunityProfile(senderId)
    );

    identity.appendChild(
      createMemberAvatar(senderId, "small")
    );

    identity.appendChild(
      createElement(
        "span",
        "cma-friend-name",
        getMemberName(senderId)
      )
    );

    const actions = createElement(
      "div",
      "cma-friend-request-actions"
    );

    const accept = makeButton(
      "Accept",
      "cma-friend-accept-button",
      () => acceptFriendRequest(request.id)
    );

    const remove = makeButton(
      "Delete",
      "cma-friend-delete-button",
      () => deleteFriendRequest(request.id)
    );

    actions.append(accept, remove);
    card.append(identity, actions);

    return card;
  }

  function renderFriendsPage() {
    const page = createElement(
      "main",
      "cma-friends-page"
    );

    page.appendChild(
      createElement(
        "h2",
        "cma-page-title",
        "Friends"
      )
    );

    if (!currentUser) {
      page.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          LOGIN_ERROR
        )
      );

      return page;
    }

    const incoming = friendRequests.filter(request =>
      String(request.recipient_id) === String(currentUser.id) &&
      request.status === "pending"
    );

    const requestSection = createElement(
      "section",
      "cma-friend-requests-section"
    );

    requestSection.appendChild(
      createElement(
        "h3",
        "cma-section-heading",
        "Friend Requests"
      )
    );

    if (!incoming.length) {
      requestSection.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "No new friend requests."
        )
      );
    } else {
      incoming.forEach(request => {
        requestSection.appendChild(
          renderFriendRequestCard(request)
        );
      });
    }

    const friendsSection = createElement(
      "section",
      "cma-friends-list-section"
    );

    friendsSection.appendChild(
      createElement(
        "h3",
        "cma-section-heading",
        "Your Friends"
      )
    );

    const friendIds = friendships
      .filter(item =>
        String(item.user_id) === String(currentUser.id)
      )
      .map(item => item.friend_id);

    const uniqueIds = [...new Set(friendIds)];

    if (!uniqueIds.length) {
      friendsSection.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "You have not added any friends yet."
        )
      );
    } else {
      uniqueIds.forEach(friendId => {
        friendsSection.appendChild(
          renderFriendMember(friendId)
        );
      });
    }

    page.append(requestSection, friendsSection);

    return page;
  }

  function renderNotificationItem(notification) {
    const item = makeButton(
      "",
      "cma-notification-item",
      async () => {
        await markNotificationRead(notification.id);
      }
    );

    if (!notification.is_read) {
      item.classList.add("unread");
    }

    item.appendChild(
      createElement(
        "p",
        "cma-notification-message",
        notification.message || "New notification"
      )
    );

    item.appendChild(
      createElement(
        "span",
        "cma-notification-time",
        formatRelativeTime(notification.created_at)
      )
    );

    return item;
  }

  async function markNotificationRead(notificationId) {
    if (!requireLogin()) return false;

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("recipient_id", currentUser.id);

      if (error) throw error;

      notifications = notifications.map(item =>
        String(item.id) === String(notificationId)
          ? { ...item, is_read: true }
          : item
      );

      renderCommunityPage();

      return true;
    } catch (error) {
      console.error("Notification read error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  async function markAllNotificationsRead() {
    if (!requireLogin()) return false;

    const client = requireDatabase();
    if (!client) return false;

    try {
      const { error } = await client
        .from("community_notifications")
        .update({ is_read: true })
        .eq("recipient_id", currentUser.id)
        .eq("is_read", false);

      if (error) throw error;

      notifications = notifications.map(item => ({
        ...item,
        is_read: true
      }));

      renderCommunityPage();

      return true;
    } catch (error) {
      console.error("Mark all notifications error:", error);
      showNotice(getErrorMessage(error), "error");
      return false;
    }
  }

  function renderNotificationsPage() {
    const page = createElement(
      "main",
      "cma-notifications-page"
    );

    const header = createElement(
      "div",
      "cma-notifications-header"
    );

    header.appendChild(
      createElement(
        "h2",
        "cma-page-title",
        "Notifications"
      )
    );

    if (notifications.some(item => !item.is_read)) {
      header.appendChild(
        makeButton(
          "Mark all as read",
          "cma-mark-all-read-button",
          markAllNotificationsRead
        )
      );
    }

    page.appendChild(header);

    if (!currentUser) {
      page.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          LOGIN_ERROR
        )
      );

      return page;
    }

    if (!notifications.length) {
      page.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "You have no notifications yet."
        )
      );

      return page;
    }

    notifications.forEach(notification => {
      page.appendChild(
        renderNotificationItem(notification)
      );
    });

    return page;
  }

  /* ==========================================
     END OF PART 6
     NEXT: SEARCH + MESSAGING INTEGRATION
  ========================================== */
       
  /* ==========================================
     PART 7/9 — SEARCH + MESSAGING
  ========================================== */

  const RECENT_SEARCH_KEY = "cma_community_recent_searches";

  function getRecentSearches() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(RECENT_SEARCH_KEY) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveRecentSearch(query) {
    const value = String(query || "").trim();

    if (!value) return;

    const recent = getRecentSearches().filter(
      item => item.toLowerCase() !== value.toLowerCase()
    );

    recent.unshift(value);

    localStorage.setItem(
      RECENT_SEARCH_KEY,
      JSON.stringify(recent.slice(0, 10))
    );
  }

  function clearRecentSearches() {
    localStorage.removeItem(RECENT_SEARCH_KEY);
    renderCommunitySearchPage();
  }

  function normalizeSearch(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function searchProfilesLocally(query) {
    const value = normalizeSearch(query);

    if (!value) return [];

    const combinedProfiles = uniqueBy(
      [
        ...(currentProfile ? [currentProfile] : []),
        ...profiles
      ],
      "user_id"
    );

    return combinedProfiles.filter(profile => {
      const name = normalizeSearch(profile.display_name);
      const memberId = normalizeSearch(profile.member_id);
      const description = normalizeSearch(
        profile.short_description
      );

      return (
        name.includes(value) ||
        memberId.includes(value) ||
        description.includes(value)
      );
    });
  }

  function searchPostsLocally(query) {
    const value = normalizeSearch(query);

    if (!value) return [];

    return sortNewest(
      posts.filter(post => {
        const content = normalizeSearch(post.content);

        return content.includes(value);
      })
    );
  }

  async function searchProfilesOnline(query) {
    const value = String(query || "").trim();

    if (!value) return [];

    const client = requireDatabase();
    if (!client) return searchProfilesLocally(value);

    try {
      const { data, error } = await client
        .from("community_profiles")
        .select("*")
        .ilike("display_name", `%${value}%`)
        .limit(100);

      if (error) throw error;

      const remoteProfiles = asArray(data);

      profiles = uniqueBy(
        [...remoteProfiles, ...profiles],
        "user_id"
      );

      return searchProfilesLocally(value);
    } catch (error) {
      console.error("Online profile search error:", error);

      return searchProfilesLocally(value);
    }
  }

  async function searchPostsOnline(query) {
    const value = String(query || "").trim();

    if (!value) return [];

    const client = requireDatabase();
    if (!client) return searchPostsLocally(value);

    try {
      const { data, error } = await client
        .from("community_posts")
        .select("*")
        .ilike("content", `%${value}%`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const remotePosts = asArray(data);

      posts = sortNewest(
        uniqueBy(
          [...remotePosts, ...posts],
          "id"
        )
      );

      return searchPostsLocally(value);
    } catch (error) {
      console.error("Online post search error:", error);

      return searchPostsLocally(value);
    }
  }

  function renderSearchHeader() {
    const header = createElement(
      "div",
      "cma-search-header"
    );

    const back = makeButton(
      "←",
      "cma-search-back-button",
      () => {
        state.section = state.previousPage || "home";
        state.searchQuery = "";
        renderCommunityPage();
      }
    );

    back.setAttribute("aria-label", "Go back");

    const input = makeInput(
      "Search profiles or posts...",
      "cma-search-input"
    );

    input.value = state.searchQuery || "";

    const clear = makeButton(
      "×",
      "cma-search-clear-button",
      () => {
        state.searchQuery = "";
        renderCommunitySearchPage();
      }
    );

    clear.setAttribute("aria-label", "Clear search");

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        performCommunitySearch(input.value);
      }
    });

    header.append(back, input, clear);

    return { header, input };
  }

  function renderRecentSearches() {
    const section = createElement(
      "section",
      "cma-recent-searches"
    );

    const heading = createElement(
      "div",
      "cma-recent-searches-heading"
    );

    heading.appendChild(
      createElement(
        "h3",
        "cma-section-heading",
        "Recent Searches"
      )
    );

    const recent = getRecentSearches();

    if (recent.length) {
      heading.appendChild(
        makeButton(
          "Clear All",
          "cma-clear-recent-button",
          clearRecentSearches
        )
      );
    }

    section.appendChild(heading);

    if (!recent.length) {
      section.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "Your recent searches will appear here."
        )
      );

      return section;
    }

    recent.forEach(query => {
      const item = makeButton(
        `◷  ${query}`,
        "cma-recent-search-item",
        () => performCommunitySearch(query)
      );

      section.appendChild(item);
    });

    return section;
  }

  function renderSearchTabs() {
    const tabs = createElement(
      "div",
      "cma-search-tabs"
    );

    ["Profiles", "Posts"].forEach(tab => {
      const button = makeButton(
        tab,
        "cma-search-tab",
        () => {
          state.activeSearchTab = tab;
          renderCommunitySearchPage();
        }
      );

      if (state.activeSearchTab === tab) {
        button.classList.add("active");
      }

      tabs.appendChild(button);
    });

    return tabs;
  }

  function renderSearchProfile(profile) {
    const card = makeButton(
      "",
      "cma-search-profile-card",
      () => openCommunityProfile(profile.user_id)
    );

    const avatar = createMemberAvatar(
      profile.user_id,
      "small"
    );

    const details = createElement(
      "div",
      "cma-search-profile-details"
    );

    details.appendChild(
      createElement(
        "span",
        "cma-search-profile-name",
        profile.display_name || "Community Member"
      )
    );

    details.appendChild(
      createElement(
        "span",
        "cma-search-profile-member-id",
        `Member ID: ${getMemberId(profile)}`
      )
    );

    if (profile.short_description) {
      details.appendChild(
        createElement(
          "span",
          "cma-search-profile-description",
          profile.short_description
        )
      );
    }

    card.append(avatar, details);

    return card;
  }

  function renderSearchResults() {
    const results = createElement(
      "section",
      "cma-search-results"
    );

    const query = state.searchQuery;

    if (!query) return results;

    if (state.activeSearchTab === "Profiles") {
      const matchingProfiles = searchProfilesLocally(query);

      if (!matchingProfiles.length) {
        results.appendChild(
          createElement(
            "p",
            "cma-empty-state",
            "No matching profiles found."
          )
        );
      } else {
        matchingProfiles.forEach(profile => {
          results.appendChild(
            renderSearchProfile(profile)
          );
        });
      }
    }

    if (state.activeSearchTab === "Posts") {
      const matchingPosts = searchPostsLocally(query);

      if (!matchingPosts.length) {
        results.appendChild(
          createElement(
            "p",
            "cma-empty-state",
            "No matching posts found."
          )
        );
      } else {
        results.appendChild(
          renderFeed(matchingPosts)
        );
      }
    }

    return results;
  }

  async function performCommunitySearch(query) {
    const value = String(query || "").trim();

    state.searchQuery = value;
    state.activeSearchTab = "Profiles";

    if (!value) {
      renderCommunitySearchPage();
      return;
    }

    saveRecentSearch(value);

    const version = ++state.searchVersion;

    renderCommunitySearchPage();

    await Promise.all([
      searchProfilesOnline(value),
      searchPostsOnline(value)
    ]);

    if (version !== state.searchVersion) return;

    renderCommunitySearchPage();
  }

  function renderCommunitySearchPage() {
    const root = getCommunityRoot();

    clearElement(root);

    const page = createElement(
      "main",
      "cma-search-page"
    );

    const searchUI = renderSearchHeader();

    page.appendChild(searchUI.header);

    const hasQuery = Boolean(
      String(state.searchQuery || "").trim()
    );

    if (!hasQuery) {
      page.appendChild(renderRecentSearches());
    } else {
      page.appendChild(renderSearchTabs());
      page.appendChild(renderSearchResults());
    }

    root.appendChild(page);

    searchUI.input.focus();

    if (state.searchQuery) {
      searchUI.input.setSelectionRange(
        state.searchQuery.length,
        state.searchQuery.length
      );
    }
  }

  function openCommunitySearch() {
    state.previousPage = state.section || "home";
    state.section = "search";
    state.searchQuery = "";

    renderCommunitySearchPage();
  }

  /* ==========================================
     MESSAGING SYSTEM INTEGRATION
  ========================================== */

  function openMessageConversation(userId) {
    if (!requireLogin()) return;

    if (!userId) {
      showNotice("Member not found.", "error");
      return;
    }

    if (String(userId) === String(currentUser.id)) {
      showNotice("You cannot message yourself.", "error");
      return;
    }

    state.previousPage = "profile";
    state.activeProfileId = userId;

    if (
      typeof window.cmaOpenMessageConversation === "function"
    ) {
      window.cmaOpenMessageConversation(userId);
      return;
    }

    if (
      typeof window.openCommunityConversation === "function"
    ) {
      window.openCommunityConversation(userId);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("cma:open-message", {
        detail: { userId }
      })
    );

    showNotice(
      "Messaging module is not connected yet.",
      "info"
    );
  }

  /* ==========================================
     END OF PART 7
     NEXT: COMMUNITY HOME + CREATOR PANEL
  ========================================== */
         
  /* ==========================================
     PART 8/9 — HOME + CREATOR + NAVIGATION
  ========================================== */

  function renderCommunityHeader() {
    const header = createElement(
      "header",
      "cma-community-header"
    );

    const title = createElement(
      "div",
      "cma-community-brand"
    );

    title.innerHTML =
      '<span>Change Maker</span> ' +
      '<span class="cma-brand-green">Community</span>';

    const searchButton = makeButton(
      "⌕",
      "cma-header-search-button",
      openCommunitySearch
    );

    searchButton.setAttribute(
      "aria-label",
      "Search Community"
    );

    header.append(title, searchButton);

    return header;
  }

  function renderCommunityNavigation() {
    const nav = createElement(
      "nav",
      "cma-community-navigation"
    );

    const items = [
      {
        id: "home",
        icon: "⌂",
        label: "Home"
      },
      {
        id: "profile",
        icon: "◉",
        label: "Profile"
      },
      {
        id: "friends",
        icon: "♧",
        label: "Friends"
      },
      {
        id: "creator",
        icon: "✦",
        label: "Creator Panel"
      },
      {
        id: "notifications",
        icon: "♧",
        label: "Notification"
      }
    ];

    items.forEach(item => {
      const button = makeButton(
        "",
        "cma-nav-item",
        () => {
          if (
            ["profile", "friends", "creator", "notifications"]
              .includes(item.id) &&
            !requireLogin()
          ) {
            return;
          }

          if (
            item.id === "creator" &&
            !isCreator()
          ) {
            showNotice(
              "Creator Panel is available to authorized creators only.",
              "error"
            );
            return;
          }

          if (item.id === "profile") {
            state.activeProfileId = currentUser
              ? currentUser.id
              : null;
          }

          state.section = item.id;
          renderCommunityPage();
        }
      );

      const icon = createElement(
        "span",
        "cma-nav-icon",
        item.icon
      );

      const label = createElement(
        "span",
        "cma-nav-label",
        item.label
      );

      button.append(icon, label);

      const isActive =
        state.section === item.id ||
        (
          item.id === "home" &&
          state.section === "community"
        );

      if (isActive) {
        button.classList.add("active");
      }

      nav.appendChild(button);
    });

    return nav;
  }

  function renderHomePostComposer() {
    if (!currentUser) {
      const prompt = createElement(
        "div",
        "cma-login-post-prompt"
      );

      prompt.appendChild(
        createElement(
          "p",
          "",
          "Sign in to share a post with the Community."
        )
      );

      prompt.appendChild(
        makeButton(
          "Go to Account",
          "cma-primary-button",
          () => {
            window.location.href = "index.html";
          }
        )
      );

      return prompt;
    }

    const composer = createElement(
      "section",
      "cma-post-composer"
    );

    const top = createElement(
      "div",
      "cma-composer-top"
    );

    top.appendChild(
      createMemberAvatar(currentUser.id, "small")
    );

    const caption = makeTextarea(
      "What's on your mind?",
      "cma-composer-textarea"
    );

    top.appendChild(caption);

    const preview = createElement(
      "div",
      "cma-composer-image-preview"
    );

    let selectedImageUrl = null;

    const actions = createElement(
      "div",
      "cma-composer-actions"
    );

    const imageButton = makeButton(
      "＋ Photo",
      "cma-secondary-button",
      () => {
        chooseCommunityImage(
          url => {
            selectedImageUrl = url;

            clearElement(preview);

            const image = createElement(
              "img",
              "cma-composer-preview-image"
            );

            image.src = url;
            image.alt = "Selected post image";

            preview.appendChild(image);

            preview.appendChild(
              makeButton(
                "Remove",
                "cma-remove-image-button",
                () => {
                  selectedImageUrl = null;
                  clearElement(preview);
                }
              )
            );
          },
          "posts"
        );
      }
    );

    const publishButton = makeButton(
      "Post",
      "cma-primary-button",
      async () => {
        const content = caption.value.trim();

        if (!content && !selectedImageUrl) {
          showNotice(
            "Write something or add a photo first.",
            "error"
          );
          return;
        }

        publishButton.disabled = true;

        const result = await publishPost({
          caption: content,
          imageUrl: selectedImageUrl,
          scope: POST_SCOPES.COMMUNITY
        });

        publishButton.disabled = false;

        if (result) {
          caption.value = "";
          selectedImageUrl = null;
          clearElement(preview);
          await refreshCommunityData();
          renderCommunityPage();
        }
      }
    );

    actions.append(imageButton, publishButton);

    composer.append(top, preview, actions);

    return composer;
  }

  function renderCommunityHomePage() {
    const page = createElement(
      "main",
      "cma-community-home-page"
    );

    const heading = createElement(
      "div",
      "cma-home-heading"
    );

    heading.appendChild(
      createElement(
        "h2",
        "cma-page-title",
        "Community"
      )
    );

    heading.appendChild(
      createElement(
        "p",
        "cma-page-subtitle",
        "Connect, share and learn together."
      )
    );

    page.append(
      heading,
      renderHomePostComposer(),
      renderFeed(posts, POST_SCOPES.COMMUNITY)
    );

    return page;
  }

  /* ==========================================
     CREATOR PANEL
  ========================================== */

  function renderCreatorComposer() {
    const composer = createElement(
      "section",
      "cma-creator-composer"
    );

    composer.appendChild(
      createElement(
        "h3",
        "cma-section-heading",
        "Create an Update"
      )
    );

    const destinationLabel = createElement(
      "label",
      "cma-field-label",
      "Publish Destination"
    );

    const destination = document.createElement("select");
    destination.className = "cma-creator-destination";

    const destinations = [
      {
        value: POST_SCOPES.CREATOR,
        label: "Creator Panel"
      },
      {
        value: POST_SCOPES.HOME,
        label: "Home"
      },
      {
        value: POST_SCOPES.STUDY,
        label: "Study Materials"
      },
      {
        value: POST_SCOPES.EXAM,
        label: "Exam Preparation"
      },
      {
        value: POST_SCOPES.ONLINE,
        label: "Online Batches"
      },
      {
        value: POST_SCOPES.OFFLINE,
        label: "Offline Batches"
      }
    ];

    destinations.forEach(item => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      destination.appendChild(option);
    });

    destinationLabel.appendChild(destination);

    const caption = makeTextarea(
      "Write your update...",
      "cma-creator-textarea"
    );

    const imagePreview = createElement(
      "div",
      "cma-creator-image-preview"
    );

    let selectedImageUrl = null;

    const actions = createElement(
      "div",
      "cma-creator-actions"
    );

    const addPhoto = makeButton(
      "＋ Add Photo",
      "cma-secondary-button",
      () => {
        chooseCommunityImage(
          url => {
            selectedImageUrl = url;

            clearElement(imagePreview);

            const image = createElement(
              "img",
              "cma-creator-preview-image"
            );

            image.src = url;
            image.alt = "Creator post image";

            imagePreview.appendChild(image);

            imagePreview.appendChild(
              makeButton(
                "Remove Photo",
                "cma-remove-image-button",
                () => {
                  selectedImageUrl = null;
                  clearElement(imagePreview);
                }
              )
            );
          },
          "creator"
        );
      }
    );

    const publish = makeButton(
      "Publish Update",
      "cma-primary-button",
      async () => {
        const content = caption.value.trim();

        if (!content && !selectedImageUrl) {
          showNotice(
            "Write an update or add a photo first.",
            "error"
          );
          return;
        }

        const scope = destination.value;

        if (
          !Object.values(POST_SCOPES).includes(scope) ||
          scope === POST_SCOPES.COMMUNITY
        ) {
          showNotice(
            "Please select a valid publishing destination.",
            "error"
          );
          return;
        }

        if (!isCreator()) {
          showNotice(
            "You do not have permission to publish here.",
            "error"
          );
          return;
        }

        publish.disabled = true;

        const result = await publishPost({
          caption: content,
          imageUrl: selectedImageUrl,
          scope
        });

        publish.disabled = false;

        if (result) {
          caption.value = "";
          selectedImageUrl = null;
          clearElement(imagePreview);

          await refreshCommunityData();
          renderCommunityPage();
        }
      }
    );

    actions.append(addPhoto, publish);

    composer.append(
      destinationLabel,
      caption,
      imagePreview,
      actions
    );

    return composer;
  }

  function renderCreatorPanelPage() {
    const page = createElement(
      "main",
      "cma-creator-page"
    );

    page.appendChild(
      createElement(
        "h2",
        "cma-page-title",
        "Creator Panel"
      )
    );

    if (!isCreator()) {
      page.appendChild(
        createElement(
          "p",
          "cma-empty-state",
          "This section is available to authorized creators only."
        )
      );

      return page;
    }

    page.appendChild(
      renderCreatorComposer()
    );

    page.appendChild(
      createElement(
        "h3",
        "cma-section-heading",
        "Latest Creator Updates"
      )
    );

    const creatorPosts = sortNewest(
      posts.filter(post => {
        return (
          post.post_scope === POST_SCOPES.CREATOR &&
          isCreator(post.user_id)
        );
      })
    );

    page.appendChild(
      renderFeed(creatorPosts)
    );

    return page;
  }

  /* ==========================================
     END OF PART 8
     NEXT: CSS + INITIALIZATION + EXPORTS
  ========================================== */
   
  /* ==========================================
     PART 9/9 — FINAL CSS + RENDERER + INIT
  ========================================== */

  function installCommunityStyles() {
    if (document.getElementById("cma-community-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "cma-community-styles";

    style.textContent = `
      :root {
        --cma-bg: #073746;
        --cma-deep: #052D3B;
        --cma-panel: #08494B;
        --cma-card: #103E4C;
        --cma-border: #245563;
        --cma-green: #08C99A;
        --cma-mint: #68DDB9;
        --cma-white: #FFFFFF;
        --cma-muted: #A8C0CE;
      }

      #communityRoot,
      .cma-community-root {
        width: 100%;
        min-height: 100vh;
        background: var(--cma-bg);
        color: var(--cma-white);
        font-family: "Nunito Sans", Arial, sans-serif;
        box-sizing: border-box;
        padding-bottom: 82px;
      }

      #communityRoot *,
      .cma-community-root * {
        box-sizing: border-box;
      }

      #communityRoot button,
      .cma-community-root button,
      #communityRoot input,
      #communityRoot textarea,
      #communityRoot select {
        font: inherit;
      }

      #communityRoot button,
      .cma-community-root button {
        cursor: pointer;
      }

      .cma-community-header {
        width: 100%;
        min-height: 58px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: var(--cma-deep);
        border-bottom: 1px solid var(--cma-border);
      }

      .cma-community-brand {
        font-size: 19px;
        font-weight: 800;
        white-space: nowrap;
      }

      .cma-brand-green {
        color: var(--cma-green);
      }

      .cma-header-search-button {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--cma-white);
        font-size: 27px;
      }

      .cma-community-navigation {
        position: fixed;
        z-index: 100;
        left: 0;
        right: 0;
        bottom: 0;
        min-height: 67px;
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 2px;
        padding: 7px 3px calc(7px + env(safe-area-inset-bottom));
        background: var(--cma-deep);
        border-top: 1px solid var(--cma-border);
      }

      .cma-nav-item {
        min-width: 0;
        flex: 1;
        min-height: 49px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 3px 1px;
        border: 0;
        background: transparent;
        color: var(--cma-muted);
      }

      .cma-nav-icon {
        font-size: 20px;
        line-height: 22px;
      }

      .cma-nav-label {
        font-size: 10px;
        line-height: 13px;
        white-space: nowrap;
      }

      .cma-nav-item.active {
        color: var(--cma-green);
      }

      .cma-community-home-page,
      .cma-creator-page,
      .cma-friends-page,
      .cma-notifications-page,
      .cma-profile-page,
      .cma-edit-information-page {
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        padding: 14px 12px 24px;
      }

      .cma-page-title {
        margin: 4px 0 5px;
        font-size: 21px;
        font-weight: 800;
      }

      .cma-page-subtitle {
        margin: 0 0 14px;
        color: var(--cma-muted);
        font-size: 13px;
      }

      .cma-section-heading {
        margin: 10px 0;
        font-size: 16px;
        font-weight: 800;
      }

      .cma-post-composer,
      .cma-login-post-prompt,
      .cma-creator-composer {
        margin: 12px 0;
        padding: 12px;
        background: var(--cma-card);
        border: 1px solid var(--cma-border);
        border-radius: 16px;
      }

      .cma-composer-top {
        display: flex;
        align-items: flex-start;
        gap: 9px;
      }

      .cma-composer-textarea,
      .cma-creator-textarea,
      .cma-field-input,
      .cma-field-textarea,
      .cma-search-input {
        width: 100%;
        min-width: 0;
        color: var(--cma-white);
        background: var(--cma-deep);
        border: 1px solid var(--cma-border);
        border-radius: 12px;
        outline: none;
        padding: 11px;
      }

      .cma-composer-textarea,
      .cma-creator-textarea {
        min-height: 78px;
        resize: vertical;
      }

      .cma-composer-textarea:focus,
      .cma-creator-textarea:focus,
      .cma-field-input:focus,
      .cma-field-textarea:focus,
      .cma-search-input:focus {
        border-color: var(--cma-green);
      }

      .cma-composer-actions,
      .cma-creator-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }

      .cma-primary-button,
      .cma-secondary-button {
        min-height: 37px;
        padding: 8px 15px;
        border-radius: 10px;
        font-weight: 800;
      }

      .cma-primary-button {
        color: var(--cma-deep);
        background: var(--cma-green);
        border: 1px solid var(--cma-green);
      }

      .cma-secondary-button {
        color: var(--cma-mint);
        background: transparent;
        border: 1px solid var(--cma-border);
      }

      .cma-primary-button:disabled,
      .cma-secondary-button:disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .cma-post-card {
        margin: 12px 0;
        padding: 11px;
        background: var(--cma-card);
        border: 1px solid var(--cma-border);
        border-radius: 16px;
        overflow: hidden;
      }

      .cma-post-header {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .cma-post-author,
      .cma-search-profile-name {
        color: var(--cma-white);
        font-size: 13px;
        font-weight: 800;
      }

      .cma-post-time,
      .cma-search-profile-member-id {
        display: block;
        color: var(--cma-muted);
        font-size: 10px;
      }

      .cma-post-menu-button {
        margin-left: auto;
        border: 0;
        background: transparent;
        color: var(--cma-muted);
        font-size: 21px;
      }

      .cma-post-caption {
        margin: 11px 0;
        font-size: 13px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }

      .cma-post-media,
      .cma-post-image {
        width: 100%;
        max-height: 430px;
        object-fit: contain;
        border-radius: 11px;
        background: var(--cma-deep);
      }

      .cma-reaction-bar {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 10px 0 6px;
      }

      .cma-reaction-button {
        width: 29px;
        height: 29px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 50%;
        background: rgba(5,45,59,.75);
        font-size: 15px;
      }

      .cma-reaction-button.active {
        background: rgba(8,201,154,.22);
        outline: 1px solid var(--cma-green);
      }

      .cma-comment-preview {
        margin: 7px 0;
        padding: 9px;
        background: var(--cma-deep);
        border: 1px solid var(--cma-border);
        border-radius: 11px;
      }

      .cma-comment-author {
        font-size: 11px;
        font-weight: 800;
      }

      .cma-comment-time {
        margin-left: 5px;
        color: var(--cma-muted);
        font-size: 10px;
      }

      .cma-comment-text {
        margin-top: 4px;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .cma-view-comments {
        padding: 5px 0;
        color: var(--cma-mint);
        border: 0;
        background: transparent;
        font-size: 11px;
      }

      .cma-comment-composer {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 8px;
      }

      .cma-comment-input {
        min-width: 0;
        flex: 1;
        padding: 9px 11px;
        color: var(--cma-white);
        background: var(--cma-deep);
        border: 1px solid var(--cma-border);
        border-radius: 22px;
        outline: none;
      }

      .cma-comment-send {
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        color: var(--cma-deep);
        background: var(--cma-green);
      }

      .cma-member-avatar {
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 50%;
        background: var(--cma-panel);
        color: var(--cma-green);
        font-weight: 800;
      }

      .cma-member-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cma-profile-cover {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 13px;
        background: var(--cma-panel);
      }

      .cma-profile-avatar {
        width: 90px;
        height: 90px;
        margin-top: -43px;
        margin-left: 17px;
        border: 4px solid var(--cma-bg);
        border-radius: 50%;
        object-fit: cover;
        background: var(--cma-panel);
      }

      .cma-profile-name {
        margin: 8px 0 3px;
        font-size: 20px;
        font-weight: 800;
      }

      .cma-profile-description,
      .cma-profile-member-id {
        color: var(--cma-muted);
        font-size: 12px;
      }

      .cma-profile-actions {
        display: flex;
        gap: 8px;
        margin: 12px 0;
      }

      .cma-personal-information,
      .cma-profile-tabs,
      .cma-friend-card,
      .cma-notification-card,
      .cma-search-profile-card {
        margin: 10px 0;
        padding: 11px;
        background: var(--cma-card);
        border: 1px solid var(--cma-border);
        border-radius: 13px;
      }

      .cma-profile-tabs,
      .cma-search-tabs {
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 5px;
      }

      .cma-profile-tab,
      .cma-search-tab {
        flex: 1;
        padding: 9px 4px;
        color: var(--cma-muted);
        background: transparent;
        border: 0;
        border-bottom: 2px solid transparent;
        font-size: 12px;
      }

      .cma-profile-tab.active,
      .cma-search-tab.active {
        color: var(--cma-green);
        border-bottom-color: var(--cma-green);
      }

      .cma-edit-information-page {
        padding-top: 18px;
      }

      .cma-edit-header,
      .cma-search-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
      }

      .cma-edit-back-button,
      .cma-search-back-button,
      .cma-search-clear-button {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        color: var(--cma-white);
        background: transparent;
        border: 0;
        font-size: 23px;
      }

      .cma-edit-field {
        margin: 14px 0;
      }

      .cma-field-label {
        display: block;
        margin-bottom: 7px;
        color: var(--cma-mint);
        font-size: 12px;
        font-weight: 800;
      }

      .cma-edit-save-button {
        width: 100%;
        min-height: 43px;
        margin-top: 12px;
      }

      .cma-search-page {
        width: 100%;
        min-height: 100vh;
        padding: 13px;
        background: var(--cma-bg);
      }

      .cma-search-header {
        position: sticky;
        top: 0;
        z-index: 5;
        padding: 5px 0 12px;
        background: var(--cma-bg);
      }

      .cma-search-input {
        flex: 1;
        border-radius: 22px;
      }

      .cma-recent-searches-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cma-clear-recent-button {
        color: var(--cma-mint);
        background: transparent;
        border: 0;
        font-size: 11px;
      }

      .cma-recent-search-item {
        display: block;
        width: 100%;
        padding: 12px 5px;
        text-align: left;
        color: var(--cma-white);
        background: transparent;
        border: 0;
        border-bottom: 1px solid var(--cma-border);
        font-size: 13px;
      }

      .cma-search-profile-card {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 11px;
        text-align: left;
        color: var(--cma-white);
      }

      .cma-search-profile-details {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .cma-search-profile-description {
        color: var(--cma-muted);
        font-size: 11px;
      }

      .cma-friend-card {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .cma-friend-actions {
        display: flex;
        gap: 6px;
        margin-left: auto;
      }

      .cma-notification-card {
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 12px;
      }

      .cma-notification-card.unread {
        border-left: 3px solid var(--cma-green);
      }

      .cma-empty-state {
        padding: 22px 12px;
        text-align: center;
        color: var(--cma-muted);
        font-size: 13px;
      }

      .cma-creator-destination {
        width: 100%;
        padding: 11px;
        color: var(--cma-white);
        background: var(--cma-deep);
        border: 1px solid var(--cma-border);
        border-radius: 10px;
      }

      .cma-creator-image-preview img,
      .cma-composer-image-preview img {
        display: block;
        width: 100%;
        max-height: 260px;
        margin-top: 9px;
        object-fit: contain;
        border-radius: 10px;
      }

      .cma-bottom-sheet,
      .cma-modal-overlay {
        position: fixed;
        z-index: 200;
        inset: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: rgba(0,0,0,.65);
      }

      .cma-bottom-sheet-content,
      .cma-modal-content {
        width: 100%;
        max-width: 650px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 17px;
        color: var(--cma-white);
        background: var(--cma-deep);
        border: 1px solid var(--cma-border);
        border-radius: 19px 19px 0 0;
      }

      .cma-toast {
        position: fixed;
        z-index: 500;
        left: 50%;
        bottom: 85px;
        transform: translateX(-50%);
        max-width: calc(100% - 30px);
        padding: 11px 16px;
        color: var(--cma-white);
        background: var(--cma-panel);
        border: 1px solid var(--cma-border);
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,.25);
        font-size: 12px;
      }

      @media (min-width: 700px) {
        .cma-community-home-page,
        .cma-creator-page,
        .cma-friends-page,
        .cma-notifications-page,
        .cma-profile-page,
        .cma-edit-information-page {
          padding-left: 20px;
          padding-right: 20px;
        }

        .cma-community-navigation {
          left: 50%;
          right: auto;
          width: min(100%, 720px);
          transform: translateX(-50%);
          border-left: 1px solid var(--cma-border);
          border-right: 1px solid var(--cma-border);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function appendPageResult(root, result) {
    if (
      result instanceof HTMLElement &&
      result.parentElement !== root
    ) {
      root.appendChild(result);
    }
  }

  async function renderCommunityPage() {
    installCommunityStyles();

    const root = getCommunityRoot();

    if (!root) {
      console.error("Community root element was not found.");
      return;
    }

    if (!state.initialized) {
      try {
        await refreshCommunityData();
      } catch (error) {
        console.error("Community initialization error:", error);
      }

      state.initialized = true;
    }

    clearElement(root);

    if (state.section === "search") {
      renderCommunitySearchPage();
      return;
    }

    let pageResult = null;

    try {
      switch (state.section) {
        case "profile": {
          if (!requireLogin()) {
            state.section = "home";
            pageResult = renderCommunityHomePage();
            break;
          }

          const profileId =
            state.activeProfileId || currentUser.id;

          pageResult = await renderUserProfile(profileId);
          break;
        }

        case "friends": {
          if (!requireLogin()) {
            state.section = "home";
            pageResult = renderCommunityHomePage();
            break;
          }

          await loadFriendRequests();
          await loadFriendships();

          pageResult = renderFriendsPage();
          break;
        }

        case "creator": {
          if (!requireLogin()) {
            state.section = "home";
            pageResult = renderCommunityHomePage();
            break;
          }

          await loadCreatorRoles();
          pageResult = renderCreatorPanelPage();
          break;
        }

        case "notifications": {
          if (!requireLogin()) {
            state.section = "home";
            pageResult = renderCommunityHomePage();
            break;
          }

          await loadNotifications();
          pageResult = renderNotificationsPage();
          break;
        }

        case "edit-information": {
          if (!requireLogin()) {
            state.section = "home";
            pageResult = renderCommunityHomePage();
            break;
          }

          pageResult = renderEditInformationPage();
          break;
        }

        case "home":
        case "community":
        default:
          state.section = "home";
          pageResult = renderCommunityHomePage();
          break;
      }
    } catch (error) {
      console.error("Community page rendering error:", error);

      pageResult = createElement(
        "div",
        "cma-empty-state",
        "Something went wrong while loading this page. Please try again."
      );
    }

    appendPageResult(root, pageResult);

    const header = renderCommunityHeader();
    root.insertBefore(header, root.firstChild);

    const navigation = renderCommunityNavigation();
    root.appendChild(navigation);
  }

  /* ==========================================
     PROFILE + SEARCH GLOBAL FUNCTIONS
  ========================================== */

  window.renderCommunityPage = renderCommunityPage;

  window.cmaOpenCommunityProfile = function (userId) {
    if (!userId) return;

    state.activeProfileId = userId;
    state.section = "profile";

    renderCommunityPage();
  };

  window.cmaOpenCommunitySearch = openCommunitySearch;

  window.cmaOpenMessageConversation =
    window.cmaOpenMessageConversation ||
    openMessageConversation;

  /* ==========================================
     COMMUNITY INITIALIZATION
  ========================================== */

  async function initializeCommunity() {
    installCommunityStyles();

    const root = getCommunityRoot();

    if (!root) return;

    await renderCommunityPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeCommunity,
      { once: true }
    );
  } else {
    initializeCommunity();
  }

  /* ==========================================
     END OF COMMUNITY.JS
  ========================================== */

})();
       
