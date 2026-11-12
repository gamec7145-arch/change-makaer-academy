
// ==================================================
// CHANGE MAKER ACADEMY
// ONLINE BATCHES
// ==================================================

// ==================================================
// ONLINE: SUBJECT -> VIDEO POSTS
// ==================================================

function renderOnlineLessons(program,group,subjectKey){

 const subject=getSubject(group,program,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 setPage(
  subject[0]+" Video Lessons",
  (program==="admission"?"Admission":program.toUpperCase())+
   " | "+groupNames[group],
  "Watch the available video lessons for "+subject[0]+".",
  demoImages[group],
  "?page=online-group-"+program+"-"+group
 );

 const videoKey=program+"-"+group+"-"+subjectKey;
 const videos=youtubeVideos[videoKey]||[];

 if(!videos.length){
  pageContent.appendChild(
   makeEmpty("Video lessons for this subject will be added soon.")
  );

  const channel=document.createElement("a");
  channel.className="channel-link";
  channel.href="https://youtube.com/@changemakeracademy?si=5nmz_GdwfYKGLF6G";
  channel.target="_blank";
  channel.rel="noopener";
  channel.textContent="Visit Our YouTube Channel ↗";

  pageContent.appendChild(channel);
  return;
 }

 renderVideoPosts(videos,subject[0]+" Video Lessons");
}
