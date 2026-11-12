
// ==================================================
// CHANGE MAKER ACADEMY
// NAVIGATION & SUBJECT SELECTION
// ==================================================


// ==================================================
// GROUP SELECTION
// ==================================================

function renderGroups(program, mode) {

 clearContent();

 const isAdmission = mode === "admission";

 setPage(
  isAdmission ? "Admission Preparation" : program.toUpperCase() + " Preparation",
  isAdmission ? "ADMISSION" : program.toUpperCase(),
  isAdmission
   ? "Choose your academic group for admission preparation."
   : "Choose your academic group to continue your preparation.",
  demoImages[program] || demoImages.classroom,
  "?"
 );

 const grid = makeGrid();

 ["science", "arts", "commerce"].forEach(group => {

  const card = makeCard(
   groupNames[group],
   "Explore " + groupNames[group] + " subjects",
   "?page=subjects-" + program + "-" + group + "-" + mode,
   group === "science" ? "⚛" :
   group === "arts" ? "✎" : "▤"
  );

  grid.appendChild(card);

 });

 pageContent.appendChild(grid);
}


// ==================================================
// SUBJECT SELECTION
// ==================================================

function renderSubjectChoices(program, group, mode) {

 clearContent();

 const isAdmission = mode === "admission";

 const subjects = getSubjects(group, isAdmission ? "admission" : program);

 if (!subjects.length) {
  showNotFound();
  return;
 }

 setPage(
  groupNames[group] + " Subjects",
  isAdmission ? "ADMISSION PREPARATION" : program.toUpperCase() + " PREPARATION",
  "Choose a subject to explore available lessons and resources.",
  demoImages[group] || demoImages.classroom,
  "?page=groups-" + program + "-" + mode
 );

 const grid = makeGrid();

 subjects.forEach(subject => {

  const subjectName = subject[0];
  const subjectKey = subject[1];

  const card = makeCard(
   subjectName,
   "Explore " + subjectName + " resources",
   "?page=subject-" + program + "-" + group + "-" + subjectKey + "-" + mode,
   "▤"
  );

  grid.appendChild(card);

 });

 pageContent.appendChild(grid);
}
