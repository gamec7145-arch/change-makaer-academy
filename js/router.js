
// ==================================================
// CHANGE MAKER ACADEMY
// PAGE ROUTER
// ==================================================

function openPage(page) {

 homePage.style.display = "none";
 innerPage.classList.add("active");
 clearContent();


 // ==================================================
 // SUBJECT PAPER SELECTION
 // ==================================================

 if (page.startsWith("subject-parts-")) {

  const parts = page.split("-");

  const mode = parts[2];
  const program = parts[3];
  const group = parts[4];
  const subjectKey = parts.slice(5).join("-");

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
 // MATERIALS: SUBJECT
 // ==================================================

 else if (page.startsWith("materials-subject-")) {

  const parts = page.split("-");

  const type = parts[2];
  const level = parts[3];
  const group = parts[4];
  const subjectKey = parts.slice(5).join("-");

  renderMaterialChapters(
   type,
   level,
   group,
   subjectKey
  );

 }


 // ==================================================
 // MATERIALS: CHAPTER CONTENT
 // ==================================================

 else if (page.startsWith("materials-content-")) {

  const parts = page.split("-");

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
   chapter
  );

 }


 // ==================================================
 // PRACTICE: CQ / MCQ CONTENT
 // ==================================================

 else if (page.startsWith("materials-practice-content-")) {

  const parts = page.split("-");

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
   kind
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
                                 
