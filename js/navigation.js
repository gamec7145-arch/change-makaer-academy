
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
// ONLINE EXAMINATION: GET EXAM POSTS
// ==================================================

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
 resultMessage.style.padding = "12px";
 resultMessage.style.color = "#B5CBD3";

 pageContent.appendChild(resultMessage);


 // ==================================================
 // GET POSTS
 // ==================================================

 const posts = getOnlineExamPostData(
  program,
  group,
  subjectKey,
  partIndex
 );


 // ==================================================
 // RENDER EXAM CARDS
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
    post.caption,
    post.subject,
    post.program,
    post.group
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

   // CARD
   const postCard = document.createElement("article");

   postCard.style.width = "100%";
   postCard.style.boxSizing = "border-box";
   postCard.style.marginBottom = "20px";
   postCard.style.background = "#10414D";
   postCard.style.border = "1px solid #28616A";
   postCard.style.borderRadius = "18px";
   postCard.style.overflow = "hidden";


   // IMAGE
   const image = document.createElement("img");

   image.src = post.image || demoImages.classroom;
   image.alt = post.title || "Online Examination";

   image.style.width = "100%";
   image.style.height = "190px";
   image.style.display = "block";
   image.style.objectFit = "cover";

   image.onerror = function() {
    this.onerror = null;
    this.src = demoImages.classroom;
   };

   postCard.appendChild(image);


   // CARD INFORMATION
   const info = document.createElement("div");

   info.style.padding = "16px";


   // SUBJECT LABEL
   const subjectLabel = document.createElement("div");

   subjectLabel.textContent =
    program.toUpperCase() + "  •  " +
    groupNames[group] + "  •  " +
    subject[0] +
    (partIndex !== null ? "  •  " + (getSubjectParts(group, program, subjectKey)[partIndex - 1] || "") : "");

   subjectLabel.style.color = "#78E0C2";
   subjectLabel.style.fontSize = "12px";
   subjectLabel.style.fontWeight = "700";
   subjectLabel.style.marginBottom = "9px";

   info.appendChild(subjectLabel);


   // TITLE
   const title = document.createElement("h3");

   title.textContent = post.title || "Online Examination";

   title.style.color = "#FFFFFF";
   title.style.fontSize = "19px";
   title.style.fontWeight = "800";
   title.style.margin = "0 0 10px";
   title.style.lineHeight = "1.4";

   info.appendChild(title);


   // CHAPTER
   const chapter = document.createElement("p");

   const chapterNumber = post.chapter || post.chapterNumber || "";

   chapter.textContent = post.chapterName
    ? "Chapter " + chapterNumber + " | " + post.chapterName
    : chapterNumber
    ? "Chapter " + chapterNumber
    : "Chapter Practice";

   chapter.style.color = "#B5CBD3";
   chapter.style.fontSize = "14px";
   chapter.style.margin = "0 0 9px";

   info.appendChild(chapter);


   // CAPTION
   if (post.caption) {

    const caption = document.createElement("p");

    caption.textContent = post.caption;

    caption.style.color = "#B5CBD3";
    caption.style.fontSize = "14px";
    caption.style.lineHeight = "1.6";
    caption.style.margin = "0 0 15px";

    info.appendChild(caption);
   }


   // EXAM DETAILS
   const details = document.createElement("div");

   details.style.display = "grid";
   details.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
   details.style.gap = "8px";
   details.style.margin = "15px 0 18px";


   const mcqCount = Number(post.mcqCount || (post.questions || []).length || 0);
   const duration = Number(post.duration || 0);
   const marksPerQuestion = Number(post.marksPerQuestion || 1);
   const totalMarks = post.totalMarks !== undefined
    ? Number(post.totalMarks)
    : mcqCount * marksPerQuestion;


   function addDetail(label, value) {

    const item = document.createElement("div");

    item.style.background = "#08494B";
    item.style.border = "1px solid #28616A";
    item.style.borderRadius = "10px";
    item.style.padding = "10px 5px";
    item.style.textAlign = "center";
    item.style.minWidth = "0";

    const valueText = document.createElement("div");

    valueText.textContent = value;

    valueText.style.color = "#FFFFFF";
    valueText.style.fontSize = "16px";
    valueText.style.fontWeight = "800";

    const labelText = document.createElement("div");

    labelText.textContent = label;

    labelText.style.color = "#B5CBD3";
    labelText.style.fontSize = "11px";
    labelText.style.marginTop = "4px";

    item.appendChild(valueText);
    item.appendChild(labelText);

    details.appendChild(item);
   }


   addDetail("DURATION", duration + " min");
   addDetail("MCQ", String(mcqCount));
   addDetail("TOTAL MARKS", String(totalMarks));

   info.appendChild(details);


   // PROVE YOURSELF BUTTON
   const button = document.createElement("a");

   button.textContent = "PROVE YOURSELF";

   button.href =
    "?page=online-exam-start-" +
    encodeURIComponent(String(post.id || ""));

   button.style.display = "block";
   button.style.width = "100%";
   button.style.boxSizing = "border-box";
   button.style.padding = "14px 16px";
   button.style.background = "#08C99A";
   button.style.color = "#052D3B";
   button.style.textAlign = "center";
   button.style.textDecoration = "none";
   button.style.fontSize = "14px";
   button.style.fontWeight = "900";
   button.style.letterSpacing = "0.7px";
   button.style.borderRadius = "11px";

   info.appendChild(button);

   postCard.appendChild(info);

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
