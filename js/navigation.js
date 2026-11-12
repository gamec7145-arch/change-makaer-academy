
function renderGroups(program,mode){
 const title=mode==="offline"?"Offline Batches":
             mode==="exam"?"Exam Preparation Course":"Online Batches";

 setPage(
  "Choose Your Group",
  title+" | "+program.toUpperCase(),
  "Select your group to continue.",
  demoImages.classroom,
  mode==="offline"?"?#offline":
  mode==="exam"?"?#exam":"?#batches"
 );

 const grid=makeGrid();

 ["science","arts","commerce"].forEach(group=>{
  const destination=mode==="offline"
   ?"offline-group-"+program+"-"+group
   :mode==="exam"
   ?"exam-group-"+program+"-"+group
   :"online-group-"+program+"-"+group;

  grid.appendChild(makeCard(
   groupNames[group],
   "Continue with "+groupNames[group],
   "?page="+destination,
   group==="science"?"⚗":group==="arts"?"📚":"▤"
  ));
 });

 pageContent.appendChild(grid);
}

function renderSubjectChoices(program,group,mode){
 const subjects=getSubjects(group,program);

 if(!subjects.length){
  showNotFound();
  return;
 }

 const modeTitle=mode==="offline"?"Offline Batch":
                 mode==="exam"?"Exam Preparation Course":"Online Lessons";

 setPage(
  groupNames[group]+" | "+program.toUpperCase(),
  modeTitle+" Subjects",
  "Choose a subject to continue.",
  demoImages[group],
  "?page="+(
   mode==="offline"?"offline-"+program:
   mode==="exam"?"exam-"+program:"online-"+program
  )
 );

 const grid=makeGrid();

 subjects.forEach(subject=>{
  let destination="";

  if(mode==="offline"){
   destination="offline-subject-"+program+"-"+group+"-"+subject[1];
  }

  if(mode==="exam"){
   destination="exam-courses-"+program+"-"+group+"-"+subject[1];
  }

  if(mode==="online"){
   destination="online-lessons-"+program+"-"+group+"-"+subject[1];
  }

  grid.appendChild(makeCard(
   subject[0],
   modeTitle+" | "+subject[0],
   "?page="+destination,
   mode==="online"?"▶":"▤"
  ));
 });

 pageContent.appendChild(grid);
    }
