
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MAIN CONTROLLER
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;

  const Main = {
    initialized: false,
    postEventsBound: false,
    selectedImage: null,
    imageInput: null,

    async init() {
      if (this.initialized) return true;

      if (!Core) {
        console.error("CMA Community Core is not loaded.");
        return false;
      }

      const session = await Core.loadSession();

      if (session.error) {
        console.warn("Community session error:", session.error);
      }

      this.bindPostEvents();
      this.initialized = true;

      return true;
    },

    bindPostEvents() {
      if (this.postEventsBound) return;
      this.postEventsBound = true;

      // Hidden photo input
      this.imageInput = document.createElement("input");
      this.imageInput.type = "file";
      this.imageInput.accept = "image/jpeg,image/png,image/webp";
      this.imageInput.hidden = true;

      document.body.appendChild(this.imageInput);

      this.imageInput.addEventListener("change", () => {
        const file = this.imageInput.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          Core.showNotice("শুধু JPG, PNG অথবা WEBP ছবি দেওয়া যাবে।", "error");
          this.imageInput.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          Core.showNotice("ছবির সাইজ 5MB-এর বেশি হতে পারবে না।", "error");
          this.imageInput.value = "";
          return;
        }

        this.selectedImage = file;
        Core.showNotice("ছবি নির্বাচন করা হয়েছে।", "success");
      });

      window.addEventListener("cma:select-photo", () => {
        if (!Core.requireLogin()) return;
        this.imageInput.value = "";
        this.imageInput.click();
      });

      window.addEventListener("cma:submit-post", (event) => {
        this.createPost(event.detail || {});
      });
    },

    async createPost(data) {
      if (!Core.requireLogin()) return;

      const user = Core.getCurrentUser();
      const db = Core.db;

      if (!user || !db) {
        Core.showNotice("Login অথবা Supabase connection পাওয়া যায়নি।", "error");
        return;
      }

      const root = Core.getRoot();
      const input = root?.querySelector("#cmaPostInput, #cmaProfilePostInput");
      const content = String(data.content || input?.value || "").trim();
      const file = this.selectedImage;

      if (!content && !file) {
        Core.showNotice("আগে কিছু লিখো অথবা একটি ছবি নির্বাচন করো।", "error");
        return;
      }

      const postButton = root?.querySelector(
        '[data-cma-action="post"], [data-cma-profile-action="post"]'
      );

      if (postButton) postButton.disabled = true;

      try {
        let imageURL = null;

        if (file) {
          const extension = file.name.split(".").pop().toLowerCase();
          const path = `${user.id}/post-${Date.now()}.${extension}`;

          const { data: uploaded, error: uploadError } = await db.storage
            .from("community-media")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            });

          if (uploadError) throw uploadError;

          const { data: publicData } = db.storage
            .from("community-media")
            .getPublicUrl(uploaded.path);

          imageURL = publicData.publicUrl;
        }

        const { error } = await db
          .from("cma_community_posts")
          .insert({
            user_id: user.id,
            content: content,
            image_url: imageURL
          });

        if (error) throw error;

        if (input) input.value = "";
        this.selectedImage = null;
        if (this.imageInput) this.imageInput.value = "";

        Core.showNotice("তোমার Post প্রকাশিত হয়েছে!", "success");

        await this.loadPosts();

      } catch (error) {
        console.error("Post creation failed:", error);
        Core.showNotice(
          error.message || "Post প্রকাশ করা যায়নি।",
          "error"
        );
      } finally {
        if (postButton) postButton.disabled = false;
      }
    },

    async loadPosts() {
      const db = Core.db;
      const root = Core.getRoot();
      const list = root?.querySelector("#cmaFeedList");

      if (!db || !list) return;

      const { data, error } = await db
        .from("cma_community_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Loading posts failed:", error);
        Core.showNotice("Post লোড করা যায়নি।", "error");
        return;
      }

      const Feed = window.CMACommunityFeed;

      if (!Feed || typeof Feed.createPostCard !== "function") return;

      if (!data || data.length === 0) {
        list.innerHTML = `
          <div class="cma-empty-feed">
            <div class="cma-empty-icon">✦</div>
            <p>Welcome to Change Maker Community</p>
            <span>এখনো কোনো Post নেই। প্রথম Postটি করো!</span>
          </div>
        `;
        return;
      }

      list.innerHTML = data.map(post => {
        return Feed.createPostCard({
          id: post.id,
          caption: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          author_name: post.user_id === Core.getCurrentUser()?.id
            ? "You"
            : "Member"
        });
      }).join("");
    },

    async render() {
      const ready = await this.init();
      if (!ready) return;

      const root = Core.getRoot();
      if (!root) {
        console.error("Community root was not found.");
        return;
      }

      const Feed = window.CMACommunityFeed;

      if (Feed && typeof Feed.renderHome === "function") {
        await Feed.renderHome(root);
        await this.loadPosts();
      }
    },

    getModules() {
      return {
        core: !!window.CMACommunityCore,
        feed: !!window.CMACommunityFeed,
        profile: !!window.CMACommunityProfile,
        friends: !!window.CMACommunityFriends,
        search: !!window.CMACommunitySearch,
        notifications: !!window.CMACommunityNotifications,
        creator: !!window.CMACommunityCreator,
        messaging: !!window.CMACommunityMessaging
      };
    }
  };

  window.CMACommunityMain = Main;

  window.renderCommunityPage = function () {
    return Main.render();
  };

})();
