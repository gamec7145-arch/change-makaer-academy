
/* ==================================================
   CHANGE MAKER ACADEMY
   COMMUNITY — FRONTEND SYSTEM
================================================== */

(function(){
"use strict";

let temporaryPosts = [];
let selectedImage = "";
let currentFilter = "";

const reactionOptions = ["👍","❤️","😂","😮","😢","😡"];
const userReactions = {};
let communityNotifications = [];


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
}

function createIcon(name){

 const icons = {
  search:`<circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path>`,
  home:`<path d="m3 10 9-7 9 7"></path><path d="M5 9v11h14V9"></path><path d="M9 20v-7h6v7"></path>`,
  user:`<circle cx="12" cy="8" r="4"></circle><path d="M5 21a7 7 0 0 1 14 0"></path>`,
  creator:`<path d="m16 4 4 4"></path><path d="M4 20 15.5 8.5"></path><path d="m13 6 5 5"></path><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z"></path>`,
  bell:`<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path>`,
  close:`<path d="m18 6-12 12M6 6l12 12"></path>`,
  like:`<path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3z"></path><path d="M7 10 12 3a3 3 0 0 1 2 3v4h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7"></path>`,
  comment:`<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"></path>`,
  share:`<path d="M12 16V3"></path><path d="m7 8 5-5 5 5"></path><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>`
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

 communityNotifications = communityNotifications.filter(item =>
  item.postId !== String(post.id)
 );

 if(!emoji) return;

 communityNotifications.unshift({
  postId:String(post.id),
  message:"You reacted " + emoji + " to " + post.author + "'s post.",
  time:"Just now"
 });
}

function renderNotifications(container){

 container.innerHTML = "";

 container.appendChild(
  createElement(
   "h3",
   "community-notifications-title",
   "Notifications"
  )
 );

 if(!communityNotifications.length){

  container.appendChild(
   createElement(
    "div",
    "community-empty",
    "No notifications yet."
   )
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

  card.appendChild(
   createElement("div","",item.message)
  );

  const time = createElement(
   "small",
   "",
   item.time
  );

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
  console.error("Community error: #pageContent was not found.");
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

 const searchArea = createElement(
  "div",
  "community-search-area"
 );

 searchArea.style.cssText = `
  position:relative;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  margin-left:auto;
  flex-shrink:0;
 `;

 const searchButton = createElement(
  "button",
  "community-search-btn"
 );

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

  searchButton.setAttribute(
   "aria-expanded",
   String(opening)
  );

  if(opening){

   searchInput.focus();

  }else{

   searchInput.value = "";
   currentFilter = "";
   renderFeed();

  }
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

  const iconWrap = createElement(
   "span",
   "community-nav-icon-wrap"
  );

  iconWrap.style.cssText = `
   position:relative;
   width:30px;
   height:27px;
   display:flex;
   align-items:center;
   justify-content:center;
  `;

  const icon = createElement(
   "span",
   "community-nav-icon"
  );

  icon.appendChild(createIcon(item[0]));
  iconWrap.appendChild(icon);

  if(item[2] === "notifications"){

   const dot = createElement(
    "span",
    "community-notification-dot"
   );

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
   createElement(
    "span",
    "community-nav-label",
    item[1]
   )
  );

  button.addEventListener("click",()=>{

   nav.querySelectorAll("button").forEach(btn=>{
    btn.classList.remove("active");
   });

   button.classList.add("active");

   if(item[2] === "home"){

    main.style.display = "block";
    notificationPanel.style.display = "none";

    showNotice("Welcome to the Community feed.");
   }

   if(item[2] === "me"){

    main.style.display = "block";
    notificationPanel.style.display = "none";

    showNotice(
     "My Profile will be connected with your Account in a future update."
    );
   }

   if(item[2] === "creator"){

    main.style.display = "block";
    notificationPanel.style.display = "none";

    showNotice(
     "Creator Panel is planned for a future update."
    );
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
// CREATE POST
// ================================================

 const composer = createElement(
  "section",
  "community-composer"
 );

 composer.appendChild(
  createElement(
   "h3",
   "community-composer-title",
   "Create a Post"
  )
 );

 const textarea = createElement("textarea");

 textarea.placeholder = "What's on your mind?";
 textarea.maxLength = 2000;

 composer.appendChild(textarea);

 const preview = createElement(
  "img",
  "community-preview"
 );

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

 const fileName = createElement(
  "div",
  "community-selected-file"
 );

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
  createElement(
   "h3",
   "community-feed-title",
   "Community Feed"
  )
 );

 const feed = createElement("div","community-feed");

 main.appendChild(feed);

 root.appendChild(main);
 root.appendChild(notificationPanel);


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
   from { transform:translateY(100%); }
   to { transform:translateY(0); }
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

 const sheetTitle = createElement(
  "strong",
  "",
  "Comments"
 );

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

 let activeCommentPost = null;


// ================================================
// COMMENT FUNCTIONS
// ================================================

 function closeCommentSheet(){

  commentOverlay.style.display = "none";
  activeCommentPost = null;
  sheetInput.value = "";
 }

 closeButton.addEventListener(
  "click",
  closeCommentSheet
 );

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
     "No comments yet. Be the first to comment!"
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

  const text = sheetInput.value.trim();

  if(!text || !activeCommentPost) return;

  if(!Array.isArray(activeCommentPost.comments)){
   activeCommentPost.comments = [];
  }

  activeCommentPost.comments.push({
   author:"You",
   text:text
  });

  sheetInput.value = "";

  renderSheetComments();
  renderFeed();

  showNotice(
   "Your comment has been added to this temporary preview."
  );
 });


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
// PUBLISH POST
// ================================================

 publishButton.addEventListener("click",()=>{

  const caption = textarea.value.trim();

  if(!caption && !selectedImage){

   showNotice("Write something or add a photo first.");
   return;
  }

  temporaryPosts.unshift({

   id:"temporary-" + Date.now(),
   isTemporary:true,
   author:"You",
   avatar:"Y",
   time:"Just now",
   caption:caption,
   image:selectedImage,
   reactions:[],
   comments:[]
  });

  textarea.value = "";
  fileInput.value = "";
  fileName.textContent = "";

  preview.removeAttribute("src");
  preview.style.display = "none";

  selectedImage = "";

  showNotice(
   "Temporary preview post created. It is not saved to an account or database."
  );

  renderFeed();
 });


// ================================================
// SEARCH
// ================================================

 searchInput.addEventListener("input",()=>{

  currentFilter = searchInput.value
   .trim()
   .toLowerCase();

  renderFeed();
 });


// ================================================
// REACTION FUNCTIONS
// ================================================

 function saveReaction(post,postId,emoji){

  const previous = userReactions[postId] || "";

  userReactions[postId] = emoji;

  if(previous !== emoji){
   addReactionNotification(post,emoji);
  }

  renderFeed();
 }

 function createReactionPicker(post,postId,likeButton){

  const wrapper = createElement(
   "div",
   "community-reaction-picker"
  );

  wrapper.style.cssText = `
   display:none;
   position:absolute;
   left:0;
   bottom:calc(100% + 9px);
   z-index:100;
   align-items:center;
   gap:5px;
   padding:8px 10px;
   border:1px solid var(--border);
   border-radius:30px;
   background:var(--panel);
   box-shadow:0 5px 22px rgba(0,0,0,.35);
   white-space:nowrap;
  `;

  let hoveredEmoji = "";

  reactionOptions.forEach(emoji=>{

   const choice = createElement(
    "button",
    "community-reaction-choice",
    emoji
   );

   choice.type = "button";
   choice.dataset.emoji = emoji;

   choice.style.cssText = `
    width:36px;
    height:36px;
    padding:0;
    border:0;
    border-radius:50%;
    background:transparent;
    font-size:24px;
    cursor:pointer;
    transition:transform .12s ease,background .12s ease;
   `;

   choice.addEventListener("click",event=>{
    event.preventDefault();
    saveReaction(post,postId,emoji);
   });

   wrapper.appendChild(choice);
  });

  function openPicker(){
   wrapper.style.display = "flex";
   likeButton.classList.add("reaction-menu-open");
  }

  function closePicker(){
   wrapper.style.display = "none";
   likeButton.classList.remove("reaction-menu-open");
   hoveredEmoji = "";
  }

  function updateHover(event){

   if(wrapper.style.display !== "flex") return;

   const target = document.elementFromPoint(
    event.clientX,
    event.clientY
   );

   const choice = target && target.closest
    ? target.closest(".community-reaction-choice")
    : null;

   hoveredEmoji = choice ? choice.dataset.emoji : "";

   wrapper.querySelectorAll(".community-reaction-choice").forEach(button=>{

    const active = button.dataset.emoji === hoveredEmoji;

    button.style.transform = active ? "scale(1.45) translateY(-5px)" : "scale(1)";
    button.style.background = active ? "rgba(8,201,154,.18)" : "transparent";
   });
  }

  let pressTimer = null;
  let pickerOpened = false;
  let suppressClick = false;

  function clearPressTimer(){

   if(pressTimer){
    clearTimeout(pressTimer);
    pressTimer = null;
   }
  }

  likeButton.addEventListener("pointerdown",event=>{

   if(event.button !== undefined && event.button !== 0) return;

   pickerOpened = false;
   suppressClick = false;

   clearPressTimer();

   pressTimer = setTimeout(()=>{

    pickerOpened = true;
    suppressClick = true;

    openPicker();

   },350);
  });

  document.addEventListener("pointermove",event=>{

   if(pickerOpened){
    updateHover(event);
   }
  });

  document.addEventListener("pointerup",event=>{

   clearPressTimer();

   if(!pickerOpened) return;

   const target = document.elementFromPoint(
    event.clientX,
    event.clientY
   );

   const choice = target && target.closest
    ? target.closest(".community-reaction-choice")
    : null;

   const selectedEmoji = choice
    ? choice.dataset.emoji
    : hoveredEmoji;

   closePicker();

   if(selectedEmoji){
    saveReaction(post,postId,selectedEmoji);
   }

   pickerOpened = false;

   setTimeout(()=>{
    suppressClick = false;
   },100);
  });

  document.addEventListener("pointercancel",()=>{

   clearPressTimer();

   if(pickerOpened){
    closePicker();
    pickerOpened = false;
   }
  });

  likeButton.addEventListener("click",event=>{

   event.preventDefault();

   if(suppressClick || pickerOpened){
    suppressClick = false;
    return;
   }

   const previous = userReactions[postId] || "";

   if(previous === "👍"){

    userReactions[postId] = "";
    addReactionNotification(post,"");
    renderFeed();

   }else{

    saveReaction(post,postId,"👍");
   }
  });

  wrapper.addEventListener("pointerdown",event=>{
   event.stopPropagation();
  });

  return wrapper;
 }


// ================================================
// SHARE FUNCTIONS
// ================================================

 function createShareMenu(post,postId){

  const menu = createElement(
   "div",
   "community-share-menu"
  );

  menu.style.cssText = `
   display:none;
   position:absolute;
   right:0;
   bottom:calc(100% + 9px);
   z-index:100;
   width:190px;
   padding:7px;
   border:1px solid var(--border);
   border-radius:14px;
   background:var(--panel);
   box-shadow:0 5px 22px rgba(0,0,0,.35);
  `;

  const shareUrl = new URL(
   window.location.href
  );

  shareUrl.searchParams.set("page","community");
  shareUrl.hash = "post-" + encodeURIComponent(postId);

  const url = shareUrl.toString();

  function addShareOption(label,callback){

   const button = createElement(
    "button",
    "community-share-option",
    label
   );

   button.type = "button";

   button.style.cssText = `
    display:block;
    width:100%;
    padding:11px 10px;
    border:0;
    border-radius:9px;
    background:transparent;
    color:var(--white);
    text-align:left;
    font:inherit;
    font-size:13px;
    cursor:pointer;
   `;

   button.addEventListener("click",callback);

   menu.appendChild(button);
  }

  addShareOption("🔗 Copy Link",async()=>{

   try{

    await navigator.clipboard.writeText(url);

    showNotice("Post link copied.");

   }catch(error){

    showNotice("Could not copy link on this browser.");
   }

   menu.style.display = "none";
  });

  addShareOption("🟢 WhatsApp",()=>{

   const text = encodeURIComponent(
    (post.caption || "Check out this community post!") + "\n" + url
   );

   window.open(
    "https://wa.me/?text=" + text,
    "_blank",
    "noopener,noreferrer"
   );

   menu.style.display = "none";
  });

  addShareOption("✈️ Telegram",()=>{

   const text = encodeURIComponent(
    post.caption || "Check out this community post!"
   );

   window.open(
    "https://t.me/share/url?url=" +
    encodeURIComponent(url) +
    "&text=" + text,
    "_blank",
    "noopener,noreferrer"
   );

   menu.style.display = "none";
  });

  return menu;
 }


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

   const searchable = [
    post.author,
    post.caption,
    ...(post.comments || []).map(comment=>
     comment.author + " " + comment.text
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

   const card = createElement(
    "article",
    "community-post"
   );

   const postId = String(
    post.id || post.author + post.time
   );

   card.id = "post-" + postId;


// AUTHOR

   const top = createElement(
    "div",
    "community-post-top"
   );

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

   if(post.isTemporary){

    authorInfo.appendChild(
     createElement(
      "span",
      "community-demo-tag",
      "TEMPORARY PREVIEW"
     )
    );
   }

   top.appendChild(authorInfo);

   top.appendChild(
    createElement(
     "button",
     "community-post-menu",
     "···"
    )
   );

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


// ================================================
// FACEBOOK-STYLE ACTION BAR
// ================================================

   const actionRow = createElement(
    "div",
    "community-post-actions"
   );

   actionRow.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:space-around;
    gap:5px;
    position:relative;
    padding:11px 0;
    margin-top:5px;
    border-top:1px solid var(--border);
    border-bottom:1px solid var(--border);
   `;


// LIKE

   const likeWrap = createElement(
    "div",
    "community-action-wrap community-like-wrap"
   );

   likeWrap.style.cssText = `
    position:relative;
    flex:1;
    display:flex;
    justify-content:center;
   `;

   const likeButton = createElement(
    "button",
    "community-action-button community-like-button"
   );

   likeButton.type = "button";

   likeButton.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    width:100%;
    min-height:40px;
    border:0;
    border-radius:9px;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
    touch-action:pan-y;
    -webkit-tap-highlight-color:transparent;
   `;

   const selectedReaction = userReactions[postId] || "";

   if(selectedReaction){

    const selectedIcon = createElement(
     "span",
     "community-selected-reaction",
     selectedReaction
    );

    selectedIcon.style.fontSize = "21px";

    likeButton.appendChild(selectedIcon);

    likeButton.style.color = "var(--green)";
    likeButton.style.fontWeight = "900";

   }else{

    likeButton.appendChild(createIcon("like"));
   }

   likeButton.setAttribute(
    "aria-label",
    selectedReaction
     ? "Your reaction: " + selectedReaction
     : "Like. Hold and drag to react."
   );

   const reactionPicker = createReactionPicker(
    post,
    postId,
    likeButton
   );

   likeWrap.appendChild(likeButton);
   likeWrap.appendChild(reactionPicker);


// COMMENT

   const commentWrap = createElement(
    "div",
    "community-action-wrap community-comment-wrap"
   );

   commentWrap.style.cssText = `
    flex:1;
    display:flex;
    justify-content:center;
   `;

   const commentButton = createElement(
    "button",
    "community-action-button community-comment-toggle"
   );

   commentButton.type = "button";
   commentButton.appendChild(createIcon("comment"));

   commentButton.setAttribute(
    "aria-label",
    "Open comments"
   );

   commentButton.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    min-height:40px;
    border:0;
    border-radius:9px;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
   `;

   commentButton.addEventListener("click",()=>{
    openCommentSheet(post);
   });

   commentWrap.appendChild(commentButton);


// SHARE

   const shareWrap = createElement(
    "div",
    "community-action-wrap community-share-wrap"
   );

   shareWrap.style.cssText = `
    position:relative;
    flex:1;
    display:flex;
    justify-content:center;
   `;

   const shareButton = createElement(
    "button",
    "community-action-button community-share-button"
   );

   shareButton.type = "button";
   shareButton.appendChild(createIcon("share"));

   shareButton.setAttribute(
    "aria-label",
    "Share post"
   );

   shareButton.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    min-height:40px;
    border:0;
    border-radius:9px;
    background:transparent;
    color:var(--muted);
    cursor:pointer;
   `;

   const shareMenu = createShareMenu(post,postId);

   shareButton.addEventListener("click",()=>{

    const opening = shareMenu.style.display === "none";

    feed.querySelectorAll(".community-share-menu").forEach(menu=>{
     menu.style.display = "none";
    });

    shareMenu.style.display = opening ? "block" : "none";
   });

   shareWrap.appendChild(shareButton);
   shareWrap.appendChild(shareMenu);


// ADD THREE ICONS

   actionRow.appendChild(likeWrap);
   actionRow.appendChild(commentWrap);
   actionRow.appendChild(shareWrap);

   card.appendChild(actionRow);


// ================================================
// SHOW ONLY TWO COMMENTS
// ================================================

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
     document.createTextNode(
      ": " + (comment.text || "")
     )
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

    more.style.cssText = `
     border:0;
     background:transparent;
     color:var(--mint);
     text-align:left;
     font:inherit;
     font-size:12px;
     font-weight:800;
     cursor:pointer;
     padding:4px 2px;
    `;

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
// ADD COMMUNITY TO PAGE CONTENT
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
