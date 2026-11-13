
// ==================================================
// CHANGE MAKER ACADEMY
// COMMUNITY — FRONTEND SYSTEM
// ==================================================

(function(){

 "use strict";

 let temporaryPosts = [];
 let selectedImage = "";
 let currentFilter = "";

 const reactionOptions = ["👍","❤️","😂","🔥"];

 function createElement(tag, className, text){

  const element = document.createElement(tag);

  if(className) element.className = className;
  if(text !== undefined) element.textContent = text;

  return element;

 }


 function showNotice(message){

  const notice = document.querySelector(
   ".community-notice"
  );

  if(!notice) return;

  notice.textContent = message;
  notice.classList.add("show");

 }


 function renderCommunityPage(){

  // GET THE EXISTING PAGE CONTENT CONTAINER

  const pageContent = document.getElementById("pageContent");

  if(!pageContent){
   console.error("Community error: #pageContent was not found.");
   return;
  }

  document.body.classList.add("community-active");

  const root = createElement(
   "div",
   "community-page"
  );


  // ================================================
  // HEADER
  // ================================================

  const header = createElement(
   "header",
   "community-header"
  );

  const brand = createElement(
   "a",
   "community-brand"
  );

  brand.href = "?page=community";
  brand.innerHTML = 'CHANGE MAKER <span>COMMUNITY</span>';

  header.appendChild(brand);


  // SEARCH

  const searchArea = createElement(
   "div",
   "community-search-area"
  );

  const searchButton = createElement(
   "button",
   "community-search-btn",
   "⌕"
  );

  searchButton.type = "button";
  searchButton.setAttribute(
   "aria-label",
   "Open search"
  );

  const search = createElement(
   "div",
   "community-search"
  );

  const searchInput = createElement("input");

  searchInput.type = "search";
  searchInput.placeholder = "Search posts...";
  searchInput.setAttribute(
   "aria-label",
   "Search community posts"
  );

  searchInput.style.display = "none";

  search.appendChild(searchInput);

  searchArea.appendChild(searchButton);
  searchArea.appendChild(search);

  header.appendChild(searchArea);

  searchButton.addEventListener("click",()=>{

   const isHidden = searchInput.style.display === "none";

   searchInput.style.display = isHidden ? "block" : "none";

   if(isHidden){
    searchInput.focus();
   }else{
    searchInput.value = "";
    currentFilter = "";
    renderFeed();
   }

  });


  // ================================================
  // NAVIGATION
  // ================================================

  const nav = createElement(
   "nav",
   "community-nav"
  );

  const navItems = [
   ["🏠","Home","home"],
   ["👤","Me","me"],
   ["✍️","Creator Panel","creator"],
   ["🔔","Notification","notifications"]
  ];

  navItems.forEach((item,index)=>{

   const button = createElement(
    "button",
    index === 0 ? "active" : ""
   );

   button.type = "button";

   button.setAttribute(
    "aria-label",
    item[1]
   );

   const iconWrap = createElement(
    "span",
    "community-nav-icon-wrap"
   );

   const icon = createElement(
    "span",
    "community-nav-icon",
    item[0]
   );

   iconWrap.appendChild(icon);

   // RED DOT IN THE CENTER OF THE BELL EMOJI

   if(item[2] === "notifications"){

    const dot = createElement(
     "span",
     "community-notification-dot"
    );

    dot.setAttribute(
     "aria-label",
     "New notifications"
    );

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

     showNotice(
      "Notifications will be connected after the account and backend system is ready."
     );

    }

   });

   nav.appendChild(button);

  });

  header.appendChild(nav);
  root.appendChild(header);


  // ================================================
  // MAIN
  // ================================================

  const main = createElement(
   "main",
   "community-main"
  );

  const notice = createElement(
   "div",
   "community-notice"
  );

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

  const textarea = createElement(
   "textarea"
  );

  textarea.placeholder = "What's on your mind?";
  textarea.maxLength = 2000;

  composer.appendChild(textarea);


  // IMAGE PREVIEW

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


  // PHOTO UPLOAD

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


  // PUBLISH BUTTON

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

  const feedTitle = createElement(
   "h3",
   "community-feed-title",
   "Community Feed"
  );

  main.appendChild(feedTitle);

  const feed = createElement(
   "div",
   "community-feed"
  );

  main.appendChild(feed);

  root.appendChild(main);

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

    showNotice(
     "Please choose a JPG, PNG or WEBP image."
    );

    return;

   }


   if(file.size > 5 * 1024 * 1024){

    fileInput.value = "";

    showNotice(
     "Image size must be 5 MB or less."
    );

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

    showNotice(
     "Write something or add a photo first."
    );

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

    reactions: ["👍","❤️"],
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

    const card = createElement(
     "article",
     "community-post"
    );


    // AUTHOR

    const top = createElement(
     "div",
     "community-post-top"
    );

    const avatar = createElement(
     "div",
     "community-avatar",
     post.avatar || "U"
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


    top.appendChild(avatar);
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


    // REACTIONS

    const reactions = createElement(
     "div",
     "community-reactions"
    );

    const postReactions = Array.isArray(post.reactions)
     ? post.reactions
     : [];


    postReactions.forEach(emoji=>{

     const reaction = createElement(
      "span",
      "community-reaction",
      emoji
     );

     reactions.appendChild(reaction);

    });


    // LOCAL REACTION SELECTION

    reactionOptions.forEach(emoji=>{

     const button = createElement(
      "button",
      "community-reaction community-reaction-button",
      emoji
     );

     button.type = "button";

     button.setAttribute(
      "aria-label",
      "Select reaction " + emoji
     );

     button.addEventListener("click",()=>{

      button.classList.toggle("selected");

     });

     reactions.appendChild(button);

    });

    card.appendChild(reactions);


    // ================================================
    // COMMENTS
    // ================================================

    const commentsBox = createElement(
     "div",
     "community-comments"
    );

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


    if(!comments.length){

     commentsBox.appendChild(
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

      commentsBox.appendChild(commentLine);

     });

    }


    card.appendChild(commentsBox);

    feed.appendChild(card);

   });

  }


  // FIRST FEED RENDER

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

   document.body.classList.remove(
    "community-active"
   );

  }

 });

})();
