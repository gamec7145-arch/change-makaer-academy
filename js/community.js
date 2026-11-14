
/* ==================================================
   CHANGE MAKER ACADEMY
   COMMUNITY — FRONTEND SYSTEM
   PART 1 OF 2
================================================== */

(function(){
"use strict";

let temporaryPosts = [];
let selectedImage = "";
let currentFilter = "";
let communityNotifications = [];
let activeCommentPost = null;

const reactionOptions = ["👍","❤️","😂","🔥"];
const userReactions = {};

const LOGIN_ERROR =
"Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";


// ================================================
// COMMON FUNCTIONS
// ================================================

function createElement(tag,className,text){
 const el = document.createElement(tag);

 if(className) el.className = className;
 if(text !== undefined) el.textContent = text;

 return el;
}

function showNotice(message){
 const notice = document.querySelector(".community-notice");

 if(!notice) return;

 notice.textContent = message;
 notice.classList.add("show");

 clearTimeout(notice._timer);

 notice._timer = setTimeout(()=>{
  notice.classList.remove("show");
 },4500);
}

function showLoginError(){
 showNotice(LOGIN_ERROR);
}

function createIcon(name){

 const icons = {
  search:`<circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path>`,
  home:`<path d="m3 10 9-7 9 7"></path><path d="M5 9v11h14V9"></path><path d="M9 20v-7h6v7"></path>`,
  user:`<circle cx="12" cy="8" r="4"></circle><path d="M5 21a7 7 0 0 1 14 0"></path>`,
  creator:`<path d="m16 4 4 4"></path><path d="M4 20 15.5 8.5"></path><path d="m13 6 5 5"></path><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z"></path>`,
  bell:`<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path>`,
  close:`<path d="m18 6-12 12M6 6l12 12"></path>`
 };

 const svg = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
 );

 svg.setAttribute("viewBox","0 0 24 24");
 svg.setAttribute("width","22");
 svg.setAttribute("height","22");
 svg.setAttribute("fill","none");
 svg.setAttribute("stroke","currentColor");
 svg.setAttribute("stroke-width","1.8");
 svg.setAttribute("stroke-linecap","round");
 svg.setAttribute("stroke-linejoin","round");
 svg.setAttribute("aria-hidden","true");
 svg.innerHTML = icons[name] || "";

 return svg;
}


// ================================================
// NOTIFICATIONS
// ================================================

function addReactionNotification(post,emoji){

 if(!post || post.author === "You") return;

 communityNotifications.unshift({
  postId:String(post.id),
  message:"You reacted " + emoji + " to " +
   (post.author || "a member") + "'s post.",
  time:"Just now"
 });
}

function renderNotifications(container){

 container.innerHTML = "";

 container.appendChild(
  createElement("h3","community-notifications-title","Notifications")
 );

 if(!communityNotifications.length){

  container.appendChild(
   createElement("div","community-empty","No notifications yet.")
  );

  return;
 }

 communityNotifications.forEach(item=>{

  const card = createElement(
   "div",
   "community-notification-item"
  );

  card.style.cssText = `
   padding:13px;
   margin-bottom:9px;
   border:1px solid var(--border);
   border-radius:12px;
   background:var(--panel);
   color:var(--white);
   font-size:13px;
  `;

  card.appendChild(createElement("div","",item.message));

  const time = createElement("small","",item.time);
  time.style.color = "var(--muted)";

  card.appendChild(time);
  container.appendChild(card);
 });
}


// ================================================
// COMMUNITY PAGE
// ================================================

function renderCommunityPage(){

 const pageContent = document.getElementById("pageContent");

 if(!pageContent){
  console.error("Community: #pageContent not found.");
  return;
 }

 document.body.classList.add("community-active");

 const root = createElement("div","community-page");


// ================================================
// HEADER
// ================================================

 const header = createElement("header","community-header");

 const brand = createElement("a","community-brand");

 brand.href = "?page=community";
 brand.innerHTML = 'CHANGE MAKER <span>COMMUNITY</span>';

 header.appendChild(brand);


// ================================================
// SEARCH
// ================================================

 const searchArea = createElement("div","community-search-area");

 searchArea.style.cssText = `
  position:relative;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  margin-left:auto;
  flex-shrink:0;
 `;

 const searchButton = createElement("button","community-search-btn");

 searchButton.type = "button";
 searchButton.setAttribute("aria-label","Open search");
 searchButton.appendChild(createIcon("search"));

 const search = createElement("div","community-search");

 search.style.cssText = `
  display:none;
  position:absolute;
  top:48px;
  right:0;
  width:min(260px,75vw);
  z-index:1002;
  padding:5px;
  border:1px solid var(--border);
  border-radius:25px;
  background:var(--bg);
 `;

 const searchInput = createElement("input");

 searchInput.type = "search";
 searchInput.placeholder = "Search posts...";

 search.appendChild(searchInput);
 searchArea.appendChild(searchButton);
 searchArea.appendChild(search);
 header.appendChild(searchArea);

 searchButton.addEventListener("click",()=>{

  const opening = search.style.display === "none";

  search.style.display = opening ? "block" : "none";

  searchButton.setAttribute("aria-expanded",String(opening));

  if(opening){
   searchInput.focus();
  }else{
   searchInput.value = "";
   currentFilter = "";
   renderFeed();
  }
 });

 searchInput.addEventListener("input",()=>{

  currentFilter = searchInput.value.trim().toLowerCase();
  renderFeed();
 });


// ================================================
// MAIN
// ================================================

 const main = createElement("main","community-main");

 const notice = createElement("div","community-notice");

 main.appendChild(notice);


// ================================================
// NAVIGATION
// ================================================

 const nav = createElement("nav","community-nav");

 const navItems = [
  ["home","Home","home"],
  ["user","Me","me"],
  ["creator","Creator Panel","creator"],
  ["bell","Notification","notifications"]
 ];

 const notificationPanel = createElement(
  "section",
  "community-notification-panel"
 );

 notificationPanel.style.cssText = `
  display:none;
  padding:16px;
  width:100%;
  box-sizing:border-box;
 `;

 const notificationList = createElement(
  "div",
  "community-notification-list"
 );

 notificationPanel.appendChild(notificationList);

 const sectionPanel = createElement(
  "section",
  "community-section-panel"
 );

 sectionPanel.style.cssText = `
  display:none;
  padding:16px;
  width:100%;
  box-sizing:border-box;
 `;

 navItems.forEach((item,index)=>{

  const button = createElement(
   "button",
   index === 0 ? "active" : ""
  );

  button.type = "button";
  button.setAttribute("aria-label",item[1]);

  button.style.cssText = `
   display:flex;
   flex-direction:column;
   align-items:center;
   justify-content:center;
   gap:5px;
  `;

  const iconWrap = createElement("span","community-nav-icon-wrap");

  iconWrap.style.cssText = `
   position:relative;
   width:30px;
   height:27px;
   display:flex;
   align-items:center;
   justify-content:center;
  `;

  const icon = createElement("span","community-nav-icon");
  icon.appendChild(createIcon(item[0]));
  iconWrap.appendChild(icon);

  if(item[2] === "notifications"){

   const dot = createElement("span","community-notification-dot");

   dot.style.cssText = `
    position:absolute;
    top:50%;
    left:50%;
    width:8px;
    height:8px;
    border:1px solid var(--bg);
    border-radius:50%;
    background:#ff3b45;
    transform:translate(-50%,-50%);
    z-index:2;
    pointer-events:none;
   `;

   iconWrap.appendChild(dot);
  }

  button.appendChild(iconWrap);

  button.appendChild(
   createElement("span","community-nav-label",item[1])
  );

  button.addEventListener("click",()=>{

   nav.querySelectorAll("button").forEach(btn=>{
    btn.classList.remove("active");
   });

   button.classList.add("active");

   main.style.display = "block";
   notificationPanel.style.display = "none";
   sectionPanel.style.display = "none";

   if(item[2] === "home"){
    showNotice("Welcome to the Community feed.");
   }

   if(item[2] === "me"){

    sectionPanel.style.display = "block";

    sectionPanel.innerHTML = `
     <h3>My Profile</h3>
     <p>Student profile will be connected after Account Login is added.</p>
    `;
   }

   if(item[2] === "creator"){

    sectionPanel.style.display = "block";

    sectionPanel.innerHTML = `
     <h3>Creator Panel</h3>
     <p>Creator access is reserved for authorized Admin, Developer and Moderator accounts.</p>
    `;
   }

   if(item[2] === "notifications"){

    main.style.display = "none";
    notificationPanel.style.display = "block";

    renderNotifications(notificationList);
   }
  });

  nav.appendChild(button);
 });

 header.appendChild(nav);
 root.appendChild(header);


// ================================================
// CREATE POST COMPOSER
// ================================================

 const composer = createElement("section","community-composer");

 composer.appendChild(
  createElement("h3","community-composer-title","Create a Post")
 );

 const textarea = createElement("textarea");

 textarea.placeholder = "What's on your mind?";
 textarea.maxLength = 2000;

 composer.appendChild(textarea);

 const preview = createElement("img","community-preview");

 preview.alt = "Selected post image preview";
 preview.style.display = "none";

 composer.appendChild(preview);

 const composerBottom = createElement(
  "div",
  "community-composer-bottom"
 );

 const photoLabel = createElement(
  "label",
  "community-photo-label",
  "▧ Add Photo"
 );

 const fileInput = createElement("input");

 fileInput.type = "file";
 fileInput.accept = "image/jpeg,image/png,image/webp";

 photoLabel.appendChild(fileInput);

 const fileName = createElement("div","community-selected-file");

 const publishButton = createElement(
  "button",
  "community-publish-btn",
  "Publish"
 );

 publishButton.type = "button";

 composerBottom.appendChild(photoLabel);
 composerBottom.appendChild(publishButton);

 composer.appendChild(composerBottom);
 composer.appendChild(fileName);

 main.appendChild(composer);

 main.appendChild(
  createElement("h3","community-feed-title","Community Feed")
 );

 const feed = createElement("div","community-feed");

 main.appendChild(feed);

 root.appendChild(main);
 root.appendChild(notificationPanel);
 root.appendChild(sectionPanel);


// ================================================
// IMAGE PREVIEW
// ================================================

 fileInput.addEventListener("change",()=>{

  const file = fileInput.files[0];

  selectedImage = "";

  if(!file){
   preview.style.display = "none";
   fileName.textContent = "";
   return;
  }

  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){

   fileInput.value = "";
   preview.style.display = "none";
   fileName.textContent = "";

   showNotice("Please choose a JPG, PNG or WEBP image.");
   return;
  }

  if(file.size > 5 * 1024 * 1024){

   fileInput.value = "";
   preview.style.display = "none";
   fileName.textContent = "";

   showNotice("Image size must be 5 MB or less.");
   return;
  }

  const reader = new FileReader();

  reader.onload = event=>{

   selectedImage = event.target.result;
   preview.src = selectedImage;
   preview.style.display = "block";
   fileName.textContent = file.name;
  };

  reader.readAsDataURL(file);
 });


// ================================================
// PUBLISH POST — LOGIN REQUIRED
// ================================================

 publishButton.addEventListener("click",()=>{

  showLoginError();

 });


// ================================================
// COMMENT BOTTOM SHEET
// ================================================

 const commentOverlay = createElement(
  "div",
  "community-comment-overlay"
 );

 commentOverlay.style.cssText = `
  display:none;
  position:fixed;
  inset:0;
  z-index:99999;
  background:rgba(0,0,0,.58);
  align-items:flex-end;
  justify-content:center;
 `;

 const commentSheet = createElement(
  "section",
  "community-comment-sheet"
 );

 commentSheet.style.cssText = `
  width:100%;
  max-width:650px;
  height:min(78vh,720px);
  display:flex;
  flex-direction:column;
  background:var(--bg);
  border:1px solid var(--border);
  border-bottom:0;
  border-radius:20px 20px 0 0;
  overflow:hidden;
  box-shadow:0 -8px 35px rgba(0,0,0,.3);
  animation:communitySheetUp .28s ease-out;
 `;

 const sheetStyle = document.createElement("style");

 sheetStyle.textContent = `
  @keyframes communitySheetUp {
   from {transform:translateY(100%)}
   to {transform:translateY(0)}
  }
 `;

 document.head.appendChild(sheetStyle);

 const sheetHeader = createElement(
  "div",
  "community-comment-sheet-header"
 );

 sheetHeader.style.cssText = `
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 16px;
  border-bottom:1px solid var(--border);
  flex-shrink:0;
 `;

 const sheetTitle = createElement("strong","","Comments");

 const closeButton = createElement(
  "button",
  "community-comment-close"
 );

 closeButton.type = "button";
 closeButton.appendChild(createIcon("close"));

 closeButton.style.cssText = `
  display:flex;
  align-items:center;
  justify-content:center;
  width:36px;
  height:36px;
  border:0;
  border-radius:50%;
  background:var(--panel);
  color:var(--white);
  cursor:pointer;
 `;

 sheetHeader.appendChild(sheetTitle);
 sheetHeader.appendChild(closeButton);

 const sheetComments = createElement(
  "div",
  "community-comment-sheet-list"
 );

 sheetComments.style.cssText = `
  flex:1;
  overflow-y:auto;
  padding:14px;
 `;

 const sheetForm = createElement(
  "form",
  "community-comment-sheet-form"
 );

 sheetForm.style.cssText = `
  display:flex;
  align-items:center;
  gap:8px;
  padding:12px;
  padding-bottom:calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--border);
  background:var(--bg);
  flex-shrink:0;
 `;

 const sheetInput = createElement(
  "input",
  "community-comment-sheet-input"
 );

 sheetInput.type = "text";
 sheetInput.placeholder = "Write a comment...";
 sheetInput.maxLength = 500;
 sheetInput.required = true;

 sheetInput.style.cssText = `
  flex:1;
  min-width:0;
  padding:12px 15px;
  border:1px solid var(--border);
  border-radius:24px;
  outline:none;
  background:var(--panel);
  color:var(--white);
  font:inherit;
 `;

 const sheetSend = createElement(
  "button",
  "community-comment-sheet-send",
  "Send"
 );

 sheetSend.type = "submit";

 sheetSend.style.cssText = `
  padding:11px 17px;
  border:0;
  border-radius:22px;
  background:var(--green);
  color:#052D3B;
  font:inherit;
  font-weight:900;
  cursor:pointer;
 `;

 sheetForm.appendChild(sheetInput);
 sheetForm.appendChild(sheetSend);

 commentSheet.appendChild(sheetHeader);
 commentSheet.appendChild(sheetComments);
 commentSheet.appendChild(sheetForm);

 commentOverlay.appendChild(commentSheet);
 root.appendChild(commentOverlay);


// ================================================
// COMMENT FUNCTIONS
// ================================================

 function closeCommentSheet(){

  commentOverlay.style.display = "none";
  activeCommentPost = null;
  sheetInput.value = "";
 }

 closeButton.addEventListener("click",closeCommentSheet);

 commentOverlay.addEventListener("click",event=>{

  if(event.target === commentOverlay){
   closeCommentSheet();
  }
 });

 function renderSheetComments(){

  sheetComments.innerHTML = "";

  if(!activeCommentPost) return;

  const comments = Array.isArray(activeCommentPost.comments)
   ? activeCommentPost.comments
   : [];

  if(!comments.length){

   sheetComments.appendChild(
    createElement(
     "div",
     "community-empty",
     "No comments yet."
    )
   );

   return;
  }

  comments.forEach(comment=>{

   const row = createElement(
    "div",
    "community-comment-sheet-row"
   );

   row.style.cssText = `
    display:flex;
    gap:10px;
    align-items:flex-start;
    margin-bottom:15px;
   `;

   const avatar = createElement(
    "div",
    "community-avatar",
    (comment.author || "U").charAt(0).toUpperCase()
   );

   const bubble = createElement(
    "div",
    "community-comment-bubble"
   );

   bubble.style.cssText = `
    padding:10px 13px;
    border-radius:15px;
    background:var(--panel);
    color:var(--white);
    max-width:calc(100% - 50px);
    overflow-wrap:anywhere;
   `;

   bubble.appendChild(
    createElement(
     "strong",
     "",
     comment.author || "Community Member"
    )
   );

   const commentText = createElement(
    "p",
    "",
    comment.text || ""
   );

   commentText.style.cssText = `
    margin:5px 0 0;
    font-size:13px;
    line-height:1.5;
   `;

   bubble.appendChild(commentText);
   row.appendChild(avatar);
   row.appendChild(bubble);

   sheetComments.appendChild(row);
  });

  sheetComments.scrollTop = sheetComments.scrollHeight;
 }

 function openCommentSheet(post){

  activeCommentPost = post;

  renderSheetComments();

  commentOverlay.style.display = "flex";

  setTimeout(()=>{
   sheetInput.focus();
  },150);
 }

 sheetForm.addEventListener("submit",event=>{

  event.preventDefault();

  const commentText = sheetInput.value.trim();

  if(!commentText || !activeCommentPost) return;

  activeCommentPost.comments =
   Array.isArray(activeCommentPost.comments)
    ? activeCommentPost.comments
    : [];

  activeCommentPost.comments.push({
   author:"You",
   text:commentText
  });

  sheetInput.value = "";

  renderSheetComments();
  renderFeed();

  showNotice(
   "Comment added to this temporary preview only."
  );
 });


// ================================================
// RENDER FEED
// ================================================

 function renderFeed(){

  feed.innerHTML = "";

  const demoPosts = Array.isArray(window.communityDemoPosts)
   ? window.communityDemoPosts
   : [];

  const allPosts = [
   ...temporaryPosts,
   ...demoPosts
  ];

  const filteredPosts = allPosts.filter(post=>{

   const comments = Array.isArray(post.comments)
    ? post.comments
    : [];

   const searchable = [
    post.author || "",
    post.caption || "",
    ...comments.map(comment=>
     (comment.author || "") + " " + (comment.text || "")
    )
   ].join(" ").toLowerCase();

   return searchable.includes(currentFilter);
  });

  if(!filteredPosts.length){

   feed.appendChild(
    createElement(
     "div",
     "community-empty",
     "No matching posts found."
    )
   );

   return;
  }

  filteredPosts.forEach(post=>{

   const card = createElement("article","community-post");

   const postId = String(
    post.id || post.author + post.time
   );


// AUTHOR

   const top = createElement("div","community-post-top");

   top.appendChild(
    createElement(
     "div",
     "community-avatar",
     post.avatar || "U"
    )
   );

   const authorInfo = createElement(
    "div",
    "community-author-info"
   );

   authorInfo.appendChild(
    createElement(
     "span",
     "community-author-name",
     post.author || "Community Member"
    )
   );

   authorInfo.appendChild(
    createElement(
     "span",
     "community-post-time",
     post.time || "Recently"
    )
   );

   if(post.isDemo){

    authorInfo.appendChild(
     createElement(
      "span",
      "community-demo-tag",
      "DEMO POST"
     )
    );
   }

   top.appendChild(authorInfo);

   card.appendChild(top);


// CAPTION

   if(post.caption){

    card.appendChild(
     createElement(
      "p",
      "community-caption",
      post.caption
     )
    );
   }


// IMAGE

   if(post.image){

    const image = createElement(
     "img",
     "community-post-image"
    );

    image.src = post.image;
    image.alt = "Community post image";
    image.loading = "lazy";

    card.appendChild(image);
   }


// REACTIONS — NO COUNTS

   const reactions = createElement(
    "div",
    "community-reactions"
   );

   if(!userReactions[postId]){
    userReactions[postId] = "";
   }

   reactionOptions.forEach(emoji=>{

    const selected = userReactions[postId] === emoji;

    const button = createElement(
     "button",
     "community-reaction community-reaction-button"
    );

    button.type = "button";
    button.textContent = emoji;
    button.setAttribute("aria-label","React with " + emoji);

    if(selected){

     button.classList.add("selected");

     button.style.background = "var(--green)";
     button.style.borderColor = "var(--green)";
     button.style.color = "#052D3B";
     button.style.transform = "scale(1.08)";
     button.style.fontWeight = "900";
    }

    button.addEventListener("click",()=>{

     const previous = userReactions[postId];

     if(previous === emoji){

      userReactions[postId] = "";

     }else{

      userReactions[postId] = emoji;
      addReactionNotification(post,emoji);
     }

     renderFeed();
    });

    reactions.appendChild(button);
   });

   card.appendChild(reactions);


// COMMENT ACTION

   const actionRow = createElement(
    "div",
    "community-post-actions"
   );

   actionRow.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 0;
    border-top:1px solid var(--border);
    border-bottom:1px solid var(--border);
   `;

   const commentButton = createElement(
    "button",
    "community-comment-toggle",
    "Comment"
   );

   commentButton.type = "button";

   commentButton.style.cssText = `
    border:0;
    background:transparent;
    color:var(--muted);
    font:inherit;
    font-weight:800;
    cursor:pointer;
    padding:8px 12px;
   `;

   commentButton.addEventListener("click",()=>{
    openCommentSheet(post);
   });

   actionRow.appendChild(commentButton);
   card.appendChild(actionRow);


// SHOW TWO COMMENTS

   const comments = Array.isArray(post.comments)
    ? post.comments
    : [];

   const previewComments = createElement(
    "div",
    "community-comments-preview"
   );

   previewComments.style.cssText = `
    padding-top:10px;
    display:flex;
    flex-direction:column;
    gap:8px;
   `;

   comments.slice(0,2).forEach(comment=>{

    const line = createElement(
     "div",
     "community-comment-preview-item"
    );

    line.style.cssText = `
     padding:8px 11px;
     border-radius:12px;
     background:var(--panel);
     color:var(--white);
     font-size:12px;
     line-height:1.5;
     overflow-wrap:anywhere;
    `;

    line.appendChild(
     createElement(
      "strong",
      "",
      comment.author || "Community Member"
     )
    );

    line.appendChild(
     document.createTextNode(": " + (comment.text || ""))
    );

    previewComments.appendChild(line);
   });

   if(comments.length > 2){

    const more = createElement(
     "button",
     "community-more-comments",
     "View all comments"
    );

    more.type = "button";

    more.addEventListener("click",()=>{
     openCommentSheet(post);
    });

    previewComments.appendChild(more);
   }

   card.appendChild(previewComments);
   feed.appendChild(card);
  });
 }


// ================================================
// ADD COMMUNITY TO PAGE
// ================================================

 pageContent.innerHTML = "";
 pageContent.appendChild(root);


// ================================================
// FIRST RENDER
// ================================================

 renderFeed();

}


// ================================================
// GLOBAL ROUTE
// ================================================

window.renderCommunityPage = renderCommunityPage;


// ================================================
// RESTORE NORMAL PAGE MODE
// ================================================

window.addEventListener("popstate",()=>{

 const params = new URLSearchParams(
  window.location.search
 );

 if(params.get("page") !== "community"){
  document.body.classList.remove("community-active");
 }

});

})();
    
