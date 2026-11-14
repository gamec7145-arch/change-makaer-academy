
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MAIN CONTROLLER
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;

  const Main = {
    initialized: false,

    // Community system চালু
    async init() {
      if (this.initialized) return true;

      if (!Core) {
        console.error(
          "CMA Community Core is not loaded."
        );
        return false;
      }

      const session = await Core.loadSession();

      if (session.error) {
        console.warn(
          "Community session could not be loaded:",
          session.error
        );
      }

      this.initialized = true;

      return true;
    },

    // Community page render
    async render() {
      const ready = await this.init();

      if (!ready) return;

      const root = Core.getRoot();

      if (!root) {
        console.error(
          "Community root element was not found."
        );
        return;
      }

      // Feed module প্রস্তুত হলে Homepage render হবে
      const Feed = window.CMACommunityFeed;

      if (
        Feed &&
        typeof Feed.renderHome === "function"
      ) {
        await Feed.renderHome(root);
        return;
      }

      console.warn(
        "Community Feed module is not connected yet."
      );
    },

    // Module availability
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

  // Main controller
  window.CMACommunityMain = Main;

  // Existing router compatibility
  window.renderCommunityPage = function () {
    return Main.render();
  };

})();
