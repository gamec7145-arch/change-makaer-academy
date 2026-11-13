
// ==================================================
// CHANGE MAKER ACADEMY
// SHARED DATA & FUNCTIONS
// ==================================================


// ==================================================
// SUBJECT DATABASE
// Bangladesh General Education Board
// SSC & HSC
// Based on NCTB subject structure
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
// SUBJECT PAPER DATABASE
//
// SSC:
// Bangla and English have two papers.
//
// HSC:
// ICT has one paper.
// Other listed HSC subjects have two papers.
//
// Empty array = no paper selection required.
// ==================================================

const subjectParts = {

 ssc: {

  bangla: ["1st Paper","2nd Paper"],
  english: ["1st Paper","2nd Paper"]

 },


 hsc: {

  // Compulsory subjects
  bangla: ["1st Paper","2nd Paper"],
  english: ["1st Paper","2nd Paper"],

  // Science subjects
  physics: ["1st Paper","2nd Paper"],
  chemistry: ["1st Paper","2nd Paper"],
  biology: ["1st Paper","2nd Paper"],
  "higher-math": ["1st Paper","2nd Paper"],

  // Science optional subjects
  agriculture: ["1st Paper","2nd Paper"],
  geography: ["1st Paper","2nd Paper"],
  psychology: ["1st Paper","2nd Paper"],
  statistics: ["1st Paper","2nd Paper"],
  "soil-science": ["1st Paper","2nd Paper"],
  "engineering-drawing": ["1st Paper","2nd Paper"],
  sports: ["1st Paper","2nd Paper"],

  // Humanities subjects
  history: ["1st Paper","2nd Paper"],
  "islamic-history": ["1st Paper","2nd Paper"],
  civics: ["1st Paper","2nd Paper"],
  economics: ["1st Paper","2nd Paper"],
  logic: ["1st Paper","2nd Paper"],
  sociology: ["1st Paper","2nd Paper"],
  "social-work": ["1st Paper","2nd Paper"],
  "islamic-studies": ["1st Paper","2nd Paper"],
  "home-science": ["1st Paper","2nd Paper"],
  "fine-arts": ["1st Paper","2nd Paper"],
  arabic: ["1st Paper","2nd Paper"],
  sanskrit: ["1st Paper","2nd Paper"],
  pali: ["1st Paper","2nd Paper"],
  anthropology: ["1st Paper","2nd Paper"],

  // Business Studies subjects
  accounting: ["1st Paper","2nd Paper"],
  "finance-banking": ["1st Paper","2nd Paper"],
  "business-management": ["1st Paper","2nd Paper"],
  "production-marketing": ["1st Paper","2nd Paper"],

  // Other optional subjects
  "tourism-hospitality": ["1st Paper","2nd Paper"],
  "human-resource": ["1st Paper","2nd Paper"]

 }

};


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
   
