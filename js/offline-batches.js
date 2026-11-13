
 // ==================================================
 // CHANGE MAKER ACADEMY
 // OFFLINE BATCHES
 // ==================================================


 // ==================================================
 // CREATE OFFLINE BATCH POST
 // ==================================================

function makePost(subject, program, group, partName = "") {

 const article = document.createElement("article");
 article.className = "offline-post";

 const img = document.createElement("img");
 img.src = demoImages.classroom;
 img.alt = subject + " offline class";
 img.loading = "lazy";

 const content = document.createElement("div");
 content.className = "post-content";

 const heading = document.createElement("h2");

 heading.textContent =
  subject +
  (partName ? " " + partName : "") +
  " Offline Batch";

 const description = document.createElement("p");

 description.textContent =
  "Upcoming " +
  subject +
  (partName ? " " + partName : "") +
  " offline batch information. Actual class schedules and teacher details will be added by the academy.";

 const meta = document.createElement("div");
 meta.className = "post-meta";

 const details = [
  ["◷", "Date: To be announced"],
  ["◴", "Time: To be announced"],
  ["♙", "Teachers: To be announced"],
  ["⌖", "Place: To be announced"],
  ["▤", "Program: " + program.toUpperCase()],
  ["▣", "Group: " + groupNames[group]]
 ];

 if (partName) {
  details.push(["▤", "Paper: " + partName]);
 }

 details.forEach(item => {

  const line = document.createElement("div");

  const symbol = document.createElement("span");
  symbol.textContent = item[0];

  const text = document.createElement("span");
  text.textContent = item[1];

  line.append(symbol, text);
  meta.append(line);

 });

 content.append(heading, description, meta);
 article.append(img, content);

 return article;

}


// ==================================================
// OFFLINE: SUBJECT -> BATCH POSTS
// ==================================================

function renderOfflinePosts(program, group, subjectKey, partIndex = null) {

 const subject = getSubject(group, program, subjectKey);

 if (!subject) {
  showNotFound();
  return;
 }

 const availableParts = getSubjectParts(
  group,
  program,
  subjectKey
 );

 let partName = "";

 if (partIndex !== null) {

  partName = availableParts[partIndex - 1];

  if (!partName) {
   showNotFound();
   return;
  }

 }

 setPage(
  subject[0] +
   (partName ? " " + partName : "") +
   " Offline Batch Posts",

  program.toUpperCase() + " | " + groupNames[group],

  "Upcoming batch posts, class schedules and teacher information.",

  demoImages.classroom,

  "?page=" +
   (partName
    ? "subject-parts-offline-" + program + "-" + group + "-" + subjectKey
    : "offline-group-" + program + "-" + group)
 );

 const posts = document.createElement("div");
 posts.className = "post-list";

 posts.appendChild(
  makePost(subject[0], program, group, partName)
 );

 pageContent.appendChild(posts);

 pageContent.appendChild(
  makeEmpty(
   "More batch posts will appear here when the academy publishes them."
  )
 );

                            }
