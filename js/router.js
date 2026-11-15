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

// প্রতিটি navigation-এর আলাদা revision
let cmaNavigationRevision = 0;

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

function validateCommunityModule(src) {
  const moduleName = getCommunityModuleName(src);

  if (!moduleName) {
    throw new Error("Unknown Community module: " + src);
  }

  if (!window[moduleName] || typeof window[moduleName] !== "object") {
    throw new Error(
      "Community module did not initialize correctly: " + moduleName
    );
  }

  return true;
}

function loadCommunityModules() {
  if (cmaCommunityLoadPromise) {
    return cmaCommunityLoadPromise;
  }

  cmaCommunityLoadPromise = CMA_COMMUNITY_FILES.reduce(
    (promise, src) => {
      return promise.then(() => loadCommunityFile(src));
    },
    Promise.resolve()
  ).catch(error => {
    cmaCommunityLoadPromise = null;
    throw error;
  });

  return cmaCommunityLoadPromise;
}

function loadCommunityFile(src) {
  const moduleName = getCommunityModuleName(src);

  if (!moduleName) {
    return Promise.reject(
      new Error("Unknown Community module: " + src)
    );
  }

  // আগে থেকেই module তৈরি থাকলে সেটি যাচাই করে ব্যবহার
  if (window[moduleName] && typeof window[moduleName] === "object") {
    return Promise.resolve(true);
  }

  if (cmaCommunityScriptPromises[src]) {
    return cmaCommunityScriptPromises[src];
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

  // Module তৈরি না হলে পুরোনো script সরিয়ে নতুন করে load
  let script = existing;

  if (script) {
    script.remove();
    script = null;
  }

  const promise = new Promise((resolve, reject) => {
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

      cleanup();

      try {
        validateCommunityModule(src);
        script.dataset.cmaLoaded = "true";
        resolve(true);
      } catch (error) {
        delete cmaCommunityScriptPromises[src];
        reject(error);
      }
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

    if (!script.isConnected) {
      document.head.appendChild(script);
    }
  });

  cmaCommunityScriptPromises[src] = promise;
  return promise;
}


// ==================================================
// COMMUNITY PAGE RENDERING
// ==================================================

function showCommunityError(root, message) {
  if (!root) return;

  root.innerHTML = `
    <div class="cma-community">
      <div style="
        padding:30px 16px;
        text-align:center;
        color:#A8C0CE;
      ">
        <h3 style="color:#FFFFFF;">Community could not load</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
}

async function renderCommunitySection(
  page,
  targetUserId = null,
  navigationRevision = cmaNavigationRevision
) {
  const root = document.getElementById("pageContent");
  if (!root) return;

  try {
    await loadCommunityModules();

    // অপেক্ষার সময় অন্য page খোলা হলে পুরোনো render বন্ধ
    if (navigationRevision !== cmaNavigationRevision) return;

    if (page === "home") {
      if (typeof window.renderCommunityPage !== "function") {
        throw new Error("Community homepage renderer not found.");
      }

      await window.renderCommunityPage();

      if (navigationRevision !== cmaNavigationRevision) return;
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

    if (!selectedModule) {
      throw new Error("Community module is missing: " + page);
    }

    // যেসব module এখনো তৈরি হয়নি, তাদের জন্য placeholder
    if (typeof selectedModule.render !== "function") {
      const titles = {
        profile: "Profile",
        friends: "Friends",
        creator: "Creator Panel",
        notifications: "Notifications",
        search: "Search",
        messaging: "Messages"
      };

      if (navigationRevision !== cmaNavigationRevision) return;

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
      return;
    }

    if (page === "profile") {
      await selectedModule.render(root, targetUserId);
    } else {
      await selectedModule.render(root);
    }

    // Render চলার সময় অন্য page-এ গেলে stale result উপেক্ষা
    if (navigationRevision !== cmaNavigationRevision) return;

  } catch (error) {
    console.error("Community section error:", error);

    if (navigationRevision !== cmaNavigationRevision) return;

    showCommunityError(
      root,
      "Please refresh the page and try again."
    );
  }
}


// ==================================================
// COMMUNITY NAVIGATION
// ==================================================

function navigateCommunity(
  page,
  updateHistory = true,
  targetUserId = null
) {
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
    const params = new URLSearchParams(
      window.location.search
    );

    params.set("page", urlPage);

    if (page === "profile" && targetUserId) {
      params.set("userId", targetUserId);
    } else {
      params.delete("userId");
    }

    const newUrl = "?" + params.toString();

    if (window.location.search !== newUrl) {
      history.pushState({}, "", newUrl);
    }
  }

  openPage(urlPage);
}


// ==================================================
// COMMUNITY EVENT LISTENERS — FIXED
// ==================================================

const cmaHandledCommunityEvents = new WeakSet();

function handleCMACommunityNavigate(event) {
  if (!event || cmaHandledCommunityEvents.has(event)) {
    return;
  }

  cmaHandledCommunityEvents.add(event);

  const detail = event.detail || {};

  const page = typeof detail === "string"
    ? detail
    : detail.page;

  const targetUserId = typeof detail === "object"
    ? (detail.userId || detail.targetUserId || null)
    : null;

  if (!page) return;

  const normalizedPage = CMA_COMMUNITY_ROUTES[page] || page;

  navigateCommunity(
    normalizedPage,
    true,
    targetUserId
  );
}

function handleCMACommunitySearch(event) {
  if (!event || cmaHandledCommunityEvents.has(event)) {
    return;
  }

  cmaHandledCommunityEvents.add(event);

  navigateCommunity("search");
}

// Document এবং Window — দুই জায়গার event গ্রহণ
if (!window.cmaRouterEventsBound) {
  window.cmaRouterEventsBound = true;

  document.addEventListener(
    "cma:navigate",
    handleCMACommunityNavigate
  );

  window.addEventListener(
    "cma:navigate",
    handleCMACommunityNavigate
  );

  document.addEventListener(
    "cma:open-search",
    handleCMACommunitySearch
  );

  window.addEventListener(
    "cma:open-search",
    handleCMACommunitySearch
  );
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
    if (typeof showNotFound === "function") {
      showNotFound();
    }
    return;
  }

  // নতুন navigation শুরু
  const navigationRevision = ++cmaNavigationRevision;

  const homePageElement = document.getElementById("homePage");
  const innerPageElement = document.getElementById("innerPage");

  if (!homePageElement || !innerPageElement) {
    console.error("Router: Required page elements are missing.");
    return;
  }

  updatePageHeaders(page);

  homePageElement.style.display = "none";
  innerPageElement.classList.add("active");

  if (typeof clearContent === "function") {
    clearContent();
  }

  // COMMUNITY ROUTES
  if (CMA_COMMUNITY_ROUTES[page]) {
    const params = new URLSearchParams(
      window.location.search
    );

    const targetUserId = params.get("userId");

    renderCommunitySection(
      CMA_COMMUNITY_ROUTES[page],
      targetUserId,
      navigationRevision
    );

    return;
  }

  // STUDENT ACCOUNT
  if (page === "account") {
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
    // চলমান পুরোনো async navigation বাতিল
    cmaNavigationRevision++;

    updatePageHeaders(null);

    const homePageElement = document.getElementById("homePage");
    const innerPageElement = document.getElementById("innerPage");

    if (typeof clearContent === "function") {
      clearContent();
    }

    if (innerPageElement) {
      innerPageElement.classList.remove("active");
    }

    if (homePageElement) {
      homePageElement.style.display = "block";
    }

    document.title =
      "Change Maker Academy | Learn. Grow. Lead.";
  }
}


// ==================================================
// BROWSER BACK / FORWARD
// ==================================================

window.addEventListener("popstate", function() {
  renderRoute();
});


// ==================================================
// INTERNAL NAVIGATION
// ==================================================

document.addEventListener("click", event => {
  const clickedElement = event.target;

  if (!clickedElement || typeof clickedElement.closest !== "function") {
    return;
  }

  const link = clickedElement.closest("a");

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
    document.getElementById("innerPage")?.classList.contains("active")
  ) {
    const targetId = href.slice(1);

    event.preventDefault();

    // চলমান Community navigation বাতিল
    cmaNavigationRevision++;

    if (typeof clearContent === "function") {
      clearContent();
    }

    updatePageHeaders(null);

    const innerPageElement = document.getElementById("innerPage");
    const homePageElement = document.getElementById("homePage");

    if (innerPageElement) {
      innerPageElement.classList.remove("active");
    }

    if (homePageElement) {
      homePageElement.style.display = "block";
    }

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
    !document.getElementById("innerPage")?.classList.contains("active")
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
