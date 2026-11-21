
// ==================================================
// CHANGE MAKER ACADEMY
// STUDY MATERIALS
// ==================================================


// ==================================================
// MATERIALS: LEVEL SELECTION
// ==================================================

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


// ==================================================
// MATERIALS: GROUP SELECTION
// ==================================================

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


// ==================================================
// MATERIALS: SUBJECT SELECTION
// ==================================================

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

  const subjectKey=subject[1];

  const hasParts=hasSubjectParts(
   group,level,subjectKey
  );

  const destination=hasParts
   ?"?page=materials-parts-"+type+"-"+level+"-"+group+"-"+subjectKey
   :"?page=materials-subject-"+type+"-"+level+"-"+group+"-"+subjectKey;

  grid.appendChild(makeCard(
   subject[0],
   hasParts
    ?"Select Paper for "+subject[0]
    :"Open "+subject[0]+" chapters",
   destination,
   "▤"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// MATERIALS: PAPER SELECTION
// ==================================================

function renderMaterialParts(type,level,group,subjectKey){

 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 const parts=getSubjectParts(group,level,subjectKey);

 if(!parts.length){
  renderMaterialChapters(
   type,level,group,subjectKey
  );
  return;
 }

 setPage(
  subject[0]+" | Select Paper",
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Choose a paper to explore its chapters.",
  demoImages[group],
  "?page=materials-group-"+type+"-"+level+"-"+group
 );

 const grid=makeGrid();

 parts.forEach((part,index)=>{

  grid.appendChild(makeCard(
   part,
   "Open "+subject[0]+" "+part,
   "?page=materials-subject-"+type+"-"+level+"-"+group+"-"+subjectKey+"-part-"+(index+1),
   "▤"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// MATERIALS: CHAPTER SELECTION
// ==================================================

function renderMaterialChapters(
 type,
 level,
 group,
 subjectKey,
 partIndex=null
){

 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 const availableParts=getSubjectParts(
  group,level,subjectKey
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
  subjectTitle+" Chapters",
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Select a chapter to continue.",
  demoImages[group],
  "?page="+(
   partName
    ?"materials-parts-"+type+"-"+level+"-"+group+"-"+subjectKey
    :"materials-group-"+type+"-"+level+"-"+group
  )
 );

 const list=document.createElement("div");
 list.className="choice-grid";

 ["Chapter 1","Chapter 2","Chapter 3"].forEach((chapter,index)=>{

  const key="chapter-"+(index+1);

  list.appendChild(makeCard(
   chapter,
   subjectTitle+" | "+chapter,
   "?page=materials-content-"+type+"-"+level+"-"+group+"-"+subjectKey+"-"+key+
    (partIndex!==null?"-part-"+partIndex:""),
   "▤"
  ));

 });

 pageContent.appendChild(list);
}


// ==================================================
// MATERIALS: CHAPTER CONTENT
// ==================================================

function renderMaterialContent(
 type,
 level,
 group,
 subjectKey,
 chapter,
 partIndex=null
){

 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 const availableParts=getSubjectParts(
  group,level,subjectKey
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
  subjectTitle+" | "+chapter.replaceAll("-"," ").toUpperCase(),
  type==="pdf"?"PDF Notes":"Practice Materials",
  "Available learning content for this chapter.",
  demoImages[group],
  "?page=materials-subject-"+type+"-"+level+"-"+group+"-"+subjectKey+
   (partIndex!==null?"-part-"+partIndex:"")
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
   "?page=materials-practice-content-"+level+"-"+group+"-"+subjectKey+"-"+chapter+"-"+kind.toLowerCase()+
    (partIndex!==null?"-part-"+partIndex:""),
   "✎"
  ));

 });

 pageContent.appendChild(grid);
}


// ==================================================
// PRACTICE: CQ / MCQ CONTENT
// ==================================================

function renderPracticeContent(
 level,
 group,
 subjectKey,
 chapter,
 kind,
 partIndex=null
){

 const subject=getSubject(group,level,subjectKey);

 if(!subject){
  showNotFound();
  return;
 }

 const availableParts=getSubjectParts(
  group,level,subjectKey
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
  subjectTitle+" "+kind.toUpperCase(),
  "Practice | "+chapter.replaceAll("-"," "),
  "Practice content for this chapter will be published here.",
  demoImages[group],
  "?page=materials-content-practice-"+level+"-"+group+"-"+subjectKey+"-"+chapter+
   (partIndex!==null?"-part-"+partIndex:"")
 );

 pageContent.appendChild(
  makeEmpty(
   kind.toUpperCase()+" questions and practice materials will be added here soon."
  )
 );
 }
   
