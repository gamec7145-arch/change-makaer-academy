
/* ==================================================
   CHANGE MAKER ACADEMY
   COMMUNITY — FRONTEND SYSTEM
================================================== */

(function(){

 "use strict";

 let temporaryPosts = [];
 let selectedImage = "";
 let currentFilter = "";

 const reactionOptions = ["👍","❤️","😂","🔥"];

 // One reaction per user per post
 const userReactions = {};

 // Temporary local notifications
 let communityNotifications = [];

 // Open comment sections
 const expandedComments = {};


 // ================================================
 // COMMON FUNCTIONS
 // ================================================

 function createElement(tag,className,text){

  const element = document.createElement(tag);

  if(className) element.className = className;
  if(text !== undefined) element.textContent = text;

  return element;
 }


 function showNotice(message){

  const notice = document.querySelector(".community-notice");

  if(!notice) return;

  notice.textContent = message;
  notice.classList.add("show");

 }


 function createIcon(name){

  const icons = {

   search: `
    <circle cx="10.8" cy="10.8" r="6.8"></circle>
    <path d="m16 16 5 5"></path>
   `,

   home: `
    <path d="m3 10 9-7 9 7"></path>
    <path d="M5 9v11h14V9"></path>
    <path d="M9 20v-7h6v7"></path>
   `,

   user: `
    <circle cx="12" cy="8" r="4"></circle>
    <path d="M5 21a7 7 0 0 1 14 0"></path>
   `,

   creator: `
    <path d="m16 4 4 4"></path>
    <path d="M4 20 15.5 8.5"></path>
    <path d="m13 6 5 5"></path>
    <path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z"></path>
   `,

   bell: `
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
    <path d="M10 21h4"></path>
   `

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
 // NOTIFICATION SYSTEM
 // ================================================

 function addReactionNotification(post,emoji){

  if(!post || post.author === "You") return;

  // Remove previous reaction notification
  // from this user for this post
  communityNotifications = communityNotifications.filter(item=>{

   return !(
    item.postId === String(post.id) &&
    item.type === "reaction" &&
    item.from === "You"
   );

  });

  communityNotifications.unshift({

   id: "notification-" + Date.now(),

   type: "reaction",

   postId: String(post.id),

   from: "You",

   owner: post.author,

   emoji: emoji,

   message: emoji
    ? "You reacted " + emoji + " to " + post.author + "'s post."
    : "Your reaction was removed.",

   time: "Just now",

   read: false

  });

 }


 function renderNotifications(container){

  container.innerHTML = "";

  const title = createElement(
   "h3",
   "community-notifications-title",
   "Notifications"
  );

  container.appendChild(title);

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

   const notification = createElement(
    "div",
    "community-notification-item"
   );

   notification.style.cssText = `
    padding:13px;
    margin-bottom:9px;
    border:1px solid var(--border);
    border-radius:12px;
    background:var(--panel);
    color:var(--white);
    font-size:13px;
   `;

   const message = createElement(
    "div",
    "",
    item.message
   );

   const time = createElement(
    "small",
    "",
    item.time
   );

   time.style.cssText = `
    display:block;
    margin-top:5px;
    color:var(--muted);
   `;

   notification.appendChild(message);
   notification.appendChild(time);

   container.appendChild(notification);

  });

 }


 // ================================================
 // RENDER COMMUNITY PAGE
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
  searchButton.setAttribute("aria-expanded","false");

  searchButton.style.cssText = `
   width:40px;
   height:40px;
   display:flex;
   align-items:center;
   justify-content:center;
   border:1px solid var(--border);
   border-radius:50%;
   background:var(--panel);
   color:var(--white);
   cursor:pointer;
  `;

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
   box-shadow:0 8px 24px rgba(0,0,0,.25);
  `;

  const searchInput = createElement("input");

  searchInput.type = "search";
  searchInput.placeholder = "Search posts...";
  searchInput.setAttribute("aria-label","Search community posts");

  search.appendChild(searchInput);
  searchArea.appendChild(searchButton);
  searchArea.appendChild(search);
  header.appendChild(searchArea);

  searchButton.addEventListener("click",()=>{

   const isHidden = search.style.display === "none";

   if(isHidden){

    search.style.display = "block";
    searchButton.setAttribute("aria-expanded","true");
    searchButton.setAttribute("aria-label","Close search");
    searchInput.focus();

   }else{

    search.style.display = "none";
    searchButton.setAttribute("aria-expanded","false");
    searchButton.setAttribute("aria-label","Open search");

    searchInput.value = "";
    currentFilter = "";

    renderFeed();

   }

  });


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

   const icon = createElement("span","community-nav-icon");

   icon.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
   `;

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

   const label = createElement(
    "span",
    "community-nav-label",
    item[1]
   );

   button.appendChild(iconWrap);
   button.appendChild(label);

   button.addEventListener("click",()=>{

    nav.querySelectorAll("button").forEach(btn=>{
     btn.classList.remove("active");
    });

    button.classList.add("active");

    if(item[2] === "home"){

     notificationPanel.style.display = "none";
     main.style.display = "block";

     showNotice("Welcome to the Community feed.");

    }

    if(item[2] === "me"){

     showNotice(
      "My Profile will be connected with your Account in a future update."
     );

    }

    if(item[2] === "creator"){

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
  // MAIN
  // ================================================

  const main = createElement("main","community-main");

  const notice = createElement("div","community-notice");

  main.appendChild(notice);


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


  // ================================================
  // COMMUNITY FEED
  // ================================================

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


  // ================================================
  // NOTIFICATION PANEL
  // ================================================

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
  root.appendChild(notificationPanel);

  pageContent.appendChild(root);


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

   reader.onload = function(event){

    selectedImage = event.target.result;

    preview.src = selectedImage;
    preview.style.display = "block";

    fileName.textContent = file.name;

   };

   reader.readAsDataURL(file);

  });


  // ================================================
  // CREATE TEMPORARY POST
  // ================================================

  publishButton.addEventListener("click",()=>{

   const caption = textarea.value.trim();

   if(!caption && !selectedImage){

    showNotice("Write something or add a photo first.");
    return;
   }

   temporaryPosts.unshift({

    id: "temporary-" + Date.now(),

    isDemo: false,
    isTemporary: true,

    author: "You",
    avatar: "Y",

    time: "Just now",

    caption: caption,
    image: selectedImage,

    reactions: [],
    comments: []

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
  // SEARCH POSTS
  // ================================================

  searchInput.addEventListener("input",()=>{

   currentFilter = searchInput.value
    .trim()
    .toLowerCase();

   renderFeed();

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

    const searchable = [
     post.author,
     post.caption,
     ...(post.comments || []).map(comment =>
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

    const card = createElement("article","community-post");

    const postId = String(post.id || post.author + post.time);


    // ================================================
    // AUTHOR
    // ================================================

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


    // ================================================
    // CAPTION
    // ================================================

    if(post.caption){

     card.appendChild(
      createElement(
       "p",
       "community-caption",
       post.caption
      )
     );

    }


    // ================================================
    // IMAGE
    // ================================================

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
    // REACTIONS
    // ================================================

    const reactions = createElement(
     "div",
     "community-reactions"
    );

    const baseReactions = Array.isArray(post.reactions)
     ? post.reactions
     : [];

    const selectedEmoji = userReactions[postId] || "";

    reactionOptions.forEach(emoji=>{

     const baseCount = baseReactions.filter(
      value=>value === emoji
     ).length;

     const selected = selectedEmoji === emoji;

     const count = baseCount + (selected ? 1 : 0);

     const button = createElement(
      "button",
      "community-reaction community-reaction-button"
     );

     button.type = "button";

     button.textContent = count > 0
      ? emoji + " " + count
      : emoji;

     button.setAttribute(
      "aria-label",
      "React with " + emoji + ". " + count + " reactions."
     );

     button.style.cssText = `
      cursor:pointer;
      transition:all .18s ease;
     `;

     if(selected){

      button.classList.add("selected");

      button.style.background = "var(--green)";
      button.style.borderColor = "var(--green)";
      button.style.color = "#052D3B";
      button.style.transform = "scale(1.08)";
      button.style.fontWeight = "900";

     }

     button.addEventListener("click",()=>{

      const previousEmoji = userReactions[postId] || "";

      if(previousEmoji === emoji){

       delete userReactions[postId];

       addReactionNotification(post,"");

      }else{

       userReactions[postId] = emoji;

       addReactionNotification(post,emoji);

      }

      renderFeed();

     });

     reactions.appendChild(button);

    });

    card.appendChild(reactions);


    // ================================================
    // COMMENT ACTION BUTTON
    // ================================================

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

    commentButton.setAttribute(
     "aria-expanded",
     expandedComments[postId] ? "true" : "false"
    );

    actionRow.appendChild(commentButton);
    card.appendChild(actionRow);


    // ================================================
    // COMMENTS SECTION
    // ================================================

    const commentsBox = createElement(
     "div",
     "community-comments"
    );

    commentsBox.style.cssText = `
     display:${expandedComments[postId] ? "block" : "none"};
     padding-top:12px;
    `;

    commentsBox.appendChild(
     createElement(
      "div",
      "community-comments-title",
      "COMMENTS"
     )
    );

    const comments = Array.isArray(post.comments)
     ? post.comments
     : [];

    const commentsList = createElement(
     "div",
     "community-comments-list"
    );

    if(!comments.length){

     commentsList.appendChild(
      createElement(
       "div",
       "community-comment",
       "No comments yet."
      )
     );

    }else{

     comments.forEach(comment=>{

      const commentLine = createElement(
       "div",
       "community-comment"
      );

      const name = createElement(
       "strong",
       "",
       comment.author || "Community Member"
      );

      commentLine.appendChild(name);

      commentLine.appendChild(
       document.createTextNode(
        ": " + (comment.text || "")
       )
      );

      commentsList.appendChild(commentLine);

     });

    }

    commentsBox.appendChild(commentsList);


    // ================================================
    // WRITE A COMMENT
    // ================================================

    const commentForm = createElement(
     "form",
     "community-comment-form"
    );

    commentForm.style.cssText = `
     display:flex;
     align-items:center;
     gap:8px;
     margin-top:12px;
    `;

    const commentInput = createElement(
     "input",
     "community-comment-input"
    );

    commentInput.type = "text";
    commentInput.placeholder = "Write a comment...";
    commentInput.maxLength = 500;
    commentInput.required = true;

    commentInput.style.cssText = `
     flex:1;
     min-width:0;
     padding:11px 13px;
     border:1px solid var(--border);
     border-radius:22px;
     outline:none;
     background:var(--panel);
     color:var(--white);
     font-family:inherit;
     font-size:12px;
    `;

    const sendButton = createElement(
     "button",
     "community-comment-send",
     "Send"
    );

    sendButton.type = "submit";

    sendButton.style.cssText = `
     padding:10px 15px;
     border:0;
     border-radius:20px;
     background:var(--green);
     color:#052D3B;
     font-family:inherit;
     font-size:12px;
     font-weight:900;
     cursor:pointer;
     flex-shrink:0;
    `;

    commentForm.appendChild(commentInput);
    commentForm.appendChild(sendButton);

    commentForm.addEventListener("submit",event=>{

     event.preventDefault();

     const commentText = commentInput.value.trim();

     if(!commentText) return;

     if(!Array.isArray(post.comments)){
      post.comments = [];
     }

     post.comments.push({
      author:"You",
      text:commentText
     });

     expandedComments[postId] = true;

     showNotice(
      "Your comment has been added to this temporary preview."
     );

     renderFeed();

    });

    commentsBox.appendChild(commentForm);

    card.appendChild(commentsBox);


    // ================================================
    // OPEN / CLOSE COMMENTS
    // ================================================

    commentButton.addEventListener("click",()=>{

     expandedComments[postId] = !expandedComments[postId];

     renderFeed();

    });


    feed.appendChild(card);

   });

  }


  // ================================================
  // FIRST FEED RENDER
  // ================================================

  renderFeed();

 }


 // ================================================
 // GLOBAL ROUTE FUNCTION
 // ================================================

 window.renderCommunityPage = renderCommunityPage;


 // ================================================
 // RESTORE NORMAL PAGE MODE WHEN LEAVING
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
