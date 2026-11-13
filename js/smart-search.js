
// ==================================================
// CHANGE MAKER ACADEMY
// SMART SEARCH SYSTEM
// Bangla + English + Related Keywords
// ==================================================

(function () {
 "use strict";

 const home = document.getElementById("homePage");
 const header = document.querySelector("header");

 if (!home || !header) return;

 // ==================================================
 // SEARCH UI
 // ==================================================

 const section = document.createElement("section");
 section.className = "smart-search-section";
 section.innerHTML = `
  <div class="smart-search-box">
   <div class="smart-search-input-wrap">
    <span class="smart-search-icon">⌕</span>
    <input
     type="search"
     class="smart-search-input"
     id="smartSearchInput"
     placeholder="Search subjects, courses, notes..."
     autocomplete="off"
     aria-label="Search Change Maker Academy"
    >
   </div>
   <div
    class="smart-search-results"
    id="smartSearchResults"
    hidden
   ></div>
  </div>
 `;

 home.insertBefore(section, home.firstChild);

 const input = section.querySelector("#smartSearchInput");
 const resultsBox = section.querySelector("#smartSearchResults");

 // ==================================================
 // KEYWORD DATABASE
 // ==================================================

 const keywordGroups = [
  {
   words: ["math", "mathematics", "গণিত", "অংক", "অঙ্ক"],
   subjects: ["general-math", "higher-math"]
  },
  {
   words: ["higher math", "উচ্চতর গণিত", "উচ্চতর"],
   subjects: ["higher-math"]
  },
  {
   words: ["general math", "সাধারণ গণিত"],
   subjects: ["general-math"]
  },
  {
   words: ["physics", "পদার্থ", "পদার্থবিজ্ঞান"],
   subjects: ["physics"]
  },
  {
   words: ["chemistry", "রসায়ন", "রসায়ন"],
   subjects: ["chemistry"]
  },
  {
   words: ["biology", "জীববিজ্ঞান", "জীব"],
   subjects: ["biology"]
  },
  {
   words: ["english", "ইংরেজি", "ইংলিশ"],
   subjects: ["english"]
  },
  {
   words: ["bangla", "বাংলা", "বাংরা"],
   subjects: ["bangla"]
  },
  {
   words: ["ict", "আইসিটি", "তথ্য যোগাযোগ"],
   subjects: ["ict"]
  },
  {
   words: ["accounting", "হিসাববিজ্ঞান", "হিসাব"],
   subjects: ["accounting"]
  },
  {
   words: ["finance", "ফিন্যান্স", "ব্যাংকিং", "banking"],
   subjects: ["finance", "finance-banking"]
  },
  {
   words: ["economics", "অর্থনীতি"],
   subjects: ["economics"]
  },
  {
   words: ["history", "ইতিহাস"],
   subjects: ["history"]
  },
  {
   words: ["geography", "ভূগোল"],
   subjects: ["geography"]
  },
  {
   words: ["civics", "পৌরনীতি"],
   subjects: ["civics"]
  },
  {
   words: ["logic", "যুক্তিবিদ্যা"],
   subjects: ["logic"]
  },
  {
   words: ["sociology", "সমাজবিজ্ঞান"],
   subjects: ["sociology"]
  },
  {
   words: ["business", "ব্যবসায়", "ব্যবসা"],
   subjects: ["business-entrepreneurship"]
  }
 ];

 // ==================================================
 // CATEGORY KEYWORDS
 // ==================================================

 const categoryGroups = [
  {
   words: ["ssc", "দশম", "নবম", "class 9", "class 10"],
   title: "SSC Program",
   description: "Class 9 & 10",
   page: "online-ssc",
   icon: "🎓"
  },
  {
   words: ["hsc", "একাদশ", "দ্বাদশ", "college", "কলেজ"],
   title: "HSC Program",
   description: "College Level",
   page: "online-hsc",
   icon: "🎓"
  },
  {
   words: ["admission", "ভর্তি", "admission test"],
   title: "Admission Program",
   description: "Admission preparation",
   page: "online-admission",
   icon: "🎯"
  },
  {
   words: ["online", "অনলাইন", "live class", "ভিডিও ক্লাস"],
   title: "Online Batches",
   description: "Explore online programs",
   page: "online-ssc",
   icon: "▶"
  },
  {
   words: ["offline", "অফলাইন", "কোচিং", "classroom"],
   title: "Offline Batches",
   description: "Explore offline programs",
   page: "offline-ssc",
   icon: "🏫"
  },
  {
   words: ["pdf", "notes", "note", "নোট", "পিডিএফ", "বই"],
   title: "PDF Notes",
   description: "Browse study notes",
   page: "materials-pdf",
   icon: "📄"
  },
  {
   words: ["practice", "প্র্যাকটিস", "অনুশীলন", "প্রশ্ন"],
   title: "Practice Materials",
   description: "Practice questions and materials",
   page: "materials-practice",
   icon: "✎"
  },
  {
   words: ["cq", "creative", "সৃজনশীল"],
   title: "Creative Question Practice",
   description: "Explore practice materials",
   page: "materials-practice",
   icon: "✎"
  },
  {
   words: ["mcq", "বহুনির্বাচনী", "নৈর্ব্যক্তিক"],
   title: "MCQ Practice",
   description: "Explore practice materials",
   page: "materials-practice",
   icon: "☑"
  },
  {
   words: ["exam", "পরীক্ষা", "পরীক্ষার প্রস্তুতি", "model test"],
   title: "Exam Preparation",
   description: "Explore exam preparation",
   page: "exam-choose",
   icon: "📝"
  }
 ];

 // ==================================================
 // TEXT NORMALIZATION
 // ==================================================

 function normalize(value) {
  return String(value || "")
   .toLowerCase()
   .normalize("NFC")
   .replace(/[।,!?।ঃ:;'"“”‘’()[\]{}]/g, " ")
   .replace(/\s+/g, " ")
   .trim();
 }

 function levenshtein(a, b) {
  if (!a || !b) return 99;

  const dp = Array.from(
   { length: a.length + 1 },
   () => []
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
   for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(
     dp[i - 1][j] + 1,
     dp[i][j - 1] + 1,
     dp[i - 1][j - 1] +
      (a[i - 1] === b[j - 1] ? 0 : 1)
    );
   }
  }

  return dp[a.length][b.length];
 }

 function matches(query, words) {
  const q = normalize(query);

  if (!q) return false;

  return words.some(word => {
   const w = normalize(word);

   if (w.includes(q) || q.includes(w)) return true;

   // Small spelling-error tolerance for English words
   if (
    /^[a-z0-9 ]+$/i.test(q) &&
    /^[a-z0-9 ]+$/i.test(w) &&
    Math.min(q.length, w.length) >= 4 &&
    levenshtein(q, w) <= 1
   ) {
    return true;
   }

   return false;
  });
 }

 // ==================================================
 // RESULT CREATION
 // ==================================================

 function addResult(list, title, description, page, icon) {
  if (!page || list.some(item => item.page === page)) return;

  list.push({
   title,
   description,
   page,
   icon: icon || "▤"
  });
 }

 function getSubjectResults(query) {
  const found = [];

  if (
   typeof getSubjects !== "function" ||
   typeof groupNames === "undefined"
  ) return found;

  ["ssc", "hsc"].forEach(level => {
   ["science", "arts", "commerce"].forEach(group => {

    let subjects = [];

    try {
     subjects = getSubjects(group, level) || [];
    } catch (error) {
     return;
    }

    subjects.forEach(subject => {
     const name = subject[0];
     const key = subject[1];

     const keywordMatch = keywordGroups.find(item =>
      item.subjects.includes(key) &&
      matches(query, item.words)
     );

     const nameMatch = matches(query, [name, key.replaceAll("-", " ")]);

     if (!keywordMatch && !nameMatch) return;

     const groupName = groupNames[group];

     // Online lesson page
     addResult(
      found,
      name + " — Online Lessons",
      level.toUpperCase() + " | " + groupName,
      "online-lessons-" + level + "-" + group + "-" + key,
      "▶"
     );

     // Offline subject page
     addResult(
      found,
      name + " — Offline Batch",
      level.toUpperCase() + " | " + groupName,
      "offline-subject-" + level + "-" + group + "-" + key,
      "🏫"
     );

     // PDF Notes page
     addResult(
      found,
      name + " — PDF Notes",
      level.toUpperCase() + " | " + groupName,
      "materials-subject-pdf-" + level + "-" + group + "-" + key,
      "📄"
     );

     // Practice Materials page
     addResult(
      found,
      name + " — Practice Materials",
      level.toUpperCase() + " | " + groupName,
      "materials-subject-practice-" + level + "-" + group + "-" + key,
      "✎"
     );
    });
   });
  });

  return found;
 }

 function search(query) {
  const found = [];

  // Subject search
  getSubjectResults(query).forEach(item => {
   addResult(
    found,
    item.title,
    item.description,
    item.page,
    item.icon
   );
  });

  // Category search
  categoryGroups.forEach(item => {
   if (matches(query, item.words)) {
    addResult(
     found,
     item.title,
     item.description,
     item.page,
     item.icon
    );
   }
  });

  return found.slice(0, 12);
 }

 // ==================================================
 // DISPLAY RESULTS
 // ==================================================

 function showResults(items) {
  resultsBox.innerHTML = "";

  if (!items.length) {
   const empty = document.createElement("div");
   empty.className = "smart-search-empty";
   empty.textContent =
    "No matching results found. Try another keyword.";
   resultsBox.appendChild(empty);
   resultsBox.hidden = false;
   return;
  }

  items.forEach(item => {
   const link = document.createElement("a");
   link.className = "smart-search-result";
   link.href = "?page=" + encodeURIComponent(item.page);

   const icon = document.createElement("span");
   icon.className = "smart-search-result-icon";
   icon.textContent = item.icon;

   const content = document.createElement("span");

   const title = document.createElement("strong");
   title.textContent = item.title;

   const description = document.createElement("small");
   description.textContent = item.description;

   content.append(title, description);
   link.append(icon, content);

   link.addEventListener("click", function (event) {
    event.preventDefault();

    if (typeof renderRoute === "function") {
     history.pushState({}, "", link.href);
     renderRoute();
    } else {
     window.location.href = link.href;
    }
   });

   resultsBox.appendChild(link);
  });

  resultsBox.hidden = false;
 }

 // ==================================================
 // SEARCH EVENTS
 // ==================================================

 let searchDelay;

 input.addEventListener("input", function () {
  clearTimeout(searchDelay);

  searchDelay = setTimeout(() => {
   const query = input.value.trim();

   if (!query) {
    resultsBox.innerHTML = "";
    resultsBox.hidden = true;
    return;
   }

   showResults(search(query));
  }, 180);
 });

 document.addEventListener("click", function (event) {
  if (!section.contains(event.target)) {
   resultsBox.hidden = true;
  }
 });

 input.addEventListener("focus", function () {
  if (input.value.trim()) {
   showResults(search(input.value));
  }
 });

 input.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
   resultsBox.hidden = true;
   input.blur();
  }

  if (event.key === "Enter") {
   const first = resultsBox.querySelector("a");

   if (first) first.click();
  }
 });

})();
    
