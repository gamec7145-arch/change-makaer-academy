
 // ==================================================
 // CHANGE MAKER ACADEMY
 // AUTOMATIC HEADER CONTROL SYSTEM
 // ==================================================

function updatePageHeaders(page) {

 const topHeader = document.querySelector(".header");
 const secondHeader = document.querySelector(".cma-bottom-nav");

 const showTop = (
  !page ||
  page === "community" ||
  page.startsWith("community-") ||
  page === "teachers" ||
  page.startsWith("teachers-")
 );

 const showSecond = (
  !page ||
  page === "community" ||
  page.startsWith("community-")
 );

 if (topHeader) {
  topHeader.style.display = showTop ? "" : "none";
 }

 if (secondHeader) {
  secondHeader.style.display = showSecond ? "" : "none";
 }

}


// ==================================================
// CHANGE MAKER ACADEMY
// PAGE ROUTER
// ==================================================

function openPage(page) {

 updatePageHeaders(page);

 homePage.style.display = "none";
 innerPage.classList.add("active");
 clearContent();


 // ==================================================
 // ONLINE EXAMINATION: START EXAM
 // ==================================================

 if (page.startsWith("online-exam-start-")) {

  const prefix = "online-exam-start-";
  const postId = page.slice(prefix.length);

  renderOnlineExamStart(postId);

 }


 // ==================================================
 // SUBJECT PAPER SELECTION
 // ==================================================

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

  }

  else {

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


 // ==================================================
 // OFFLINE: SSC / HSC -> GROUP
 // ==================================================

 else if (
  page === "offline-ssc" ||
  page === "offline-hsc"
 ) {

  renderGroups(
   page.replace("offline-", ""),
   "offline"
  );

 }


 // ==================================================
 // OFFLINE: GROUP -> SUBJECT
 // ==================================================

 else if (page.startsWith("offline-group-")) {

  const parts = page.split("-");

  renderSubjectChoices(
   parts[2],
   parts[3],
   "offline"
  );

 }


 // ==================================================
 // OFFLINE: SUBJECT -> POSTS
 // ==================================================

 else if (page.startsWith("offline-subject-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

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


 // ==================================================
 // ONLINE EXAMINATION: LEARN MORE -> SSC / HSC
 // ==================================================

 else if (page === "online-exam-choose") {

  renderOnlineExamLevels();

 }


 // ==================================================
 // ONLINE EXAMINATION: SSC / HSC -> GROUP
 // ==================================================

 else if (
  page === "online-exam-ssc" ||
  page === "online-exam-hsc"
 ) {

  renderGroups(
   page.replace("online-exam-", ""),
   "online-exam"
  );

 }


 // ==================================================
 // ONLINE EXAMINATION: GROUP -> SUBJECT
 // ==================================================

 else if (page.startsWith("online-exam-group-")) {

  const prefix = "online-exam-group-";
  const route = page.slice(prefix.length);
  const parts = route.split("-");

  const program = parts[0];
  const group = parts[1];

  renderSubjectChoices(
   program,
   group,
   "online-exam"
  );

 }


 // ==================================================
 // ONLINE EXAMINATION: SUBJECT -> EXAM POSTS
 // ==================================================

 else if (page.startsWith("online-exam-posts-")) {

  const prefix = "online-exam-posts-";
  const route = page.slice(prefix.length);

  const selected = route.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

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


 // ==================================================
 // ONLINE: PROGRAM -> GROUP
 // ==================================================

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


 // ==================================================
 // ONLINE: GROUP -> SUBJECT
 // ==================================================

 else if (page.startsWith("online-group-")) {

  const parts = page.split("-");

  renderSubjectChoices(
   parts[2],
   parts[3],
   "online"
  );

 }


 // ==================================================
 // ONLINE: SUBJECT -> VIDEO POSTS
 // ==================================================

 else if (page.startsWith("online-lessons-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

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


 // ==================================================
 // EXAM: LEARN MORE -> SSC / HSC
 // ==================================================

 else if (page === "exam-choose") {

  renderExamLevels();

 }


 // ==================================================
 // EXAM: SSC / HSC -> GROUP
 // ==================================================

 else if (
  page === "exam-ssc" ||
  page === "exam-hsc"
 ) {

  renderGroups(
   page.replace("exam-", ""),
   "exam"
  );

 }


 // ==================================================
 // EXAM: GROUP -> SUBJECT
 // ==================================================

 else if (page.startsWith("exam-group-")) {

  const parts = page.split("-");

  renderSubjectChoices(
   parts[2],
   parts[3],
   "exam"
  );

 }


 // ==================================================
 // EXAM: SUBJECT -> COURSE POSTS
 // ==================================================

 else if (page.startsWith("exam-courses-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

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


 // ==================================================
 // EXAM: COURSE DETAILS
 // ==================================================

 else if (page.startsWith("exam-detail-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

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


 // ==================================================
 // STUDY MATERIALS: PDF / PRACTICE
 // ==================================================

 else if (
  page === "materials-pdf" ||
  page === "materials-practice"
 ) {

  renderMaterialLevels(
   page.replace("materials-", "")
  );

 }


 // ==================================================
 // MATERIALS: LEVEL
 // ==================================================

 else if (page.startsWith("materials-level-")) {

  const parts = page.split("-");

  renderMaterialGroups(
   parts[2],
   parts[3]
  );

 }


 // ==================================================
 // MATERIALS: GROUP
 // ==================================================

 else if (page.startsWith("materials-group-")) {

  const parts = page.split("-");

  renderMaterialSubjects(
   parts[2],
   parts[3],
   parts[4]
  );

 }


 // ==================================================
 // MATERIALS: PAPER SELECTION
 // ==================================================

 else if (page.startsWith("materials-parts-")) {

  const parts = page.split("-");

  const type = parts[2];
  const level = parts[3];
  const group = parts[4];
  const subjectKey = parts.slice(5).join("-");

  renderMaterialParts(
   type,
   level,
   group,
   subjectKey
  );

 }


 // ==================================================
 // MATERIALS: SUBJECT -> CHAPTERS
 // ==================================================

 else if (page.startsWith("materials-subject-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

  const cleanPage = page.replace(/-part-\d+$/, "");
  const parts = cleanPage.split("-");

  const type = parts[2];
  const level = parts[3];
  const group = parts[4];
  const subjectKey = parts.slice(5).join("-");

  renderMaterialChapters(
   type,
   level,
   group,
   subjectKey,
   partIndex
  );

 }


 // ==================================================
 // MATERIALS: CHAPTER CONTENT
 // ==================================================

 else if (page.startsWith("materials-content-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

  const cleanPage = page.replace(/-part-\d+$/, "");
  const parts = cleanPage.split("-");

  const type = parts[2];
  const level = parts[3];
  const group = parts[4];

  const subjectKey = parts.slice(5, -2).join("-");
  const chapter = parts.slice(-2).join("-");

  renderMaterialContent(
   type,
   level,
   group,
   subjectKey,
   chapter,
   partIndex
  );

 }


 // ==================================================
 // PRACTICE: CQ / MCQ CONTENT
 // ==================================================

 else if (page.startsWith("materials-practice-content-")) {

  const selected = page.match(/-part-(\d+)$/);
  const partIndex = selected ? Number(selected[1]) : null;

  const cleanPage = page.replace(/-part-\d+$/, "");
  const parts = cleanPage.split("-");

  const level = parts[3];
  const group = parts[4];

  const subjectKey = parts.slice(5, -3).join("-");
  const chapter = parts.slice(-3, -1).join("-");
  const kind = parts[parts.length - 1];

  renderPracticeContent(
   level,
   group,
   subjectKey,
   chapter,
   kind,
   partIndex
  );

 }


 // ==================================================
 // PAGE NOT FOUND
 // ==================================================

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

  history.pushState({}, "", href);

  renderRoute();

  return;

 }


 // Homepage section links from inner pages

 if (
  href.startsWith("#") &&
  innerPage.classList.contains("active")
 ) {

  event.preventDefault();

  clearContent();

  updatePageHeaders(null);

  innerPage.classList.remove("active");
  homePage.style.display = "block";

  history.pushState({}, "", href);

  const target = document.querySelector(href);

  if (target) {
   target.scrollIntoView({
    behavior: "smooth"
   });
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

   target.scrollIntoView({
    behavior: "smooth"
   });

  }

 }

});


// ==================================================
// START
// ==================================================

renderRoute();
