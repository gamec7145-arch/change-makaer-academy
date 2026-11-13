
// ==================================================
// CHANGE MAKER ACADEMY
// ONLINE BATCHES
// ==================================================

// ==================================================
// ONLINE: SUBJECT -> VIDEO POSTS
// ==================================================

function renderOnlineLessons(program, group, subjectKey, partIndex = null) {

 const subject = getSubject(group, program, subjectKey);

 if (!subject) {
  showNotFound();
  return;
 }

 const availableParts = getSubjectParts(group, program, subjectKey);

 let partName = "";

 if (partIndex !== null) {
  const index = Number(partIndex);

  if (
   !Number.isInteger(index) ||
   index < 1 ||
   index > availableParts.length
  ) {
   showNotFound();
   return;
  }

  partName = availableParts[index - 1];
 }

 const subjectTitle =
  subject[0] + (partName ? " " + partName : "");

 setPage(
  subjectTitle + " Video Lessons",
  (program === "admission" ? "Admission" : program.toUpperCase()) +
   " | " + groupNames[group],
  "Watch the available video lessons for " + subjectTitle + ".",
  demoImages[group],
  "?page=" + (
   partName
    ? "subject-parts-online-" + program + "-" + group + "-" + subjectKey
    : "online-group-" + program + "-" + group
  )
 );

 const baseVideoKey = program + "-" + group + "-" + subjectKey;

 const videoKey = partName
  ? baseVideoKey + "-part-" + partIndex
  : baseVideoKey;

 const videos = youtubeVideos[videoKey] || [];

 if (!videos.length) {
  pageContent.appendChild(
   makeEmpty("Video lessons for this subject will be added soon.")
  );

  const channel = document.createElement("a");
  channel.className = "channel-link";
  channel.href = "https://youtube.com/@changemakeracademy?si=5nmz_GdwfYKGLF6G";
  channel.target = "_blank";
  channel.rel = "noopener";
  channel.textContent = "Visit Our YouTube Channel ↗";

  pageContent.appendChild(channel);
  return;
 }

 renderVideoPosts(videos, subjectTitle + " Video Lessons");
}
