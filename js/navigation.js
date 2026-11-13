
// ==================================================
// CHANGE MAKER ACADEMY
// GROUP & SUBJECT NAVIGATION
// ==================================================


// ==================================================
// ONLINE EXAMINATION: SSC / HSC
// ==================================================

function renderOnlineExamLevels() {

 setPage(
  "Online Examination",
  "Prove Yourself",
  "Choose your academic program to continue.",
  demoImages.classroom,
  "?#home"
 );

 const grid = makeGrid();

 ["ssc", "hsc"].forEach(program => {

  grid.appendChild(makeCard(
   program.toUpperCase(),
   "Online Examination | " + program.toUpperCase(),
   "?page=online-exam-" + program,
   "✎"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// RENDER GROUPS
// ==================================================

function renderGroups(program, mode) {

 const title = mode === "offline"
  ? "Offline Batches"
  : mode === "exam"
  ? "Exam Preparation Course"
  : mode === "online-exam"
  ? "Online Examination"
  : "Online Batches";

 setPage(
  "Choose Your Group",
  title + " | " + program.toUpperCase(),
  "Select your group to continue.",
  demoImages.classroom,
  mode === "offline" ? "?#offline" :
  mode === "exam" ? "?#exam" :
  mode === "online-exam" ? "?page=online-exam-choose" :
  "?#batches"
 );

 const grid = makeGrid();

 ["science", "arts", "commerce"].forEach(group => {

  const destination = mode === "offline"
   ? "offline-group-" + program + "-" + group
   : mode === "exam"
   ? "exam-group-" + program + "-" + group
   : mode === "online-exam"
   ? "online-exam-group-" + program + "-" + group
   : "online-group-" + program + "-" + group;

  grid.appendChild(makeCard(
   groupNames[group],
   "Continue with " + groupNames[group],
   "?page=" + destination,
   group === "science" ? "⚗" :
   group === "arts" ? "📚" : "▤"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// GET SUBJECT DESTINATION
// ==================================================

function getSubjectDestination(program, group, subjectKey, mode, partIndex = null) {

 let destination = "";

 if (mode === "offline") {
  destination = "offline-subject-" + program + "-" + group + "-" + subjectKey;
 }

 if (mode === "exam") {
  destination = "exam-courses-" + program + "-" + group + "-" + subjectKey;
 }

 if (mode === "online") {
  destination = "online-lessons-" + program + "-" + group + "-" + subjectKey;
 }

 if (mode === "online-exam") {
  destination = "online-exam-posts-" + program + "-" + group + "-" + subjectKey;
 }

 if (partIndex !== null) {
  destination += "-part-" + partIndex;
 }

 return destination;
}


// ==================================================
// RENDER SUBJECT CHOICES
// ==================================================

function renderSubjectChoices(program, group, mode) {

 const subjects = getSubjects(group, program);

 if (!subjects.length) {
  showNotFound();
  return;
 }

 const modeTitle = mode === "offline"
  ? "Offline Batch"
  : mode === "exam"
  ? "Exam Preparation Course"
  : mode === "online-exam"
  ? "Online Examination"
  : "Online Lessons";

 setPage(
  groupNames[group] + " | " + program.toUpperCase(),
  modeTitle + " Subjects",
  "Choose a subject to continue.",
  demoImages[group],
  "?page=" + (
   mode === "offline" ? "offline-" + program :
   mode === "exam" ? "exam-" + program :
   mode === "online-exam" ? "online-exam-" + program :
   "online-" + program
  )
 );

 const grid = makeGrid();

 subjects.forEach(subject => {

  const subjectKey = subject[1];

  const hasParts = hasSubjectParts(
   group,
   program,
   subjectKey
  );

  let destination = "";

  if (hasParts) {

   destination =
    "subject-parts-" +
    mode + "-" +
    program + "-" +
    group + "-" +
    subjectKey;

  } else {

   destination = getSubjectDestination(
    program,
    group,
    subjectKey,
    mode
   );

  }

  grid.appendChild(makeCard(
   subject[0],
   hasParts
    ? "Choose Paper | " + subject[0]
    : modeTitle + " | " + subject[0],
   "?page=" + destination,
   mode === "online" ? "▶" : "▤"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// RENDER SUBJECT PAPER / PART CHOICES
// ==================================================

function renderSubjectParts(program, group, subjectKey, mode) {

 const subject = getSubject(group, program, subjectKey);

 if (!subject) {
  showNotFound();
  return;
 }

 const parts = getSubjectParts(
  group,
  program,
  subjectKey
 );

 if (!parts.length) {

  location.href = "?page=" + getSubjectDestination(
   program,
   group,
   subjectKey,
   mode
  );

  return;
 }

 const modeTitle = mode === "offline"
  ? "Offline Batch"
  : mode === "exam"
  ? "Exam Preparation Course"
  : mode === "online-exam"
  ? "Online Examination"
  : "Online Lessons";

 setPage(
  subject[0] + " | Choose Paper",
  modeTitle + " | Paper Selection",
  "Select your paper to continue.",
  demoImages[group],
  "?page=" + (
   mode === "offline"
    ? "offline-group-" + program + "-" + group
    : mode === "exam"
    ? "exam-group-" + program + "-" + group
    : mode === "online-exam"
    ? "online-exam-group-" + program + "-" + group
    : "online-group-" + program + "-" + group
  )
 );

 const grid = makeGrid();

 parts.forEach((part, index) => {

  const destination = getSubjectDestination(
   program,
   group,
   subjectKey,
   mode,
   index + 1
  );

  grid.appendChild(makeCard(
   part,
   subject[0] + " | " + part,
   "?page=" + destination,
   "▤"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// ONLINE EXAMINATION: SEARCHABLE EXAM POSTS
// ==================================================

// Future Admin Panel / Database data source:
// window.onlineExamPosts = [
//   {
//     id: "exam-1",
//     program: "ssc",
//     group: "science",
//     subject: "physics",
//     part: 1,
//     title: "Chapter 7 Examination",
//     chapter: "7",
//     chapterName: "Waves",
//     caption: "Test your knowledge",
//     duration: 20,
//     mcqCount: 20
//   }
// ];

function getOnlineExamPostData(program, group, subjectKey, partIndex) {

 const allPosts = Array.isArray(window.onlineExamPosts)
  ? window.onlineExamPosts
  : [];

 return allPosts.filter(post => {

  const postProgram = String(post.program || "").toLowerCase();
  const postGroup = String(post.group || "").toLowerCase();
  const postSubject = String(post.subject || "").toLowerCase();

  const sameProgram = postProgram === String(program).toLowerCase();
  const sameGroup = postGroup === String(group).toLowerCase();
  const sameSubject = postSubject === String(subjectKey).toLowerCase();

  const samePart = partIndex === null
   ? post.part === null || post.part === undefined || post.part === ""
   : Number(post.part) === Number(partIndex);

  return sameProgram && sameGroup && sameSubject && samePart;
 });
}


// ==================================================
// RENDER ONLINE EXAMINATION POSTS
// ==================================================

function renderOnlineExamPosts(program, group, subjectKey, partIndex = null) {

 // FIXED: Subject Key must be passed as the third argument.

 const subject = getSubject(group, program, subjectKey);

 if (!subject) {
  showNotFound();
  return;
 }

 const backPage = partIndex !== null
  ? "subject-parts-online-exam-" + program + "-" + group + "-" + subjectKey
  : "online-exam-group-" + program + "-" + group;

 setPage(
  subject[0] + " | Online Examination",
  "Available Examinations",
  "Choose an examination to prove yourself.",
  demoImages[group],
  "?page=" + backPage
 );

 // ==================================================
 // SEARCH BAR
 // ==================================================

 const searchWrapper = document.createElement("div");

 searchWrapper.style.width = "100%";
 searchWrapper.style.margin = "0 0 20px";
 searchWrapper.style.boxSizing = "border-box";

 const searchInput = document.createElement("input");

 searchInput.type = "search";
 searchInput.placeholder = "Search Chapter Number, Name, Exam Title...";
 searchInput.setAttribute("aria-label", "Search examinations");

 searchInput.style.width = "100%";
 searchInput.style.boxSizing = "border-box";
 searchInput.style.padding = "14px 16px";
 searchInput.style.borderRadius = "12px";
 searchInput.style.border = "1px solid #28616A";
 searchInput.style.background = "#08494B";
 searchInput.style.color = "#FFFFFF";
 searchInput.style.fontSize = "15px";
 searchInput.style.outline = "none";

 searchWrapper.appendChild(searchInput);
 pageContent.appendChild(searchWrapper);


 // ==================================================
 // EXAM POST CONTAINER
 // ==================================================

 const postsContainer = document.createElement("div");

 postsContainer.style.width = "100%";

 pageContent.appendChild(postsContainer);


 // ==================================================
 // SEARCH RESULT MESSAGE
 // ==================================================

 const resultMessage = document.createElement("p");

 resultMessage.style.textAlign = "center";
 resultMessage.style.padding = "20px 12px";
 resultMessage.style.color = "#B5CBD3";

 pageContent.appendChild(resultMessage);


 // ==================================================
 // GET POSTS FOR EXACT SUBJECT AND PAPER
 // ==================================================

 const posts = getOnlineExamPostData(
  program,
  group,
  subjectKey,
  partIndex
 );


 // ==================================================
 // RENDER / FILTER POSTS
 // ==================================================

 function renderFilteredPosts(searchText = "") {

  postsContainer.innerHTML = "";

  const query = searchText.trim().toLowerCase();

  const filteredPosts = posts.filter(post => {

   const searchableText = [
    post.title,
    post.chapter,
    post.chapterNumber,
    post.chapterName,
    post.caption
   ].join(" ").toLowerCase();

   return searchableText.includes(query);
  });


  if (filteredPosts.length === 0) {

   resultMessage.textContent = query
    ? "No matching examinations found."
    : "No examinations have been published yet. Please check again later.";

   return;
  }

  resultMessage.textContent =
   filteredPosts.length + " examination(s) found.";


  filteredPosts.forEach(post => {

   const postTitle = post.title || "Online Examination";

   const chapterText = post.chapterName
    ? "Chapter " + (post.chapter || post.chapterNumber || "") +
      " | " + post.chapterName
    : post.chapter
    ? "Chapter " + post.chapter
    : "";

   const caption = post.caption || "";

   const description = [
    chapterText,
    caption,
    post.duration ? post.duration + " Minutes" : "",
    post.mcqCount ? post.mcqCount + " MCQs" : ""
   ].filter(Boolean).join(" • ");

   const postId = encodeURIComponent(post.id || "");

   const destination = "?page=online-exam-info-" + postId;

   const postCard = makeCard(
    postTitle,
    description,
    destination,
    "▤"
   );

   postsContainer.appendChild(postCard);
  });
 }


 // ==================================================
 // SEARCH WHILE TYPING
 // ==================================================

 searchInput.addEventListener("input", function() {

  renderFilteredPosts(searchInput.value);

 });


 // ==================================================
 // INITIAL RENDER
 // ==================================================

 renderFilteredPosts();

}
