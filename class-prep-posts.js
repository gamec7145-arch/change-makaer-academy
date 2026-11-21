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

  const posts = [
    {
      id: "class6-math-ch1-01",
      program: "class-6", group: "general", subject: "math", part: null,
      chapter: "1", chapterName: "সংখ্যা পদ্ধতি",
      title: "সংখ্যা পদ্ধতি — MCQ পরীক্ষা (ডেমো)",
      caption: "সংখ্যা পদ্ধতির মৌলিক ধারণা যাচাই করো।",
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
      id: "class6-math-ch2-01",
      program: "class-6", group: "general", subject: "math", part: null,
      chapter: "2", chapterName: "ভগ্নাংশ",
      title: "ভগ্নাংশ — MCQ পরীক্ষা (ডেমো)",
      caption: "ভগ্নাংশের প্রাথমিক ধারণা যাচাই করো।",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "১/২ + ১/২ = কত?", options: ["১/৪", "১", "২", "১/২"], answer: 1 },
        { question: "১/২ এর সমান ভগ্নাংশ কোনটি?", options: ["২/৪", "১/৩", "২/৫", "৩/৪"], answer: 0 },
        { question: "৩/৪ ভগ্নাংশের হর কত?", options: ["৩", "৪", "৭", "১"], answer: 1 },
        { question: "কোনটি সবচেয়ে বড়?", options: ["১/২", "১/৩", "১/৪", "১/৫"], answer: 0 },
        { question: "২/৩ ভগ্নাংশের লব কত?", options: ["২", "৩", "৫", "১"], answer: 0 }
      ]
    },
    {
      id: "class6-english-ch1-01",
      program: "class-6", group: "general", subject: "english", part: null,
      chapter: "1", chapterName: "Grammar Basics",
      title: "Grammar Basics — MCQ Exam (Demo)",
      caption: "Test your basic English grammar.",
      duration: 5, mcqCount: 5,
      questions: [
        { question: "She ___ a student.", options: ["is", "are", "am", "be"], answer: 0 },
        { question: "What is the plural of 'book'?", options: ["book", "books", "bookes", "bookies"], answer: 1 },
        { question: "What is the opposite of 'hot'?", options: ["cold", "warm", "big", "small"], answer: 0 },
        { question: "I ___ going to school.", options: ["is", "am", "are", "be"], answer: 1 },
        { question: "Which word is a noun?", options: ["run", "quickly", "Dhaka", "blue"], answer: 2 }
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
