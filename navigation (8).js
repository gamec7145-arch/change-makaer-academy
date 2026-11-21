
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
 searchInput.style.border = "1px solid #F6DEDD";
 searchInput.style.background = "#FFF2F1";
 searchInput.style.color = "#1C2236";
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
 resultMessage.style.color = "#69728A";

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
   postCard.style.background = "#FFFFFF";
   postCard.style.border = "1px solid #F6DEDD";
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

   subjectLabel.style.color = "#C92A44";
   subjectLabel.style.fontSize = "12px";
   subjectLabel.style.fontWeight = "700";
   subjectLabel.style.marginBottom = "9px";

   info.appendChild(subjectLabel);


   // TITLE
   const title = document.createElement("h3");

   title.textContent = post.title || "Online Examination";

   title.style.color = "#1C2236";
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

   chapter.style.color = "#69728A";
   chapter.style.fontSize = "14px";
   chapter.style.margin = "0 0 9px";

   info.appendChild(chapter);


   // CAPTION
   if (post.caption) {

    const caption = document.createElement("p");

    caption.textContent = post.caption;

    caption.style.color = "#69728A";
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

    item.style.background = "#FFF2F1";
    item.style.border = "1px solid #F6DEDD";
    item.style.borderRadius = "10px";
    item.style.padding = "10px 5px";
    item.style.textAlign = "center";
    item.style.minWidth = "0";

    const valueText = document.createElement("div");

    valueText.textContent = value;

    valueText.style.color = "#1C2236";
    valueText.style.fontSize = "16px";
    valueText.style.fontWeight = "800";

    const labelText = document.createElement("div");

    labelText.textContent = label;

    labelText.style.color = "#69728A";
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
   button.style.background = "linear-gradient(135deg,#EF4A52,#C92A44)";
   button.style.color = "#FFFFFF";
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

// ==================================================
// CHANGE MAKER ACADEMY
// ONLINE EXAMINATION SYSTEM
// ==================================================


// ==================================================
// DEMO QUESTIONS
// ==================================================

const onlineExamDemoQuestions = {

 "demo-english-01": [
  {
   question: "Choose the correct form: He _____ to school every day.",
   options: ["go", "goes", "going", "gone"],
   answer: 1
  },
  {
   question: "What is the plural form of 'Child'?",
   options: ["Childs", "Childes", "Children", "Childrens"],
   answer: 2
  },
  {
   question: "Choose the correct article: He is _____ honest man.",
   options: ["a", "an", "the", "no article"],
   answer: 1
  },
  {
   question: "What is the past form of 'Write'?",
   options: ["Writed", "Written", "Wrote", "Writing"],
   answer: 2
  },
  {
   question: "Choose the correct preposition: He is good _____ English.",
   options: ["in", "at", "on", "for"],
   answer: 1
  },
  {
   question: "Choose the correct sentence.",
   options: [
    "She do not like tea.",
    "She does not likes tea.",
    "She does not like tea.",
    "She not like tea."
   ],
   answer: 2
  },
  {
   question: "What is the opposite of 'Ancient'?",
   options: ["Old", "Modern", "Past", "Historic"],
   answer: 1
  },
  {
   question: "Choose the correct verb: They _____ playing football.",
   options: ["is", "am", "are", "was"],
   answer: 2
  },
  {
   question: "What is the noun form of 'Beautiful'?",
   options: ["Beauty", "Beautifully", "Beautify", "Beautified"],
   answer: 0
  },
  {
   question: "Choose the correct question tag: He is a student, _____?",
   options: ["is he", "isn't he", "does he", "doesn't he"],
   answer: 1
  }
 ],

 "demo-english-02": [
  {
   question: "Which word is a synonym of 'Happy'?",
   options: ["Sad", "Angry", "Joyful", "Tired"],
   answer: 2
  },
  {
   question: "What is the opposite of 'Difficult'?",
   options: ["Hard", "Easy", "Complex", "Tough"],
   answer: 1
  },
  {
   question: "Choose the correct spelling.",
   options: ["Enviroment", "Environment", "Envirnment", "Environmant"],
   answer: 1
  },
  {
   question: "Which one is a pronoun?",
   options: ["Book", "Beautiful", "They", "Quickly"],
   answer: 2
  },
  {
   question: "Choose the correct sentence.",
   options: [
    "I have seen him yesterday.",
    "I saw him yesterday.",
    "I see him yesterday.",
    "I seeing him yesterday."
   ],
   answer: 1
  },
  {
   question: "What is the comparative form of 'Good'?",
   options: ["Gooder", "Best", "Better", "More good"],
   answer: 2
  },
  {
   question: "Which one is an adjective?",
   options: ["Slowly", "Beautiful", "Run", "Happiness"],
   answer: 1
  },
  {
   question: "Choose the correct preposition: She is interested _____ music.",
   options: ["on", "at", "in", "for"],
   answer: 2
  },
  {
   question: "What is the past participle of 'Eat'?",
   options: ["Ate", "Eating", "Eaten", "Eats"],
   answer: 2
  },
  {
   question: "Which one is a conjunction?",
   options: ["And", "Beautiful", "Quickly", "Under"],
   answer: 0
  }
 ]

};


// ==================================================
// START ONLINE EXAMINATION
// ==================================================

function renderOnlineExamStart(postId) {

 // Stop any previous timer
 if (window.onlineExamTimer) {
  clearInterval(window.onlineExamTimer);
  window.onlineExamTimer = null;
 }

 const posts = Array.isArray(window.onlineExamPosts)
  ? window.onlineExamPosts
  : [];

 const post = posts.find(item =>
  String(item.id) === String(postId)
 );

 if (!post) {
  showNotFound();
  return;
 }

 const questions = Array.isArray(post.questions) &&
  post.questions.length > 0
   ? post.questions
   : onlineExamDemoQuestions[postId] || [];

 if (!questions.length) {
  showNotFound();
  return;
 }

 const duration = Math.max(1, Number(post.duration || 20));
 const totalSeconds = duration * 60;

 let remainingSeconds = totalSeconds;
 let submitted = false;
 let selectedAnswers = {};


 // ==================================================
 // PAGE SETUP
 // ==================================================

 setPage(
  post.title || "Online Examination",
  "Examination in Progress",
  "Answer all questions before submitting.",
  post.image || demoImages.classroom,
  post.backPage
   ? "?page=" + post.backPage
   : "?page=online-exam-posts-" +
     post.program + "-" +
     post.group + "-" +
     post.subject +
     (post.part ? "-part-" + post.part : "")
 );


 // ==================================================
 // TIMER DISPLAY
 // ==================================================

 const timerBox = document.createElement("div");

 timerBox.style.background = "#FFF2F1";
 timerBox.style.border = "1px solid #EF4A52";
 timerBox.style.borderRadius = "14px";
 timerBox.style.padding = "14px";
 timerBox.style.marginBottom = "20px";
 timerBox.style.textAlign = "center";

 const timerLabel = document.createElement("div");

 timerLabel.textContent = "TIME REMAINING";
 timerLabel.style.color = "#C92A44";
 timerLabel.style.fontSize = "12px";
 timerLabel.style.fontWeight = "800";

 const timerValue = document.createElement("div");

 timerValue.style.color = "#1C2236";
 timerValue.style.fontSize = "28px";
 timerValue.style.fontWeight = "900";
 timerValue.style.marginTop = "5px";

 timerBox.appendChild(timerLabel);
 timerBox.appendChild(timerValue);

 pageContent.appendChild(timerBox);


 // ==================================================
 // EXAM INFORMATION
 // ==================================================

 const info = document.createElement("div");

 info.style.background = "#FFFFFF";
 info.style.border = "1px solid #F6DEDD";
 info.style.borderRadius = "14px";
 info.style.padding = "14px";
 info.style.marginBottom = "20px";

 const examTitle = document.createElement("h3");

 examTitle.textContent = post.title || "Online Examination";
 examTitle.style.color = "#1C2236";
 examTitle.style.margin = "0 0 8px";
 examTitle.style.fontSize = "18px";

 const examDetails = document.createElement("p");

 examDetails.textContent =
  questions.length + " Questions  •  " +
  duration + " Minutes";

 examDetails.style.color = "#69728A";
 examDetails.style.fontSize = "13px";
 examDetails.style.margin = "0";

 info.appendChild(examTitle);
 info.appendChild(examDetails);

 pageContent.appendChild(info);


 // ==================================================
 // QUESTION CONTAINER
 // ==================================================

 const questionContainer = document.createElement("div");

 questionContainer.style.width = "100%";

 pageContent.appendChild(questionContainer);


 // ==================================================
 // RENDER QUESTIONS
 // ==================================================

 questions.forEach((question, index) => {

  const card = document.createElement("div");

  card.style.background = "#FFFFFF";
  card.style.border = "1px solid #F6DEDD";
  card.style.borderRadius = "14px";
  card.style.padding = "16px";
  card.style.marginBottom = "16px";


  const number = document.createElement("div");

  number.textContent = "QUESTION " + (index + 1);

  number.style.color = "#C92A44";
  number.style.fontSize = "12px";
  number.style.fontWeight = "800";
  number.style.marginBottom = "10px";


  const questionText = document.createElement("h3");

  questionText.textContent = question.question;

  questionText.style.color = "#1C2236";
  questionText.style.fontSize = "16px";
  questionText.style.lineHeight = "1.6";
  questionText.style.margin = "0 0 16px";


  card.appendChild(number);
  card.appendChild(questionText);


  question.options.forEach((option, optionIndex) => {

   const label = document.createElement("label");

   label.style.display = "flex";
   label.style.alignItems = "center";
   label.style.gap = "10px";
   label.style.padding = "12px";
   label.style.marginBottom = "9px";
   label.style.background = "#FFF2F1";
   label.style.border = "1px solid #F6DEDD";
   label.style.borderRadius = "10px";
   label.style.color = "#1C2236";
   label.style.fontSize = "14px";
   label.style.cursor = "pointer";


   const radio = document.createElement("input");

   radio.type = "radio";
   radio.name = "exam-question-" + index;
   radio.value = optionIndex;

   radio.style.accentColor = "#EF4A52";
   radio.style.width = "17px";
   radio.style.height = "17px";
   radio.style.flexShrink = "0";


   radio.addEventListener("change", function() {

    if (submitted) return;

    selectedAnswers[index] = optionIndex;

   });


   const optionText = document.createElement("span");

   optionText.textContent = option;

   label.appendChild(radio);
   label.appendChild(optionText);

   card.appendChild(label);

  });


  questionContainer.appendChild(card);

 });


 // ==================================================
 // RESULT BUTTON
 // ==================================================

 const resultButton = document.createElement("button");

 resultButton.type = "button";
 resultButton.textContent = "RESULT";

 resultButton.style.width = "100%";
 resultButton.style.padding = "15px";
 resultButton.style.border = "none";
 resultButton.style.borderRadius = "12px";
 resultButton.style.background = "linear-gradient(135deg,#EF4A52,#C92A44)";
 resultButton.style.color = "#FFFFFF";
 resultButton.style.fontSize = "15px";
 resultButton.style.fontWeight = "900";
 resultButton.style.cursor = "pointer";
 resultButton.style.marginBottom = "25px";

 pageContent.appendChild(resultButton);


 // ==================================================
 // TIMER FORMAT
 // ==================================================

 function formatExamTime(seconds) {

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return String(minutes).padStart(2, "0") +
   ":" +
   String(remaining).padStart(2, "0");
 }


 // ==================================================
 // SHOW RESULT
 // ==================================================

 function showExamResult() {

  if (submitted) return;

  submitted = true;

  clearInterval(window.onlineExamTimer);
  window.onlineExamTimer = null;

  let right = 0;

  questions.forEach((question, index) => {

   if (
    selectedAnswers[index] !== undefined &&
    Number(selectedAnswers[index]) === Number(question.answer)
   ) {
    right++;
   }

  });

  const wrong = questions.length - right;

  const elapsedSeconds = totalSeconds - remainingSeconds;

  const elapsedTime = formatExamTime(elapsedSeconds);


  // Clear examination page
  clearContent();

  homePage.style.display = "none";
  innerPage.classList.add("active");


  // Back target: class-prep posts carry their own backPage (chapter page);
  // normal online-exam posts go to their subject post list.
  const examBackHref = post.backPage
   ? "?page=" + post.backPage
   : "?page=online-exam-posts-" +
     post.program + "-" +
     post.group + "-" +
     post.subject +
     (post.part ? "-part-" + post.part : "");

  // RESULT PAGE
  setPage(
   "EXAMINATION RESULT",
   post.title || "Online Examination",
   "Your examination has been completed.",
   post.image || demoImages.classroom,
   examBackHref
  );


  // RESULT CARD (new design)
  const total = questions.length;
  const answered = Object.keys(selectedAnswers).filter(k => selectedAnswers[k] !== undefined).length;
  const wrongOnly = Math.max(0, answered - right);
  const skipped = Math.max(0, total - answered);
  const percent = total ? Math.round((right / total) * 100) : 0;

  const verdict = percent >= 80
   ? ["দারুণ! অসাধারণ ফলাফল", "great"]
   : percent >= 50
   ? ["ভালো হয়েছে! আরেকটু চেষ্টা করলেই পারফেক্ট", "good"]
   : ["হাল ছেড়ো না, আবার চেষ্টা করো", "low"];

  const backHref = examBackHref;

  function node(tag, cls, text) {
   const n = document.createElement(tag);
   if (cls) n.className = cls;
   if (text !== undefined) n.textContent = text;
   return n;
  }

  const resultCard = node("div", "cma-result " + verdict[1]);

  // top: score ring
  const top = node("div", "cma-result-top");
  top.appendChild(node("div", "cma-result-exam", post.title || "Online Examination"));

  const ring = node("div", "cma-result-ring");
  ring.style.setProperty("--pct", percent);
  const ringInner = node("div", "cma-result-ring-in");
  ringInner.appendChild(node("b", "", percent + "%"));
  ringInner.appendChild(node("span", "", right + " / " + total));
  ring.appendChild(ringInner);
  top.appendChild(ring);

  top.appendChild(node("div", "cma-result-verdict", verdict[0]));
  resultCard.appendChild(top);

  // stats
  const stats = node("div", "cma-result-stats");
  function stat(label, value, cls) {
   const box = node("div", "cma-stat " + cls);
   box.appendChild(node("b", "", String(value)));
   box.appendChild(node("span", "", label));
   stats.appendChild(box);
  }
  stat("RIGHT", right, "right");
  stat("WRONG", wrongOnly, "wrong");
  stat("SKIPPED", skipped, "skip");
  stat("TIME TAKEN", elapsedTime, "time");
  resultCard.appendChild(stats);

  // actions
  const actions = node("div", "cma-result-actions");
  const retryButton = node("button", "cma-btn-primary", "TRY AGAIN");
  retryButton.type = "button";
  retryButton.addEventListener("click", function() {
   renderOnlineExamStart(postId);
   window.scrollTo(0, 0);
  });
  const backBtn = node("a", "cma-btn-ghost", "← সব পরীক্ষা");
  backBtn.href = backHref;
  actions.append(retryButton, backBtn);
  resultCard.appendChild(actions);

  // answer review
  const review = node("details", "cma-review");
  review.appendChild(node("summary", "", "উত্তর দেখো (Review answers)"));
  questions.forEach((q, i) => {
   const chosen = selectedAnswers[i];
   const isRight = chosen !== undefined && Number(chosen) === Number(q.answer);
   const item = node("div", "cma-review-item " + (chosen === undefined ? "skip" : isRight ? "right" : "wrong"));
   item.appendChild(node("div", "cma-review-q", (i + 1) + ". " + q.question));
   const opts = q.options || [];
   if (chosen !== undefined && !isRight) {
    item.appendChild(node("div", "cma-review-a bad", "তোমার উত্তর: " + (opts[chosen] !== undefined ? opts[chosen] : "-")));
   }
   if (chosen === undefined) {
    item.appendChild(node("div", "cma-review-a bad", "উত্তর দেওয়া হয়নি"));
   }
   item.appendChild(node("div", "cma-review-a ok", "সঠিক উত্তর: " + (opts[q.answer] !== undefined ? opts[q.answer] : "-")));
   review.appendChild(item);
  });
  resultCard.appendChild(review);

  pageContent.appendChild(resultCard);

  window.scrollTo(0, 0);

 }


 // ==================================================
 // RESULT BUTTON CLICK
 // ==================================================

 resultButton.addEventListener("click", showExamResult);


 // ==================================================
 // START TIMER IMMEDIATELY
 // ==================================================

 function updateTimer() {

  timerValue.textContent = formatExamTime(remainingSeconds);

  if (remainingSeconds <= 0) {

   remainingSeconds = 0;

   timerValue.textContent = "00:00";

   showExamResult();

   return;
  }

  remainingSeconds--;

 }

 updateTimer();

 window.onlineExamTimer = setInterval(updateTimer, 1000);

             }
                         
