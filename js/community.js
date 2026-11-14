
/* =========================================================
   CHANGE MAKER ACADEMY
   COMMUNITY SYSTEM — COMPLETE REBUILD
   PART 1 OF 8 — CORE + DATABASE FOUNDATION
   ========================================================= */

(function () {
  "use strict";

  // ---------------------------------------------------------
  // 1. SUPABASE CONFIGURATION
  // ---------------------------------------------------------

  const db = window.cmaSupabase;
  const BUCKET = "community-media";

  const LOGIN_ERROR =
    "Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";

  const EMOJIS = ["👍", "❤️", "😂", "😮"];

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

  // ---------------------------------------------------------
  // 2. SHARED COMMUNITY STATE
  // ---------------------------------------------------------

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

  let activePost = null;
  let activeProfileId = null;
  let activeProfileTab = "posts";
  let activeSearchTab = "profiles";

  let currentFeedSearchQuery = "";
  let currentSearchQuery = "";

  let selectedPostImage = null;
  let selectedAvatar = null;
  let selectedCover = null;

  let communityLoading = false;
  let communityInitialized = false;

  const state = {
    page: "home",
    commentsPostId: null,
    commentsOpen: false,
    editProfileOpen: false,
    searchOpen: false,
    previousPage: "home",
    pendingProfileId: null
  };

  // ---------------------------------------------------------
  // 3. DOM HELPERS
  // ---------------------------------------------------------

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

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

  function makeButton(text, className = "", onClick = null) {
    const button = createElement("button", className, text);

    button.type = "button";

    if (typeof onClick === "function") {
      button.addEventListener("click", onClick);
    }

    return button;
  }

  function makeInput(type, placeholder, className = "") {
    const input = createElement("input", className);

    input.type = type || "text";
    input.placeholder = placeholder || "";

    return input;
  }

  function clearElement(element) {
    if (element) {
      element.replaceChildren();
    }
  }

  function getCommunityRoot() {
    return $("#pageContent") || $("#innerPage");
  }

  // ---------------------------------------------------------
  // 4. SAFE TEXT AND IMAGE HELPERS
  // ---------------------------------------------------------

  function escapeText(value = "") {
    return String(value).replace(/[&<>"']/g, character => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return map[character];
    });
  }

  function safeImage(url) {
    if (!url) return "";

    try {
      const parsed = new URL(
        String(url),
        window.location.origin
      );

      if (
        parsed.protocol !== "https:" &&
        parsed.protocol !== "http:"
      ) {
        return "";
      }

      return parsed.href;
    } catch (error) {
      return "";
    }
  }

  function getInitial(name = "") {
    return (
      String(name).trim().charAt(0).toUpperCase() || "U"
    );
  }

  function currentName() {
    return (
      currentProfile?.display_name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "User"
    );
  }

  function getProfile(userId) {
    if (
      currentUser?.id === userId &&
      currentProfile
    ) {
      return currentProfile;
    }

    return (
      profiles.find(profile => profile.user_id === userId) ||
      null
    );
  }

  function isCreator() {
    return ["admin", "moderator", "developer"].includes(
      String(currentRole || "").toLowerCase()
    );
  }

  // ---------------------------------------------------------
  // 5. NOTICE / MESSAGE SYSTEM
  // ---------------------------------------------------------

  function showNotice(message, type = "info") {
    let notice = $("#communityNotice");

    if (!notice) {
      notice = createElement(
        "div",
        "community-notice"
      );

      notice.id = "communityNotice";

      document.body.appendChild(notice);
    }

    notice.textContent = String(message || "");
    notice.dataset.type = type;

    notice.classList.add("show");

    clearTimeout(notice._timer);

    notice._timer = setTimeout(() => {
      notice.classList.remove("show");
    }, 3200);
  }

  function requireLogin() {
    if (currentUser) {
      return true;
    }

    showNotice(LOGIN_ERROR, "error");
    return false;
  }

  // ---------------------------------------------------------
  // 6. RELATIVE TIME SYSTEM
  // ---------------------------------------------------------

  function getTimeDifference(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const difference = Date.now() - date.getTime();

    if (difference < 0) {
      return 0;
    }

    return difference;
  }

  function formatRelativeTime(value, compact = false) {
    const difference = getTimeDifference(value);

    if (difference === null) {
      return "";
    }

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (compact) {
      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      if (days < 30) return `${weeks}w`;
      if (days < 365) return `${months}mo`;

      return `${years}y`;
    }

    if (seconds < 60) return "Just now";
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days < 7) {
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    if (days < 30) {
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }

    if (days < 365) {
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }

    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  function dateText(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka"
    });
  }

  // ---------------------------------------------------------
  // 7. SUPABASE SESSION
  // ---------------------------------------------------------

  async function loadSession() {
    if (!db || !db.auth) {
      console.error(
        "Community: Supabase client not found."
      );

      currentUser = null;
      return null;
    }

    const { data, error } = await db.auth.getSession();

    if (error) {
      console.error(
        "Community session error:",
        error
      );

      currentUser = null;
      return null;
    }

    currentUser = data?.session?.user || null;

    return currentUser;
  }

  // ---------------------------------------------------------
  // 8. MY PROFILE DATA
  // ---------------------------------------------------------

  async function loadMyProfile() {
    currentProfile = null;
    currentPrivate = null;

    if (!currentUser || !db) {
      return null;
    }

    const { data, error } = await db
      .from("community_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Community profile load error:",
        error
      );
    } else {
      currentProfile = data || null;
    }

    const {
      data: privateData,
      error: privateError
    } = await db
      .from("community_private_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (privateError) {
      console.error(
        "Private profile load error:",
        privateError
      );
    } else {
      currentPrivate = privateData || null;
    }

    return currentProfile;
  }

  // ---------------------------------------------------------
  // 9. CREATOR ROLE
  // ---------------------------------------------------------

  async function loadMyRole() {
    currentRole = null;

    if (!currentUser || !db) {
      return null;
    }

    const { data, error } = await db
      .from("community_creator_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Community role load error:",
        error
      );

      return null;
    }

    currentRole = data?.role || null;

    return currentRole;
  }

  // ---------------------------------------------------------
  // 10. COMMUNITY POSTS
  // ---------------------------------------------------------

  async function loadPosts() {
    if (!db) {
      posts = [];
      return posts;
    }

    const { data, error } = await db
      .from("community_posts")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(
        "Community posts load error:",
        error
      );

      posts = [];
      return posts;
    }

    posts = data || [];

    return posts;
  }

  // ---------------------------------------------------------
  // 11. COMMUNITY REACTIONS
  // ---------------------------------------------------------

  async function loadReactions() {
    reactions = [];

    if (!db) {
      return reactions;
    }

    const { data, error } = await db
      .from("community_reactions")
      .select("*");

    if (error) {
      console.error(
        "Community reactions load error:",
        error
      );

      return reactions;
    }

    reactions = data || [];

    return reactions;
  }

  // ---------------------------------------------------------
  // 12. COMMUNITY COMMENTS
  // ---------------------------------------------------------

  async function loadComments() {
    comments = [];

    if (!db) {
      return comments;
    }

    const { data, error } = await db
      .from("community_comments")
      .select("*")
      .order("created_at", {
        ascending: true
      });

    if (error) {
      console.error(
        "Community comments load error:",
        error
      );

      return comments;
    }

    comments = data || [];

    return comments;
  }

  // ---------------------------------------------------------
  // 13. PUBLIC COMMUNITY PROFILES
  // ---------------------------------------------------------

  async function loadPublicProfiles() {
    profiles = [];

    if (!db) {
      return profiles;
    }

    const { data, error } = await db
      .from("community_profiles")
      .select("*")
      .order("display_name", {
        ascending: true
      });

    if (error) {
      console.error(
        "Public profiles load error:",
        error
      );

      return profiles;
    }

    profiles = data || [];

    return profiles;
  }

  // ---------------------------------------------------------
  // 14. GET POST RELATED DATA
  // ---------------------------------------------------------

  function getReaction(postId, userId = null) {
    return reactions.find(reaction => {
      if (reaction.post_id !== postId) {
        return false;
      }

      if (
        userId &&
        reaction.user_id !== userId
      ) {
        return false;
      }

      return true;
    }) || null;
  }

  function getPostComments(postId) {
    return comments.filter(
      comment => comment.post_id === postId
    );
  }

  function getPostReactions(postId) {
    return reactions.filter(
      reaction => reaction.post_id === postId
    );
  }

  // ---------------------------------------------------------
  // 15. REFRESH ALL COMMUNITY DATA
  // ---------------------------------------------------------

  async function refreshCommunityData() {
    if (!db) {
      showNotice(
        "Community database connection is unavailable.",
        "error"
      );

      return false;
    }

    try {
      await loadSession();

      await Promise.all([
        loadPosts(),
        loadComments(),
        loadReactions(),
        loadPublicProfiles()
      ]);

      if (currentUser) {
        await Promise.all([
          loadMyProfile(),
          loadMyRole()
        ]);
      } else {
        currentProfile = null;
        currentPrivate = null;
        currentRole = null;
      }

      return true;
    } catch (error) {
      console.error(
        "Community refresh error:",
        error
      );

      showNotice(
        "Could not refresh Community data.",
        "error"
      );

      return false;
    }
  }

  // =========================================================
  // END OF PART 1
  // NEXT: PART 2 — PROFILE SAVE, IMAGE UPLOAD,
  // POST PUBLISH, REACTION AND COMMENT ACTIONS
  // =========================================================
        
// =========================================================
// PART 2 OF 8
// PROFILE SAVE + IMAGE UPLOAD + POST ACTIONS
// =========================================================

// ---------------------------------------------------------
// 16. IMAGE VALIDATION
// ---------------------------------------------------------

function validateCommunityImage(file) {
  if (!file) {
    showNotice("Please select an image.", "error");
    return false;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    showNotice(
      "Only JPG, PNG and WEBP images are allowed.",
      "error"
    );
    return false;
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    showNotice(
      "Image size must be 5MB or smaller.",
      "error"
    );
    return false;
  }

  return true;
}

// ---------------------------------------------------------
// 17. SUPABASE IMAGE UPLOAD
// ---------------------------------------------------------

async function uploadCommunityImage(file, folder = "posts") {
  if (!requireLogin()) return null;

  if (!validateCommunityImage(file)) {
    return null;
  }

  if (!db?.storage) {
    showNotice(
      "Image storage is unavailable.",
      "error"
    );

    return null;
  }

  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  const extension = extensionMap[file.type];

  const fileName =
    `${currentUser.id}/${folder}/` +
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

  const { data, error } = await db.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error("Community upload error:", error);

    showNotice(
      "Image upload failed. Please try again.",
      "error"
    );

    return null;
  }

  const { data: publicData } = db.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  const imageUrl = publicData?.publicUrl || "";

  if (!imageUrl) {
    showNotice(
      "Could not generate image URL.",
      "error"
    );

    return null;
  }

  return imageUrl;
}

// ---------------------------------------------------------
// 18. PHONE GALLERY PICKER
// ---------------------------------------------------------

function chooseCommunityImage(callback, folder = "posts") {
  if (!requireLogin()) return;

  const input = createElement("input");

  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  input.style.display = "none";

  document.body.appendChild(input);

  input.addEventListener("change", async () => {
    const file = input.files?.[0];

    input.remove();

    if (!file) return;

    const imageUrl = await uploadCommunityImage(
      file,
      folder
    );

    if (imageUrl && typeof callback === "function") {
      callback(imageUrl, file);
    }
  });

  input.click();
}

// ---------------------------------------------------------
// 19. SAVE PERSONAL INFORMATION
// ---------------------------------------------------------

async function saveProfile(formData = {}) {
  if (!requireLogin()) return false;

  if (!db) return false;

  const displayName = String(
    formData.display_name ??
    currentProfile?.display_name ??
    currentName()
  ).trim();

  const shortDescription = String(
    formData.short_description ??
    currentProfile?.short_description ??
    ""
  ).trim();

  const institution = String(
    formData.school ??
    currentProfile?.school ??
    ""
  ).trim();

  if (!displayName) {
    showNotice(
      "Full Name cannot be empty.",
      "error"
    );

    return false;
  }

  const profileData = {
    user_id: currentUser.id,
    display_name: displayName,
    short_description: shortDescription,
    school: institution,
    updated_at: new Date().toISOString()
  };

  if (formData.avatar_url !== undefined) {
    profileData.avatar_url = formData.avatar_url;
  }

  if (formData.cover_url !== undefined) {
    profileData.cover_url = formData.cover_url;
  }

  const { data, error } = await db
    .from("community_profiles")
    .upsert(profileData, {
      onConflict: "user_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Profile save error:", error);

    showNotice(
      "Could not save profile information.",
      "error"
    );

    return false;
  }

  currentProfile = data;

  await loadPublicProfiles();

  showNotice(
    "Profile information saved successfully.",
    "success"
  );

  return true;
}

// ---------------------------------------------------------
// 20. SAVE PRIVATE PROFILE INFORMATION
// ---------------------------------------------------------

async function savePrivateProfile(formData = {}) {
  if (!requireLogin()) return false;

  if (!db) return false;

  const privateData = {
    user_id: currentUser.id,
    phone: String(formData.phone || "").trim(),
    address: String(formData.address || "").trim(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await db
    .from("community_private_profiles")
    .upsert(privateData, {
      onConflict: "user_id"
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Private profile save error:",
      error
    );

    showNotice(
      "Could not save contact information.",
      "error"
    );

    return false;
  }

  currentPrivate = data;

  showNotice(
    "Contact information saved.",
    "success"
  );

  return true;
}

// ---------------------------------------------------------
// 21. UPDATE PROFILE PICTURE
// ---------------------------------------------------------

async function updateProfilePicture(file) {
  if (!requireLogin()) return false;

  const imageUrl = await uploadCommunityImage(
    file,
    "avatars"
  );

  if (!imageUrl) return false;

  return await saveProfile({
    avatar_url: imageUrl
  });
}

// ---------------------------------------------------------
// 22. UPDATE COVER PHOTO
// ---------------------------------------------------------

async function updateCoverPhoto(file) {
  if (!requireLogin()) return false;

  const imageUrl = await uploadCommunityImage(
    file,
    "covers"
  );

  if (!imageUrl) return false;

  return await saveProfile({
    cover_url: imageUrl
  });
}

// ---------------------------------------------------------
// 23. PUBLISH COMMUNITY POST
// ---------------------------------------------------------

async function publishPost({
  caption = "",
  imageUrl = "",
  scope = "community_home"
} = {}) {
  if (!requireLogin()) return false;

  if (!db) return false;

  const cleanCaption = String(caption).trim();

  const cleanImageUrl = safeImage(imageUrl);

  if (!cleanCaption && !cleanImageUrl) {
    showNotice(
      "Write something or add a photo.",
      "error"
    );

    return false;
  }

  const allowedScopes = [
    "community_home",
    "creator_panel"
  ];

  if (!allowedScopes.includes(scope)) {
    showNotice(
      "Invalid publishing destination.",
      "error"
    );

    return false;
  }

  if (
    scope !== "community_home" &&
    !isCreator()
  ) {
    showNotice(
      "Only Admin, Moderator and Developer can publish here.",
      "error"
    );

    return false;
  }

  const postData = {
    user_id: currentUser.id,
    content: cleanCaption,
    image_url: cleanImageUrl || null,
    post_scope: scope
  };

  const { data, error } = await db
    .from("community_posts")
    .insert(postData)
    .select()
    .single();

  if (error) {
    console.error("Post publish error:", error);

    showNotice(
      "Post could not be published.",
      "error"
    );

    return false;
  }

  posts.unshift(data);

  showNotice(
    "Your post has been published.",
    "success"
  );

  return true;
}

// ---------------------------------------------------------
// 24. DELETE COMMUNITY POST
// ---------------------------------------------------------

async function deletePost(postId) {
  if (!requireLogin()) return false;

  const post = posts.find(
    item => item.id === postId
  );

  if (!post) return false;

  const isOwner = post.user_id === currentUser.id;

  if (!isOwner && !isCreator()) {
    showNotice(
      "You cannot delete this post.",
      "error"
    );

    return false;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this post?"
  );

  if (!confirmed) return false;

  const { error } = await db
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("Post delete error:", error);

    showNotice(
      "Could not delete this post.",
      "error"
    );

    return false;
  }

  posts = posts.filter(
    item => item.id !== postId
  );

  reactions = reactions.filter(
    item => item.post_id !== postId
  );

  comments = comments.filter(
    item => item.post_id !== postId
  );

  showNotice(
    "Post deleted successfully.",
    "success"
  );

  return true;
}

// ---------------------------------------------------------
// 25. ADD / CHANGE / REMOVE REACTION
// ---------------------------------------------------------

async function toggleReaction(postId, emoji) {
  if (!requireLogin()) return false;

  if (!EMOJIS.includes(emoji)) {
    return false;
  }

  const existing = reactions.find(item =>
    item.post_id === postId &&
    item.user_id === currentUser.id
  );

  if (existing && existing.emoji === emoji) {
    const { error } = await db
      .from("community_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error(
        "Reaction remove error:",
        error
      );

      showNotice(
        "Could not remove reaction.",
        "error"
      );

      return false;
    }

    reactions = reactions.filter(
      item => item.id !== existing.id
    );

    return true;
  }

  if (existing) {
    const { data, error } = await db
      .from("community_reactions")
      .update({
        emoji: emoji
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error(
        "Reaction update error:",
        error
      );

      showNotice(
        "Could not change reaction.",
        "error"
      );

      return false;
    }

    reactions = reactions.map(item =>
      item.id === existing.id ? data : item
    );

    return true;
  }

  const { data, error } = await db
    .from("community_reactions")
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      emoji: emoji
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Reaction insert error:",
      error
    );

    showNotice(
      "Could not add reaction.",
      "error"
    );

    return false;
  }

  reactions.push(data);

  return true;
}

// ---------------------------------------------------------
// 26. ADD COMMENT
// ---------------------------------------------------------

async function addComment(postId, text) {
  if (!requireLogin()) return false;

  const cleanText = String(text || "").trim();

  if (!cleanText) {
    showNotice(
      "Write a comment first.",
      "error"
    );

    return false;
  }

  const { data, error } = await db
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      content: cleanText
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Comment insert error:",
      error
    );

    showNotice(
      "Could not add comment.",
      "error"
    );

    return false;
  }

  comments.push(data);

  showNotice(
    "Comment added.",
    "success"
  );

  return true;
}

// ---------------------------------------------------------
// 27. DELETE COMMENT
// ---------------------------------------------------------

async function deleteComment(commentId) {
  if (!requireLogin()) return false;

  const comment = comments.find(
    item => item.id === commentId
  );

  if (!comment) return false;

  const isOwner =
    comment.user_id === currentUser.id;

  if (!isOwner && !isCreator()) {
    showNotice(
      "You cannot delete this comment.",
      "error"
    );

    return false;
  }

  const { error } = await db
    .from("community_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error(
      "Comment delete error:",
      error
    );

    showNotice(
      "Could not delete comment.",
      "error"
    );

    return false;
  }

  comments = comments.filter(
    item => item.id !== commentId
  );

  return true;
}

// =========================================================
// END OF PART 2
// NEXT: PART 3 — POST CARD + FEED + COMPOSER UI
// =========================================================
    
// =========================================================
// PART 3 OF 8
// POST CARD + HOMEPAGE FEED + COMPOSER
// =========================================================

// ---------------------------------------------------------
// 28. GET POST AUTHOR
// ---------------------------------------------------------

function getPostAuthor(post) {
  return getProfile(post.user_id);
}

function getAuthorName(post) {
  const profile = getPostAuthor(post);

  return (
    profile?.display_name ||
    "Community Member"
  );
}

function getAuthorAvatar(post) {
  const profile = getPostAuthor(post);

  return safeImage(profile?.avatar_url || "");
}

// ---------------------------------------------------------
// 29. CREATE AVATAR
// ---------------------------------------------------------

function createAuthorAvatar(profile, size = "normal") {
  const avatar = createElement(
    "div",
    `community-avatar community-avatar-${size}`
  );

  const imageUrl = safeImage(profile?.avatar_url);

  if (imageUrl) {
    const image = createElement("img");

    image.src = imageUrl;
    image.alt = profile?.display_name || "Member";
    image.loading = "lazy";

    image.onerror = () => {
      image.remove();
      avatar.textContent = getInitial(
        profile?.display_name
      );
    };

    avatar.appendChild(image);
  } else {
    avatar.textContent = getInitial(
      profile?.display_name
    );
  }

  return avatar;
}

// ---------------------------------------------------------
// 30. CREATE POST AUTHOR BUTTON
// ---------------------------------------------------------

function createPostAuthor(post) {
  const profile = getPostAuthor(post);

  const button = createElement(
    "button",
    "community-post-author"
  );

  button.type = "button";

  button.appendChild(
    createAuthorAvatar(profile, "small")
  );

  const details = createElement(
    "div",
    "community-post-author-details"
  );

  const name = createElement(
    "span",
    "community-post-author-name",
    getAuthorName(post)
  );

  const time = createElement(
    "span",
    "community-post-time",
    formatRelativeTime(post.created_at)
  );

  details.append(name, time);

  button.appendChild(details);

  button.addEventListener("click", () => {
    window.cmaOpenCommunityProfile?.(
      post.user_id
    );
  });

  return button;
}

// ---------------------------------------------------------
// 31. POST MENU
// ---------------------------------------------------------

function createPostMenu(post) {
  const wrapper = createElement(
    "div",
    "community-post-menu-wrapper"
  );

  const menuButton = makeButton(
    "⋯",
    "community-post-menu-button"
  );

  menuButton.setAttribute(
    "aria-label",
    "Post options"
  );

  const menu = createElement(
    "div",
    "community-post-menu"
  );

  menu.hidden = true;

  const isOwner =
    currentUser?.id === post.user_id;

  if (isOwner || isCreator()) {
    const deleteButton = makeButton(
      "Delete Post",
      "community-menu-item community-delete-post-button",
      async () => {
        menu.hidden = true;

        const deleted = await deletePost(post.id);

        if (deleted) {
          renderCommunityPage();
        }
      }
    );

    menu.appendChild(deleteButton);
  }

  if (!menu.children.length) {
    const unavailable = createElement(
      "div",
      "community-menu-empty",
      "No options available"
    );

    menu.appendChild(unavailable);
  }

  menuButton.addEventListener("click", event => {
    event.stopPropagation();

    menu.hidden = !menu.hidden;
  });

  document.addEventListener("click", event => {
    if (!wrapper.contains(event.target)) {
      menu.hidden = true;
    }
  });

  wrapper.append(menuButton, menu);

  return wrapper;
}

// ---------------------------------------------------------
// 32. REACTION BUTTONS
// ---------------------------------------------------------

function createReactionBar(post) {
  const bar = createElement(
    "div",
    "community-reaction-bar"
  );

  const currentReaction = reactions.find(item =>
    item.post_id === post.id &&
    item.user_id === currentUser?.id
  );

  EMOJIS.forEach(emoji => {
    const button = makeButton(
      emoji,
      "community-reaction-button",
      async () => {
        if (!requireLogin()) return;

        const success = await toggleReaction(
          post.id,
          emoji
        );

        if (success) {
          renderCommunityPage();
        }
      }
    );

    button.setAttribute(
      "aria-label",
      `React with ${emoji}`
    );

    if (currentReaction?.emoji === emoji) {
      button.classList.add("active");
    }

    button.addEventListener("contextmenu", event => {
      event.preventDefault();
      openReactionMembers(post.id, emoji);
    });

    button.addEventListener("click", event => {
      if (event.detail === 2) {
        openReactionMembers(post.id, emoji);
      }
    });

    bar.appendChild(button);
  });

  return bar;
}

// ---------------------------------------------------------
// 33. REACTION MEMBER LIST
// ---------------------------------------------------------

function openReactionMembers(postId, emoji) {
  const matching = reactions.filter(item =>
    item.post_id === postId &&
    item.emoji === emoji
  );

  const overlay = createElement(
    "div",
    "community-modal-overlay"
  );

  const sheet = createElement(
    "div",
    "community-modal-sheet"
  );

  const heading = createElement(
    "h3",
    "",
    `${emoji} Reactions`
  );

  const close = makeButton(
    "×",
    "community-modal-close",
    () => overlay.remove()
  );

  sheet.append(heading, close);

  if (!matching.length) {
    sheet.appendChild(
      createElement(
        "p",
        "community-empty",
        "No reactions yet."
      )
    );
  }

  matching.forEach(reaction => {
    const profile = getProfile(reaction.user_id);

    const row = createElement(
      "div",
      "community-reaction-member"
    );

    row.appendChild(
      createAuthorAvatar(profile, "small")
    );

    row.appendChild(
      createElement(
        "span",
        "",
        profile?.display_name || "Member"
      )
    );

    sheet.appendChild(row);
  });

  overlay.appendChild(sheet);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
}

// ---------------------------------------------------------
// 34. ONE COMMENT PREVIEW
// ---------------------------------------------------------

function createCommentPreview(post) {
  const postComments = getPostComments(post.id);

  if (!postComments.length) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * postComments.length
  );

  const comment = postComments[randomIndex];

  const profile = getProfile(comment.user_id);

  const card = createElement(
    "div",
    "community-comment-preview"
  );

  card.appendChild(
    createAuthorAvatar(profile, "tiny")
  );

  const body = createElement(
    "div",
    "community-comment-preview-body"
  );

  const header = createElement(
    "div",
    "community-comment-preview-header"
  );

  header.append(
    createElement(
      "strong",
      "",
      profile?.display_name || "Member"
    ),
    createElement(
      "span",
      "",
      formatRelativeTime(comment.created_at, true)
    )
  );

  body.append(
    header,
    createElement(
      "p",
      "",
      comment.content || ""
    )
  );

  card.appendChild(body);

  return card;
}

// ---------------------------------------------------------
// 35. WRITE COMMENT BAR
// ---------------------------------------------------------

function createWriteCommentBar(post) {
  const bar = createElement(
    "form",
    "community-write-comment"
  );

  const avatar = createAuthorAvatar(
    currentProfile,
    "tiny"
  );

  const input = makeInput(
    "text",
    "Write a comment...",
    "community-write-comment-input"
  );

  const send = makeButton(
    "➤",
    "community-write-comment-send"
  );

  send.type = "submit";

  bar.append(avatar, input, send);

  bar.addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireLogin()) return;

    const success = await addComment(
      post.id,
      input.value
    );

    if (success) {
      renderCommunityPage();
    }
  });

  return bar;
}

// ---------------------------------------------------------
// 36. COMPLETE POST CARD
// ---------------------------------------------------------

function renderPostCard(post) {
  const card = createElement(
    "article",
    "community-post-card"
  );

  card.id = `community-post-${post.id}`;

  // Header
  const header = createElement(
    "div",
    "community-post-header"
  );

  header.append(
    createPostAuthor(post),
    createPostMenu(post)
  );

  card.appendChild(header);

  // Caption
  if (post.content) {
    card.appendChild(
      createElement(
        "p",
        "community-post-caption",
        post.content
      )
    );
  }

  // Photo
  const imageUrl = safeImage(post.image_url);

  if (imageUrl) {
    const image = createElement(
      "img",
      "community-post-image"
    );

    image.src = imageUrl;
    image.alt = "Community post image";
    image.loading = "lazy";

    card.appendChild(image);
  }

  // Reactions
  card.appendChild(createReactionBar(post));

  // One comment preview
  const preview = createCommentPreview(post);

  if (preview) {
    card.appendChild(preview);
  }

  // View all comments
  const postComments = getPostComments(post.id);

  if (postComments.length > 0) {
    const viewAll = makeButton(
      "View all comments",
      "community-view-comments",
      () => openComments(post.id)
    );

    card.appendChild(viewAll);
  }

  // Write comment
  card.appendChild(createWriteCommentBar(post));

  return card;
}

// ---------------------------------------------------------
// 37. POST COMPOSER
// ---------------------------------------------------------

function createComposer(scope = "community_home") {
  const composer = createElement(
    "form",
    "community-composer"
  );

  const heading = createElement(
    "div",
    "community-composer-heading",
    "Create a Post"
  );

  const textarea = createElement(
    "textarea",
    "community-composer-textarea"
  );

  textarea.placeholder = "What's on your mind?";
  textarea.rows = 2;

  const imagePreview = createElement(
    "div",
    "community-composer-image-preview"
  );

  let selectedImageUrl = "";

  const actions = createElement(
    "div",
    "community-composer-actions"
  );

  const photoButton = makeButton(
    "＋ Add Photo",
    "community-composer-photo"
  );

  const publishButton = makeButton(
    "Post",
    "community-composer-submit"
  );

  publishButton.type = "submit";

  photoButton.addEventListener("click", () => {
    chooseCommunityImage(imageUrl => {
      selectedImageUrl = imageUrl;

      clearElement(imagePreview);

      const image = createElement("img");

      image.src = imageUrl;
      image.alt = "Selected post photo";

      const remove = makeButton(
        "×",
        "community-composer-remove-image",
        () => {
          selectedImageUrl = "";
          clearElement(imagePreview);
        }
      );

      imagePreview.append(image, remove);
    }, "posts");
  });

  actions.append(photoButton, publishButton);

  composer.append(
    heading,
    textarea,
    imagePreview,
    actions
  );

  composer.addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireLogin()) return;

    publishButton.disabled = true;

    const success = await publishPost({
      caption: textarea.value,
      imageUrl: selectedImageUrl,
      scope
    });

    publishButton.disabled = false;

    if (success) {
      renderCommunityPage();
    }
  });

  return composer;
}

// ---------------------------------------------------------
// 38. FILTER POSTS
// ---------------------------------------------------------

function getCommunityPosts(scope = "community_home") {
  return posts
    .filter(post => post.post_scope === scope)
    .sort((a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
    );
}

// ---------------------------------------------------------
// 39. RENDER HOMEPAGE FEED
// ---------------------------------------------------------

function renderFeed(container) {
  clearElement(container);

  const heading = createElement(
    "h2",
    "community-section-title",
    "Community"
  );

  container.appendChild(heading);

  if (currentUser) {
    container.appendChild(
      createComposer("community_home")
    );
  }

  const feed = createElement(
    "div",
    "community-feed"
  );

  const communityPosts = getCommunityPosts(
    "community_home"
  );

  if (!communityPosts.length) {
    feed.appendChild(
      createElement(
        "div",
        "community-empty",
        "No posts yet. Be the first to share something!"
      )
    );
  } else {
    communityPosts.forEach(post => {
      feed.appendChild(
        renderPostCard(post)
      );
    });
  }

  container.appendChild(feed);
}

// =========================================================
// END OF PART 3
// NEXT: PART 4 — COMMENTS BOTTOM SHEET + PROFILE SYSTEM
// =========================================================
    
// =========================================================
// PART 4 OF 8
// COMMENTS + MY PROFILE + OTHER MEMBER PROFILE
// =========================================================

// ---------------------------------------------------------
// 40. CLOSE COMMUNITY MODAL
// ---------------------------------------------------------

function closeCommunityModal() {
  const overlay = $(".community-modal-overlay");

  if (overlay) {
    overlay.remove();
  }

  state.commentsOpen = false;
  state.commentsPostId = null;
}

// ---------------------------------------------------------
// 41. COMMENTS BOTTOM SHEET
// ---------------------------------------------------------

function openComments(postId) {
  if (state.commentsOpen) {
    closeCommunityModal();
  }

  const post = posts.find(
    item => item.id === postId
  );

  if (!post) return;

  state.commentsOpen = true;
  state.commentsPostId = postId;

  const overlay = createElement(
    "div",
    "community-modal-overlay community-comments-overlay"
  );

  const sheet = createElement(
    "section",
    "community-modal-sheet community-comments-sheet"
  );

  const header = createElement(
    "div",
    "community-comments-header"
  );

  const heading = createElement(
    "h3",
    "",
    "Comments"
  );

  const close = makeButton(
    "×",
    "community-modal-close",
    closeCommunityModal
  );

  header.append(heading, close);

  const list = createElement(
    "div",
    "community-comments-list"
  );

  const renderComments = () => {
    clearElement(list);

    const postComments = getPostComments(postId);

    if (!postComments.length) {
      list.appendChild(
        createElement(
          "p",
          "community-empty",
          "No comments yet."
        )
      );

      return;
    }

    postComments.forEach(comment => {
      const profile = getProfile(comment.user_id);

      const row = createElement(
        "div",
        "community-comment-row"
      );

      row.appendChild(
        createAuthorAvatar(profile, "small")
      );

      const body = createElement(
        "div",
        "community-comment-body"
      );

      const top = createElement(
        "div",
        "community-comment-top"
      );

      top.append(
        createElement(
          "strong",
          "",
          profile?.display_name || "Member"
        ),
        createElement(
          "span",
          "",
          formatRelativeTime(comment.created_at, true)
        )
      );

      body.append(
        top,
        createElement(
          "p",
          "",
          comment.content || ""
        )
      );

      if (
        currentUser &&
        (
          comment.user_id === currentUser.id ||
          isCreator()
        )
      ) {
        const remove = makeButton(
          "Delete",
          "community-comment-delete",
          async () => {
            const success = await deleteComment(
              comment.id
            );

            if (success) {
              renderComments();
              renderCommunityPage();
            }
          }
        );

        body.appendChild(remove);
      }

      row.appendChild(body);
      list.appendChild(row);
    });
  };

  renderComments();

  const form = createElement(
    "form",
    "community-comments-form"
  );

  const input = makeInput(
    "text",
    "Write a comment...",
    "community-comments-input"
  );

  const send = makeButton(
    "➤",
    "community-comments-send"
  );

  send.type = "submit";

  form.append(input, send);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireLogin()) return;

    const success = await addComment(
      postId,
      input.value
    );

    if (success) {
      input.value = "";
      renderComments();
      renderCommunityPage();
    }
  });

  sheet.append(header, list, form);
  overlay.appendChild(sheet);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeCommunityModal();
    }
  });

  document.body.appendChild(overlay);
}

// ---------------------------------------------------------
// 42. PROFILE INFORMATION ROW
// ---------------------------------------------------------

function createProfileInfoRow(label, value) {
  const row = createElement(
    "div",
    "community-profile-info-row"
  );

  row.append(
    createElement(
      "span",
      "community-profile-info-label",
      label
    ),
    createElement(
      "span",
      "community-profile-info-value",
      value || "Not provided"
    )
  );

  return row;
}

// ---------------------------------------------------------
// 43. PROFILE HEADER
// ---------------------------------------------------------

function renderProfileHeader(profile, isOwn = false) {
  const header = createElement(
    "section",
    "community-profile-header"
  );

  const cover = createElement(
    "div",
    "community-profile-cover"
  );

  const coverUrl = safeImage(profile?.cover_url);

  if (coverUrl) {
    cover.style.backgroundImage =
      `url("${coverUrl}")`;
  }

  if (isOwn) {
    cover.classList.add(
      "community-profile-editable"
    );

    cover.addEventListener("click", () => {
      chooseCommunityImage(async (url, file) => {
        const success = await updateCoverPhoto(file);

        if (success) {
          renderCommunityPage();
        }
      }, "covers");
    });
  }

  const avatarWrap = createElement(
    "div",
    "community-profile-avatar-wrap"
  );

  const avatar = createAuthorAvatar(
    profile,
    "profile"
  );

  if (isOwn) {
    avatar.classList.add(
      "community-profile-editable"
    );

    avatar.addEventListener("click", () => {
      chooseCommunityImage(async (url, file) => {
        const success = await updateProfilePicture(file);

        if (success) {
          renderCommunityPage();
        }
      }, "avatars");
    });
  }

  avatarWrap.appendChild(avatar);

  const details = createElement(
    "div",
    "community-profile-heading"
  );

  details.append(
    createElement(
      "h2",
      "",
      profile?.display_name || "Community Member"
    )
  );

  if (profile?.short_description) {
    details.appendChild(
      createElement(
        "p",
        "",
        profile.short_description
      )
    );
  }

  header.append(
    cover,
    avatarWrap,
    details
  );

  return header;
}

// ---------------------------------------------------------
// 44. PROFILE PERSONAL INFORMATION
// ---------------------------------------------------------

function renderProfileInfo(profile, isOwn = false, privateData = null) {
  const section = createElement(
    "section",
    "community-profile-info"
  );

  const heading = createElement(
    "div",
    "community-profile-info-heading"
  );

  heading.appendChild(
    createElement(
      "h3",
      "",
      "Personal Information"
    )
  );

  if (isOwn) {
    const edit = makeButton(
      "✎",
      "community-profile-edit-button",
      () => renderEditProfilePage()
    );

    edit.setAttribute(
      "aria-label",
      "Edit Personal Information"
    );

    heading.appendChild(edit);
  }

  const rows = createElement(
    "div",
    "community-profile-info-list"
  );

  rows.append(
    createProfileInfoRow(
      "Institution",
      profile?.school
    ),
    createProfileInfoRow(
      "Mobile Number",
      privateData?.phone
    ),
    createProfileInfoRow(
      "Address",
      privateData?.address
    )
  );

  section.append(heading, rows);

  return section;
}

// ---------------------------------------------------------
// 45. PROFILE TABS
// ---------------------------------------------------------

function createProfileTabs(profileId) {
  const tabs = createElement(
    "div",
    "community-profile-tabs"
  );

  const tabItems = [
    ["posts", "Posts"],
    ["photos", "Photos"],
    ["reacted", "React On"],
    ["friends", "Friends"]
  ];

  tabItems.forEach(([value, label]) => {
    const button = makeButton(
      label,
      "community-profile-tab",
      () => {
        activeProfileTab = value;

        $$(".community-profile-tab").forEach(tab => {
          tab.classList.toggle(
            "active",
            tab.dataset.tab === value
          );
        });

        const content = $(
          ".community-profile-tab-content"
        );

        if (content) {
          renderProfileTab(
            content,
            profileId,
            value
          );
        }
      }
    );

    button.dataset.tab = value;

    if (activeProfileTab === value) {
      button.classList.add("active");
    }

    tabs.appendChild(button);
  });

  return tabs;
}

// ---------------------------------------------------------
// 46. PROFILE TAB CONTENT
// ---------------------------------------------------------

function renderProfileTab(container, profileId, tab) {
  clearElement(container);

  if (tab === "friends") {
    const friendList = friendships.filter(friend =>
      friend.user_id === profileId ||
      friend.friend_id === profileId
    );

    if (!friendList.length) {
      container.appendChild(
        createElement(
          "p",
          "community-empty",
          "No friends to show yet."
        )
      );

      return;
    }

    friendList.forEach(friend => {
      const otherId =
        friend.user_id === profileId
          ? friend.friend_id
          : friend.user_id;

      const profile = getProfile(otherId);

      if (!profile) return;

      const item = makeButton(
        profile.display_name || "Member",
        "community-friend-item",
        () => window.cmaOpenCommunityProfile?.(otherId)
      );

      item.prepend(
        createAuthorAvatar(profile, "small")
      );

      container.appendChild(item);
    });

    return;
  }

  let profilePosts = posts.filter(
    post => post.user_id === profileId
  );

  if (tab === "photos") {
    profilePosts = profilePosts.filter(
      post => post.image_url
    );
  }

  if (tab === "reacted") {
    const reactedIds = new Set(
      reactions
        .filter(item => item.user_id === profileId)
        .map(item => item.post_id)
    );

    profilePosts = posts.filter(
      post => reactedIds.has(post.id)
    );
  }

  if (!profilePosts.length) {
    container.appendChild(
      createElement(
        "p",
        "community-empty",
        "Nothing to show here yet."
      )
    );

    return;
  }

  profilePosts
    .sort((a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
    )
    .forEach(post => {
      container.appendChild(
        renderPostCard(post)
      );
    });
}

// ---------------------------------------------------------
// 47. MY PROFILE PAGE
// ---------------------------------------------------------

function renderMe(container) {
  clearElement(container);

  if (!currentUser) {
    container.appendChild(
      createElement(
        "p",
        "community-empty",
        LOGIN_ERROR
      )
    );

    return;
  }

  const profile = currentProfile || {
    user_id: currentUser.id,
    display_name: currentName()
  };

  const page = createElement(
    "div",
    "community-profile-page"
  );

  page.appendChild(
    renderProfileHeader(profile, true)
  );

  page.appendChild(
    renderProfileInfo(
      profile,
      true,
      currentPrivate
    )
  );

  page.appendChild(
    createComposer("community_home")
  );

  const tabs = createProfileTabs(
    currentUser.id
  );

  const content = createElement(
    "div",
    "community-profile-tab-content"
  );

  page.append(tabs, content);

  container.appendChild(page);

  renderProfileTab(
    content,
    currentUser.id,
    activeProfileTab
  );
}

// ---------------------------------------------------------
// 48. OTHER MEMBER PROFILE
// ---------------------------------------------------------

async function renderUserProfile(
  container,
  userId,
  backCallback = null
) {
  clearElement(container);

  if (!userId) return;

  activeProfileId = userId;

  const loading = createElement(
    "p",
    "community-loading",
    "Loading profile..."
  );

  container.appendChild(loading);

  let profile = getProfile(userId);

  if (!profile && db) {
    const { data, error } = await db
      .from("community_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error) {
      profile = data;

      if (profile) {
        profiles.push(profile);
      }
    }
  }

  if (!profile) {
    clearElement(container);

    container.appendChild(
      createElement(
        "p",
        "community-empty",
        "This profile could not be found."
      )
    );

    return;
  }

  clearElement(container);

  const isOwn =
    currentUser?.id === userId;

  if (isOwn) {
    renderMe(container);
    return;
  }

  const page = createElement(
    "div",
    "community-profile-page"
  );

  page.appendChild(
    renderProfileHeader(profile, false)
  );

  page.appendChild(
    renderProfileInfo(
      profile,
      false,
      profile
    )
  );

  // Member actions
  const actions = createElement(
    "div",
    "community-member-actions"
  );

  const friendButton = makeButton(
    "Add Friend",
    "community-add-friend-button",
    async () => {
      if (!requireLogin()) return;

      await sendFriendRequest(userId);
    }
  );

  const messageButton = makeButton(
    "Message",
    "community-message-button",
    () => {
      if (!requireLogin()) return;

      openMessageConversation(userId);
    }
  );

  actions.append(
    friendButton,
    messageButton
  );

  page.appendChild(actions);

  const tabs = createProfileTabs(userId);

  const content = createElement(
    "div",
    "community-profile-tab-content"
  );

  page.append(tabs, content);

  container.appendChild(page);

  renderProfileTab(
    content,
    userId,
    activeProfileTab
  );
}

// =========================================================
// END OF PART 4
// NEXT: PART 5 — FRIEND REQUESTS + FRIENDS PAGE
// =========================================================
  
// =========================================================
// PART 5 OF 8
// FRIEND SYSTEM + MESSAGING MODULE CONNECTION
// =========================================================

// ---------------------------------------------------------
// 49. LOAD FRIEND REQUESTS
// ---------------------------------------------------------

async function loadFriendRequests() {
  friendRequests = [];

  if (!db || !currentUser) return friendRequests;

  const { data, error } = await db
    .from("community_friend_requests")
    .select("*")
    .or(
      `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Friend request load:", error);
    return friendRequests;
  }

  friendRequests = data || [];
  return friendRequests;
}

// ---------------------------------------------------------
// 50. LOAD FRIENDSHIPS
// ---------------------------------------------------------

async function loadFriendships() {
  friendships = [];

  if (!db || !currentUser) return friendships;

  const { data, error } = await db
    .from("community_friendships")
    .select("*")
    .or(
      `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
    );

  if (error) {
    console.error("Friendship load:", error);
    return friendships;
  }

  friendships = data || [];
  return friendships;
}

// ---------------------------------------------------------
// 51. FRIEND STATUS
// ---------------------------------------------------------

function areFriends(userId) {
  if (!currentUser || !userId) return false;

  return friendships.some(item =>
    (
      item.user_id === currentUser.id &&
      item.friend_id === userId
    ) ||
    (
      item.user_id === userId &&
      item.friend_id === currentUser.id
    )
  );
}

function getSentFriendRequest(userId) {
  return friendRequests.find(item =>
    item.sender_id === currentUser?.id &&
    item.receiver_id === userId &&
    item.status === "pending"
  ) || null;
}

function getReceivedFriendRequest(userId) {
  return friendRequests.find(item =>
    item.sender_id === userId &&
    item.receiver_id === currentUser?.id &&
    item.status === "pending"
  ) || null;
}

// ---------------------------------------------------------
// 52. SEND FRIEND REQUEST
// ---------------------------------------------------------

async function sendFriendRequest(receiverId) {
  if (!requireLogin()) return false;

  if (!receiverId || receiverId === currentUser.id) {
    return false;
  }

  if (areFriends(receiverId)) {
    showNotice("Already friends.", "info");
    return false;
  }

  if (
    getSentFriendRequest(receiverId) ||
    getReceivedFriendRequest(receiverId)
  ) {
    showNotice("A pending request already exists.", "info");
    return false;
  }

  const { data, error } = await db
    .from("community_friend_requests")
    .insert({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    console.error("Send request:", error);
    showNotice("Could not send friend request.", "error");
    return false;
  }

  friendRequests.unshift(data);

  showNotice("Friend request sent.", "success");
  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 53. ACCEPT FRIEND REQUEST
// ---------------------------------------------------------

async function acceptFriendRequest(requestId) {
  if (!requireLogin()) return false;

  const request = friendRequests.find(
    item => item.id === requestId
  );

  if (
    !request ||
    request.receiver_id !== currentUser.id ||
    request.status !== "pending"
  ) {
    return false;
  }

  const { data: updated, error } = await db
    .from("community_friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("receiver_id", currentUser.id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    console.error("Accept request:", error);
    showNotice("Could not accept request.", "error");
    return false;
  }

  const { error: friendshipError } = await db
    .from("community_friendships")
    .upsert(
      [
        {
          user_id: request.sender_id,
          friend_id: request.receiver_id
        },
        {
          user_id: request.receiver_id,
          friend_id: request.sender_id
        }
      ],
      {
        onConflict: "user_id,friend_id",
        ignoreDuplicates: true
      }
    );

  if (friendshipError) {
    console.error("Create friendship:", friendshipError);
    showNotice(
      "Request accepted, but friendship needs a refresh.",
      "error"
    );
    return false;
  }

  friendRequests = friendRequests.map(item =>
    item.id === requestId ? updated : item
  );

  await loadFriendships();

  showNotice("You are now friends.", "success");
  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 54. DELETE FRIEND REQUEST
// ---------------------------------------------------------

async function deleteFriendRequest(requestId) {
  if (!requireLogin()) return false;

  const request = friendRequests.find(
    item => item.id === requestId
  );

  if (!request) return false;

  if (
    request.sender_id !== currentUser.id &&
    request.receiver_id !== currentUser.id
  ) {
    return false;
  }

  const { error } = await db
    .from("community_friend_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error("Delete request:", error);
    showNotice("Could not remove request.", "error");
    return false;
  }

  friendRequests = friendRequests.filter(
    item => item.id !== requestId
  );

  showNotice("Friend request removed.", "success");
  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 55. REMOVE FRIEND
// ---------------------------------------------------------

async function removeFriend(friendId) {
  if (!requireLogin()) return false;
  if (!areFriends(friendId)) return false;

  if (!window.confirm("Remove this friend?")) return false;

  const { error } = await db
    .from("community_friendships")
    .delete()
    .or(
      `and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`
    );

  if (error) {
    console.error("Remove friend:", error);
    showNotice("Could not remove friend.", "error");
    return false;
  }

  await loadFriendships();

  showNotice("Friend removed.", "success");
  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 56. GET FRIEND PROFILE
// ---------------------------------------------------------

function getFriendProfile(friendship) {
  const otherId =
    friendship.user_id === currentUser?.id
      ? friendship.friend_id
      : friendship.user_id;

  return getProfile(otherId);
}

// ---------------------------------------------------------
// 57. FRIEND ITEM
// ---------------------------------------------------------

function createFriendItem(profile, options = {}) {
  const item = createElement(
    "div",
    "community-friend-item"
  );

  const identity = makeButton(
    "",
    "community-friend-identity",
    () => {
      window.cmaOpenCommunityProfile?.(profile.user_id);
    }
  );

  identity.append(
    createAuthorAvatar(profile, "small"),
    createElement(
      "span",
      "community-friend-name",
      profile.display_name || "Member"
    )
  );

  item.appendChild(identity);

  if (options.request) {
    const actions = createElement(
      "div",
      "community-friend-actions"
    );

    actions.append(
      makeButton(
        "Accept",
        "community-friend-accept",
        () => acceptFriendRequest(options.request.id)
      ),
      makeButton(
        "Delete",
        "community-friend-delete",
        () => deleteFriendRequest(options.request.id)
      )
    );

    item.appendChild(actions);
  }

  if (options.showRemove) {
    item.appendChild(
      makeButton(
        "Remove",
        "community-friend-remove",
        () => removeFriend(profile.user_id)
      )
    );
  }

  return item;
}

// ---------------------------------------------------------
// 58. FRIENDS PAGE
// ---------------------------------------------------------

function renderFriendsPage(container) {
  clearElement(container);

  if (!currentUser) {
    container.appendChild(
      createElement("p", "community-empty", LOGIN_ERROR)
    );
    return;
  }

  const page = createElement(
    "section",
    "community-friends-page"
  );

  page.appendChild(
    createElement("h2", "community-section-title", "Friends")
  );

  // Incoming requests
  const incoming = friendRequests.filter(item =>
    item.receiver_id === currentUser.id &&
    item.status === "pending"
  );

  const requestSection = createElement(
    "section",
    "community-friend-section"
  );

  requestSection.appendChild(
    createElement(
      "h3",
      "",
      `Friend Requests (${incoming.length})`
    )
  );

  if (!incoming.length) {
    requestSection.appendChild(
      createElement(
        "p",
        "community-empty",
        "No new friend requests."
      )
    );
  }

  incoming.forEach(request => {
    const profile = getProfile(request.sender_id);

    if (profile) {
      requestSection.appendChild(
        createFriendItem(profile, { request })
      );
    }
  });

  page.appendChild(requestSection);

  // Accepted friends
  const uniqueFriends = new Map();

  friendships.forEach(friendship => {
    const profile = getFriendProfile(friendship);

    if (profile) {
      uniqueFriends.set(profile.user_id, profile);
    }
  });

  const friendsSection = createElement(
    "section",
    "community-friend-section"
  );

  friendsSection.appendChild(
    createElement(
      "h3",
      "",
      `My Friends (${uniqueFriends.size})`
    )
  );

  const search = makeInput(
    "search",
    "Search friends...",
    "community-friend-search"
  );

  const list = createElement(
    "div",
    "community-friends-list"
  );

  function renderList(query = "") {
    clearElement(list);

    const matches = [...uniqueFriends.values()].filter(profile =>
      (profile.display_name || "")
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    matches.forEach(profile => {
      list.appendChild(
        createFriendItem(profile, {
          showRemove: true
        })
      );
    });

    if (!matches.length) {
      list.appendChild(
        createElement(
          "p",
          "community-empty",
          "No matching friends found."
        )
      );
    }
  }

  search.addEventListener("input", () => {
    renderList(search.value.trim());
  });

  renderList();

  friendsSection.append(search, list);
  page.appendChild(friendsSection);

  container.appendChild(page);
}

// ---------------------------------------------------------
// 59. UPDATE FRIEND BUTTON ON MEMBER PROFILE
// ---------------------------------------------------------

function updateFriendButton(button, userId) {
  if (!button) return;

  button.onclick = null;

  if (!currentUser) {
    button.textContent = "Add Friend";
    button.onclick = () => requireLogin();
    return;
  }

  if (areFriends(userId)) {
    button.textContent = "Friends";
    button.onclick = () => removeFriend(userId);
    return;
  }

  if (getSentFriendRequest(userId)) {
    button.textContent = "Request Sent";
    button.onclick = () => showNotice(
      "Friend request is pending.",
      "info"
    );
    return;
  }

  const received = getReceivedFriendRequest(userId);

  if (received) {
    button.textContent = "Accept Request";
    button.onclick = () => acceptFriendRequest(received.id);
    return;
  }

  button.textContent = "Add Friend";
  button.onclick = () => sendFriendRequest(userId);
}

// ---------------------------------------------------------
// 60. OPEN MESSAGING MODULE
// ---------------------------------------------------------

function openMessageConversation(userId) {
  if (!requireLogin()) return;

  if (!userId || userId === currentUser.id) return;

  if (!window.CMAMessaging) {
    showNotice(
      "Messaging is not available yet.",
      "info"
    );
    return;
  }

  if (
    typeof window.CMAMessaging.openConversation !== "function"
  ) {
    showNotice(
      "Messaging module is not ready.",
      "error"
    );
    return;
  }

  window.CMAMessaging.openConversation(userId);
}

// =========================================================
// END OF PART 5
// NEXT: PART 6 — CREATOR PANEL + NOTIFICATIONS
// =========================================================
  
// =========================================================
// PART 6 OF 8
// CREATOR PANEL + NOTIFICATIONS
// =========================================================

// ---------------------------------------------------------
// 61. CREATOR DESTINATIONS
// ---------------------------------------------------------

const CREATOR_DESTINATIONS = [
  {
    value: "creator",
    label: "Creator Panel"
  },
  {
    value: "home",
    label: "Community Homepage"
  },
  {
    value: "study",
    label: "Study Materials"
  },
  {
    value: "exam",
    label: "Exam Preparation"
  },
  {
    value: "online",
    label: "Online Batches"
  },
  {
    value: "offline",
    label: "Offline Batches"
  }
];

// ---------------------------------------------------------
// 62. CHECK CREATOR PERMISSION
// ---------------------------------------------------------

function canPublishCommunityContent() {
  return Boolean(
    currentUser &&
    currentRole &&
    ["admin", "moderator", "developer"].includes(
      String(currentRole).toLowerCase()
    )
  );
}

// ---------------------------------------------------------
// 63. CREATOR DESTINATION SELECT
// ---------------------------------------------------------

function createCreatorDestinationSelect() {
  const select = createElement(
    "select",
    "community-creator-destination"
  );

  CREATOR_DESTINATIONS.forEach(destination => {
    const option = createElement("option");
    option.value = destination.value;
    option.textContent = destination.label;
    select.appendChild(option);
  });

  return select;
}

// ---------------------------------------------------------
// 64. CREATOR PANEL COMPOSER
// ---------------------------------------------------------

function createCreatorComposer() {
  const composer = createElement(
    "section",
    "community-creator-composer"
  );

  composer.appendChild(
    createElement(
      "h3",
      "",
      "Create Creator Update"
    )
  );

  const destination = createCreatorDestinationSelect();

  const caption = makeInput(
    "text",
    "Write your update...",
    "community-creator-caption"
  );

  caption.maxLength = 5000;

  const imagePreview = createElement(
    "div",
    "community-creator-image-preview"
  );

  const imageButton = makeButton(
    "Add Photo",
    "community-creator-image-button"
  );

  const publishButton = makeButton(
    "Publish",
    "community-creator-publish"
  );

  let selectedImage = null;

  imageButton.addEventListener("click", () => {
    chooseCommunityImage(file => {
      selectedImage = file;

      imagePreview.innerHTML = "";

      const preview = createElement("img");
      preview.src = URL.createObjectURL(file);
      preview.alt = "Selected creator image";

      imagePreview.appendChild(preview);
    }, "creator");
  });

  publishButton.addEventListener("click", async () => {
    if (!canPublishCommunityContent()) {
      showNotice(
        "You do not have permission to publish.",
        "error"
      );
      return;
    }

    const text = caption.value.trim();

    if (!text && !selectedImage) {
      showNotice(
        "Write something or add a photo first.",
        "error"
      );
      return;
    }

    publishButton.disabled = true;
    publishButton.textContent = "Publishing...";

    try {
      let imageUrl = null;

      if (selectedImage) {
        imageUrl = await uploadCommunityImage(
          selectedImage,
          "creator"
        );
      }

      const success = await publishPost({
        caption: text,
        imageUrl,
        scope: destination.value
      });

      if (success) {
        caption.value = "";
        selectedImage = null;
        imagePreview.innerHTML = "";

        showNotice(
          "Your update has been published.",
          "success"
        );
      }
    } catch (error) {
      console.error("Creator publish:", error);

      showNotice(
        "Could not publish your update.",
        "error"
      );
    } finally {
      publishButton.disabled = false;
      publishButton.textContent = "Publish";
    }
  });

  composer.append(
    destination,
    caption,
    imageButton,
    imagePreview,
    publishButton
  );

  return composer;
}

// ---------------------------------------------------------
// 65. CREATOR PANEL PAGE
// ---------------------------------------------------------

function renderCreatorPanel(container) {
  clearElement(container);

  if (!currentUser) {
    container.appendChild(
      createElement(
        "p",
        "community-empty",
        LOGIN_ERROR
      )
    );
    return;
  }

  const page = createElement(
    "section",
    "community-creator-page"
  );

  page.appendChild(
    createElement(
      "h2",
      "community-section-title",
      "Creator Panel"
    )
  );

  if (!canPublishCommunityContent()) {
    page.appendChild(
      createElement(
        "p",
        "community-empty",
        "Creator Panel is available to authorized creators only."
      )
    );

    container.appendChild(page);
    return;
  }

  page.appendChild(createCreatorComposer());

  const feed = createElement(
    "div",
    "community-creator-feed"
  );

  renderFeed(feed, "creator");

  page.appendChild(feed);
  container.appendChild(page);
}

// ---------------------------------------------------------
// 66. CREATE NOTIFICATION
// ---------------------------------------------------------

async function createCommunityNotification({
  recipientId,
  message,
  notificationType = "general",
  relatedId = null
}) {
  if (!currentUser || !recipientId) return false;

  if (recipientId === currentUser.id) return false;

  const payload = {
    recipient_id: recipientId,
    sender_id: currentUser.id,
    message,
    notification_type: notificationType,
    related_id: relatedId,
    is_read: false
  };

  const { error } = await db
    .from("community_notifications")
    .insert(payload);

  if (error) {
    console.error(
      "Notification create error:",
      error
    );

    return false;
  }

  return true;
}

// ---------------------------------------------------------
// 67. LOAD NOTIFICATIONS
// ---------------------------------------------------------

async function loadNotifications() {
  notifications = [];

  if (!db || !currentUser) return notifications;

  const { data, error } = await db
    .from("community_notifications")
    .select("*")
    .eq("recipient_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Notifications load error:",
      error
    );

    return notifications;
  }

  notifications = data || [];

  return notifications;
}

// ---------------------------------------------------------
// 68. UNREAD NOTIFICATION COUNT
// ---------------------------------------------------------

function getUnreadNotificationCount() {
  return notifications.filter(
    item => !item.is_read
  ).length;
}

// ---------------------------------------------------------
// 69. MARK ONE NOTIFICATION AS READ
// ---------------------------------------------------------

async function markNotificationRead(notificationId) {
  if (!requireLogin()) return false;

  const { error } = await db
    .from("community_notifications")
    .update({
      is_read: true
    })
    .eq("id", notificationId)
    .eq("recipient_id", currentUser.id);

  if (error) {
    console.error(
      "Notification read error:",
      error
    );

    return false;
  }

  notifications = notifications.map(item =>
    item.id === notificationId
      ? { ...item, is_read: true }
      : item
  );

  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 70. MARK ALL NOTIFICATIONS AS READ
// ---------------------------------------------------------

async function markAllNotificationsRead() {
  if (!requireLogin()) return false;

  const { error } = await db
    .from("community_notifications")
    .update({
      is_read: true
    })
    .eq("recipient_id", currentUser.id)
    .eq("is_read", false);

  if (error) {
    console.error(
      "Mark all read error:",
      error
    );

    showNotice(
      "Could not update notifications.",
      "error"
    );

    return false;
  }

  notifications = notifications.map(item => ({
    ...item,
    is_read: true
  }));

  renderCommunityPage();

  return true;
}

// ---------------------------------------------------------
// 71. NOTIFICATION ITEM
// ---------------------------------------------------------

function createNotificationItem(notification) {
  const item = createElement(
    "button",
    "community-notification-item"
  );

  if (!notification.is_read) {
    item.classList.add("unread");
  }

  const message = createElement(
    "span",
    "community-notification-message",
    notification.message || "New notification"
  );

  const time = createElement(
    "span",
    "community-notification-time",
    formatRelativeTime(notification.created_at)
  );

  item.append(message, time);

  item.addEventListener("click", async () => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }

    if (
      notification.notification_type === "friend_request" &&
      notification.sender_id
    ) {
      window.cmaOpenCommunityProfile?.(
        notification.sender_id
      );
    }

    if (
      notification.notification_type === "comment" ||
      notification.notification_type === "reaction"
    ) {
      if (notification.related_id) {
        const post = posts.find(
          item => item.id === notification.related_id
        );

        if (post) {
          openComments(post.id);
        }
      }
    }
  });

  return item;
}

// ---------------------------------------------------------
// 72. NOTIFICATIONS PAGE
// ---------------------------------------------------------

function renderNotificationsPage(container) {
  clearElement(container);

  if (!currentUser) {
    container.appendChild(
      createElement(
        "p",
        "community-empty",
        LOGIN_ERROR
      )
    );

    return;
  }

  const page = createElement(
    "section",
    "community-notifications-page"
  );

  const header = createElement(
    "div",
    "community-notifications-header"
  );

  header.appendChild(
    createElement(
      "h2",
      "community-section-title",
      "Notifications"
    )
  );

  const unread = getUnreadNotificationCount();

  if (unread > 0) {
    header.appendChild(
      makeButton(
        "Mark all as read",
        "community-mark-all-read",
        markAllNotificationsRead
      )
    );
  }

  page.appendChild(header);

  if (!notifications.length) {
    page.appendChild(
      createElement(
        "p",
        "community-empty",
        "You have no notifications yet."
      )
    );
  } else {
    const list = createElement(
      "div",
      "community-notification-list"
    );

    notifications.forEach(notification => {
      list.appendChild(
        createNotificationItem(notification)
      );
    });

    page.appendChild(list);
  }

  container.appendChild(page);
}

// =========================================================
// END OF PART 6
// NEXT: PART 7 — SEARCH PAGE + PROFILE SEARCH
// =========================================================
    

// =========================================================
// PART 7 OF 8
// FINAL COMMUNITY SEARCH SYSTEM
// =========================================================

// ---------------------------------------------------------
// 73. SEARCH SETTINGS
// ---------------------------------------------------------

const COMMUNITY_RECENT_SEARCH_KEY =
  "cma_community_recent_searches";

const COMMUNITY_MAX_RECENT_SEARCHES = 8;

// ---------------------------------------------------------
// 74. GET RECENT SEARCHES
// ---------------------------------------------------------

function getRecentCommunitySearches() {
  try {
    const saved = localStorage.getItem(
      COMMUNITY_RECENT_SEARCH_KEY
    );

    const parsed = saved
      ? JSON.parse(saved)
      : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error("Recent search error:", error);
    return [];
  }
}

// ---------------------------------------------------------
// 75. SAVE RECENT SEARCH
// ---------------------------------------------------------

function saveRecentCommunitySearch(query) {
  const value = String(query || "").trim();

  if (!value) return;

  let recent = getRecentCommunitySearches();

  recent = recent.filter(
    item =>
      item.toLowerCase() !== value.toLowerCase()
  );

  recent.unshift(value);

  recent = recent.slice(
    0,
    COMMUNITY_MAX_RECENT_SEARCHES
  );

  try {
    localStorage.setItem(
      COMMUNITY_RECENT_SEARCH_KEY,
      JSON.stringify(recent)
    );
  } catch (error) {
    console.error("Save search error:", error);
  }
}

// ---------------------------------------------------------
// 76. CLEAR RECENT SEARCHES
// ---------------------------------------------------------

function clearRecentCommunitySearches() {
  try {
    localStorage.removeItem(
      COMMUNITY_RECENT_SEARCH_KEY
    );
  } catch (error) {
    console.error("Clear search error:", error);
  }
}

// ---------------------------------------------------------
// 77. REMOVE ONE RECENT SEARCH
// ---------------------------------------------------------

function removeRecentCommunitySearch(query) {
  const updated = getRecentCommunitySearches().filter(
    item => item !== query
  );

  try {
    localStorage.setItem(
      COMMUNITY_RECENT_SEARCH_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error("Remove recent search:", error);
  }
}

// ---------------------------------------------------------
// 78. SEARCH PROFILES
// ---------------------------------------------------------

async function searchCommunityProfiles(query) {
  const value = String(query || "")
    .trim()
    .toLowerCase();

  if (!value) return [];

  await loadPublicProfiles();

  return profiles.filter(profile => {
    const name = String(
      profile.display_name || ""
    ).toLowerCase();

    const memberId = String(
      profile.member_id || ""
    ).toLowerCase();

    return (
      name.includes(value) ||
      memberId.includes(value)
    );
  });
}

// ---------------------------------------------------------
// 79. SEARCH POSTS
// ---------------------------------------------------------

async function searchCommunityPosts(query) {
  const value = String(query || "")
    .trim()
    .toLowerCase();

  if (!value) return [];

  await loadPosts();

  return posts
    .filter(post => {
      const content = String(
        post.content || ""
      ).toLowerCase();

      return content.includes(value);
    })
    .sort((a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
    );
}

// ---------------------------------------------------------
// 80. PROFILE SEARCH RESULT
// ---------------------------------------------------------

function createSearchProfileItem(profile) {
  const item = createElement(
    "button",
    "community-search-profile-item"
  );

  const identity = createElement(
    "div",
    "community-search-profile-identity"
  );

  const details = createElement(
    "div",
    "community-search-profile-details"
  );

  identity.appendChild(
    createAuthorAvatar(profile, "small")
  );

  details.appendChild(
    createElement(
      "strong",
      "",
      profile.display_name || "Member"
    )
  );

  if (profile.member_id) {
    details.appendChild(
      createElement(
        "span",
        "community-search-member-id",
        `Member ID: ${profile.member_id}`
      )
    );
  }

  if (profile.short_description) {
    details.appendChild(
      createElement(
        "span",
        "community-search-profile-description",
        profile.short_description
      )
    );
  }

  identity.appendChild(details);
  item.appendChild(identity);

  item.addEventListener("click", () => {
    window.cmaOpenCommunityProfile?.(
      profile.user_id
    );
  });

  return item;
}

// ---------------------------------------------------------
// 81. SEARCH TABS
// ---------------------------------------------------------

function createCommunitySearchTabs(
  activeTab,
  onChange
) {
  const tabs = createElement(
    "div",
    "community-search-tabs"
  );

  const tabDefinitions = [
    {
      id: "profiles",
      label: "♙ Profiles"
    },
    {
      id: "posts",
      label: "▤ Posts"
    }
  ];

  tabDefinitions.forEach(definition => {
    const button = makeButton(
      definition.label,
      "community-search-tab"
    );

    if (activeTab === definition.id) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      onChange(definition.id);
    });

    tabs.appendChild(button);
  });

  return tabs;
}

// ---------------------------------------------------------
// 82. RENDER SEARCH RESULTS
// ---------------------------------------------------------

async function renderCommunitySearchResults(
  container,
  query,
  tab
) {
  clearElement(container);

  if (!query) return;

  const loading = createElement(
    "p",
    "community-search-loading",
    "Searching..."
  );

  container.appendChild(loading);

  if (tab === "profiles") {
    const results =
      await searchCommunityProfiles(query);

    clearElement(container);

    if (!results.length) {
      container.appendChild(
        createElement(
          "p",
          "community-empty",
          "No profiles found."
        )
      );

      return;
    }

    results.forEach(profile => {
      container.appendChild(
        createSearchProfileItem(profile)
      );
    });

    return;
  }

  if (tab === "posts") {
    const results =
      await searchCommunityPosts(query);

    clearElement(container);

    if (!results.length) {
      container.appendChild(
        createElement(
          "p",
          "community-empty",
          "No posts found."
        )
      );

      return;
    }

    results.forEach(post => {
      container.appendChild(
        renderPostCard(post)
      );
    });
  }
}

// ---------------------------------------------------------
// 83. RECENT SEARCHES UI
// ---------------------------------------------------------

function renderRecentCommunitySearches(
  container,
  onSelect
) {
  clearElement(container);

  const recent = getRecentCommunitySearches();

  if (!recent.length) return;

  const header = createElement(
    "div",
    "community-search-recent-header"
  );

  header.appendChild(
    createElement(
      "h3",
      "",
      "Recent Searches"
    )
  );

  const clearButton = makeButton(
    "Clear All",
    "community-search-clear",
    () => {
      clearRecentCommunitySearches();

      renderRecentCommunitySearches(
        container,
        onSelect
      );
    }
  );

  header.appendChild(clearButton);
  container.appendChild(header);

  recent.forEach(value => {
    const row = createElement(
      "div",
      "community-search-recent-item"
    );

    const selectButton = makeButton(
      "",
      "community-search-recent-query",
      () => onSelect(value)
    );

    selectButton.append(
      createElement("span", "", "◷"),
      createElement("span", "", value)
    );

    const removeButton = makeButton(
      "×",
      "community-search-recent-remove",
      () => {
        removeRecentCommunitySearch(value);

        renderRecentCommunitySearches(
          container,
          onSelect
        );
      }
    );

    row.append(
      selectButton,
      removeButton
    );

    container.appendChild(row);
  });
}

// ---------------------------------------------------------
// 84. FULL SCREEN SEARCH PAGE
// ---------------------------------------------------------

function renderSearchPage(
  container,
  initialQuery = ""
) {
  clearElement(container);

  const page = createElement(
    "section",
    "community-search-page"
  );

  const header = createElement(
    "header",
    "community-search-header"
  );

  const backButton = makeButton(
    "←",
    "community-search-back"
  );

  backButton.setAttribute(
    "aria-label",
    "Go back"
  );

  backButton.addEventListener("click", () => {
    state.section = state.previousPage || "home";

    renderCommunityPage();
  });

  const searchInput = makeInput(
    "search",
    "Search profiles or posts...",
    "community-search-input"
  );

  searchInput.value = initialQuery;

  header.append(
    backButton,
    searchInput
  );

  const recentArea = createElement(
    "div",
    "community-search-recent-area"
  );

  const tabsArea = createElement(
    "div",
    "community-search-tabs-area"
  );

  const resultArea = createElement(
    "div",
    "community-search-result-area"
  );

  page.append(
    header,
    recentArea,
    tabsArea,
    resultArea
  );

  container.appendChild(page);

  let activeTab = "profiles";
  let currentQuery = "";
  let searchVersion = 0;

  // Draw tabs and handle tab switching.
  function showTabs() {
    clearElement(tabsArea);

    tabsArea.appendChild(
      createCommunitySearchTabs(
        activeTab,
        async selectedTab => {
          activeTab = selectedTab;

          showTabs();

          await runSearchResults();
        }
      )
    );
  }

  // Render currently selected tab.
  async function runSearchResults() {
    const version = ++searchVersion;

    clearElement(resultArea);

    const loading = createElement(
      "p",
      "community-search-loading",
      "Searching..."
    );

    resultArea.appendChild(loading);

    let results = [];

    if (activeTab === "profiles") {
      results = await searchCommunityProfiles(
        currentQuery
      );
    } else {
      results = await searchCommunityPosts(
        currentQuery
      );
    }

    // Ignore older results if the query or tab changed.
    if (version !== searchVersion) return;

    clearElement(resultArea);

    if (!results.length) {
      resultArea.appendChild(
        createElement(
          "p",
          "community-empty",
          activeTab === "profiles"
            ? "No profiles found."
            : "No posts found."
        )
      );

      return;
    }

    if (activeTab === "profiles") {
      results.forEach(profile => {
        resultArea.appendChild(
          createSearchProfileItem(profile)
        );
      });
    } else {
      results.forEach(post => {
        resultArea.appendChild(
          renderPostCard(post)
        );
      });
    }
  }

  // Start a new search.
  async function performSearch(value) {
    const query = String(value || "").trim();

    if (!query) {
      currentQuery = "";
      searchVersion++;

      clearElement(tabsArea);
      clearElement(resultArea);

      renderRecentCommunitySearches(
        recentArea,
        performSearch
      );

      return;
    }

    currentQuery = query;
    activeTab = "profiles";

    saveRecentCommunitySearch(query);

    renderRecentCommunitySearches(
      recentArea,
      performSearch
    );

    showTabs();

    await runSearchResults();
  }

  // Search when Enter is pressed.
  searchInput.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        performSearch(searchInput.value);
      }
    }
  );

  // Hide results when input is cleared.
  searchInput.addEventListener(
    "input",
    () => {
      if (!searchInput.value.trim()) {
        performSearch("");
      }
    }
  );

  // Show recent searches before searching.
  renderRecentCommunitySearches(
    recentArea,
    value => {
      searchInput.value = value;
      performSearch(value);
    }
  );

  if (initialQuery.trim()) {
    performSearch(initialQuery);
  }
}

// ---------------------------------------------------------
// 85. OPEN COMMUNITY SEARCH
// ---------------------------------------------------------

function openCommunitySearch() {
  state.previousPage =
    state.section || "home";

  state.section = "search";

  renderCommunityPage();
}

// =========================================================
// END OF PART 7
// NEXT: PART 8 — MAIN PAGE + NAVIGATION + INTEGRATION
// =========================================================
  
/* =========================================================
   PART 8/8 — MAIN RENDERER, NAVIGATION, EDIT PROFILE, CSS
   ========================================================= */

/* ---------- 86. COMMUNITY PAGE HELPERS ---------- */

function communityButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className || "cma-btn";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function communityHeading(text) {
  const heading = document.createElement("h2");
  heading.className = "cma-page-heading";
  heading.textContent = text;
  return heading;
}

function communityEmpty(text) {
  const element = document.createElement("div");
  element.className = "cma-empty";
  element.textContent = text;
  return element;
}

function setCommunitySection(section) {
  state.section = section;
  renderCommunityPage();
}

/* ---------- 87. FEED SCOPE SUPPORT ---------- */

/* Supports both the Homepage feed and Creator Panel feed. */
renderFeed = function (container, scope) {
  clearElement(container);

  let feedPosts = getCommunityPosts(scope);

  if (scope === "creator") {
    feedPosts = feedPosts.filter(function (post) {
      const author = getProfile(post.user_id);
      return author && (
        author.role === "admin" ||
        author.role === "moderator" ||
        author.role === "developer"
      );
    });
  }

  if (!feedPosts.length) {
    container.appendChild(
      communityEmpty(
        scope === "creator"
          ? "No creator updates yet."
          : "No posts yet. Be the first to share something!"
      )
    );
    return;
  }

  feedPosts.forEach(function (post) {
    container.appendChild(renderPostCard(post));
  });
};

/* ---------- 88. OTHER MEMBER PROFILE PAGE ---------- */

renderUserProfile = async function (container, userId, backCallback) {
  clearElement(container);

  const backButton = communityButton("← Back", "cma-back-button", function () {
    if (typeof backCallback === "function") {
      backCallback();
    } else {
      setCommunitySection("home");
    }
  });

  container.appendChild(backButton);

  let profile = getProfile(userId);

  if (!profile) {
    const { data, error } = await db
      .from("community_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      container.appendChild(communityEmpty("Member profile could not be found."));
      return;
    }

    profile = data;
  }

  const profileArea = document.createElement("div");
  profileArea.className = "cma-profile-page";

  renderProfileHeader(profile, false).forEach(function (element) {
    profileArea.appendChild(element);
  });

  /*
   * Other members' phone numbers and home addresses are not
   * displayed publicly. Public profile information stays limited
   * to profile details intended for community browsing.
   */
  const info = document.createElement("section");
  info.className = "cma-profile-info";

  info.appendChild(communityHeading(profile.display_name || "Member"));

  if (profile.member_id) {
    const memberId = document.createElement("p");
    memberId.className = "cma-member-id";
    memberId.textContent = "Member ID: " + profile.member_id;
    info.appendChild(memberId);
  }

  if (profile.short_description) {
    const description = document.createElement("p");
    description.className = "cma-profile-description";
    description.textContent = profile.short_description;
    info.appendChild(description);
  }

  if (profile.school) {
    const institution = document.createElement("p");
    institution.className = "cma-profile-public-info";
    institution.textContent = "Institution: " + profile.school;
    info.appendChild(institution);
  }

  const actions = document.createElement("div");
  actions.className = "cma-profile-actions";

  const friendButton = communityButton(
    "Add Friend",
    "cma-btn cma-btn-primary",
    function () {
      updateFriendButton(friendButton, userId);
    }
  );

  const messageButton = communityButton(
    "Message",
    "cma-btn cma-btn-outline",
    function () {
      openMessageConversation(userId);
    }
  );

  actions.appendChild(friendButton);
  actions.appendChild(messageButton);
  info.appendChild(actions);

  profileArea.appendChild(info);

  updateFriendButton(friendButton, userId);

  const tabs = createProfileTabs(userId);
  profileArea.appendChild(tabs);

  const tabContent = document.createElement("div");
  tabContent.className = "cma-profile-tab-content";
  profileArea.appendChild(tabContent);

  container.appendChild(profileArea);

  renderProfileTab(tabContent, userId, activeProfileTab || "posts");
};

/* ---------- 89. EDIT PERSONAL INFORMATION PAGE ---------- */

function renderEditProfilePage() {
  state.section = "edit-profile";

  const root = getCommunityRoot();
  clearElement(root);

  const page = document.createElement("section");
  page.className = "cma-edit-page";

  const top = document.createElement("div");
  top.className = "cma-edit-top";

  top.appendChild(
    communityButton("←", "cma-back-icon", function () {
      state.section = "profile";
      renderCommunityPage();
    })
  );

  const title = document.createElement("h2");
  title.textContent = "Edit Personal Information";
  top.appendChild(title);

  page.appendChild(top);

  const form = document.createElement("form");
  form.className = "cma-edit-form";

  function addField(labelText, name, value, placeholder, multiline) {
    const wrapper = document.createElement("label");
    wrapper.className = "cma-form-field";

    const label = document.createElement("span");
    label.textContent = labelText;
    wrapper.appendChild(label);

    let field;

    if (multiline) {
      field = document.createElement("textarea");
      field.rows = 3;
    } else {
      field = document.createElement("input");
      field.type = name === "phone" ? "tel" : "text";
    }

    field.name = name;
    field.value = value || "";
    field.placeholder = placeholder || "";
    field.autocomplete = "off";

    wrapper.appendChild(field);
    form.appendChild(wrapper);

    return field;
  }

  const fullName = addField(
    "Full Name",
    "full_name",
    currentProfile?.display_name || "",
    "Enter your full name"
  );

  const shortDescription = addField(
    "Short Description",
    "short_description",
    currentProfile?.short_description || "",
    "Write a short introduction",
    true
  );

  const institution = addField(
    "Institution",
    "school",
    currentProfile?.school || "",
    "Enter your institution"
  );

  const mobile = addField(
    "Mobile Number",
    "phone",
    currentPrivate?.phone || "",
    "Your mobile number"
  );

  const address = addField(
    "Address",
    "address",
    currentPrivate?.address || "",
    "Your address",
    true
  );

  const privacyNote = document.createElement("p");
  privacyNote.className = "cma-private-note";
  privacyNote.textContent =
    "Your mobile number and address are private account information. They are not shown on your public profile.";
  form.appendChild(privacyNote);

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "cma-btn cma-btn-primary cma-save-button";
  saveButton.textContent = "Save Changes";
  form.appendChild(saveButton);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!requireLogin()) return;

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
      const profileResult = await saveProfile({
        display_name: fullName.value.trim(),
        short_description: shortDescription.value.trim(),
        school: institution.value.trim()
      });

      const privateResult = await savePrivateProfile({
        phone: mobile.value.trim(),
        address: address.value.trim()
      });

      if (profileResult === false || privateResult === false) {
        throw new Error("Could not save your information.");
      }

      await loadMyProfile();

      showNotice("Personal information saved successfully.");
      state.section = "profile";
      renderCommunityPage();
    } catch (error) {
      console.error("Community profile save error:", error);
      showNotice(error.message || "Could not save your information.");
      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
    }
  });

  page.appendChild(form);
  root.appendChild(page);
}

/* ---------- 90. COMMUNITY HEADER ---------- */

function createCommunityHeader() {
  const header = document.createElement("header");
  header.className = "cma-community-header";

  const title = document.createElement("div");
  title.className = "cma-header-title";

  const whiteText = document.createElement("span");
  whiteText.textContent = "Change Maker ";

  const greenText = document.createElement("span");
  greenText.textContent = "Community";
  greenText.className = "cma-green-text";

  title.appendChild(whiteText);
  title.appendChild(greenText);

  const searchButton = communityButton(
    "⌕",
    "cma-header-search",
    function () {
      openCommunitySearch();
    }
  );

  searchButton.setAttribute("aria-label", "Search Community");

  header.appendChild(title);
  header.appendChild(searchButton);

  return header;
}

/* ---------- 91. COMMUNITY BOTTOM NAVIGATION ---------- */

function createCommunityBottomNav() {
  const nav = document.createElement("nav");
  nav.className = "cma-bottom-nav";

  const items = [
    { id: "home", icon: "⌂", label: "Home" },
    { id: "profile", icon: "●", label: "Profile" },
    { id: "friends", icon: "♧", label: "Friends" },
    { id: "creator", icon: "✦", label: "Creator Panel" },
    { id: "notifications", icon: "♧", label: "Notification" }
  ];

  items.forEach(function (item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "cma-nav-item" +
      (state.section === item.id ? " active" : "");

    const icon = document.createElement("span");
    icon.className = "cma-nav-icon";
    icon.textContent = item.icon;

    const label = document.createElement("span");
    label.className = "cma-nav-label";
    label.textContent = item.label;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener("click", function () {
      setCommunitySection(item.id);
    });

    if (item.id === "notifications") {
      const count = getUnreadNotificationCount();

      if (count > 0) {
        const badge = document.createElement("span");
        badge.className = "cma-notification-badge";
        badge.textContent = count > 9 ? "9+" : String(count);
        button.appendChild(badge);
      }
    }

    nav.appendChild(button);
  });

  return nav;
}

/* ---------- 92. HOMEPAGE ---------- */

function renderCommunityHome(container) {
  container.appendChild(communityHeading("Community"));

  const composer = createComposer();

  if (composer) {
    container.appendChild(composer);
  }

  const feed = document.createElement("div");
  feed.className = "cma-community-feed";
  container.appendChild(feed);

  renderFeed(feed);
}

/* ---------- 93. MAIN COMMUNITY PAGE RENDERER ---------- */

async function renderCommunityPage() {
  const root = getCommunityRoot();

  if (!root) {
    console.error("Community root element was not found.");
    return;
  }

  clearElement(root);

  if (!communityInitialized) {
    communityInitialized = true;

    try {
      await refreshCommunityData();
      await loadFriendRequests();
      await loadFriendships();
      await loadNotifications();
    } catch (error) {
      console.error("Community initialization error:", error);
    }
  }

  if (state.section === "search") {
    renderSearchPage(
      root,
      currentSearchQuery || ""
    );
    return;
  }

  if (state.section === "edit-profile") {
    renderEditProfilePage();
    return;
  }

  root.appendChild(createCommunityHeader());

  const main = document.createElement("main");
  main.className = "cma-community-main";
  root.appendChild(main);

  if (state.section === "home") {
    renderCommunityHome(main);
  } else if (state.section === "profile") {
    if (!currentUser) {
      main.appendChild(communityEmpty("Please sign in to view your profile."));
    } else {
      renderMe(main);
    }
  } else if (state.section === "member-profile") {
    if (activeProfileId) {
      await renderUserProfile(
        main,
        activeProfileId,
        function () {
          state.section = "home";
          activeProfileId = null;
          renderCommunityPage();
        }
      );
    }
  } else if (state.section === "friends") {
    await renderFriendsPage(main);
  } else if (state.section === "creator") {
    await renderCreatorPanel(main);
  } else if (state.section === "notifications") {
    await renderNotificationsPage(main);
  } else {
    state.section = "home";
    renderCommunityHome(main);
  }

  root.appendChild(createCommunityBottomNav());
}

/* ---------- 94. GLOBAL PROFILE NAVIGATION ---------- */

window.cmaOpenCommunityProfile = function (userId) {
  if (!userId) return;

  if (currentUser && userId === currentUser.id) {
    state.section = "profile";
    activeProfileId = null;
  } else {
    state.section = "member-profile";
    activeProfileId = userId;
  }

  renderCommunityPage();
};

/* ---------- 95. SEARCH NAVIGATION ---------- */

window.cmaOpenCommunitySearch = function () {
  openCommunitySearch();
};

/* ---------- 96. COMMUNITY CSS ---------- */

(function addCommunityStyles() {
  if (document.getElementById("cma-community-styles")) return;

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
    --cma-white: #ffffff;
    --cma-muted: #A8C0CE;
  }

  #communityPage,
  #communityRoot,
  .cma-community-root {
    background: var(--cma-bg);
    color: var(--cma-white);
    font-family: "Nunito Sans", Arial, sans-serif;
    min-height: 100vh;
  }

  .cma-community-header {
    width: 100%;
    min-height: 58px;
    padding: 12px 16px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--cma-deep);
    border-bottom: 1px solid var(--cma-border);
  }

  .cma-header-title {
    font-size: 19px;
    font-weight: 800;
    white-space: nowrap;
  }

  .cma-green-text {
    color: var(--cma-green);
  }

  .cma-header-search,
  .cma-back-icon {
    border: 0;
    background: transparent;
    color: var(--cma-white);
    font-size: 27px;
    cursor: pointer;
    min-width: 38px;
    min-height: 38px;
  }

  .cma-community-main {
    width: 100%;
    max-width: 760px;
    box-sizing: border-box;
    padding: 14px 12px 100px;
    margin: 0 auto;
  }

  .cma-page-heading {
    color: var(--cma-white);
    font-size: 19px;
    font-weight: 800;
    margin: 10px 0 14px;
  }

  .cma-bottom-nav {
    position: fixed;
    z-index: 100;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    min-height: 66px;
    padding: 6px 2px calc(6px + env(safe-area-inset-bottom));
    background: var(--cma-deep);
    border-top: 1px solid var(--cma-border);
  }

  .cma-nav-item {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 1px;
    border: 0;
    background: transparent;
    color: var(--cma-muted);
    font: inherit;
    cursor: pointer;
  }

  .cma-nav-item.active {
    color: var(--cma-green);
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

  .cma-notification-badge {
    position: absolute;
    top: 0;
    right: 16%;
    min-width: 15px;
    padding: 1px 4px;
    border-radius: 12px;
    background: var(--cma-green);
    color: var(--cma-deep);
    font-size: 9px;
    font-weight: 800;
  }

  .cma-btn {
    border: 1px solid var(--cma-border);
    border-radius: 12px;
    padding: 10px 14px;
    background: var(--cma-panel);
    color: var(--cma-white);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .cma-btn-primary {
    background: var(--cma-green);
    border-color: var(--cma-green);
    color: var(--cma-deep);
  }

  .cma-btn-outline {
    background: transparent;
    border-color: var(--cma-green);
    color: var(--cma-green);
  }

  .cma-back-button {
    margin: 4px 0 12px;
    background: transparent;
    border: 0;
    color: var(--cma-green);
    font: inherit;
    font-weight: 700;
  }

  .cma-empty {
    padding: 22px 14px;
    margin: 12px 0;
    border: 1px solid var(--cma-border);
    border-radius: 14px;
    background: var(--cma-card);
    color: var(--cma-muted);
    text-align: center;
    font-size: 14px;
  }

  .cma-profile-page {
    width: 100%;
  }

  .cma-profile-info,
  .cma-edit-page {
    background: var(--cma-card);
    border: 1px solid var(--cma-border);
    border-radius: 16px;
    padding: 14px;
    margin: 12px 0;
  }

  .cma-member-id,
  .cma-profile-description,
  .cma-profile-public-info {
    color: var(--cma-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .cma-profile-actions {
    display: flex;
    gap: 9px;
    margin-top: 14px;
  }

  .cma-profile-actions button {
    flex: 1;
  }

  .cma-profile-tab-content {
    margin-top: 12px;
  }

  .cma-edit-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }

  .cma-edit-top h2 {
    margin: 0;
    font-size: 18px;
  }

  .cma-edit-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cma-form-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    color: var(--cma-white);
    font-size: 13px;
    font-weight: 700;
  }

  .cma-form-field input,
  .cma-form-field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid var(--cma-border);
    border-radius: 11px;
    outline: none;
    background: var(--cma-deep);
    color: var(--cma-white);
    font: inherit;
    font-weight: 400;
  }

  .cma-form-field input:focus,
  .cma-form-field textarea:focus {
    border-color: var(--cma-green);
  }

  .cma-private-note {
    margin: 0;
    color: var(--cma-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .cma-save-button {
    width: 100%;
    min-height: 46px;
    margin-top: 5px;
  }

  .cma-save-button:disabled {
    opacity: .6;
    cursor: wait;
  }

  .cma-community-feed {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cma-post-card {
    padding: 12px;
    border: 1px solid var(--cma-border);
    border-radius: 15px;
    background: var(--cma-card);
    overflow: hidden;
  }

  .cma-post-author {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .cma-post-caption {
    color: var(--cma-white);
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .cma-post-image {
    display: block;
    width: 100%;
    max-height: 430px;
    object-fit: cover;
    border-radius: 12px;
    margin-top: 9px;
  }

  .cma-reaction-bar {
    display: flex;
    gap: 8px;
    margin: 10px 0;
  }

  .cma-reaction-button {
    width: 29px;
    height: 29px;
    border: 0;
    border-radius: 50%;
    background: rgba(5,45,59,.8);
    color: white;
    cursor: pointer;
  }

  .cma-reaction-button.active {
    outline: 2px solid var(--cma-green);
    background: var(--cma-panel);
  }

  .cma-comment-preview {
    padding: 9px;
    border: 1px solid var(--cma-border);
   
    border-radius: 10px;
    background: rgba(5,45,59,.55);
    font-size: 12px;
  }

  .cma-write-comment {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 10px;
  }

  .cma-write-comment input {
    flex: 1;
    min-width: 0;
    padding: 10px;
    border: 1px solid var(--cma-border);
    border-radius: 20px;
    background: var(--cma-deep);
    color: white;
  }

  .cma-write-comment button {
    border: 0;
    background: transparent;
    color: var(--cma-green);
    font-size: 20px;
  }

  .cma-edit-page textarea {
    resize: vertical;
  }

  @media (min-width: 700px) {
    .cma-community-main {
      padding-left: 20px;
      padding-right: 20px;
    }

    .cma-bottom-nav {
      left: 50%;
      right: auto;
      width: min(760px, 100%);
      transform: translateX(-50%);
      border-left: 1px solid var(--cma-border);
      border-right: 1px solid var(--cma-border);
    }
  }
  `;

  document.head.appendChild(style);
})();

/* ---------- 97. EXPORT FOR router.js ---------- */

window.renderCommunityPage = renderCommunityPage;

/* First render is triggered by router.js when ?page=community */
if (window.location.search.includes("page=community")) {
  renderCommunityPage();
}

/* ================= END OF PART 8 ================= */
 
