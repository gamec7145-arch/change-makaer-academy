// ==================================================
// CHANGE MAKER ACADEMY — CLASS 6–10 MCQ POSTS
// Notun post add korte ekta object copy kore niche paste koro.
//
//   program : "class-6" ... "class-10"
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

  // Class 6, 7, 8, 10 e 1ta kore DEMO post (sotti-i kaj kore).
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
  ];

  // exam theke "back" korle ei post er chapter page-e ferar jonno
  posts.forEach(p => {
    p.backPage = "class-chapter-" + String(p.program).replace("class-", "") +
      "-" + p.subject + "-" + encodeURIComponent(p.chapter);
    const exists = window.onlineExamPosts.some(x => x.id === p.id);
    if (!exists) window.onlineExamPosts.push(p);
  });
})();
