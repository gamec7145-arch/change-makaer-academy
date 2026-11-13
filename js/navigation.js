
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
// ONLINE EXAMINATION: EXAM POSTS
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

 const message = document.createElement("p");

 message.textContent =
  "No examinations have been published yet. Please check again later.";

 message.style.textAlign = "center";
 message.style.padding = "24px 12px";

 pageContent.appendChild(message);

}
