
// ==================================================
// CHANGE MAKER ACADEMY
// EXAM PREPARATION
// ==================================================


// ==================================================
// EXAM: SSC / HSC LEVEL SELECTION
// ==================================================

function renderExamLevels(){

 setPage(
  "Exam Preparation Course",
  "Learn More",
  "Choose your examination to explore available courses.",
  demoImages.classroom,
  "?#exam"
 );

 const grid=makeGrid();

 grid.appendChild(makeCard(
  "SSC Preparation",
  "Class 9 & 10",
  "?page=exam-ssc",
  "▤"
 ));

 grid.appendChild(makeCard(
  "HSC Preparation",
  "College",
  "?page=exam-hsc",
  "▣"
 ));

 pageContent.appendChild(grid);
}


// ==================================================
// UNIVERSAL VIDEO POST RENDERER
// ==================================================

function renderVideoPosts(videos,headingText){

 if(!Array.isArray(videos)||!videos.length){
  pageContent.appendChild(
   makeEmpty("Video lessons will be added here soon.")
  );
  return;
 }

 const heading=document.createElement("h2");
 heading.textContent=headingText||"Video Lessons";
 heading.style.marginBottom="16px";

 const list=document.createElement("div");
 list.className="exam-video-list";

 videos.forEach((entry,index)=>{

  const videoData=typeof entry==="string"
   ?{url:entry}
   :entry;

  const videoId=getYouTubeVideoId(
   videoData.url||videoData.id||""
  );

  if(!videoId)return;

  const videoTitle=videoData.title||("Lesson "+(index+1));

  const card=document.createElement("article");
  card.className="exam-video-card";

  const thumbButton=document.createElement("button");
  thumbButton.type="button";
  thumbButton.className="exam-video-thumb";
  thumbButton.setAttribute("aria-label","Play "+videoTitle);

  const thumb=document.createElement("img");
  thumb.src=videoData.image||
   "https://img.youtube.com/vi/"+videoId+"/hqdefault.jpg";
  thumb.alt=videoTitle;
  thumb.loading="lazy";

  const playIcon=document.createElement("span");
  playIcon.className="exam-video-play";
  playIcon.textContent="▶";

  thumbButton.append(thumb,playIcon);

  const title=document.createElement("div");
  title.className="exam-video-title";
  title.textContent=videoTitle;

  const frameSlot=document.createElement("div");
  frameSlot.className="exam-video-frame";

  thumbButton.addEventListener("click",()=>{
   playUniversalVideo(videoId,frameSlot,videoTitle);

   frameSlot.scrollIntoView({
    behavior:"smooth",
    block:"nearest"
   });
  });

  card.append(thumbButton,title,frameSlot);
  list.appendChild(card);

 });

 if(!list.children.length){
  pageContent.appendChild(
   makeEmpty("No valid YouTube video links have been added yet.")
  );
  return;
 }

 pageContent.append(heading,list);
}


// ==================================================
// EXAM: COURSE FILTER
// ==================================================

function getExamCoursesForSubject(
 program,
 group,
 subjectKey,
 partIndex=null,
 partName=""
){

 return examCourses.filter(course=>{

  if(course.program && course.program!==program)return false;
  if(course.group && course.group!==group)return false;
  if(course.subjectKey && course.subjectKey!==subjectKey)return false;

  const coursePart=course.part||course.paper||"";
  const coursePartIndex=Number(
   course.partIndex||course.paperIndex||0
  );

  if(partIndex!==null){
   return (
    coursePartIndex===Number(partIndex) ||
    coursePart===partName
   );
  }

  return !coursePartIndex&&!coursePart;
 });
}


// ==================================================
// EXAM: SUBJECT -> COURSE POSTS
// ==================================================

function renderExamCourses(
 program,
 group,
 subjectKey,
 partIndex=null
){

 const subject=getSubject(group,program,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 const availableParts=getSubjectParts(
  group,program,subjectKey
 );

 let partName="";

 if(partIndex!==null){

  const index=Number(partIndex);

  if(
   !Number.isInteger(index)||
   index<1||
   index>availableParts.length
  ){
   showNotFound();
   return;
  }

  partName=availableParts[index-1];
 }

 const subjectTitle=
  subject[0]+(partName?" "+partName:"");

 setPage(
  subjectTitle+" Courses",
  "Exam Preparation Course | "+program.toUpperCase()+" | "+groupNames[group],
  "Choose a course to see its details.",
  demoImages[group],
  "?page="+(
   partName
    ?"subject-parts-exam-"+program+"-"+group+"-"+subjectKey
    :"exam-group-"+program+"-"+group
  )
 );

 const list=document.createElement("div");
 list.className="course-list";

 const courses=getExamCoursesForSubject(
  program,
  group,
  subjectKey,
  partIndex,
  partName
 );

 if(!courses.length){
  pageContent.appendChild(
   makeEmpty(
    partName
     ?"Courses for "+subjectTitle+" will be added soon."
     :"Courses for this subject will be added soon."
   )
  );
  return;
 }

 courses.forEach(course=>{

  const card=document.createElement("article");
  card.className="course-card";

  const image=document.createElement("img");
  image.className="course-card-image";
  image.src=course.image||demoImages.classroom;
  image.alt=course.name+" course photo";
  image.loading="lazy";

  const body=document.createElement("div");
  body.className="course-card-body";

  const heading=document.createElement("h3");
  heading.textContent=course.name;

  const desc=document.createElement("p");
  desc.textContent=course.description;

  const price=document.createElement("div");
  price.className="course-price";
  price.textContent="Course Value: "+course.price;

  const link=document.createElement("a");
  link.className="action-link";

  const detailRoute=
   "exam-detail-"+program+"-"+group+"-"+subjectKey+
   "-"+course.id+
   (partIndex!==null?"-part-"+partIndex:"");

  link.href="?page="+detailRoute;
  link.textContent="View Details →";

  body.append(heading,desc,price,link);
  card.append(image,body);

  list.appendChild(card);

 });

 pageContent.appendChild(list);
}


// ==================================================
// EXAM: COURSE DETAILS + VIDEO POSTS
// ==================================================

function renderExamDetails(
 program,
 group,
 subjectKey,
 courseId,
 partIndex=null
){

 const subject=getSubject(group,program,subjectKey);
 const course=examCourses.find(item=>item.id===courseId);

 if(!subject||!course){
  showNotFound();
  return;
 }

 const availableParts=getSubjectParts(
  group,program,subjectKey
 );

 let partName="";

 if(partIndex!==null){

  const index=Number(partIndex);

  if(
   !Number.isInteger(index)||
   index<1||
   index>availableParts.length
  ){
   showNotFound();
   return;
  }

  partName=availableParts[index-1];

  const coursePart=course.part||course.paper||"";
  const coursePartIndex=Number(
   course.partIndex||course.paperIndex||0
  );

  if(
   coursePartIndex!==index&&
   coursePart!==partName
  ){
   showNotFound();
   return;
  }
 }

 setPage(
  course.name,
  "Course Details | "+subject[0]+
   (partName?" | "+partName:""),
  "Read the course information before making an enquiry.",
  course.image||demoImages[group],
  "?page=exam-courses-"+program+"-"+group+"-"+subjectKey+
   (partIndex!==null?"-part-"+partIndex:"")
 );

 const box=document.createElement("div");
 box.className="detail-box";

 const courseImage=document.createElement("img");
 courseImage.src=course.image||demoImages.classroom;
 courseImage.alt=course.name+" course photo";
 courseImage.style.width="100%";
 courseImage.style.aspectRatio="16/8";
 courseImage.style.objectFit="cover";
 courseImage.style.borderRadius="14px";
 courseImage.style.marginBottom="18px";

 const heading=document.createElement("h2");
 heading.textContent=course.name;

 const description=document.createElement("p");
 description.textContent=course.description;

 const subjectInfo=document.createElement("p");
 subjectInfo.textContent=
  "Subject: "+subject[0]+
  (partName?" | Paper: "+partName:"")+
  " | Group: "+groupNames[group]+
  " | Level: "+program.toUpperCase();

 const value=document.createElement("p");
 value.textContent="Course Value: "+course.price;

 box.append(courseImage,heading,description,subjectInfo,value);

 const videos=Array.isArray(course.videos)?[...course.videos]:[];

 if(course.video){
  videos.unshift(course.video);
 }

 pageContent.appendChild(box);

 if(videos.length){
  renderVideoPosts(videos,"Course Videos");
 }else{
  box.appendChild(
   makeEmpty("Course videos will be added here soon.")
  );
 }

 const bottom=document.createElement("div");
 bottom.className="detail-bottom";

 const purchase=document.createElement("button");
 purchase.className="purchase-button";
 purchase.type="button";
 purchase.textContent="Purchase Now";

 purchase.addEventListener("click",()=>{
  alert("The course purchase process will be announced by Change Maker Academy. Please contact the academy for details.");
 });

 bottom.appendChild(purchase);
 box.appendChild(bottom);
}
