
function renderMaterialLevels(type){
 setPage(
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Study Materials",
  "Select your academic level.",
  demoImages.classroom,
  "?#materials"
 );

 const grid=makeGrid();

 ["ssc","hsc"].forEach(level=>{
  grid.appendChild(makeCard(
   level.toUpperCase(),
   level==="ssc"?"Class 9 & 10":"College",
   "?page=materials-level-"+type+"-"+level,
   "▤"
  ));
 });

 pageContent.appendChild(grid);
}

function renderMaterialGroups(type,level){
 setPage(
  level.toUpperCase()+" | Choose Group",
  type==="pdf"?"PDF Notes":"Practice",
  "Select Science, Arts or Commerce.",
  demoImages.classroom,
  "?page=materials-"+type
 );

 const grid=makeGrid();

 ["science","arts","commerce"].forEach(group=>{
  grid.appendChild(makeCard(
   groupNames[group],
   "Explore "+groupNames[group]+" materials",
   "?page=materials-group-"+type+"-"+level+"-"+group,
   "▤"
  ));
 });

 pageContent.appendChild(grid);
}

function renderMaterialSubjects(type,level,group){
 setPage(
  groupNames[group]+" Subjects",
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Choose a subject.",
  demoImages[group],
  "?page=materials-level-"+type+"-"+level
 );

 const grid=makeGrid();

 getSubjects(group,level).forEach(subject=>{
  grid.appendChild(makeCard(
   subject[0],
   "Open "+subject[0]+" chapters",
   "?page=materials-subject-"+type+"-"+level+"-"+group+"-"+subject[1],
   "▤"
  ));
 });

 pageContent.appendChild(grid);
}

function renderMaterialChapters(type,level,group,subjectKey){
 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 setPage(
  subject[0]+" Chapters",
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Select a chapter to continue.",
  demoImages[group],
  "?page=materials-group-"+type+"-"+level+"-"+group
 );

 const list=document.createElement("div");
 list.className="choice-grid";

 ["Chapter 1","Chapter 2","Chapter 3"].forEach((chapter,index)=>{
  const key="chapter-"+(index+1);

  list.appendChild(makeCard(
   chapter,
   subject[0]+" | "+chapter,
   "?page=materials-content-"+type+"-"+level+"-"+group+"-"+subjectKey+"-"+key,
   "▤"
  ));
 });

 pageContent.appendChild(list);
}

function renderMaterialContent(type,level,group,subjectKey,chapter){
 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 setPage(
  subject[0]+" | "+chapter.replaceAll("-"," ").toUpperCase(),
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Available learning content for this chapter.",
  demoImages[group],
  "?page=materials-subject-"+type+"-"+level+"-"+group+"-"+subjectKey
 );

 if(type==="pdf"){
  pageContent.appendChild(
   makeEmpty("PDF notes for this chapter will be uploaded here.")
  );
  return;
 }

 const grid=makeGrid();

 ["CQ","MCQ"].forEach(kind=>{
  grid.appendChild(makeCard(
   kind,
   kind==="CQ"?"Creative Questions":"Multiple Choice Questions",
   "?page=materials-practice-content-"+level+"-"+group+"-"+subjectKey+"-"+chapter+"-"+kind.toLowerCase(),
   "✎"
  ));
 });

 pageContent.appendChild(grid);
}

function renderPracticeContent(level,group,subjectKey,chapter,kind){
 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 setPage(
  subject[0]+" "+kind.toUpperCase(),
  "Practice | "+chapter.replaceAll("-"," "),
  "Practice content for this chapter will be published here.",
  demoImages[group],
  "?page=materials-content-practice-"+level+"-"+group+"-"+subjectKey+"-"+chapter
 );

 pageContent.appendChild(
  makeEmpty(
   kind.toUpperCase()+" questions and practice materials will be added here soon."
  )
 );
   }
