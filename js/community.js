(function () {
  "use strict";

  const db = window.cmaSupabase;
  const BUCKET = "community-media";

  let currentUser = null;
  let currentProfile = null;
  let currentPrivate = null;
  let currentRole = null;

  let posts = [];
  let reactions = [];
  let comments = [];
  let profiles = [];

  let selectedAvatar = null;
  let selectedCover = null;
  let activePost = null;
  let currentFeedSearchQuery = "";

  const EMOJIS = ["👍", "❤️", "😂", "😮"];

  const LOGIN_ERROR =
    "Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = text;
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

  function showNotice(message, type = "info") {
    let notice = $("#communityNotice");

    if (!notice) {
      notice = createElement("div", "community-notice");
      notice.id = "communityNotice";
      document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.dataset.type = type;
    notice.classList.add("show");

    clearTimeout(notice._timer);

    notice._timer = setTimeout(() => {
      notice.classList.remove("show");
    }, 3000);
  }

  function dateText(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function initial(name = "") {
    return String(name).trim().charAt(0).toUpperCase() || "U";
  }

  function currentName() {
    return (
      currentProfile?.display_name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "User"
    );
  }

  function isCreator() {
    return ["admin", "moderator", "developer"].includes(
      String(currentRole || "").toLowerCase()
    );
  }

  function requireLogin() {
    if (currentUser) return true;

    showNotice(LOGIN_ERROR, "error");
    return false;
  }

  function safeImage(url) {
    if (!url) return "";

    try {
      const parsed = new URL(url, window.location.origin);

      if (
        parsed.protocol !== "https:" &&
        parsed.protocol !== "http:"
      ) {
        return "";
      }

      return parsed.href;
    } catch {
      return "";
    }
  }

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

  async function loadSession() {
    if (!db) {
      console.error("Supabase client not found: window.cmaSupabase");
      return null;
    }

    const { data, error } = await db.auth.getSession();

    if (error) {
      console.error("Session load error:", error);
      currentUser = null;
      return null;
    }

    currentUser = data.session?.user || null;
    return currentUser;
  }

  async function loadMyProfile() {
    currentProfile = null;
    currentPrivate = null;

    if (!currentUser) return;

    const { data, error } = await db
      .from("community_profiles")
      .select(
        "user_id, display_name, short_description, school, avatar_url, cover_url"
      )
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
    } else {
      currentProfile = data || null;
    }

    // Private profile is loaded only for the signed-in user's own account.
    const { data: privateData, error: privateError } = await db
      .from("community_private_profiles")
      .select("user_id, phone, address")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (privateError) {
      console.error("Private profile load error:", privateError);
    } else {
      currentPrivate = privateData || null;
    }
  }

  async function loadMyRole() {
    currentRole = null;

    if (!currentUser) return;

    const { data, error } = await db
      .from("community_creator_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Role load error:", error);
      return;
    }

    currentRole = data?.role || null;
  }

  async function loadPosts() {
    const { data, error } = await db
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Posts load error:", error);
      posts = [];
      return;
    }

    posts = data || [];
  }

  async function loadReactions() {
    reactions = [];

    if (!currentUser) return;

    const { data, error } = await db
      .from("community_reactions")
      .select("*")
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Reactions load error:", error);
      return;
    }

    reactions = data || [];
  }

  async function loadComments() {
    const { data, error } = await db
      .from("community_comments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments load error:", error);
      comments = [];
      return;
    }

    comments = data || [];
  }

  async function loadPublicProfiles() {
    const authorIds = [
      ...new Set(
        posts
          .map(post => post.user_id)
          .filter(Boolean)
      )
    ];

    if (currentUser?.id) {
      authorIds.push(currentUser.id);
    }

    const uniqueIds = [...new Set(authorIds)];

    if (!uniqueIds.length) {
      profiles = [];
      return;
    }

    const { data, error } = await db
      .from("community_profiles")
      .select("user_id, display_name, short_description, avatar_url, cover_url")
      .in("user_id", uniqueIds);

    if (error) {
      console.error("Public profiles load error:", error);
      profiles = [];
      return;
    }

    profiles = data || [];
  }

  async function refreshData() {
    await loadSession();

    await Promise.all([
      loadPosts(),
      loadComments()
    ]);

    await Promise.all([
      loadMyProfile(),
      loadMyRole(),
      loadReactions(),
      loadPublicProfiles()
    ]);
  }

  function getProfile(userId) {
    if (currentUser?.id === userId && currentProfile) {
      return currentProfile;
    }

    return profiles.find(profile => profile.user_id === userId) || null;
  }

  function getReaction(postId) {
    return reactions.find(reaction => reaction.post_id === postId) || null;
  }

  function getPostComments(postId) {
    return comments.filter(comment => comment.post_id === postId);
  }

  async function uploadCommunityImage(file, folder = "posts") {
    if (!requireLogin()) return null;

    if (!file) return null;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotice("Only JPG, PNG and WEBP images are allowed.", "error");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice("Image size must be 5MB or less.", "error");
      return null;
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const filePath =
      `${currentUser.id}/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error("Image upload error:", error);
      showNotice("Image upload failed. Please try again.", "error");
      return null;
    }

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  }

  async function saveProfile(profileData, privateData = {}) {
    if (!requireLogin()) return false;

    const publicPayload = {
      user_id: currentUser.id,
      display_name: profileData.display_name || "",
      short_description: profileData.short_description || "",
      school: profileData.school || "",
      avatar_url: profileData.avatar_url || null,
      cover_url: profileData.cover_url || null,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await db
      .from("community_profiles")
      .upsert(publicPayload, {
        onConflict: "user_id"
      });

    if (profileError) {
      console.error("Profile save error:", profileError);
      showNotice("Could not save profile information.", "error");
      return false;
    }

    const privatePayload = {
      user_id: currentUser.id,
      phone: privateData.phone || "",
      address: privateData.address || "",
      updated_at: new Date().toISOString()
    };

    const { error: privateError } = await db
      .from("community_private_profiles")
      .upsert(privatePayload, {
        onConflict: "user_id"
      });

    if (privateError) {
      console.error("Private profile save error:", privateError);
      showNotice("Public profile saved, but private information could not be saved.", "error");
      return false;
    }

    await loadMyProfile();

    showNotice("Profile updated successfully.", "success");
    return true;
  }

  async function publishPost(content, imageUrl = null, postScope = "community_home") {
    if (!requireLogin()) return false;

    if (postScope !== "community_home" && !isCreator()) {
      showNotice("You do not have permission to publish here.", "error");
      return false;
    }

    const text = String(content || "").trim();

    if (!text && !imageUrl) {
      showNotice("Write something or add a photo first.", "error");
      return false;
    }

    const { error } = await db
      .from("community_posts")
      .insert({
        user_id: currentUser.id,
        content: text,
        image_url: imageUrl || null,
        post_scope: postScope
      });

    if (error) {
      console.error("Post publish error:", error);
      showNotice("Could not publish your post.", "error");
      return false;
    }

    await refreshData();
    showNotice("Post published successfully.", "success");
    return true;
  }

  async function toggleReaction(postId, emoji) {
    if (!requireLogin()) return false;

    if (!EMOJIS.includes(emoji)) return false;

    const existing = reactions.find(
      reaction => reaction.post_id === postId
    );

    if (existing?.emoji === emoji) {
      const { error } = await db
        .from("community_reactions")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Reaction remove error:", error);
        showNotice("Could not remove reaction.", "error");
        return false;
      }
    } else if (existing) {
      const { error } = await db
        .from("community_reactions")
        .update({ emoji })
        .eq("id", existing.id)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Reaction update error:", error);
        showNotice("Could not update reaction.", "error");
        return false;
      }
    } else {
      const { error } = await db
        .from("community_reactions")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          emoji
        });

      if (error) {
        console.error("Reaction insert error:", error);
        showNotice("Could not add reaction.", "error");
        return false;
      }
    }

    await loadReactions();
    return true;
  }

  async function addComment(postId, content) {
    if (!requireLogin()) return false;

    const text = String(content || "").trim();

    if (!text) {
      showNotice("Write a comment first.", "error");
      return false;
    }

    if (text.length > 500) {
      showNotice("Comment must be 500 characters or less.", "error");
      return false;
    }

    const { error } = await db
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text
      });

    if (error) {
      console.error("Comment insert error:", error);
      showNotice("Could not add your comment.", "error");
      return false;
    }

    await loadComments();
    return true;
       }
    function addProfileField(container, label, value, name, type = "text") {
    const wrapper = createElement("label", "community-profile-field");

    const title = createElement(
      "span",
      "community-profile-field-label",
      label
    );

    const input = createElement("input", "community-profile-input");
    input.type = type;
    input.name = name;
    input.value = value || "";
    input.placeholder = label;

    wrapper.append(title, input);
    container.appendChild(wrapper);

    return input;
  }

  function addImageField(container, label, currentUrl, folder) {
    const wrapper = createElement("div", "community-image-field");

    const heading = createElement(
      "div",
      "community-image-field-title",
      label
    );

    const preview = createElement("div", "community-image-preview");

    if (currentUrl) {
      const image = createElement("img");
      image.src = safeImage(currentUrl);
      image.alt = label;
      preview.appendChild(image);
    } else {
      preview.textContent = "No image selected";
    }

    const input = createElement("input", "community-image-input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      const uploadedUrl = await uploadCommunityImage(file, folder);
      if (!uploadedUrl) return;

      preview.replaceChildren();

      const image = createElement("img");
      image.src = uploadedUrl;
      image.alt = label;
      preview.appendChild(image);

      if (folder === "avatars") {
        selectedAvatar = uploadedUrl;
      } else if (folder === "covers") {
        selectedCover = uploadedUrl;
      }
    });

    wrapper.append(heading, preview, input);
    container.appendChild(wrapper);

    return input;
  }

  function createProfileTabs(container, userId, isOwnProfile) {
    const tabs = createElement("div", "community-profile-tabs");
    const content = createElement("div", "community-profile-tab-content");

    const tabItems = [
      { key: "posts", label: "Post" },
      { key: "photos", label: "Photos" }
    ];

    if (isOwnProfile) {
      tabItems.push({ key: "reacted", label: "React On" });
    }

    function selectTab(tabKey) {
      $$(".community-profile-tab", tabs).forEach(button => {
        const active = button.dataset.tab === tabKey;

        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });

      renderProfileTab(content, userId, tabKey, isOwnProfile);
    }

    tabItems.forEach(item => {
      const button = makeButton(
        item.label,
        "community-profile-tab",
        () => selectTab(item.key)
      );

      button.dataset.tab = item.key;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", "false");

      tabs.appendChild(button);
    });

    container.append(tabs, content);
    selectTab("posts");
  }

  function renderProfileTab(container, userId, tab, isOwnProfile) {
    container.replaceChildren();

    let userPosts = posts.filter(
      post => post.user_id === userId
    );

    if (tab === "photos") {
      userPosts = userPosts.filter(post => post.image_url);
    }

    if (tab === "reacted" && isOwnProfile) {
      const reactedPostIds = reactions.map(
        reaction => reaction.post_id
      );

      userPosts = posts.filter(post =>
        reactedPostIds.includes(post.id)
      );
    }

    if (!userPosts.length) {
      const message =
        tab === "photos"
          ? "No photos yet."
          : tab === "reacted"
            ? "You haven't reacted to any posts yet."
            : "No posts yet.";

      container.appendChild(
        createElement("div", "community-profile-empty", message)
      );

      return;
    }

    userPosts.forEach(post => {
      renderPostCard(
        container,
        post,
        isOwnProfile && post.user_id === currentUser?.id
      );
    });
  }

  function renderProfileHeader(container, profile, isOwnProfile) {
    const cover = createElement("div", "community-profile-cover");

    if (profile?.cover_url) {
      cover.style.backgroundImage =
        `url("${safeImage(profile.cover_url)}")`;
    }

    const avatarWrap = createElement(
      "div",
      "community-profile-avatar-wrap"
    );

    const avatar = createElement(
      "div",
      "community-avatar community-profile-avatar"
    );

    if (profile?.avatar_url) {
      const image = createElement("img");
      image.src = safeImage(profile.avatar_url);
      image.alt = "Profile picture";
      avatar.appendChild(image);
    } else {
      avatar.textContent = initial(
        profile?.display_name || "User"
      );
    }

    avatarWrap.appendChild(avatar);

    const identity = createElement(
      "div",
      "community-profile-identity"
    );

    const name = createElement(
      "h2",
      "community-profile-name",
      profile?.display_name || "User"
    );

    const description = createElement(
      "p",
      "community-profile-description",
      profile?.short_description || ""
    );

    identity.append(name, description);
    container.append(cover, avatarWrap, identity);

    if (!isOwnProfile) return;

    cover.classList.add("community-editable-image");
    avatar.classList.add("community-editable-image");

    cover.title = "Change cover photo";
    avatar.title = "Change profile picture";

    cover.addEventListener("click", () => {
      const input = createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";

      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;

        const url = await uploadCommunityImage(file, "covers");
        if (!url) return;

        const success = await saveProfile(
          {
            ...currentProfile,
            cover_url: url
          },
          currentPrivate || {}
        );

        if (success) {
          selectedCover = null;
          cover.style.backgroundImage = `url("${safeImage(url)}")`;
        }
      });

      input.click();
    });

    avatar.addEventListener("click", () => {
      const input = createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";

      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;

        const url = await uploadCommunityImage(file, "avatars");
        if (!url) return;

        const success = await saveProfile(
          {
            ...currentProfile,
            avatar_url: url
          },
          currentPrivate || {}
        );

        if (success) {
          selectedAvatar = null;

          avatar.replaceChildren();

          const image = createElement("img");
          image.src = safeImage(url);
          image.alt = "Profile picture";
          avatar.appendChild(image);
        }
      });

      input.click();
    });
  }

  function renderProfileInfo(container, profile, privateData, isOwnProfile) {
    const section = createElement("section", "community-profile-info");

    const headingRow = createElement(
      "div",
      "community-profile-info-heading"
    );

    const heading = createElement("h3", "", "Information");
    headingRow.appendChild(heading);

    const details = createElement(
      "div",
      "community-profile-info-details"
    );

    function addInfo(label, value) {
      if (!value) return;

      const row = createElement(
        "div",
        "community-profile-info-row"
      );

      row.append(
        createElement("span", "community-profile-info-label", label),
        createElement("span", "community-profile-info-value", value)
      );

      details.appendChild(row);
    }

    addInfo("Institution", profile?.school);

    if (isOwnProfile) {
      addInfo("Mobile Number", privateData?.phone);
      addInfo("Address", privateData?.address);
    }

    if (isOwnProfile) {
      const editButton = makeButton(
        "✎",
        "community-profile-edit-button",
        openProfileEditor
      );

      editButton.title = "Edit profile information";
      editButton.setAttribute(
        "aria-label",
        "Edit profile information"
      );

      headingRow.appendChild(editButton);
    }

    section.append(headingRow, details);
    container.appendChild(section);

    function openProfileEditor() {
      details.replaceChildren();

      const form = createElement(
        "form",
        "community-profile-edit-form"
      );

      const nameInput = addProfileField(
        form,
        "Name",
        profile?.display_name,
        "display_name"
      );

      const descriptionInput = addProfileField(
        form,
        "Short Description",
        profile?.short_description,
        "short_description"
      );

      const schoolInput = addProfileField(
        form,
        "Institution",
        profile?.school,
        "school"
      );

      const phoneInput = addProfileField(
        form,
        "Mobile Number",
        privateData?.phone,
        "phone",
        "tel"
      );

      const addressInput = addProfileField(
        form,
        "Address",
        privateData?.address,
        "address"
      );

      const actions = createElement(
        "div",
        "community-profile-edit-actions"
      );

      const cancelButton = makeButton(
        "Cancel",
        "community-secondary-button",
        () => {
          renderProfileInfo(
            container,
            currentProfile,
            currentPrivate,
            true
          );
          section.remove();
        }
      );

      const saveButton = makeButton(
        "Save",
        "community-primary-button"
      );

      saveButton.type = "submit";

      actions.append(cancelButton, saveButton);
      form.appendChild(actions);

      form.addEventListener("submit", async event => {
        event.preventDefault();

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const success = await saveProfile(
          {
            display_name: nameInput.value.trim(),
            short_description: descriptionInput.value.trim(),
            school: schoolInput.value.trim(),
            avatar_url: currentProfile?.avatar_url || null,
            cover_url: currentProfile?.cover_url || null
          },
          {
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim()
          }
        );

        if (success) {
          renderProfileInfo(
            container,
            currentProfile,
            currentPrivate,
            true
          );

          section.remove();
        } else {
          saveButton.disabled = false;
          saveButton.textContent = "Save";
        }
      });

      details.appendChild(form);
    }
  }

  function renderMe(container) {
    container.replaceChildren();

    const profile = currentProfile || {
      display_name: currentName(),
      short_description: "",
      school: "",
      avatar_url: null,
      cover_url: null
    };

    selectedAvatar = null;
    selectedCover = null;

    const profileHeader = createElement(
      "section",
      "community-profile-header"
    );

    renderProfileHeader(profileHeader, profile, true);

    const infoContainer = createElement(
      "div",
      "community-profile-info-container"
    );

    renderProfileInfo(
      infoContainer,
      profile,
      currentPrivate,
      true
    );

    container.append(profileHeader, infoContainer);

    createComposer(
      container,
      "community_home",
      async () => {
        await refreshData();
        renderMe(container);
      }
    );

    const tabsContainer = createElement(
      "section",
      "community-profile-post-section"
    );

    createProfileTabs(
      tabsContainer,
      currentUser.id,
      true
    );

    container.appendChild(tabsContainer);
  }

  async function renderUserProfile(container, userId, onBack) {
    container.replaceChildren();

    container.appendChild(
      makeButton("← Back", "community-back-button", () => {
        if (typeof onBack === "function") onBack();
      })
    );

    if (!userId) {
      container.appendChild(
        createElement(
          "div",
          "community-profile-empty",
          "Profile not found."
        )
      );
      return;
    }

    let profile = getProfile(userId);

    if (!profile) {
      const { data, error } = await db
        .from("community_profiles")
        .select(
          "user_id, display_name, short_description, school, avatar_url, cover_url"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Public profile error:", error);
      }

      profile = data || null;
    }

    if (!profile) {
      container.appendChild(
        createElement(
          "div",
          "community-profile-empty",
          "This profile is not available."
        )
      );
      return;
    }

    const isOwnProfile = currentUser?.id === userId;

    const profileHeader = createElement(
      "section",
      "community-profile-header"
    );

    renderProfileHeader(profileHeader, profile, isOwnProfile);
    container.appendChild(profileHeader);

    if (isOwnProfile) {
      renderProfileInfo(
        container,
        profile,
        currentPrivate,
        true
      );

      createComposer(
        container,
        "community_home",
        async () => {
          await refreshData();
          renderUserProfile(container, userId, onBack);
        }
      );
    } else {
      renderProfileInfo(
        container,
        profile,
        null,
        false
      );
    }

    const tabsContainer = createElement(
      "section",
      "community-profile-post-section"
    );

    createProfileTabs(
      tabsContainer,
      userId,
      isOwnProfile
    );

    container.appendChild(tabsContainer);
                             }
     function openPublicProfile(userId) {
    if (!userId) return;

    window.dispatchEvent(
      new CustomEvent("cma:open-profile", {
        detail: { userId }
      })
    );
  }

  function createAuthorAvatar(profile, userId) {
    const avatar = createElement(
      "div",
      "community-post-avatar"
    );

    if (profile?.avatar_url) {
      const image = createElement("img");
      image.src = safeImage(profile.avatar_url);
      image.alt = profile.display_name || "User";
      avatar.appendChild(image);
    } else {
      avatar.textContent = initial(
        profile?.display_name || "User"
      );
    }

    avatar.setAttribute("role", "button");
    avatar.tabIndex = 0;
    avatar.title = "View profile";

    avatar.addEventListener("click", () => {
      openPublicProfile(userId);
    });

    avatar.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPublicProfile(userId);
      }
    });

    return avatar;
  }

  function createPostAuthor(post) {
    const profile = getProfile(post.user_id);

    const author = createElement(
      "div",
      "community-post-author"
    );

    const avatar = createAuthorAvatar(
      profile,
      post.user_id
    );

    const information = createElement(
      "div",
      "community-post-author-info"
    );

    const name = createElement(
      "button",
      "community-post-author-name",
      profile?.display_name || "User"
    );

    name.type = "button";

    name.addEventListener("click", () => {
      openPublicProfile(post.user_id);
    });

    const date = createElement(
      "span",
      "community-post-date",
      dateText(post.created_at)
    );

    information.append(name, date);
    author.append(avatar, information);

    return author;
  }

  function renderPostCard(container, post, ownPost = false) {
    const card = createElement(
      "article",
      "community-post-card"
    );

    card.dataset.postId = post.id;

    const header = createElement(
      "div",
      "community-post-header"
    );

    header.appendChild(createPostAuthor(post));

    const content = createElement(
      "div",
      "community-post-content"
    );

    if (post.content) {
      const caption = createElement(
        "p",
        "community-post-caption"
      );

      caption.textContent = post.content;
      content.appendChild(caption);
    }

    if (post.image_url) {
      const imageWrap = createElement(
        "div",
        "community-post-image-wrap"
      );

      const image = createElement(
        "img",
        "community-post-image"
      );

      image.src = safeImage(post.image_url);
      image.alt = "Post image";
      image.loading = "lazy";

      image.addEventListener("error", () => {
        imageWrap.remove();
      });

      imageWrap.appendChild(image);
      content.appendChild(imageWrap);
    }

    const reactionRow = createElement(
      "div",
      "community-post-reactions"
    );

    const myReaction = getReaction(post.id);

    EMOJIS.forEach(emoji => {
      const button = makeButton(
        emoji,
        "community-reaction-button",
        async () => {
          if (!requireLogin()) return;

          button.disabled = true;

          const success = await toggleReaction(
            post.id,
            emoji
          );

          button.disabled = false;

          if (success) {
            await refreshData();
            renderCommunityPage();
          }
        }
      );

      button.setAttribute(
        "aria-label",
        `React ${emoji}`
      );

      button.setAttribute(
        "aria-pressed",
        String(myReaction?.emoji === emoji)
      );

      if (myReaction?.emoji === emoji) {
        button.classList.add("active");
      }

      reactionRow.appendChild(button);
    });

    const commentButton = makeButton(
      "Comment",
      "community-comment-button",
      () => {
        if (!requireLogin()) return;
        openComments(post);
      }
    );

    const actionRow = createElement(
      "div",
      "community-post-actions"
    );

    actionRow.append(reactionRow, commentButton);

    const commentPreview = createElement(
      "div",
      "community-comment-preview"
    );

    const postComments = getPostComments(post.id);

    postComments.slice(0, 2).forEach(comment => {
      const commentProfile = getProfile(comment.user_id);

      const preview = createElement(
        "div",
        "community-comment-preview-item"
      );

      const commentName = createElement(
        "strong",
        "community-comment-preview-name",
        commentProfile?.display_name || "User"
      );

      commentName.setAttribute("role", "button");
      commentName.tabIndex = 0;

      commentName.addEventListener("click", () => {
        openPublicProfile(comment.user_id);
      });

      const commentText = createElement(
        "span",
        "community-comment-preview-text",
        comment.content || ""
      );

      preview.append(commentName, commentText);
      commentPreview.appendChild(preview);
    });

    if (postComments.length > 2) {
      const moreComments = makeButton(
        `View all ${postComments.length} comments`,
        "community-view-comments",
        () => {
          if (!requireLogin()) return;
          openComments(post);
        }
      );

      commentPreview.appendChild(moreComments);
    }

    if (ownPost && currentUser?.id === post.user_id) {
      const deleteButton = makeButton(
        "Delete Post",
        "community-delete-post-button",
        async () => {
          if (!requireLogin()) return;

          const confirmed = window.confirm(
            "Are you sure you want to delete this post?"
          );

          if (!confirmed) return;

          deleteButton.disabled = true;
          deleteButton.textContent = "Deleting...";

          const { error } = await db
            .from("community_posts")
            .delete()
            .eq("id", post.id)
            .eq("user_id", currentUser.id);

          if (error) {
            console.error("Post delete error:", error);

            showNotice(
              "Could not delete this post.",
              "error"
            );

            deleteButton.disabled = false;
            deleteButton.textContent = "Delete Post";
            return;
          }

          await refreshData();

          showNotice("Post deleted.", "success");
          renderCommunityPage();
        }
      );

      actionRow.appendChild(deleteButton);
    }

    card.append(
      header,
      content,
      actionRow
    );

    if (postComments.length) {
      card.appendChild(commentPreview);
    }

    container.appendChild(card);

    return card;
  }

  function openComments(post) {
    if (!requireLogin()) return;

    activePost = post;

    const oldOverlay = $("#community-comments-overlay");

    if (oldOverlay) {
      oldOverlay.remove();
    }

    const overlay = createElement(
      "div",
      "community-comments-overlay"
    );

    overlay.id = "community-comments-overlay";

    const sheet = createElement(
      "section",
      "community-comments-sheet"
    );

    const header = createElement(
      "div",
      "community-comments-header"
    );

    const title = createElement(
      "h3",
      "",
      "Comments"
    );

    const closeButton = makeButton(
      "✕",
      "community-comments-close",
      () => overlay.remove()
    );

    closeButton.setAttribute(
      "aria-label",
      "Close comments"
    );

    header.append(title, closeButton);

    const list = createElement(
      "div",
      "community-comments-list"
    );

    function renderCommentList() {
      list.replaceChildren();

      const postComments = getPostComments(post.id);

      if (!postComments.length) {
        list.appendChild(
          createElement(
            "div",
            "community-comments-empty",
            "No comments yet. Be the first to comment."
          )
        );

        return;
      }

      postComments.forEach(comment => {
        const profile = getProfile(comment.user_id);

        const item = createElement(
          "div",
          "community-comment-item"
        );

        const avatar = createAuthorAvatar(
          profile,
          comment.user_id
        );

        const body = createElement(
          "div",
          "community-comment-body"
        );

        const name = createElement(
          "button",
          "community-comment-name",
          profile?.display_name || "User"
        );

        name.type = "button";

        name.addEventListener("click", () => {
          overlay.remove();
          openPublicProfile(comment.user_id);
        });

        const text = createElement(
          "p",
          "community-comment-text",
          comment.content || ""
        );

        const date = createElement(
          "span",
          "community-comment-date",
          dateText(comment.created_at)
        );

        body.append(name, text, date);
        item.append(avatar, body);

        list.appendChild(item);
      });
    }

    const form = createElement(
      "form",
      "community-comment-form"
    );

    const input = createElement(
      "textarea",
      "community-comment-input"
    );

    input.placeholder = "Write a comment...";
    input.maxLength = 500;
    input.rows = 2;
    input.required = true;

    const submit = makeButton(
      "Send",
      "community-comment-send"
    );

    submit.type = "submit";

    form.append(input, submit);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!requireLogin()) return;

      const text = input.value.trim();

      if (!text) {
        showNotice("Write a comment first.", "error");
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending...";

      const success = await addComment(
        post.id,
        text
      );

      if (success) {
        input.value = "";
        renderCommentList();
      }

      submit.disabled = false;
      submit.textContent = "Send";
    });

    sheet.append(
      header,
      list,
      form
    );

    overlay.appendChild(sheet);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);

    renderCommentList();
       }
     function createComposer(container, postScope, onPublished) {
    if (!currentUser) return;

    if (postScope !== "community_home" && !isCreator()) {
      return;
    }

    const composer = createElement(
      "section",
      "community-composer"
    );

    const heading = createElement(
      "h3",
      "community-composer-title",
      "Create a Post"
    );

    const form = createElement(
      "form",
      "community-composer-form"
    );

    const textarea = createElement(
      "textarea",
      "community-composer-textarea"
    );

    textarea.placeholder = "What's on your mind?";
    textarea.rows = 3;
    textarea.maxLength = 5000;

    const preview = createElement(
      "div",
      "community-composer-preview"
    );

    let selectedImageUrl = null;

    const controls = createElement(
      "div",
      "community-composer-controls"
    );

    const photoButton = makeButton(
      "＋ Add Photo",
      "community-add-photo-button"
    );

    const photoInput = createElement("input");
    photoInput.type = "file";
    photoInput.accept = "image/jpeg,image/png,image/webp";
    photoInput.hidden = true;

    photoButton.addEventListener("click", () => {
      photoInput.click();
    });

    photoInput.addEventListener("change", async () => {
      const file = photoInput.files?.[0];
      if (!file) return;

      photoButton.disabled = true;
      photoButton.textContent = "Uploading...";

      const url = await uploadCommunityImage(file, "posts");

      photoButton.disabled = false;
      photoButton.textContent = "＋ Add Photo";

      if (!url) {
        photoInput.value = "";
        return;
      }

      selectedImageUrl = url;
      preview.replaceChildren();

      const imageWrap = createElement(
        "div",
        "community-composer-image-wrap"
      );

      const image = createElement(
        "img",
        "community-composer-image"
      );

      image.src = safeImage(url);
      image.alt = "Selected post image";

      const removeButton = makeButton(
        "✕",
        "community-remove-image-button",
        () => {
          selectedImageUrl = null;
          preview.replaceChildren();
          photoInput.value = "";
        }
      );

      removeButton.title = "Remove image";

      imageWrap.append(image, removeButton);
      preview.appendChild(imageWrap);
    });

    const postButton = makeButton(
      "Post",
      "community-primary-button"
    );

    postButton.type = "submit";

    controls.append(photoButton, postButton);

    form.append(
      textarea,
      preview,
      photoInput,
      controls
    );

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!requireLogin()) return;

      const content = textarea.value.trim();

      if (!content && !selectedImageUrl) {
        showNotice(
          "Write something or add a photo first.",
          "error"
        );
        return;
      }

      postButton.disabled = true;
      postButton.textContent = "Posting...";

      const success = await publishPost(
        content,
        selectedImageUrl,
        postScope
      );

      postButton.disabled = false;
      postButton.textContent = "Post";

      if (!success) return;

      textarea.value = "";
      selectedImageUrl = null;
      photoInput.value = "";
      preview.replaceChildren();

      if (typeof onPublished === "function") {
        await onPublished();
      }
    });

    composer.append(heading, form);
    container.appendChild(composer);

    return composer;
  }

  function renderFeed(container, postScope = "community_home") {
    container.replaceChildren();

    const isHome = postScope === "community_home";

    const heading = createElement(
      "h2",
      "community-section-title",
      isHome ? "Community Feed" : "Creator Panel"
    );

    container.appendChild(heading);

    if (isHome) {
      createComposer(
        container,
        "community_home",
        async () => {
          await refreshData();
          renderFeed(container, "community_home");
        }
      );
    } else if (isCreator()) {
      createComposer(
        container,
        postScope,
        async () => {
          await refreshData();
          renderFeed(container, postScope);
        }
      );
    }

    const feed = createElement(
      "div",
      "community-post-list"
    );

    const filteredPosts = posts.filter(post => {
      const scope = post.post_scope || "community_home";
      return scope === postScope;
    });

    if (!filteredPosts.length) {
      feed.appendChild(
        createElement(
          "div",
          "community-feed-empty",
          isHome
            ? "No posts yet. Be the first to share something!"
            : "No Creator Panel posts yet."
        )
      );
    } else {
      filteredPosts.forEach(post => {
        renderPostCard(
          feed,
          post,
          post.user_id === currentUser?.id
        );
      });
    }

    container.appendChild(feed);
  }

  function renderCreator(container) {
    container.replaceChildren();

    const heading = createElement(
      "h2",
      "community-section-title",
      "Creator Panel"
    );

    const description = createElement(
      "p",
      "community-section-description",
      "Official updates and posts from the Change Maker Community team."
    );

    container.append(heading, description);

    const feed = createElement(
      "div",
      "community-post-list"
    );

    const creatorPosts = posts.filter(post => {
      return post.post_scope === "creator_panel";
    });

    if (isCreator()) {
      createComposer(
        container,
        "creator_panel",
        async () => {
          await refreshData();
          renderCreator(container);
        }
      );
    }

    if (!creatorPosts.length) {
      feed.appendChild(
        createElement(
          "div",
          "community-feed-empty",
          "No Creator Panel posts yet."
        )
      );
    } else {
      creatorPosts.forEach(post => {
        renderPostCard(
          feed,
          post,
          post.user_id === currentUser?.id
        );
      });
    }

    container.appendChild(feed);
  }

  async function getUnreadNotificationCount() {
    if (!currentUser) return 0;

    const { count, error } = await db
      .from("community_notifications")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("recipient_id", currentUser.id)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Notification count error:",
        error
      );

      return 0;
    }

    return count || 0;
  }

  async function renderNotifications(container) {
    container.replaceChildren();

    const heading = createElement(
      "h2",
      "community-section-title",
      "Notifications"
    );

    container.appendChild(heading);

    if (!currentUser) {
      container.appendChild(
        createElement(
          "div",
          "community-feed-empty",
          "Please sign in to view your notifications."
        )
      );

      return;
    }

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

      container.appendChild(
        createElement(
          "div",
          "community-feed-empty",
          "Could not load notifications."
        )
      );

      return;
    }

    const notificationList = createElement(
      "div",
      "community-notification-list"
    );

    if (!data?.length) {
      notificationList.appendChild(
        createElement(
          "div",
          "community-feed-empty",
          "You have no notifications yet."
        )
      );
    } else {
      for (const notification of data) {
        const item = createElement(
          "div",
          "community-notification-item"
        );

        if (!notification.is_read) {
          item.classList.add("unread");
        }

        const message = createElement(
          "div",
          "community-notification-message",
          notification.message ||
            "You have a new notification."
        );

        const date = createElement(
          "span",
          "community-notification-date",
          dateText(notification.created_at)
        );

        item.append(message, date);

        if (!notification.is_read) {
          const markButton = makeButton(
            "Mark as read",
            "community-notification-read-button",
            async () => {
              markButton.disabled = true;

              const { error: updateError } = await db
                .from("community_notifications")
                .update({ is_read: true })
                .eq("id", notification.id)
                .eq("recipient_id", currentUser.id);

              if (updateError) {
                console.error(
                  "Notification update error:",
                  updateError
                );

                showNotice(
                  "Could not update notification.",
                  "error"
                );

                markButton.disabled = false;
                return;
              }

              notification.is_read = true;
              item.classList.remove("unread");
              markButton.remove();
              await updateNotificationBadge();
            }
          );

          item.appendChild(markButton);
        }

        notificationList.appendChild(item);
      }
    }

    container.appendChild(notificationList);
         }
     function updateNotificationBadge() {
    const badge = document.querySelector(
      ".community-notification-badge"
    );

    if (!badge) return;

    getUnreadNotificationCount().then(count => {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
    });
  }

  function getRecentSearches() {
    try {
      const saved = localStorage.getItem(
        "cma_community_recent_searches"
      );

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  function saveRecentSearch(query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    const recent = getRecentSearches().filter(
      item => item.toLowerCase() !== cleanQuery.toLowerCase()
    );

    recent.unshift(cleanQuery);

    localStorage.setItem(
      "cma_community_recent_searches",
      JSON.stringify(recent.slice(0, 10))
    );
  }

  function renderSearchPage(container, onBack) {
    container.replaceChildren();

    const page = createElement(
      "section",
      "community-search-page"
    );

    const topbar = createElement(
      "div",
      "community-search-topbar"
    );

    const backButton = makeButton(
      "←",
      "community-search-back",
      () => {
        if (typeof onBack === "function") {
          onBack();
        }
      }
    );

    backButton.setAttribute("aria-label", "Back");

    const title = createElement(
      "h2",
      "community-search-title",
      "Search"
    );

    topbar.append(backButton, title);

    const searchForm = createElement(
      "form",
      "community-search-form"
    );

    const searchInput = createElement(
      "input",
      "community-search-input"
    );

    searchInput.type = "search";
    searchInput.placeholder = "Search people or posts...";
    searchInput.autocomplete = "off";

    const searchButton = makeButton(
      "Search",
      "community-primary-button"
    );

    searchButton.type = "submit";

    searchForm.append(searchInput, searchButton);

    const results = createElement(
      "div",
      "community-search-results"
    );

    const recentSection = createElement(
      "section",
      "community-recent-searches"
    );

    const recentHeader = createElement(
      "div",
      "community-recent-header"
    );

    const recentTitle = createElement(
      "h3",
      "",
      "Recent Searches"
    );

    const clearButton = makeButton(
      "Clear All",
      "community-clear-searches"
    );

    recentHeader.append(recentTitle, clearButton);

    const recentList = createElement(
      "div",
      "community-recent-list"
    );

    function showRecentSearches() {
      recentList.replaceChildren();

      const recent = getRecentSearches();

      if (!recent.length) {
        recentList.appendChild(
          createElement(
            "p",
            "community-search-muted",
            "No recent searches."
          )
        );

        return;
      }

      recent.forEach(query => {
        const item = makeButton(
          "⌕  " + query,
          "community-recent-search-item",
          () => {
            searchInput.value = query;
            performSearch(query);
          }
        );

        recentList.appendChild(item);
      });
    }

    clearButton.addEventListener("click", () => {
      localStorage.removeItem(
        "cma_community_recent_searches"
      );

      showRecentSearches();
    });

    function addSearchResult(titleText, description, callback, className) {
      const item = makeButton(
        "",
        className || "community-search-result-item",
        callback
      );

      const resultTitle = createElement(
        "strong",
        "community-search-result-title",
        titleText
      );

      const resultDescription = createElement(
        "span",
        "community-search-result-description",
        description
      );

      item.append(resultTitle, resultDescription);
      results.appendChild(item);
    }

    function performSearch(rawQuery) {
      const query = String(rawQuery || "").trim();

      results.replaceChildren();

      if (!query) {
        showNotice("Enter something to search.", "error");
        return;
      }

      saveRecentSearch(query);

      const normalizedQuery = query.toLowerCase();

      const matchingProfiles = Object.values(profiles).filter(profile => {
        const name = profile.display_name || "";

        const description = profile.short_description || "";

        return (
          name.toLowerCase().includes(normalizedQuery) ||
          description.toLowerCase().includes(normalizedQuery)
        );
      });

      const matchingPosts = posts.filter(post => {
        const content = post.content || post.caption || "";

        return content.toLowerCase().includes(normalizedQuery);
      });

      const peopleHeading = createElement(
        "h3",
        "community-search-group-title",
        "People"
      );

      results.appendChild(peopleHeading);

      if (!matchingProfiles.length) {
        results.appendChild(
          createElement(
            "p",
            "community-search-muted",
            "No matching people found."
          )
        );
      } else {
        matchingProfiles.forEach(profile => {
          addSearchResult(
            profile.display_name || "Community Member",
            profile.short_description || "View profile",
            () => {
              renderUserProfile(
                container,
                profile.user_id,
                () => renderSearchPage(container, onBack)
              );
            },
            "community-search-result-item"
          );
        });
      }

      const postsHeading = createElement(
        "h3",
        "community-search-group-title",
        "Posts"
      );

      results.appendChild(postsHeading);

      if (!matchingPosts.length) {
        results.appendChild(
          createElement(
            "p",
            "community-search-muted",
            "No matching posts found."
          )
        );
      } else {
        matchingPosts.forEach(post => {
          const content = post.content || post.caption || "";

          const author = getProfile(post.user_id);

          addSearchResult(
            author?.display_name || "Community Member",
            content.slice(0, 140) || "Photo post",
            () => {
              if (typeof onBack === "function") {
                onBack();
              }

              setTimeout(() => {
                const postElement = document.querySelector(
                  `[data-post-id="${post.id}"]`
                );

                if (postElement) {
                  postElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                  });
                }
              }, 100);
            },
            "community-search-result-item"
          );
        });
      }

      showRecentSearches();
    }

    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      performSearch(searchInput.value);
    });

    recentSection.append(recentHeader, recentList);

    page.append(
      topbar,
      searchForm,
      recentSection,
      results
    );

    container.appendChild(page);

    showRecentSearches();
    searchInput.focus();
  }

  function injectCommunityStyles() {
    if (document.getElementById("cma-community-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "cma-community-styles";

    style.textContent = `
      body.community-active {
        background: #073746 !important;
        color: #fff;
        font-family: "Nunito Sans", sans-serif;
      }

      body.community-active #pageContent {
        background: #073746;
        min-height: 100vh;
      }

      .community-app {
        width: 100%;
        max-width: 760px;
        min-height: 100vh;
        margin: 0 auto;
        padding-bottom: 90px;
        color: #fff;
      }

      .community-header {
        position: sticky;
        top: 0;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 62px;
        padding: 12px 18px;
        background: #073746;
        border-bottom: 1px solid rgba(168,192,206,.15);
      }

      .community-brand {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        white-space: nowrap;
        letter-spacing: -.4px;
      }

      .community-brand span {
        color: #08C99A;
      }

      .community-search-icon {
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 50%;
        color: #fff;
        background: transparent;
        font-size: 23px;
        cursor: pointer;
      }

      .community-search-icon:active {
        color: #08C99A;
      }

      .community-main {
        padding: 16px 14px 28px;
      }

      .community-bottom-nav {
        position: fixed;
        z-index: 50;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        background: #073746;
        border-top: 1px solid rgba(168,192,206,.18);
      }

      .community-nav-inner {
        width: 100%;
        max-width: 760px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        padding: 7px 4px calc(7px + env(safe-area-inset-bottom));
      }

      .community-nav-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        min-height: 54px;
        border: 0;
        background: transparent;
        color: #A8C0CE;
        font: inherit;
        cursor: pointer;
      }

      .community-nav-icon {
        font-size: 21px;
        line-height: 1.2;
      }

      .community-nav-label {
        font-size: 11px;
        font-weight: 700;
      }

      .community-nav-item.active {
        color: #08C99A;
        background: transparent;
      }

      .community-notification-badge {
        position: absolute;
        top: 0;
        left: calc(50% + 7px);
        min-width: 16px;
        padding: 2px 4px;
        border-radius: 20px;
        background: #08C99A;
        color: #052D3B;
        font-size: 9px;
        font-weight: 900;
        text-align: center;
      }

      .community-notification-badge[hidden] {
        display: none;
      }

      .community-section-title {
        margin: 5px 0 15px;
        font-size: 21px;
        font-weight: 800;
      }

      .community-section-description {
        margin: -7px 0 18px;
        color: #A8C0CE;
        font-size: 13px;
        line-height: 1.6;
      }

      .community-composer {
        margin-bottom: 18px;
        padding: 15px;
        border: 1px solid #245563;
        border-radius: 17px;
        background: #103E4C;
      }

      .community-composer-title {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 800;
      }

      .community-composer-form {
        display: flex;
        flex-direction: column;
        gap: 11px;
      }

      .community-composer-textarea {
        width: 100%;
        min-height: 90px;
        resize: vertical;
        box-sizing: border-box;
        padding: 12px;
        border: 1px solid #245563;
        border-radius: 12px;
        outline: none;
        background: #08494B;
        color: #fff;
        font: inherit;
        font-size: 14px;
      }

      .community-composer-textarea::placeholder {
        color: #A8C0CE;
      }

      .community-composer-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .community-add-photo-button {
        min-height: 38px;
        padding: 8px 13px;
        border: 1px solid #08C99A;
        border-radius: 10px;
        background: transparent;
        color: #68DDB9;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .community-primary-button {
        min-height: 38px;
        padding: 8px 20px;
        border: 0;
        border-radius: 10px;
        background: #08C99A;
        color: #052D3B;
        font: inherit;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
      }

      .community-primary-button:disabled,
      .community-add-photo-button:disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .community-composer-preview:empty {
        display: none;
      }

      .community-composer-image-wrap {
        position: relative;
        width: fit-content;
        max-width: 100%;
      }

      .community-composer-image {
        display: block;
        max-width: 100%;
        max-height: 220px;
        border-radius: 12px;
        object-fit: cover;
      }

      .community-remove-image-button {
        position: absolute;
        top: 7px;
        right: 7px;
        width: 29px;
        height: 29px;
        border: 0;
        border-radius: 50%;
        background: #052D3B;
        color: #fff;
        cursor: pointer;
      }

      .community-post-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .community-feed-empty {
        padding: 25px 15px;
        border: 1px solid #245563;
        border-radius: 15px;
        background: #103E4C;
        color: #A8C0CE;
        text-align: center;
        font-size: 14px;
      }

      .community-post-card {
        overflow: hidden;
        padding: 14px;
        border: 1px solid #245563;
        border-radius: 16px;
        background: #103E4C;
      }

      .community-post-author,
      .community-post-author-button {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .community-post-author-button {
        padding: 0;
        border: 0;
        background: transparent;
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      .community-avatar {
        width: 39px;
        height: 39px;
        flex: 0 0 39px;
        border-radius: 50%;
        object-fit: cover;
        background: #08494B;
      }

      .community-post-author-name {
        font-size: 14px;
        font-weight: 800;
      }

      .community-post-date {
        display: block;
        margin-top: 2px;
        color: #A8C0CE;
        font-size: 11px;
      }

      .community-post-content {
        margin: 13px 0;
        color: #fff;
        font-size: 14px;
        line-height: 1.65;
        overflow-wrap: anywhere;
      }

      .community-post-image {
        display: block;
        width: 100%;
        max-height: 420px;
        border-radius: 12px;
        object-fit: contain;
        background: #08494B;
      }

      .community-post-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 13px;
        padding-top: 11px;
        border-top: 1px solid rgba(168,192,206,.15);
      }

      .community-reaction-button,
      .community-comment-button,
      .community-delete-button {
        min-width: 35px;
        min-height: 35px;
        padding: 5px 9px;
        border: 0;
        border-radius: 30px;
        background: #08494B;
        color: #fff;
        font-size: 15px;
        cursor: pointer;
      }

      .community-reaction-button.active {
        outline: 1px solid #08C99A;
        background: #08494B;
      }

      .community-comment-button {
        margin-left: auto;
        font-size: 12px;
        font-weight: 800;
      }

      .community-delete-button {
        color: #ffb3b3;
        font-size: 12px;
      }

      .community-profile-cover {
        position: relative;
        height: 175px;
        border-radius: 15px;
        background: #08494B;
        background-position: center;
        background-size: cover;
      }

      .community-profile-avatar-wrap {
        position: relative;
        width: 112px;
        height: 112px;
        margin: -55px 0 0 18px;
      }

      .community-profile-avatar {
        width: 112px;
        height: 112px;
        border: 4px solid #073746;
        border-radius: 50%;
        object-fit: cover;
        background: #08494B;
      }

      .community-profile-identity {
        padding: 10px 17px 17px;
      }

      .community-profile-name {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
      }

      .community-profile-description {
        margin: 5px 0 0;
        color: #A8C0CE;
        font-size: 13px;
        line-height: 1.5;
      }

      .community-profile-info {
        margin: 12px 0 18px;
        padding: 15px;
        border: 1px solid #245563;
        border-radius: 15px;
        background: #103E4C;
      }

      .community-profile-info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .community-profile-info-title {
        margin: 0;
        font-size: 16px;
      }

      .community-profile-edit-button {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: #08C99A;
        font-size: 20px;
        cursor: pointer;
      }

      .community-profile-info-row {
        margin-top: 12px;
        color: #A8C0CE;
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      .community-profile-info-row strong {
        display: block;
        margin-bottom: 3px;
        color: #fff;
      }

      .community-profile-edit-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 14px;
      }

      .community-profile-edit-form input,
      .community-profile-edit-form textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 11px;
        border: 1px solid #245563;
        border-radius: 10px;
        outline: none;
        background: #08494B;
        color: #fff;
        font: inherit;
        font-size: 13px;
      }

      .community-profile-tabs {
        display: flex;
        align-items: center;
        gap: 25px;
        margin: 18px 0;
        padding: 0 4px 11px;
        border-bottom: 1px solid rgba(168,192,206,.18);
      }

      .community-profile-tab {
        padding: 5px 0;
        border: 0;
        background: transparent;
        color: #A8C0CE;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .community-profile-tab.active {
        background: transparent;
        color: #08C99A;
      }

      .community-search-page {
        min-height: 75vh;
      }

      .community-search-topbar {
        display: flex;
        align-items: center;
        gap: 13px;
        margin-bottom: 17px;
      }

      .community-search-back {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #103E4C;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
      }

      .community-search-title {
        margin: 0;
        font-size: 21px;
      }

      .community-search-form {
        display: flex;
        gap: 8px;
        margin-bottom: 22px;
      }

      .community-search-input {
        min-width: 0;
        flex: 1;
        padding: 11px 13px;
        border: 1px solid #245563;
        border-radius: 11px;
        outline: none;
        background: #103E4C;
        color: #fff;
        font: inherit;
      }

      .community-recent-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .community-recent-header h3,
      .community-search-group-title {
        font-size: 15px;
      }

      .community-clear-searches {
        border: 0;
        background: transparent;
        color: #08C99A;
        font: inherit;
     // Open another user's public profile
  document.addEventListener(
    "cma:open-profile",
    event => {
      const userId = event.detail;

      if (!userId) return;

      const main = document.querySelector(
        ".community-main"
      );

      if (!main) return;

      renderUserProfile(
        main,
        userId,
        () => renderCommunityPage()
      );
    }
  );

  // Public function to open a community profile
  window.cmaOpenCommunityProfile = function (userId) {
    if (!userId) return;

    document.dispatchEvent(
      new CustomEvent("cma:open-profile", {
        detail: userId
      })
    );
  };

  // Supabase authentication state listener
  if (
    db &&
    db.auth &&
    typeof db.auth.onAuthStateChange === "function"
  ) {
    db.auth.onAuthStateChange(
      (event, session) => {
        currentUser = session?.user || null;

        if (
          window.location.search.includes(
            "page=community"
          )
        ) {
          setTimeout(() => {
            renderCommunityPage();
          }, 0);
        }
      }
    );
  }

  // Refresh community when browser navigation changes
  window.addEventListener(
    "popstate",
    () => {
      if (
        window.location.search.includes(
          "page=community"
        )
      ) {
        renderCommunityPage();
      }
    }
  );

  // Initialize community page
  function initializeCommunityPage() {
    const params = new URLSearchParams(
      window.location.search
    );

    if (params.get("page") === "community") {
      renderCommunityPage();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeCommunityPage
    );
  } else {
    initializeCommunityPage();
  }

  // Public refresh function
  window.renderCommunityPage = renderCommunityPage;

})();
