
// ==================================================
// CHANGE MAKER ACADEMY
// COMMUNITY MODULE LOADER + MAIN ROUTER
// ==================================================

const CMA_COMMUNITY_ROUTES = {
  "community": "home",
  "community-home": "home",
  "community-profile": "profile",
  "community-friends": "friends",
  "community-creator": "creator",
  "community-notifications": "notifications",
  "community-search": "search",
  "community-messaging": "messaging"
};

const CMA_COMMUNITY_URLS = {
  home: "community",
  profile: "community-profile",
  friends: "community-friends",
  creator: "community-creator",
  notifications: "community-notifications",
  search: "community-search",
  messaging: "community-messaging"
};

const CMA_COMMUNITY_FILES = [
  "js/cma-community/cma-community-core.js",
  "js/cma-community/cma-community-feed.js",
  "js/cma-community/cma-community-profile.js",
  "js/cma-community/cma-community-friends.js",
  "js/cma-community/cma-community-search.js",
  "js/cma-community/cma-community-notifications.js",
  "js/cma-community/cma-community-creator.js",
  "js/cma-community/cma-community-messaging.js",
  "js/cma-community/cma-community-main.js"
];

let cmaCommunityLoadPromise = null;
const cmaCommunityScriptPromises = {};

function getCommunityModuleName(src) {
  const names = {
    "cma-community-core.js": "CMACommunityCore",
    "cma-community-feed.js": "CMACommunityFeed",
    "cma-community-profile.js": "CMACommunityProfile",
    "cma-community-friends.js": "CMACommunityFriends",
    "cma-community-search.js": "CMACommunitySearch",
    "cma-community-notifications.js": "CMACommunityNotifications",
    "cma-community-creator.js": "CMACommunityCreator",
    "cma-community-messaging.js": "CMACommunityMessaging",
    "cma-community-main.js": "CMACommunityMain"
  };

  return names[src.split("/").pop()] || null;
}

function loadCommunityModules() {
  if (cmaCommunityLoadPromise) {
    return cmaCommunityLoadPromise;
  }

  cmaCommunityLoadPromise = CMA_COMMUNITY_FILES.reduce(
    (promise, src) => promise.then(() => loadCommunityFile(src)),
    Promise.resolve()
  ).catch(error => {
    cmaCommunityLoadPromise = null;
    throw error;
  });

  return cmaCommunityLoadPromise;
}

function loadCommunityFile(src) {
  if (cmaCommunityScriptPromises[src]) {
    return cmaCommunityScriptPromises[src];
  }

  const moduleName = getCommunityModuleName(src);

  if (moduleName && window[moduleName]) {
    return Promise.resolve();
  }

  const existing = Array.from(document.scripts).find(script => {
    if (!script.src) return false;

    try {
      return new URL(
        script.src,
        window.location.href
      ).pathname.endsWith(src);
    } catch (error) {
      return script.src.endsWith(src);
    }
  });

  if (existing && existing.dataset.cmaLoaded === "true") {
    return Promise.resolve();
  }

  const promise = new Promise((resolve, reject) => {
    let script = existing;

    // If an old script tag exists but its module is unavailable,
    // replace it so the loader does not wait forever for an event
    // that may already have happened.
    if (script && !moduleName) {
      script.remove();
      script = null;
    }

    if (script && moduleName && !window[moduleName]) {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.cmaCommunityModule = "true";
    }

    let finished = false;

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      if (finished) return;

      finished = true;
      script.dataset.cmaLoaded = "true";

      cleanup();
      resolve();
    };

    const onError = () => {
      if (finished) return;

      finished = true;
      cleanup();

      delete cmaCommunityScriptPromises[src];

      reject(
        new Error("Failed to load Community module: " + src)
      );
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    if (!existing || !script.isConnected) {
      document.head.appendChild(script);
    }
  });

  cmaCommunityScriptPromises[src] = promise;

  return promise;
}


// ==================================================
// COMMUNITY PAGE RENDERING
// ==================================================

async function renderCommunitySection(page) {
  const root = document.getElementById("pageContent");

  if (!root) return;

  try {
    await loadCommunityModules();

    if (page === "home") {
      if (typeof window.renderCommunityPage === "function") {
        await window.renderCommunityPage();
      } else {
        throw new Error(
          "Community homepage renderer not found."
        );
      }

      return;
    }

    const moduleMap = {
      profile: window.CMACommunityProfile,
      friends: window.CMACommunityFriends,
      creator: window.CMACommunityCreator,
      notifications: window.CMACommunityNotifications,
      search: window.CMACommunitySearch,
      messaging: window.CMACommunityMessaging
    };

    const selectedModule = moduleMap[page];

    if (
      selectedModule &&
      typeof selectedModule.render === "function"
    ) {
      await selectedModule.render(root);
      return;
    }

    const titles = {
      profile: "Profile",
      friends: "Friends",
      creator: "Creator Panel",
      notifications: "Notifications",
      search: "Search",
      messaging: "Messages"
    };

    root.innerHTML = `
      <div class="cma-community">
        <div style="
          padding:30px 16px;
          text-align:center;
          color:#A8C0CE;
        ">
          <h3 style="color:#FFFFFF;">
            ${titles[page] || "Community"}
          </h3>
          <p>This section is not available yet.</p>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("Community section error:", error);

    root.innerHTML = `
      <div class="cma-community">
        <div style="
          padding:30px 16px;
          text-align:center;
          color:#A8C0CE;
        ">
          <h3 style="color:#FFFFFF;">
            Community could not load
          </h3>
          <p>Please refresh the page and try again.</p>
        </div>
      </div>
    `;
  }
}


// ==================================================
// COMMUNITY NAVIGATION
// ==================================================

function navigateCommunity(page, updateHistory = true) {
  const allowedPages = [
    "home",
    "profile",
    "friends",
    "creator",
    "notifications",
    "search",
    "messaging"
  ];

  if (!allowedPages.includes(page)) return;

  const urlPage = CMA_COMMUNITY_URLS[page];

  if (!urlPage) return;

  if (updateHistory) {
    const currentPage = new URLSearchParams(
      window.location.search
    ).get("page");

    if (currentPage !== urlPage) {
      history.pushState(
        {},
        "",
        "?page=" + urlPage
      );
    }
  }

  openPage(urlPage);
}


// ==================================================
// COMMUNITY EVENT LISTENERS
// ==================================================

if (!window.cmaRouterEventsBound) {
  window.cmaRouterEventsBound = true;

  window.addEventListener("cma:navigate", function(event) {
    const detail = event.detail || {};

    const page = typeof detail === "string"
      ? detail
      : detail.page;

    if (CMA_COMMUNITY_ROUTES[page]) {
      navigateCommunity(CMA_COMMUNITY_ROUTES[page]);
      return;
    }

    navigateCommunity(page);
  });

  window.addEventListener("cma:open-search", function() {
    navigateCommunity("search");
  });
}

window.CMANavigateCommunity = navigateCommunity;


// ==================================================
// AUTOMATIC HEADER AND PAGE ELEMENT CONTROL
// ==================================================

function updatePageHeaders(page) {
  const topHeader = document.querySelector(".header");
  const secondHeader = document.querySelector(".cma-bottom-nav");

  const pageBanner = document.getElementById("pageBanner");
  const pageIntro = document.querySelector("#innerPage .page-intro");
  const backLink = document.getElementById("backLink");

  const isDemoAI = (
    page === "demo-ai" ||
    (page && page.startsWith("demo-ai-"))
  );

  const isCommunity = (
    page === "community" ||
    (page && page.startsWith("community-"))
  );

  const isAccount = page === "account";

  const showBoth = (
    !page ||
    page === "teachers" ||
    page === "account" ||
    (page && page.startsWith("teachers-"))
  );

  document.body.classList.toggle(
    "community-active",
    !!isCommunity
  );

  if (topHeader) {
    topHeader.style.display =
      (isDemoAI || isCommunity) ? "none" : "";
  }

  if (secondHeader) {
    secondHeader.style.display =
      (!isDemoAI && !isCommunity && showBoth) ? "" : "none";
  }

  if (pageBanner) {
    pageBanner.style.display =
      (isAccount || isCommunity) ? "none" : "";
  }

  if (pageIntro) {
    pageIntro.style.display = isCommunity ? "none" : "";
  }

  if (backLink) {
    backLink.style.display = isCommunity ? "none" : "";
  }
}


// ==================================================
// CLASSROOM LEARNING
// ADMISSION PROGRAM SELECTION
// ==================================================

function renderAdmissionPrograms() {
  setPage(
    "Choose Your Program",
    "Classroom Learning",
    "Select your academic program to explore admission opportunities.",
    demoImages.classroom,
    "?"
  );

  const grid = document.createElement("div");
  grid.className = "offline-grid";

  const programs = [
    {
      name: "SSC",
      description: "Class 9 & 10",
      icon: "▤",
      page: "admission-ssc"
    },
    {
      name: "HSC",
      description: "College",
      icon: "▣",
      page: "admission-hsc"
    }
  ];

  programs.forEach(program => {
    const card = document.createElement("a");
    card.href = "?page=" + program.page;
    card.className = "offline-card";

    const icon = document.createElement("div");
    icon.className = "offline-icon";
    icon.textContent = program.icon;

    const content = document.createElement("div");

    const heading = document.createElement("h3");
    heading.textContent = program.name;

    const description = document.createElement("p");
    description.textContent = program.description;

    const arrow = document.createElement("span");
    arrow.textContent = "›";

    content.append(heading, description);
    card.append(icon, content, arrow);

    grid.appendChild(card);
  });

  pageContent.appendChild(grid);
}

// ==================================================
// PAGE ROUTER
// ==================================================

function openPage(page) {
  if (!page || typeof page !== "string") {
    showNotFound();
    return;
  }

  updatePageHeaders(page);

  homePage.style.display = "none";
  innerPage.classList.add("active");

  clearContent();

  // COMMUNITY ROUTES
  if (CMA_COMMUNITY_ROUTES[page]) {
    renderCommunitySection(CMA_COMMUNITY_ROUTES[page]);
  }

  // STUDENT ACCOUNT
  else if (page === "account") {
    if (typeof window.renderAccountPage === "function") {
      window.renderAccountPage();
    } else {
      console.error(
        "Account system not found. Check account.js loading."
      );
      showNotFound();
    }
  }

  // ONLINE EXAMINATION: START EXAM
  else if (page.startsWith("online-exam-start-")) {
    const prefix = "online-exam-start-";
    const postId = page.slice(prefix.length);
    renderOnlineExamStart(postId);
  }

  // CLASSROOM LEARNING: ADMISSION PROGRAMS
  else if (page === "admission-programs") {
    renderAdmissionPrograms();
  }

  // SUBJECT PAPER SELECTION
  else if (page.startsWith("subject-parts-")) {
    let mode;
    let program;
    let group;
    let subjectKey;

    if (page.startsWith("subject-parts-online-exam-")) {
      const prefix = "subject-parts-online-exam-";
      const route = page.slice(prefix.length);
      const parts = route.split("-");

      mode = "online-exam";
      program = parts[0];
      group = parts[1];
      subjectKey = parts.slice(2).join("-");
    } else {
      const parts = page.split("-");

      mode = parts[2];
      program = parts[3];
      group = parts[4];
      subjectKey = parts.slice(5).join("-");
    }

    renderSubjectParts(
      program,
      group,
      subjectKey,
      mode
    );
  }

  // OFFLINE: SSC / HSC -> GROUP
  else if (
    page === "offline-ssc" ||
    page === "offline-hsc"
  ) {
    renderGroups(
      page.replace("offline-", ""),
      "offline"
    );
  }

  // OFFLINE: GROUP -> SUBJECT
  else if (page.startsWith("offline-group-")) {
    const parts = page.split("-");

    renderSubjectChoices(
      parts[2],
      parts[3],
      "offline"
    );
  }

  // OFFLINE: SUBJECT -> POSTS
  else if (page.startsWith("offline-subject-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    const program = parts[2];
    const group = parts[3];
    const subjectKey = parts.slice(4).join("-");

    renderOfflinePosts(
      program,
      group,
      subjectKey,
      partIndex
    );
  }

  // ONLINE EXAMINATION: LEARN MORE -> SSC / HSC
  else if (page === "online-exam-choose") {
    renderOnlineExamLevels();
  }

  // ONLINE EXAMINATION: SSC / HSC -> GROUP
  else if (
    page === "online-exam-ssc" ||
    page === "online-exam-hsc"
  ) {
    renderGroups(
      page.replace("online-exam-", ""),
      "online-exam"
    );
  }

  // ONLINE EXAMINATION: GROUP -> SUBJECT
  else if (page.startsWith("online-exam-group-")) {
    const prefix = "online-exam-group-";
    const route = page.slice(prefix.length);
    const parts = route.split("-");

    renderSubjectChoices(
      parts[0],
      parts[1],
      "online-exam"
    );
  }

  // ONLINE EXAMINATION: SUBJECT -> EXAM POSTS
  else if (page.startsWith("online-exam-posts-")) {
    const prefix = "online-exam-posts-";
    const route = page.slice(prefix.length);

    const selected = route.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanRoute = route.replace(/-part-\d+$/, "");
    const parts = cleanRoute.split("-");

    const program = parts[0];
    const group = parts[1];
    const subjectKey = parts.slice(2).join("-");

    renderOnlineExamPosts(
      program,
      group,
      subjectKey,
      partIndex
    );
  }

  // ONLINE: PROGRAM -> GROUP
  else if (
    page === "online-ssc" ||
    page === "online-hsc" ||
    page === "online-admission"
  ) {
    renderGroups(
      page.replace("online-", ""),
      "online"
    );
  }

  // ONLINE: GROUP -> SUBJECT
  else if (page.startsWith("online-group-")) {
    const parts = page.split("-");

    renderSubjectChoices(
      parts[2],
      parts[3],
      "online"
    );
  }

  // ONLINE: SUBJECT -> VIDEO POSTS
  else if (page.startsWith("online-lessons-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    const program = parts[2];
    const group = parts[3];
    const subjectKey = parts.slice(4).join("-");

    renderOnlineLessons(
      program,
      group,
      subjectKey,
      partIndex
    );
  }

  // EXAM: LEARN MORE -> SSC / HSC
  else if (page === "exam-choose") {
    renderExamLevels();
  }

  // EXAM: SSC / HSC -> GROUP
  else if (
    page === "exam-ssc" ||
    page === "exam-hsc"
  ) {
    renderGroups(
      page.replace("exam-", ""),
      "exam"
    );
  }

  // EXAM: GROUP -> SUBJECT
  else if (page.startsWith("exam-group-")) {
    const parts = page.split("-");

    renderSubjectChoices(
      parts[2],
      parts[3],
      "exam"
    );
  }

  // EXAM: SUBJECT -> COURSE POSTS
  else if (page.startsWith("exam-courses-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    const program = parts[2];
    const group = parts[3];
    const subjectKey = parts.slice(4).join("-");

    renderExamCourses(
      program,
      group,
      subjectKey,
      partIndex
    );
  }

  // EXAM: COURSE DETAILS
  else if (page.startsWith("exam-detail-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    const program = parts[2];
    const group = parts[3];

    const subjectKey = parts.slice(4, -2).join("-");
    const courseId = parts.slice(-2).join("-");

    renderExamDetails(
      program,
      group,
      subjectKey,
      courseId,
      partIndex
    );
  }

  // STUDY MATERIALS: PDF / PRACTICE
  else if (
    page === "materials-pdf" ||
    page === "materials-practice"
  ) {
    renderMaterialLevels(
      page.replace("materials-", "")
    );
  }

  // MATERIALS: LEVEL
  else if (page.startsWith("materials-level-")) {
    const parts = page.split("-");

    renderMaterialGroups(
      parts[2],
      parts[3]
    );
  }

  // MATERIALS: GROUP
  else if (page.startsWith("materials-group-")) {
    const parts = page.split("-");

    renderMaterialSubjects(
      parts[2],
      parts[3],
      parts[4]
    );
  }

  // MATERIALS: PAPER SELECTION
  else if (page.startsWith("materials-parts-")) {
    const parts = page.split("-");

    renderMaterialParts(
      parts[2],
      parts[3],
      parts[4],
      parts.slice(5).join("-")
    );
  }

  // MATERIALS: SUBJECT -> CHAPTERS
  else if (page.startsWith("materials-subject-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    renderMaterialChapters(
      parts[2],
      parts[3],
      parts[4],
      parts.slice(5).join("-"),
      partIndex
    );
  }

  // MATERIALS: CHAPTER CONTENT
  else if (page.startsWith("materials-content-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    renderMaterialContent(
      parts[2],
      parts[3],
      parts[4],
      parts.slice(5, -2).join("-"),
      parts.slice(-2).join("-"),
      partIndex
    );
  }

  // PRACTICE: CQ / MCQ CONTENT
  else if (page.startsWith("materials-practice-content-")) {
    const selected = page.match(/-part-(\d+)$/);
    const partIndex = selected
      ? Number(selected[1])
      : null;

    const cleanPage = page.replace(/-part-\d+$/, "");
    const parts = cleanPage.split("-");

    renderPracticeContent(
      parts[3],
      parts[4],
      parts.slice(5, -3).join("-"),
      parts.slice(-3, -1).join("-"),
      parts[parts.length - 1],
      partIndex
    );
  }

  // PAGE NOT FOUND
  else {
    showNotFound();
  }

  window.scrollTo(0, 0);
}


// ==================================================
// URL ROUTING
// ==================================================

function renderRoute() {
  const params = new URLSearchParams(
    window.location.search
  );

  const page = params.get("page");

  if (page) {
    openPage(page);
  } else {
    updatePageHeaders(null);

    clearContent();

    innerPage.classList.remove("active");
    homePage.style.display = "block";

    document.title =
      "Change Maker Academy | Learn. Grow. Lead.";
  }
}

window.addEventListener("popstate", renderRoute);


// ==================================================
// INTERNAL NAVIGATION
// ==================================================

document.addEventListener("click", event => {
  const link = event.target.closest("a");

  if (!link) return;

  const href = link.getAttribute("href");

  if (!href) return;

  // Internal page navigation
  if (href.startsWith("?page=")) {
    event.preventDefault();

    if (window.location.search !== href) {
      history.pushState({}, "", href);
    }

    renderRoute();
    return;
  }

  // Homepage section links from inner pages
  if (
    href.startsWith("#") &&
    innerPage.classList.contains("active")
  ) {
    const targetId = href.slice(1);

    event.preventDefault();

    clearContent();
    updatePageHeaders(null);

    innerPage.classList.remove("active");
    homePage.style.display = "block";

    history.pushState({}, "", href);

    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }

    return;
  }

  // Homepage section links
  if (
    href.startsWith("#") &&
    !innerPage.classList.contains("active")
  ) {
    const target = document.querySelector(href);

    if (target) {
      event.preventDefault();

      target.scrollIntoView({ behavior: "smooth" });
    }
  }
});


// ==================================================
// START
// ==================================================

renderRoute();
    
