
// ==================================================
// CHANGE MAKER ACADEMY
// SHARED DATA & FUNCTIONS
// ==================================================


// ==================================================
// SUBJECT DATABASE
// Bangladesh General Education Board
// SSC & HSC
// ==================================================

const learningSubjects = {

 science: {

  ssc: [

   // Common compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["General Mathematics","general-math"],
   ["Religion and Moral Education","religion"],
   ["ICT","ict"],
   ["Career Education","career-education"],
   ["Physical Education, Health Science and Sports","physical-education"],

   // Science group subjects
   ["Physics","physics"],
   ["Chemistry","chemistry"],
   ["Biology","biology"],
   ["Higher Mathematics","higher-math"],
   ["Bangladesh and Global Studies","bangladesh-global-studies"],

   // Optional subjects
   ["Agriculture Studies","agriculture"],
   ["Home Science","home-science"],
   ["Geography and Environment","geography"],
   ["Arts and Crafts","arts-crafts"],
   ["Music","music"],
   ["Small Ethnic Groups Language and Culture","ethnic-language"],
   ["Basic Trade","basic-trade"]
  ],

  hsc: [

   // Compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["ICT","ict"],

   // Science group subjects
   ["Physics","physics"],
   ["Chemistry","chemistry"],
   ["Biology","biology"],
   ["Higher Mathematics","higher-math"],

   // Optional subjects
   ["Agriculture Studies","agriculture"],
   ["Geography","geography"],
   ["Psychology","psychology"],
   ["Statistics","statistics"],
   ["Soil Science","soil-science"],
   ["Engineering Drawing and Workshop Practice","engineering-drawing"],
   ["Sports","sports"]
  ]
 },


 arts: {

  ssc: [

   // Common compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["General Mathematics","general-math"],
   ["Religion and Moral Education","religion"],
   ["ICT","ict"],
   ["Career Education","career-education"],
   ["Physical Education, Health Science and Sports","physical-education"],

   // Humanities group subjects
   ["History of Bangladesh and World Civilization","history"],
   ["Geography and Environment","geography"],
   ["Economics","economics"],
   ["Civics and Citizenship","civics"],
   ["General Science","general-science"],

   // Optional subjects
   ["Agriculture Studies","agriculture"],
   ["Home Science","home-science"],
   ["Arts and Crafts","arts-crafts"],
   ["Music","music"],
   ["Small Ethnic Groups Language and Culture","ethnic-language"],
   ["Arabic","arabic"],
   ["Sanskrit","sanskrit"],
   ["Pali","pali"],
   ["Basic Trade","basic-trade"]
  ],

  hsc: [

   // Compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["ICT","ict"],

   // Humanities group subjects
   ["History","history"],
   ["Islamic History and Culture","islamic-history"],
   ["Civics and Good Governance","civics"],
   ["Economics","economics"],
   ["Logic","logic"],
   ["Sociology","sociology"],
   ["Social Work","social-work"],
   ["Geography","geography"],

   // Optional subjects
   ["Islamic Studies","islamic-studies"],
   ["Psychology","psychology"],
   ["Statistics","statistics"],
   ["Agriculture Studies","agriculture"],
   ["Home Science","home-science"],
   ["Fine Arts","fine-arts"],
   ["Arabic","arabic"],
   ["Sanskrit","sanskrit"],
   ["Pali","pali"],
   ["Anthropology","anthropology"],
   ["Sports","sports"]
  ]
 },


 commerce: {

  ssc: [

   // Common compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["General Mathematics","general-math"],
   ["Religion and Moral Education","religion"],
   ["ICT","ict"],
   ["Career Education","career-education"],
   ["Physical Education, Health Science and Sports","physical-education"],

   // Business Studies group subjects
   ["Business Entrepreneurship","business-entrepreneurship"],
   ["Accounting","accounting"],
   ["Finance and Banking","finance-banking"],
   ["General Science","general-science"],

   // Optional subjects
   ["Geography and Environment","geography"],
   ["Bangladesh and Global Studies","bangladesh-global-studies"],
   ["Agriculture Studies","agriculture"],
   ["Home Science","home-science"],
   ["Small Ethnic Groups Language and Culture","ethnic-language"],
   ["Arts and Crafts","arts-crafts"],
   ["Music","music"],
   ["Basic Trade","basic-trade"]
  ],

  hsc: [

   // Compulsory subjects
   ["Bangla","bangla"],
   ["English","english"],
   ["ICT","ict"],

   // Business Studies group subjects
   ["Business Organization and Management","business-management"],
   ["Accounting","accounting"],
   ["Finance, Banking and Insurance","finance-banking"],
   ["Production Management and Marketing","production-marketing"],

   // Optional subjects
   ["Economics","economics"],
   ["Geography","geography"],
   ["Statistics","statistics"],
   ["Agriculture Studies","agriculture"],
   ["Home Science","home-science"],
   ["Tourism and Hospitality","tourism-hospitality"],
   ["Human Resource Development","human-resource"]
  ]

 }

};


// ==================================================
// CENTRAL SUBJECT PAPER CONFIGURATION
// ==================================================

// Default paper structure for each level
// New subjects automatically follow these defaults.

const subjectPaperDefaults = {

 ssc: [],

 hsc: [
  "1st Paper",
  "2nd Paper"
 ]

};


// ==================================================
// SUBJECT-SPECIFIC PAPER OVERRIDES
// ==================================================

// These rules override the default paper structure.

const subjectPaperOverrides = {

 ssc: {

  bangla: [
   "1st Paper",
   "2nd Paper"
  ],

  english: [
   "1st Paper",
   "2nd Paper"
  ]

 },

 hsc: {

  // ICT does not use separate paper selection here.
  ict: []

 }

};


// ==================================================
// AUTOMATIC SUBJECT PAPER DATABASE GENERATOR
// ==================================================

function buildSubjectParts() {

 const database = {
  ssc: {},
  hsc: {}
 };

 const groups = Object.keys(learningSubjects);

 groups.forEach(group => {

  ["ssc", "hsc"].forEach(level => {

   const subjects =
    learningSubjects[group][level] || [];

   subjects.forEach(subject => {

    const subjectKey = subject[1];

    const overrides =
     subjectPaperOverrides[level] || {};

    const hasOverride =
     Object.prototype.hasOwnProperty.call(
      overrides,
      subjectKey
     );

    const papers = hasOverride
     ? overrides[subjectKey]
     : subjectPaperDefaults[level];

    database[level][subjectKey] = [
     ...papers
    ];

   });

  });

 });

 return database;

}


// Automatically generated paper database
const subjectParts = buildSubjectParts();


// ==================================================
// GROUP NAMES
// ==================================================

const groupNames = {
 science: "Science",
 arts: "Humanities",
 commerce: "Commerce"
};


// ==================================================
// DEMO IMAGES
// ==================================================

const demoImages = {

 science:
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85",

 arts:
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",

 commerce:
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",

 biology:
  "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=85",

 physics:
  "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=85",

 chemistry:
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85",

 ict:
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",

 classroom:
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=85"

};


// ==================================================
// ONLINE VIDEO DATA
// ==================================================

const youtubeVideos = {

 // Example:
 // "ssc-science-physics": [
 //  {
 //   title:"Physics Chapter 1",
 //   url:"https://youtu.be/VIDEO_ID",
 //   image:""
 //  }
 // ]

};


// ==================================================
// EXAM COURSE DATA
// ==================================================

const examCourses = [

 {
  id: "course-1",
  name: "Complete Subject Preparation",
  price: "To be announced",
  description:
   "A structured subject-wise preparation course with lessons and study guidance.",
  image:
   "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=85",
  videos: []
 },

 {
  id: "course-2",
  name: "Exam Revision Course",
  price: "To be announced",
  description:
   "Revision-focused lessons and preparation support for upcoming examinations.",
  image:
   "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=85",
  videos: []
 }

];


// ==================================================
// UNIVERSAL YOUTUBE VIDEO PLAYER
// ==================================================

let activeVideoFrame = null;
let activeVideoObserver = null;
let activeVideoSlot = null;


function getYouTubeVideoId(value) {

 const text = String(value || "").trim();

 if (!text) return "";

 if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
  return text;
 }

 const match = text.match(
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
 );

 return match ? match[1] : "";

}


function stopActiveVideo() {

 if (activeVideoObserver) {
  activeVideoObserver.disconnect();
  activeVideoObserver = null;
 }

 if (activeVideoFrame) {
  activeVideoFrame.src = "about:blank";
  activeVideoFrame.remove();
  activeVideoFrame = null;
 }

 if (activeVideoSlot) {
  activeVideoSlot.classList.remove("active");
  activeVideoSlot.innerHTML = "";
  activeVideoSlot = null;
 }

}


function playUniversalVideo(videoId, slot, title) {

 if (!videoId || !slot) return;

 stopActiveVideo();

 const iframe = document.createElement("iframe");

 iframe.className = "detail-video";

 iframe.src =
  "https://www.youtube-nocookie.com/embed/" +
  encodeURIComponent(videoId) +
  "?autoplay=1&playsinline=1&rel=0";

 iframe.title = title || "Academy video lesson";

 iframe.allow =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

 iframe.allowFullscreen = true;
 iframe.loading = "eager";

 iframe.referrerPolicy = "strict-origin-when-cross-origin";

 slot.innerHTML = "";
 slot.classList.add("active");
 slot.appendChild(iframe);

 activeVideoFrame = iframe;
 activeVideoSlot = slot;

 if ("IntersectionObserver" in window) {

  activeVideoObserver = new IntersectionObserver(entries => {

   entries.forEach(entry => {

    if (
     !entry.isIntersecting ||
     entry.intersectionRatio < 0.20
    ) {
     stopActiveVideo();
    }

   });

  }, {
   threshold: [0, 0.20]
  });

  activeVideoObserver.observe(slot);

 }

}


document.addEventListener("visibilitychange", () => {

 if (document.hidden) {
  stopActiveVideo();
 }

});


// ==================================================
// PAGE ELEMENTS
// ==================================================

const innerPage = document.getElementById("innerPage");
const homePage = document.getElementById("homePage");
const pageBanner = document.getElementById("pageBanner");
const pageTitle = document.getElementById("pageTitle");
const pageLabel = document.getElementById("pageLabel");
const pageDescription = document.getElementById("pageDescription");
const pageContent = document.getElementById("pageContent");
const backLink = document.getElementById("backLink");


// ==================================================
// SHARED PAGE FUNCTIONS
// ==================================================

function setPage(title, label, description, image, back) {

 pageTitle.textContent = title;
 pageLabel.textContent = label;
 pageDescription.textContent = description;

 pageBanner.src = image || demoImages.classroom;
 pageBanner.alt = title + " banner";

 backLink.href = back || "?";

 document.title = title + " | Change Maker Academy";

}


function clearContent() {

 stopActiveVideo();

 pageContent.innerHTML = "";

}


function makeCard(title, subtitle, url, icon = "▤") {

 const a = document.createElement("a");

 a.className = "choice-card";
 a.href = url;

 const symbol = document.createElement("span");

 symbol.className = "choice-icon";
 symbol.textContent = icon;

 const info = document.createElement("div");

 const strong = document.createElement("strong");
 strong.textContent = title;

 const small = document.createElement("small");
 small.textContent = subtitle;

 info.append(strong, small);

 a.append(symbol, info);

 return a;

}


function makeGrid() {

 const grid = document.createElement("div");

 grid.className = "choice-grid";

 return grid;

}


function makeEmpty(text) {

 const note = document.createElement("div");

 note.className = "empty-note";
 note.textContent = text;

 return note;

}


// ==================================================
// GET SUBJECTS
// ==================================================

function getSubjects(group, level) {

 if (!learningSubjects[group]) return [];

 const actualLevel =
  level === "admission" ? "hsc" : level;

 return learningSubjects[group][actualLevel] || [];

}


// ==================================================
// GET SINGLE SUBJECT
// ==================================================

function getSubject(group, level, key) {

 return getSubjects(group, level).find(
  item => item[1] === key
 );

}


// ==================================================
// GET SUBJECT PAPERS / PARTS
// ==================================================

function getSubjectParts(group, level, key) {

 const actualLevel =
  level === "admission" ? "hsc" : level;

 const subject = getSubject(group, actualLevel, key);

 if (!subject) return [];

 return subjectParts[actualLevel]?.[key] || [];

}


// ==================================================
// CHECK IF SUBJECT HAS MULTIPLE PAPERS
// ==================================================

function hasSubjectParts(group, level, key) {

 return getSubjectParts(group, level, key).length > 0;

}


// ==================================================
// PAGE NOT FOUND
// ==================================================

function showNotFound() {

 setPage(
  "Page Not Found",
  "404",
  "This page could not be found.",
  demoImages.classroom,
  "?"
 );

 pageContent.appendChild(
  makeEmpty(
   "Please return to the homepage and choose a valid section."
  )
 );

 }

// ==================================================
// ONLINE EXAMINATION: DEMO EXAM POSTS
// Future Admin Panel compatible data structure
// ==================================================

window.onlineExamPosts = [
 {
  id: "demo-english-01",
  program: "ssc",
  group: "science",
  subject: "english",
  part: 1,

  title: "Grammar Practice Examination",
  chapter: "1",
  chapterName: "Grammar Practice",
  caption: "Test your English grammar knowledge.",

  image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",

  duration: 20,
  mcqCount: 10,

  questions: []
 },

 {
  id: "demo-english-02",
  program: "ssc",
  group: "science",
  subject: "english",
  part: 1,

  title: "Reading Practice Examination",
  chapter: "2",
  chapterName: "Reading Practice",
  caption: "Challenge yourself with English reading questions.",

  image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=85",

  duration: 15,
  mcqCount: 10,

  questions: []
 }
];

     


// ==================================================
// CONTEXTUAL HEADER SEARCH
// Header er search bar ekhon jei page-e acho, shei page er content-i khoje:
//  - Home            -> class / course / feature gulo (dropdown e)
//  - Subject/Group/Batch/Material... list page -> oi page er card gulo filter kore
//  - Chapter page    -> chapter + post (class-prep.js register kore)
// ==================================================
(function () {
 "use strict";

 const ITEM_SEL = ".choice-card,.fc-card,.fc-video-cards>*,.batch-card,.course-card,.video-lesson,.offline-post,.exam-video-card,.exam-resource-row,.classroom-option";
 const HOME_PH = "ক্লাস বা কোর্স খুঁজুন…";
 const PAGE_PH = "এই পেজে খুঁজুন…";
 const DEFAULT_PH = "কী খুঁজতে চাও?";

 let ctx = null;          // { anchor, handler, placeholder } (page-specific search)
 let lastMode = "";
 let panel, input, note, drop, btn, pc, home;

 const norm = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

 function homeVisible() { return home && home.style.display !== "none"; }
 function ctxActive() { return ctx && ctx.anchor && document.body.contains(ctx.anchor); }
 function modeNow() {
  if (ctxActive()) return "ctx:" + (ctx.placeholder || "");
  if (homeVisible()) return "home";
  return pc && pc.querySelector(ITEM_SEL) ? "page" : "none";
 }

 function resetUI() {
  if (note) { note.textContent = ""; note.hidden = true; }
  if (drop) { drop.innerHTML = ""; drop.hidden = true; }
  if (pc) pc.querySelectorAll("[data-cma-hid]").forEach(el => { el.style.display = ""; el.removeAttribute("data-cma-hid"); });
 }

 function sync() {
  if (!input) return;
  const m = modeNow();
  if (m !== lastMode) { lastMode = m; input.value = ""; resetUI(); }
  input.placeholder = m.indexOf("ctx:") === 0 ? ctx.placeholder
   : m === "home" ? HOME_PH : m === "page" ? PAGE_PH : DEFAULT_PH;
 }

 function setNote(text) { note.textContent = text; note.hidden = !text; }

 // ---- Home: dropdown of matching links ----
 function searchHome(q) {
  drop.innerHTML = ""; drop.hidden = true; setNote("");
  if (!q) return;
  const seen = new Set(), hits = [];
  home.querySelectorAll("a[href]").forEach(a => {
   const text = (a.textContent || "").replace(/\s+/g, " ").trim();
   const href = a.getAttribute("href");
   if (!text || text.length > 80 || !href || href === "#" || href.indexOf("javascript") === 0) return;
   if (a.closest(".cma-bottom-nav,.footer,.mobile-menu")) return;
   if (!norm(text).includes(q)) return;
   const key = href + "|" + text;
   if (seen.has(key)) return;
   seen.add(key); hits.push({ text, href });
  });
  if (!hits.length) return setNote("কিছু পাওয়া যায়নি।");
  hits.slice(0, 8).forEach(h => {
   const a = document.createElement("a");
   a.href = h.href; a.textContent = h.text;
   drop.appendChild(a);
  });
  drop.hidden = false;
 }

 // ---- Inner page: filter the cards that are on this page ----
 function searchPage() {
  const q = norm(input.value);
  const items = Array.from(pc.querySelectorAll(ITEM_SEL));
  let shown = 0;
  items.forEach(el => {
   const match = !q || norm(el.textContent).includes(q);
   if (match) { if (el.hasAttribute("data-cma-hid")) { el.style.display = ""; el.removeAttribute("data-cma-hid"); } shown++; }
   else { el.style.display = "none"; el.setAttribute("data-cma-hid", "1"); }
  });
  setNote(q && !shown ? "কিছু পাওয়া যায়নি।" : "");
 }

 function run() {
  sync();
  const m = modeNow();
  const q = norm(input.value);
  if (m.indexOf("ctx:") === 0) { setNote(""); ctx.handler(input.value); }
  else if (m === "home") searchHome(q);
  else if (m === "page") searchPage();
 }

 window.CMAPageSearch = {
  register: function (anchor, handler, placeholder) {
   ctx = { anchor: anchor, handler: handler, placeholder: placeholder || PAGE_PH };
   setTimeout(sync, 0);
  }
 };

 function init() {
  panel = document.getElementById("cmaSearch");
  input = document.getElementById("cmaSearchInput");
  pc = document.getElementById("pageContent");
  home = document.getElementById("homePage");
  if (!panel || !input) return;
  btn = panel.querySelector("button");

  note = document.createElement("div"); note.className = "cma-search-note"; note.hidden = true;
  drop = document.createElement("div"); drop.className = "cma-search-drop"; drop.hidden = true;
  panel.append(note, drop);

  // Replace the old "go to ?search=" button behaviour (capture phase beats inline onclick)
  panel.addEventListener("click", function (e) {
   if (btn && (e.target === btn || btn.contains(e.target))) { e.stopPropagation(); e.preventDefault(); run(); }
  }, true);
  input.addEventListener("input", run);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run(); } });
  drop.addEventListener("click", function () { panel.classList.remove("open"); });

  // Page changes (router re-renders #pageContent / toggles #homePage)
  const re = function () { requestAnimationFrame(sync); };
  if (pc) new MutationObserver(re).observe(pc, { childList: true });
  if (home) new MutationObserver(re).observe(home, { attributes: true, attributeFilter: ["style"] });
  window.addEventListener("popstate", re);
  sync();
 }

 if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
 else init();
})();
