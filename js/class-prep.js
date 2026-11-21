// ==================================================
// CHANGE MAKER ACADEMY — ACADEMIC PREPARATION (Class 6–12)
// Ek file-e duita ongsho:
//   PART 1: MCQ post data   (notun post ekhane add koro)
//   PART 2: Class > Subject > Chapter > Post flow (form, search, cards)
// ==================================================

// ##################################################
// PART 1 — MCQ POSTS DATA
// ##################################################
// ==================================================
// CHANGE MAKER ACADEMY — CLASS 6–10 MCQ POSTS
// Notun post add korte ekta object copy kore niche paste koro.
//
//   program : "class-6" ... "class-10", "class-11" (= একাদশ–দ্বাদশ)
//   subject : class 6-8  -> bangla | english | math | science | bgs | ict | religion |
//                           physical-education | work-life | agriculture | home-science | arts-crafts
//             class 9-10 -> bangla | english | general-math | religion | ict | career-education |
//                           physical-education | physics | chemistry | biology | higher-math |
//                           bangladesh-global-studies | business-entrepreneurship | accounting |
//                           finance-banking | history | geography | economics | civics |
//                           general-science | agriculture | home-science | arts-crafts | music
//   chapter : chapter number (string)     chapterName : chapter er nam
//   questions: [{ question, options:[4ta], answer: correct option er index (0 theke) }]
//
// Chapter list ar search ei posts theke-i automatic toiri hoy.
// MCQ system hocche already thaka "Online Examination" (renderOnlineExamStart).
// Ekhaner 3ta post DEMO — nijer real post dewar por muche felte paro.
// ==================================================
(function () {
  "use strict";
  if (!Array.isArray(window.onlineExamPosts)) window.onlineExamPosts = [];

  // Class 6, 7, 8, 10, 11 e 1ta kore DEMO post (sotti-i kaj kore).
  // Admin panel ready hole ei gulo muche real post add korbe.
  const posts = [
    {
      id: "class6-math-ch1-01",
      program: "class-6", group: "general", subject: "math", part: null,
      chapter: "1", chapterName: "সংখ্যা পদ্ধতি",
      title: "সংখ্যা পদ্ধতি পরীক্ষা",
      caption: "ডেমো পোস্ট — সংখ্যা পদ্ধতির মৌলিক ধারণা যাচাই করো।",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "১২ + ৮ = কত?", options: ["১৮", "২০", "২২", "২৪"], answer: 1 },
        { question: "৫ × ৭ = কত?", options: ["৩০", "৩৫", "৪০", "৪৫"], answer: 1 },
        { question: "১০০ ÷ ৪ = কত?", options: ["২০", "২৫", "৩০", "৪০"], answer: 1 },
        { question: "কোনটি জোড় সংখ্যা?", options: ["৭", "৯", "১২", "১৫"], answer: 2 },
        { question: "কোনটি মৌলিক সংখ্যা?", options: ["৪", "৬", "৯", "১১"], answer: 3 }
      ]
    },
    {
      id: "class7-english-ch1-01",
      program: "class-7", group: "general", subject: "english", part: null,
      chapter: "1", chapterName: "Grammar Basics",
      title: "Grammar Basics Exam",
      caption: "Demo post — test your basic English grammar.",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "She ___ to school every day.", options: ["go", "goes", "going", "gone"], answer: 1 },
        { question: "I ___ reading a book now.", options: ["is", "are", "am", "be"], answer: 2 },
        { question: "What is the past form of 'eat'?", options: ["eated", "eaten", "ate", "eating"], answer: 2 },
        { question: "Which word means the same as 'big'?", options: ["small", "large", "thin", "short"], answer: 1 },
        { question: "Which word is a verb?", options: ["quick", "jump", "table", "blue"], answer: 1 }
      ]
    },
    {
      id: "class8-science-ch1-01",
      program: "class-8", group: "general", subject: "science", part: null,
      chapter: "1", chapterName: "বিজ্ঞানের মৌলিক ধারণা",
      title: "বিজ্ঞানের মৌলিক ধারণা পরীক্ষা",
      caption: "ডেমো পোস্ট — সাধারণ বিজ্ঞানের প্রাথমিক প্রশ্ন।",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "পানির রাসায়নিক সংকেত কোনটি?", options: ["CO₂", "H₂O", "O₂", "NaCl"], answer: 1 },
        { question: "কোনটি গ্যাসীয় পদার্থ?", options: ["লোহা", "পানি", "অক্সিজেন", "কাঠ"], answer: 2 },
        { question: "সাধারণ চাপে পানি কত ডিগ্রি সেলসিয়াসে ফুটে?", options: ["৫০", "৮০", "১০০", "১২০"], answer: 2 },
        { question: "উদ্ভিদ যে প্রক্রিয়ায় খাদ্য তৈরি করে তার নাম কী?", options: ["শ্বসন", "সালোকসংশ্লেষণ", "পরিপাক", "প্রস্বেদন"], answer: 1 },
        { question: "পৃথিবীর একমাত্র প্রাকৃতিক উপগ্রহ কোনটি?", options: ["মঙ্গল", "সূর্য", "চাঁদ", "শুক্র"], answer: 2 }
      ]
    },
    {
      id: "class10-general-math-ch1-01",
      program: "class-10", group: "general", subject: "general-math", part: null,
      chapter: "1", chapterName: "সেট ও ফাংশন",
      title: "সেট ও ফাংশন পরীক্ষা",
      caption: "ডেমো পোস্ট — সেট ও ফাংশনের মৌলিক ধারণা যাচাই করো।",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "A = {১, ২, ৩} সেটের উপাদান সংখ্যা কত?", options: ["২", "৩", "৪", "৬"], answer: 1 },
        { question: "যে সেটের কোনো উপাদান নেই তাকে কী বলে?", options: ["সার্বিক সেট", "একক সেট", "শূন্য সেট", "অসীম সেট"], answer: 2 },
        { question: "A = {১, ২}, B = {২, ৩} হলে A ∩ B = কত?", options: ["{১}", "{২}", "{৩}", "{১, ২, ৩}"], answer: 1 },
        { question: "A = {১, ২}, B = {২, ৩} হলে A ∪ B = কত?", options: ["{২}", "{১, ২}", "{২, ৩}", "{১, ২, ৩}"], answer: 3 },
        { question: "f(x) = 2x + 1 হলে f(3) = কত?", options: ["৫", "৬", "৭", "৮"], answer: 2 }
      ]
    }
,
    {
      id: "class11-physics-ch1-01",
      program: "class-11", group: "general", subject: "physics", part: null,
      chapter: "1", chapterName: "ভৌত জগৎ ও পরিমাপ",
      title: "ভৌত জগৎ ও পরিমাপ পরীক্ষা",
      caption: "ডেমো পোস্ট — পরিমাপ ও এককের মৌলিক ধারণা যাচাই করো।",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "দৈর্ঘ্যের SI একক কোনটি?", options: ["সেন্টিমিটার", "মিটার", "কিলোমিটার", "ইঞ্চি"], answer: 1 },
        { question: "ভরের SI একক কোনটি?", options: ["গ্রাম", "পাউন্ড", "কিলোগ্রাম", "টন"], answer: 2 },
        { question: "সময়ের SI একক কোনটি?", options: ["মিনিট", "ঘণ্টা", "দিন", "সেকেন্ড"], answer: 3 },
        { question: "কোনটি স্কেলার রাশি?", options: ["বেগ", "ভর", "সরণ", "বল"], answer: 1 },
        { question: "১ কিলোমিটার = কত মিটার?", options: ["১০", "১০০", "১০০০", "১০০০০"], answer: 2 }
      ]
    }
  ];

  // exam theke "back" korle ei post er chapter page-e ferar jonno
  posts.forEach(p => {
    p.backPage = "class-chapter-" + String(p.program).replace("class-", "") +
      "-" + p.subject + "-" + encodeURIComponent(p.chapter);
    const exists = window.onlineExamPosts.some(x => x.id === p.id);
    if (!exists) window.onlineExamPosts.push(p);
  });
})();


// ##################################################
// PART 2 — CLASS FLOW (form → subject → chapter + search → post → MCQ)
// ##################################################
// ==================================================
// CHANGE MAKER ACADEMY — ACADEMIC PREPARATION (Class 6–10)
// Home > Class card
//   -> Information form (Enroll)            ?page=class-prep-6
//   -> Subjects                              ?page=class-subjects-6
//   -> Chapters + search bar                 ?page=class-subject-6-math
//   -> Chapter posts                         ?page=class-chapter-6-math-1
//   -> MCQ exam (existing online exam)       ?page=online-exam-start-<postId>
//
// Posts live in window.onlineExamPosts (see js/class-prep-posts.js).
// A post belongs to a class when  post.program === "class-6" (… "class-10").
// Styling of the form re-uses the .fc-enroll-* classes injected by free-courses.js
// so the page looks exactly like the Game Changer 2.0 information form.
// ==================================================
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const bn = n => Number(n).toLocaleString("bn-BD");
  const sb = () => window.cmaSupabase;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ---------- class + subject config (edit here to change subjects) ----------
  const CLASS_NAMES = {
    6: "ষষ্ঠ শ্রেণি", 7: "সপ্তম শ্রেণি", 8: "অষ্টম শ্রেণি", 9: "নবম শ্রেণি", 10: "দশম শ্রেণি", 11: "একাদশ–দ্বাদশ"
  };
  // Subject list class onujaye alada. Format: [key, nam, tag]
  // ৬–৮: NCTB 2026 er official boi-er list (ঐচ্ছিক = school/choice onujaye).
  // ৯–১০: tomar project er nijer SSC subject list (shared.js > learningSubjects) onujaye.
  // Post add korar somoy `subject` field e ei key gulo-i dite hobe.
  const REQ = "আবশ্যিক", OPT = "ঐচ্ছিক";
  const MIDDLE = [
    ["bangla", "বাংলা", REQ], ["english", "ইংরেজি", REQ], ["math", "গণিত", REQ],
    ["science", "বিজ্ঞান", REQ], ["bgs", "বাংলাদেশ ও বিশ্বপরিচয়", REQ],
    ["ict", "তথ্য ও যোগাযোগ প্রযুক্তি", REQ], ["religion", "ধর্ম ও নৈতিক শিক্ষা", REQ],
    ["physical-education", "শারীরিক শিক্ষা ও স্বাস্থ্য", REQ],
    ["work-life", "কর্ম ও জীবনমুখী শিক্ষা", REQ],
    ["agriculture", "কৃষিশিক্ষা", OPT], ["home-science", "গার্হস্থ্যবিজ্ঞান", OPT],
    ["arts-crafts", "চারু ও কারুকলা", OPT]
  ];
  const ALL = "সবার জন্য";
  const SSC_SUBJECTS = [
    ["bangla", "বাংলা", ALL], ["english", "ইংরেজি", ALL],
    ["general-math", "সাধারণ গণিত", ALL], ["religion", "ধর্ম ও নৈতিক শিক্ষা", ALL],
    ["ict", "তথ্য ও যোগাযোগ প্রযুক্তি", ALL], ["career-education", "ক্যারিয়ার শিক্ষা", ALL],
    ["physical-education", "শারীরিক শিক্ষা, স্বাস্থ্যবিজ্ঞান ও খেলাধুলা", ALL],
    ["physics", "পদার্থবিজ্ঞান", "বিজ্ঞান"], ["chemistry", "রসায়ন", "বিজ্ঞান"],
    ["biology", "জীববিজ্ঞান", "বিজ্ঞান"], ["higher-math", "উচ্চতর গণিত", "বিজ্ঞান"],
    ["bangladesh-global-studies", "বাংলাদেশ ও বিশ্বপরিচয়", "বিজ্ঞান ও ব্যবসায় শিক্ষা"],
    ["business-entrepreneurship", "ব্যবসায় উদ্যোগ", "ব্যবসায় শিক্ষা"],
    ["accounting", "হিসাববিজ্ঞান", "ব্যবসায় শিক্ষা"],
    ["finance-banking", "ফিন্যান্স ও ব্যাংকিং", "ব্যবসায় শিক্ষা"],
    ["history", "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা", "মানবিক"],
    ["geography", "ভূগোল ও পরিবেশ", "মানবিক"],
    ["economics", "অর্থনীতি", "মানবিক"], ["civics", "পৌরনীতি ও নাগরিকতা", "মানবিক"],
    ["general-science", "সাধারণ বিজ্ঞান", "মানবিক ও ব্যবসায় শিক্ষা"],
    ["agriculture", "কৃষিশিক্ষা", OPT], ["home-science", "গার্হস্থ্যবিজ্ঞান", OPT],
    ["arts-crafts", "চারু ও কারুকলা", OPT], ["music", "সংগীত", OPT]
  ];
  // ১১–১২ (HSC): tomar project er nijer HSC subject list (shared.js) onujaye.
  const HSC_SUBJECTS = [
    ["bangla", "বাংলা", ALL], ["english", "ইংরেজি", ALL],
    ["ict", "তথ্য ও যোগাযোগ প্রযুক্তি", ALL],
    ["physics", "পদার্থবিজ্ঞান", "বিজ্ঞান"], ["chemistry", "রসায়ন", "বিজ্ঞান"],
    ["biology", "জীববিজ্ঞান", "বিজ্ঞান"], ["higher-math", "উচ্চতর গণিত", "বিজ্ঞান"],
    ["business-management", "ব্যবসায় সংগঠন ও ব্যবস্থাপনা", "ব্যবসায় শিক্ষা"],
    ["accounting", "হিসাববিজ্ঞান", "ব্যবসায় শিক্ষা"],
    ["finance-banking", "ফিন্যান্স, ব্যাংকিং ও বিমা", "ব্যবসায় শিক্ষা"],
    ["production-marketing", "উৎপাদন ব্যবস্থাপনা ও বিপণন", "ব্যবসায় শিক্ষা"],
    ["tourism-hospitality", "পর্যটন ও আতিথেয়তা", "ব্যবসায় শিক্ষা"],
    ["human-resource", "মানবসম্পদ ব্যবস্থাপনা", "ব্যবসায় শিক্ষা"],
    ["history", "ইতিহাস", "মানবিক"], ["islamic-history", "ইসলামের ইতিহাস ও সংস্কৃতি", "মানবিক"],
    ["civics", "পৌরনীতি ও সুশাসন", "মানবিক"], ["economics", "অর্থনীতি", "মানবিক"],
    ["logic", "যুক্তিবিদ্যা", "মানবিক"], ["sociology", "সমাজবিজ্ঞান", "মানবিক"],
    ["social-work", "সমাজকর্ম", "মানবিক"], ["islamic-studies", "ইসলাম শিক্ষা", "মানবিক"],
    ["anthropology", "নৃবিজ্ঞান", "মানবিক"],
    ["geography", "ভূগোল", OPT], ["psychology", "মনোবিজ্ঞান", OPT],
    ["statistics", "পরিসংখ্যান", OPT], ["agriculture", "কৃষিশিক্ষা", OPT],
    ["home-science", "গার্হস্থ্য বিজ্ঞান", OPT], ["soil-science", "মৃত্তিকা বিজ্ঞান", OPT],
    ["engineering-drawing", "প্রকৌশল অঙ্কন ও ওয়ার্কশপ প্র্যাকটিস", OPT],
    ["fine-arts", "চারুকলা", OPT], ["sports", "ক্রীড়া", OPT]
  ];
  // Class 9, 10, 11-12: Group page comes BEFORE the subject page.
  const GROUPS = [
    ["science", "বিজ্ঞান", "বিজ্ঞান"],
    ["arts", "মানবিক", "মানবিক"],
    ["commerce", "ব্যবসায় শিক্ষা", "ব্যবসায় শিক্ষা"]
  ];
  const hasGroups = n => Number(n) >= 9;
  function groupOf(key) { return GROUPS.find(g => g[0] === key); }
  const groupKey = n => "cma-class-group-" + n;
  function savedGroup(n) { try { return sessionStorage.getItem(groupKey(n)) || ""; } catch (e) { return ""; } }
  function saveGroup(n, g) { try { sessionStorage.setItem(groupKey(n), g); } catch (e) {} }
  // subject = common (ALL / OPT) + the ones tagged for the chosen group
  function subjectsFor(n, g) {
    const grp = groupOf(g);
    const all = subjectsOf(n);
    if (!grp) return all;
    return all.filter(s => s[2] === ALL || s[2] === OPT || String(s[2]).includes(grp[2]));
  }
  // Where the "back" button from chapters should go
  function subjectsHref(n) {
    if (!hasGroups(n)) return "?page=class-subjects-" + n;
    const g = savedGroup(n);
    return g ? "?page=class-subjects-" + n + "-" + g : "?page=class-groups-" + n;
  }

  const SUBJECTS_BY_CLASS = { 6: MIDDLE, 7: MIDDLE, 8: MIDDLE, 9: SSC_SUBJECTS, 10: SSC_SUBJECTS, 11: HSC_SUBJECTS };
  function subjectsOf(n) { return SUBJECTS_BY_CLASS[Number(n)] || []; }
  function validClass(n) { return Object.prototype.hasOwnProperty.call(CLASS_NAMES, n); }
  function subjectName(n, key) {
    const s = subjectsOf(n).find(x => x[0] === key);
    return s ? s[1] : key;
  }

  // ---------- styles ----------
  // Card/grid/form design Game Changer 2.0 er free-courses.js er .fc-* class gulo-i
  // use kora hoyeche (shei file age load hoy). Ekhane shudhu search bar er style.
  const css = document.createElement("style");
  css.id = "cma-class-prep-css";
  css.textContent = `
  .cp-search{position:sticky;top:76px;z-index:20;padding:6px 0 14px;margin:0 0 6px;background:linear-gradient(#fffafa 75%,rgba(255,250,250,0))}
  .cp-search input{width:100%;box-sizing:border-box;min-height:56px;padding:12px 18px 12px 52px;border:1px solid #d9dce3;border-radius:18px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c92a44' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16 16l4.5 4.5'/%3E%3C/svg%3E") no-repeat 18px center/22px;color:#20283a;font:inherit;font-size:16px;outline:none;box-shadow:0 14px 30px -22px rgba(28,34,54,.45);transition:border-color .18s,box-shadow .18s}
  .cp-search input:focus{border-color:#d84355;box-shadow:0 0 0 3px rgba(216,67,85,.10)}
  .cp-sec{margin-top:26px}
  `;
  document.head.appendChild(css);

  // ---------- shared UI ----------
  function head(label, title, desc, back) {
    if ($("pageLabel")) $("pageLabel").textContent = label || "";
    if ($("pageTitle")) $("pageTitle").textContent = title || "";
    if ($("pageDescription")) $("pageDescription").textContent = desc || "";
    const b = $("backLink");
    if (b) {
      b.setAttribute("href", back || "?");
      b.textContent = (back && back !== "?") ? "← পেছনে যাও" : "← হোমে ফিরে যাও";
    }
    const pb = $("pageBanner"); if (pb) pb.style.display = "none";
    document.title = (title ? title + " | " : "") + "Change Maker Academy";
  }
  function root() { const r = $("pageContent"); if (r) r.innerHTML = ""; return r; }
  function msg(r, text) { r.appendChild(el("div", "fc-msg", text)); }
  function intro(r, text) { r.appendChild(el("p", "fc-intro", text)); }

  // ---------- card design (same as Game Changer 2.0; tag text alada) ----------
  const TAG_TEXT = "Practice makes a man perfect";
  const TARGET_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#d6304a" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="#d6304a"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>';
  const ART_SVG = '<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true"><defs><linearGradient id="fcb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="fct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="160" height="14" fill="url(#fct)"/><path d="M-6 90L34 0h22L16 90z" fill="url(#fcb)" opacity=".28"/><path d="M96 90L136 0h8L104 90z" fill="#fff" opacity=".05"/><g stroke="currentColor" stroke-width=".7"><circle cx="132" cy="50" r="46" opacity=".13"/><circle cx="132" cy="50" r="34" opacity=".17"/><circle cx="132" cy="50" r="22" opacity=".22"/><circle cx="132" cy="50" r="10" opacity=".3"/><path d="M132 0v100M82 50h100" opacity=".1"/></g><circle cx="132" cy="50" r="2.2" fill="currentColor" opacity=".55"/></svg>';

  function poster(title) {
    const d = el("div", "fc-ph");
    d.appendChild(el("div", "fc-ph-title" + (String(title).length > 16 ? " long" : ""), title));
    const tag = el("div", "fc-ph-tag");
    tag.innerHTML = TARGET_SVG + "<span>" + TAG_TEXT + "</span>";
    d.appendChild(tag);
    return d;
  }
  function thumbBox(title, idx) {
    const t = el("div", "fc-thumb c" + ((idx % 3) + 1));
    const art = el("div", "fc-art"); art.innerHTML = ART_SVG; t.appendChild(art);
    t.appendChild(poster(title));
    return t;
  }
  function gcCard(href, title, idx, sub) {
    const a = el("a", "fc-card"); a.href = href;
    a.appendChild(thumbBox(title, idx));
    const b = el("div", "fc-body");
    const txt = el("div"); txt.appendChild(el("h3", "", title));
    if (sub) txt.appendChild(el("p", "", sub));
    b.appendChild(txt); b.appendChild(el("span", "fc-dot"));
    a.appendChild(b);
    return a;
  }

  // ---------- data helpers (posts = window.onlineExamPosts) ----------
  function allPosts(n, subjectKey) {
    const list = Array.isArray(window.onlineExamPosts) ? window.onlineExamPosts : [];
    return list.filter(p =>
      String(p.program || "").toLowerCase() === "class-" + n &&
      (!subjectKey || String(p.subject || "").toLowerCase() === subjectKey)
    );
  }
  function chaptersOf(n, subjectKey) {
    const map = new Map();
    allPosts(n, subjectKey).forEach(p => {
      const key = String(p.chapter == null ? "" : p.chapter);
      if (!map.has(key)) map.set(key, { key, name: p.chapterName || ("Chapter " + key), count: 0 });
      map.get(key).count++;
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.key).localeCompare(String(b.key), undefined, { numeric: true }));
  }
  const DIGITS = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[০-৯]/g, d => DIGITS[d]).trim();
  }

  // Exam post card = Game Changer er video card design; button e "Prove Yourself"
  function postCard(p, n, subjectKey, idx) {
    const title = p.title || "Online Examination";
    const href = "?page=online-exam-start-" + encodeURIComponent(String(p.id || ""));
    const article = el("article", "fc-video-card");

    const link = el("a", "fc-video-poster-link"); link.href = href;
    link.setAttribute("aria-label", "Start " + title);
    link.appendChild(thumbBox(title, idx || 0));
    article.appendChild(link);

    const body = el("div", "fc-body");
    body.appendChild(el("h3", "", title));

    const mcq = Number(p.mcqCount || (p.questions || []).length || 0);
    const dur = Number(p.duration || 0);
    const total = p.totalMarks !== undefined ? Number(p.totalMarks) : mcq * Number(p.marksPerQuestion || 1);
    const parts = [];
    if (p.chapterName) parts.push("অধ্যায় " + bn(p.chapter) + " • " + p.chapterName);
    parts.push(bn(dur) + " মিনিট  •  " + bn(mcq) + "টি MCQ  •  " + bn(total) + " নম্বর");
    parts.forEach(t => body.appendChild(el("div", "fc-video-meta", t)));
    if (p.caption) body.appendChild(el("div", "fc-video-meta", p.caption));

    const go = el("a", "fc-watch-button", "✍  Prove Yourself"); go.href = href;
    body.appendChild(go);
    article.appendChild(body);
    return article;
  }

  // ---------- enrollment ----------
  const enrollKey = n => "cma-class-enrolled-" + n;
  function hasEnrollment(n) {
    try { return sessionStorage.getItem(enrollKey(n)) === "1"; } catch (e) { return false; }
  }
  async function getProfileDefaults() {
    try {
      const c = sb();
      if (!c || !c.auth || typeof c.auth.getUser !== "function") return {};
      const res = await c.auth.getUser();
      const user = res && res.data ? res.data.user : null;
      if (!user) return {};
      const meta = user.user_metadata || {};
      return { name: meta.full_name || meta.name || "", email: user.email || "", userId: user.id || null };
    } catch (e) { return {}; }
  }

  // Step 1: Information form (same look as the Game Changer 2.0 form)
  async function renderForm(n, ok) {
    head("Student Information", "তথ্য নিশ্চিত করো", "কোর্সে প্রবেশের আগে তোমার তথ্যগুলো পূরণ করো।", "?");
    const r = root();
    const wrap = el("div", "fc-enroll-wrap");
    const panel = el("section", "fc-enroll-card");
    panel.appendChild(el("h2", "", "Information"));
    panel.appendChild(el("p", "", CLASS_NAMES[n] + " Course-এ প্রবেশের জন্য অনুগ্রহ করে তোমার তথ্য নিশ্চিত করো।"));
    panel.appendChild(el("div", "fc-enroll-rule"));

    const form = el("form", "fc-enroll-form");
    function field(labelText, name, placeholder, type) {
      const g = el("div", "fc-field");
      const lab = el("label", "", labelText); lab.htmlFor = "cp-enroll-" + name;
      const input = el("input");
      input.id = "cp-enroll-" + name; input.name = name; input.type = type || "text";
      input.placeholder = placeholder; input.required = true;
      input.autocomplete = name === "student_name" ? "name" : (name === "email" ? "email" : (name === "phone_number" ? "tel" : "organization"));
      g.append(lab, input); form.appendChild(g);
      return input;
    }
    const nameI = field("Name", "student_name", "তোমার পুরো নাম", "text");
    const emailI = field("Email", "email", "তোমার ইমেইল", "email");
    const phoneI = field("Phone Number", "phone_number", "মোবাইল নম্বর", "tel");
    phoneI.inputMode = "tel"; phoneI.pattern = "[0-9+() -]{8,20}";
    phoneI.title = "৮ থেকে ২০ অক্ষরের একটি বৈধ ফোন নম্বর দাও।";
    const instI = field("Institution", "institution", "তোমার স্কুল বা কলেজের নাম", "text");
    nameI.maxLength = 120; emailI.maxLength = 254; instI.maxLength = 160;

    form.appendChild(el("p", "fc-enroll-privacy", "তোমার দেওয়া তথ্য কোর্সে নিবন্ধনের জন্য সংরক্ষণ করা হবে এবং কেবল অনুমোদিত অ্যাডমিন দেখতে পারবে।"));
    const consent = el("label", "fc-consent");
    const check = el("input"); check.type = "checkbox"; check.required = true;
    consent.append(check, el("span", "", "আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং ফ্রি কোর্সে অংশ নেওয়ার জন্য সম্মতি দিচ্ছি।"));
    form.appendChild(consent);

    const status = el("div", "fc-enroll-status");
    status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    form.appendChild(status);

    const actions = el("div", "fc-enroll-actions");
    const cancel = el("a", "fc-enroll-cancel", "Cancel"); cancel.href = "?";
    const submit = el("button", "fc-enroll-submit", "Enroll"); submit.type = "submit";
    actions.append(cancel, submit); form.appendChild(actions);
    panel.appendChild(form); wrap.appendChild(panel); r.appendChild(wrap);

    const defaults = await getProfileDefaults();
    if (!ok()) return;
    if (defaults.name) nameI.value = defaults.name;
    if (defaults.email) emailI.value = defaults.email;

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      status.textContent = "";
      if (!form.reportValidity()) return;
      submit.disabled = true; submit.textContent = "Saving...";

      // Save the registration. If the table rejects it (e.g. DB not ready) we
      // still let the student in, so a setup problem never locks learners out.
      try {
        const client = sb();
        if (client) {
          const { error } = await client.from("free_enrollments").insert({
            batch: "class-" + n,
            student_name: nameI.value.trim(),
            email: emailI.value.trim(),
            phone_number: phoneI.value.trim(),
            institution: instI.value.trim(),
            user_id: defaults.userId || null
          });
          if (error) console.warn("Class enrollment was not saved:", error);
        }
      } catch (e) { console.warn("Class enrollment was not saved:", e); }

      try { sessionStorage.setItem(enrollKey(n), "1"); } catch (e) {}
      if (!ok()) return;
      if (hasGroups(n)) {
        try { history.replaceState(null, "", "?page=class-groups-" + n); } catch (e) {}
        renderGroups(n, ok);
      } else {
        try { history.replaceState(null, "", "?page=class-subjects-" + n); } catch (e) {}
        renderSubjects(n, ok);
      }
    });
  }

  function ensureEnrolled(n, ok) {
    if (hasEnrollment(n)) return true;
    renderForm(n, ok);
    return false;
  }

  // Step 2a (class 9+ only): group page — Science / Humanities / Business
  function renderGroups(n, ok) {
    if (!validClass(n)) return notFound();
    if (!ensureEnrolled(n, ok)) return;
    head("Select Group", CLASS_NAMES[n] + " — গ্রুপ", "", "?");
    const r = root();
    intro(r, "তোমার গ্রুপটি বেছে নাও");
    const g = el("div", "fc-grid");
    GROUPS.forEach((x, i) => g.appendChild(gcCard(
      "?page=class-subjects-" + n + "-" + x[0], x[1], i)));
    r.appendChild(g);
  }

  // Step 2b: subjects (with search bar on top)
  function renderSubjects(n, ok, group) {
    if (!validClass(n)) return notFound();
    if (!ensureEnrolled(n, ok)) return;
    if (hasGroups(n)) {
      if (!groupOf(group)) return renderGroups(n, ok);   // no group chosen yet -> group page first
      saveGroup(n, group);
      head("Select Subject", CLASS_NAMES[n] + " (" + groupOf(group)[1] + ") — সাবজেক্ট", "", "?page=class-groups-" + n);
    } else {
      head("Select Subject", CLASS_NAMES[n] + " — সাবজেক্ট", "", "?");
    }
    const r = root();
    const list = hasGroups(n) ? subjectsFor(n, group) : subjectsOf(n);

    intro(r, bn(list.length) + "টি সাবজেক্ট — তোমার সাবজেক্টটি বেছে নাও");
    const g = el("div", "fc-grid");
    list.forEach((x, i) => g.appendChild(gcCard(
      "?page=class-subject-" + n + "-" + x[0], x[1], i, x[2] === REQ ? "" : x[2])));
    r.appendChild(g);
  }

  // Step 3: chapters + (only here) search bar. Search chapter + matching posts dekhay.
  function renderChapters(n, key, ok) {
    if (!validClass(n)) return notFound();
    if (!ensureEnrolled(n, ok)) return;
    head("Select Chapter", subjectName(n, key), "", subjectsHref(n));
    const r = root();

    const out = el("div"); r.appendChild(out);
    const chapters = chaptersOf(n, key);
    const posts = allPosts(n, key);

    function draw(text) {
      out.innerHTML = "";
      const q = norm(text);
      if (!chapters.length) return msg(out, "এই সাবজেক্টে এখনো কোনো চ্যাপ্টার যুক্ত হয়নি।");

      const cs = chapters.filter(c => !q || norm(c.name).includes(q) || norm(c.key).includes(q) || norm("chapter " + c.key).includes(q));
      const ps = q ? posts.filter(p => norm([p.title, p.chapterName, p.chapter, p.caption].join(" ")).includes(q)) : [];
      if (!cs.length && !ps.length) return msg(out, "কোনো চ্যাপ্টার বা পোস্ট পাওয়া যায়নি।");

      if (cs.length) {
        intro(out, bn(cs.length) + "টি চ্যাপ্টার — তোমার শেখার যাত্রা শুরু করো");
        const g = el("div", "fc-grid");
        cs.forEach((c, i) => g.appendChild(gcCard(
          "?page=class-chapter-" + n + "-" + key + "-" + encodeURIComponent(c.key), c.name, i)));
        out.appendChild(g);
      }
      if (ps.length) {
        const sec = el("div", "fc-page cp-sec");
        const h = el("div", "fc-h", "পোস্ট"); h.appendChild(el("small", "", "(" + bn(ps.length) + ")")); sec.appendChild(h);
        const v = el("div", "fc-video-cards");
        ps.forEach((p, i) => v.appendChild(postCard(p, n, key, i)));
        sec.appendChild(v); out.appendChild(sec);
      }
    }
    // Header search bar drives this page (chapters + matching posts)
    if (window.CMAPageSearch) window.CMAPageSearch.register(out, draw, "চ্যাপ্টারের নাম বা নম্বর খোঁজো…");
    draw("");
  }

  // Step 4: one chapter -> its exam posts
  function renderChapterPosts(n, key, chapterKey, ok) {
    if (!validClass(n)) return notFound();
    if (!ensureEnrolled(n, ok)) return;
    const list = allPosts(n, key).filter(p => String(p.chapter) === String(chapterKey));
    const title = list.length && list[0].chapterName ? list[0].chapterName : ("Chapter " + chapterKey);
    head("Practice Exam", title, "এই চ্যাপ্টারের পরীক্ষাগুলো বেছে নাও", "?page=class-subject-" + n + "-" + key);
    const r = root();
    if (!list.length) return msg(r, "এই চ্যাপ্টারে এখনো কোনো পোস্ট যুক্ত হয়নি।");
    const w = el("div", "fc-page");
    const h = el("div", "fc-h", "পরীক্ষাসমূহ"); h.appendChild(el("small", "", "(" + bn(list.length) + " exam)")); w.appendChild(h);
    const v = el("div", "fc-video-cards");
    list.forEach((p, i) => v.appendChild(postCard(p, n, key, i)));
    w.appendChild(v); r.appendChild(w);
  }

  function notFound() {
    head("", "পেজটি পাওয়া যায়নি", "", "?");
    msg(root(), "দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি।");
  }

  // ---------- router entry ----------
  function render(page, isCurrent) {
    const ok = typeof isCurrent === "function" ? isCurrent : () => true;
    let m;
    if ((m = page.match(/^class-prep-(\d+)$/))) {
      if (!validClass(m[1])) return notFound();
      return renderForm(m[1], ok);               // class card click always asks for the form
    }
    if ((m = page.match(/^class-groups-(\d+)$/))) return renderGroups(m[1], ok);
    if ((m = page.match(/^class-subjects-(\d+)-([a-z]+)$/))) return renderSubjects(m[1], ok, m[2]);
    if ((m = page.match(/^class-subjects-(\d+)$/))) return renderSubjects(m[1], ok);
    if ((m = page.match(/^class-subject-(\d+)-(.+)$/))) return renderChapters(m[1], m[2], ok);
    if ((m = page.match(/^class-chapter-(\d+)-(.+)-([^-]+)$/))) {
      return renderChapterPosts(m[1], m[2], decodeURIComponent(m[3]), ok);
    }
    notFound();
  }
  window.CMAClassPrep = { render: render };
})();
