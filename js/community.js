/* ==================================================
   CHANGE MAKER ACADEMY
   COMMUNITY SYSTEM — CORRECTED VERSION
   PART 1 OF 4
================================================== */

(function(){
"use strict";

// ================================================
// SUPABASE
// ================================================

const db = window.cmaSupabase;
const BUCKET = "community-media";

let currentUser = null;
let currentProfile = {};
let currentPrivate = {};
let currentRole = null;

let posts = [];
let reactions = [];
let comments = [];
let profiles = {};

let selectedAvatar = null;
let selectedCover = null;
let activePost = null;

let currentFeedSearchQuery = "";

const EMOJIS = ["👍","❤️","😂","🔥"];

const LOGIN_ERROR =
"Login Error! Please go back to homepage, select Account, sign up your account and sign in to continue.";


// ================================================
// HELPERS
// ================================================

function createElement(tag,className,text){

 const node = document.createElement(tag);

 if(className) node.className = className;

 if(text !== undefined) node.textContent = text;

 return node;
}

function makeButton(text,className){

 const node = createElement("button",className,text);

 node.type = "button";

 return node;
}

function showNotice(message){

 const box = document.querySelector(".community-notice");

 if(!box){
  console.log(message);
  return;
 }

 box.textContent = message;
 box.classList.add("show");

 clearTimeout(box._timer);

 box._timer = setTimeout(()=>{
  box.classList.remove("show");
 },4000);
}

function dateText(value){

 if(!value) return "Recently";

 const date = new Date(value);

 return isNaN(date.getTime())
  ? "Recently"
  : date.toLocaleString();
}

function initial(name){

 return String(name || "U")
  .trim()
  .charAt(0)
  .toUpperCase() || "U";
}

function currentName(){

 return currentProfile.display_name ||
  currentUser?.user_metadata?.full_name ||
  currentUser?.email?.split("@")[0] ||
  "Student";
}

function isCreator(){

 return ["admin","moderator","developer"].includes(
  String(currentRole || "").toLowerCase()
 );
}

function requireLogin(){

 if(currentUser) return true;

 showNotice(LOGIN_ERROR);

 return false;
}

function safeImage(url){

 return typeof url === "string" &&
  /^https?:\/\//i.test(url);
}

function escapeText(value){

 return String(value || "");
}


// ================================================
// AUTH
// ================================================

async function loadSession(){

 if(!db){
  throw new Error("Supabase client is not connected.");
 }

 const {data,error} = await db.auth.getSession();

 if(error) throw error;

 currentUser = data.session?.user || null;

 return currentUser;
}


// ================================================
// PROFILE
// ================================================

async function loadProfile(){

 currentProfile = {};
 currentPrivate = {};

 if(!currentUser) return;

 const {data,error} = await db
  .from("community_profiles")
  .select("*")
  .eq("user_id",currentUser.id)
  .maybeSingle();

 if(error) throw error;

 currentProfile = data || {};

 const {
  data:privateData,
  error:privateError
 } = await db
  .from("community_private_profiles")
  .select("*")
  .eq("user_id",currentUser.id)
  .maybeSingle();

 if(privateError) throw privateError;

 currentPrivate = privateData || {};
}


// ================================================
// CREATOR ROLE
// ================================================

async function loadRole(){

 currentRole = null;

 if(!currentUser) return;

 const {data,error} = await db
  .from("community_creator_roles")
  .select("role")
  .eq("user_id",currentUser.id)
  .maybeSingle();

 if(error) throw error;

 currentRole = data?.role || null;
}


// ================================================
// LOAD POSTS
// ================================================

async function loadPosts(){

 const {data,error} = await db
  .from("community_posts")
  .select("*")
  .order("created_at",{ascending:false});

 if(error) throw error;

 posts = data || [];
}


// ================================================
// LOAD REACTIONS
// ================================================

async function loadReactions(){

 reactions = [];

 if(!currentUser) return;

 const {data,error} = await db
  .from("community_reactions")
  .select("*")
  .eq("user_id",currentUser.id);

 if(error) throw error;

 reactions = data || [];
}


// ================================================
// LOAD COMMENTS
// ================================================

async function loadComments(){

 const {data,error} = await db
  .from("community_comments")
  .select("*")
  .order("created_at",{ascending:true});

 if(error) throw error;

 comments = data || [];
}


// ================================================
// LOAD PUBLIC PROFILES
// ================================================

async function loadProfiles(){

 profiles = {};

 const ids = [...new Set(
  posts.map(post=>post.user_id).filter(Boolean)
 )];

 if(!ids.length) return;

 const {data,error} = await db
  .from("community_profiles")
  .select("user_id,display_name,avatar_url")
  .in("user_id",ids);

 if(error) throw error;

 (data || []).forEach(profile=>{
  profiles[profile.user_id] = profile;
 });
}


// ================================================
// REFRESH DATABASE
// ================================================

async function refreshData(){

 await loadSession();

 await Promise.all([
  loadPosts(),
  loadComments()
 ]);

 await Promise.all([
  loadProfile(),
  loadRole(),
  loadReactions(),
  loadProfiles()
 ]);
}


// ================================================
// IMAGE UPLOAD
// ================================================

async function uploadImage(file,folder){

 if(!currentUser){
  throw new Error(LOGIN_ERROR);
 }

 if(!file) return null;

 const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp"
 ];

 if(!allowed.includes(file.type)){
  throw new Error(
   "Only JPG, PNG and WEBP images are allowed."
  );
 }

 if(file.size > 5 * 1024 * 1024){
  throw new Error("Image size must be 5 MB or less.");
 }

 const extension = file.name
  .split(".")
  .pop()
  .toLowerCase();

 const path =
  currentUser.id + "/" +
  folder + "/" +
  Date.now() + "-" +
  Math.random().toString(36).slice(2) +
  "." + extension;

 const {error} = await db.storage
  .from(BUCKET)
  .upload(path,file,{
   cacheControl:"3600",
   upsert:false,
   contentType:file.type
  });

 if(error) throw error;

 const {data} = db.storage
  .from(BUCKET)
  .getPublicUrl(path);

 return data.publicUrl;
}


// ================================================
// SAVE PROFILE
// ================================================

async function saveProfile(values){

 if(!requireLogin()) return;

 let avatarUrl = currentProfile.avatar_url || null;
 let coverUrl = currentProfile.cover_url || null;

 if(selectedAvatar){
  avatarUrl = await uploadImage(
   selectedAvatar,
   "profile"
  );
 }

 if(selectedCover){
  coverUrl = await uploadImage(
   selectedCover,
   "cover"
  );
 }

 const profileData = {
  user_id:currentUser.id,
  display_name:values.name.trim(),
  short_description:values.description.trim(),
  school:values.school.trim(),
  avatar_url:avatarUrl,
  cover_url:coverUrl
 };

 const {error} = await db
  .from("community_profiles")
  .upsert(profileData,{
   onConflict:"user_id"
  });

 if(error) throw error;

 const privateData = {
  user_id:currentUser.id,
  phone:values.phone.trim(),
  address:values.address.trim()
 };

 const {error:privateError} = await db
  .from("community_private_profiles")
  .upsert(privateData,{
   onConflict:"user_id"
  });

 if(privateError) throw privateError;

 selectedAvatar = null;
 selectedCover = null;

 await loadProfile();
}


// ================================================
// PUBLISH POST
// ================================================

/*
 post_scope:
 community_home = all logged-in users can publish
 creator_panel  = Admin / Moderator / Developer only
*/

async function publishPost(caption,file,postScope){

 if(!requireLogin()) return;

 const scope = postScope || "community_home";

 if(
  scope !== "community_home" &&
  !isCreator()
 ){
  throw new Error(
   "Only Admin, Moderator and Developer can publish outside Community Homepage."
  );
 }

 if(!caption.trim() && !file){
  throw new Error(
   "Write something or select a photo."
  );
 }

 let imageUrl = null;

 if(file){
  imageUrl = await uploadImage(file,"posts");
 }

 const {error} = await db
  .from("community_posts")
  .insert({
   user_id:currentUser.id,
   post_type:imageUrl ? "photo" : "text",
   caption:caption.trim(),
   image_url:imageUrl,
   post_scope:scope
  });

 if(error) throw error;

 await loadPosts();
 await loadProfiles();
}


// ================================================
// MY REACTION
// ================================================

function myReaction(postId){

 return reactions.find(item=>
  String(item.post_id) === String(postId)
 );
}


// ================================================
// TOGGLE REACTION
// ================================================

async function toggleReaction(postId,emoji){

 if(!requireLogin()) return;

 const existing = myReaction(postId);

 if(existing){

  if(existing.reaction_type === emoji){

   const {error} = await db
    .from("community_reactions")
    .delete()
    .eq("id",existing.id)
    .eq("user_id",currentUser.id);

   if(error) throw error;

  }else{

   const {error} = await db
    .from("community_reactions")
    .update({
     reaction_type:emoji
    })
    .eq("id",existing.id)
    .eq("user_id",currentUser.id);

   if(error) throw error;
  }

 }else{

  const {error} = await db
   .from("community_reactions")
   .insert({
    post_id:postId,
    user_id:currentUser.id,
    reaction_type:emoji
   });

  if(error) throw error;
 }

 await loadReactions();
}


// ================================================
// ADD COMMENT
// ================================================

async function addComment(postId,text){

 if(!requireLogin()) return;

 const cleanText = String(text || "").trim();

 if(!cleanText) return;

 if(cleanText.length > 500){
  throw new Error("Comment must be 500 characters or less.");
 }

 const {error} = await db
  .from("community_comments")
  .insert({
   post_id:postId,
   user_id:currentUser.id,
   comment_text:cleanText
  });

 if(error) throw error;

 await loadComments();
 await loadProfiles();
}

 // ================================================
// PROFILE FIELD
// ================================================

function addProfileField(form,label,value,type){

 const wrapper = createElement("label","");

 wrapper.style.cssText = `
  display:flex;
  flex-direction:column;
  gap:6px;
  color:var(--white);
  font-size:13px;
 `;

 wrapper.appendChild(
  createElement("span","",label)
 );

 const input = createElement("input");

 input.type = type || "text";
 input.value = value || "";

 input.style.cssText = `
  width:100%;
  box-sizing:border-box;
  padding:12px;
  border:1px solid var(--border);
  border-radius:10px;
  background:var(--panel);
  color:var(--white);
  font:inherit;
 `;

 wrapper.appendChild(input);
 form.appendChild(wrapper);

 return input;
}


// ================================================
// IMAGE FIELD
// ================================================

function addImageField(form,label,callback){

 const wrapper = createElement("label","");

 wrapper.style.cssText = `
  display:flex;
  flex-direction:column;
  gap:8px;
  color:var(--white);
  font-size:13px;
 `;

 wrapper.appendChild(
  createElement("span","",label)
 );

 const input = createElement("input");

 input.type = "file";
 input.accept = "image/jpeg,image/png,image/webp";

 input.addEventListener("change",()=>{

  const file = input.files?.[0];

  if(!file) return;

  if(file.size > 5 * 1024 * 1024){
   showNotice("Image must be 5 MB or less.");
   input.value = "";
   return;
  }

  if(![
   "image/jpeg",
   "image/png",
   "image/webp"
  ].includes(file.type)){
   showNotice("Choose JPG, PNG or WEBP.");
   input.value = "";
   return;
  }

  callback(file);
 });

 wrapper.appendChild(input);
 form.appendChild(wrapper);
}


// ================================================
// PROFILE TABS
// ================================================

function createProfileTabs(container){

 const tabs = createElement(
  "div",
  "community-profile-tabs"
 );

 tabs.style.cssText = `
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin:22px 0 15px;
 `;

 const content = createElement(
  "div",
  "community-profile-tab-content"
 );

 container.appendChild(tabs);
 container.appendChild(content);

 const items = [
  ["Photos","photos"],
  ["React On","reacted"],
  ["My Posts","posts"]
 ];

 items.forEach((item,index)=>{

  const button = makeButton(
   item[0],
   "community-profile-tab"
  );

  if(index === 0){
   button.classList.add("active");
  }

  button.addEventListener("click",()=>{

   tabs.querySelectorAll("button").forEach(node=>{
    node.classList.remove("active");
   });

   button.classList.add("active");

   renderProfileTab(content,item[1]);
  });

  tabs.appendChild(button);
 });

 renderProfileTab(content,"photos");
}


// ================================================
// RENDER PROFILE TAB
// ================================================

function renderProfileTab(container,type){

 container.innerHTML = "";

 container.dataset.activeTab = type;

 if(!currentUser) return;

 // PHOTOS

 if(type === "photos"){

  const photos = posts.filter(post=>
   post.user_id === currentUser.id &&
   post.image_url
  );

  if(!photos.length){

   container.appendChild(
    createElement(
     "p",
     "community-empty",
     "No photos yet."
    )
   );

   return;
  }

  const grid = createElement(
   "div",
   "community-photo-grid"
  );

  grid.style.cssText = `
   display:grid;
   grid-template-columns:repeat(3,minmax(0,1fr));
   gap:7px;
  `;

  photos.forEach(post=>{

   const image = createElement(
    "img",
    "community-post-image"
   );

   image.src = post.image_url;
   image.alt = post.caption || "My photo";
   image.loading = "lazy";

   image.style.cssText = `
    width:100%;
    aspect-ratio:1;
    object-fit:cover;
    border-radius:10px;
    cursor:pointer;
   `;

   image.addEventListener("click",()=>{

    const target = document.getElementById(
     "community-post-" + post.id
    );

    if(target){
     target.scrollIntoView({
      behavior:"smooth",
      block:"center"
     });
    }else{
     showNotice(
      post.caption || "Your photo"
     );
    }
   });

   grid.appendChild(image);
  });

  container.appendChild(grid);

  return;
 }


 // REACTED POSTS

 if(type === "reacted"){

  const myItems = reactions
   .map(reaction=>
    posts.find(post=>
     String(post.id) === String(reaction.post_id)
    )
   )
   .filter(Boolean);

  if(!myItems.length){

   container.appendChild(
    createElement(
     "p",
     "community-empty",
     "You haven't reacted to any posts yet."
    )
   );

   return;
  }

  myItems.forEach(post=>{
   renderPostCard(container,post,false);
  });

  return;
 }


 // MY POSTS

 if(type === "posts"){

  container.appendChild(
   createElement("h3","","My Posts")
  );

  const mine = posts
   .filter(post=>
    post.user_id === currentUser.id
   )
   .sort((a,b)=>
    new Date(b.created_at) -
    new Date(a.created_at)
   );

  if(!mine.length){

   container.appendChild(
    createElement(
     "p",
     "community-empty",
     "You haven't published any posts yet."
    )
   );

   return;
  }

  mine.forEach(post=>{
   renderPostCard(container,post,true);
  });
 }
}


// ================================================
// ME PAGE
// ================================================

async function renderMe(container){

 container.innerHTML = "";

 if(!currentUser){

  container.appendChild(
   createElement(
    "p",
    "community-empty",
    LOGIN_ERROR
   )
  );

  return;
 }

 container.appendChild(
  createElement("h3","","My Profile")
 );


 // COVER

 const cover = createElement(
  "div",
  "community-profile-cover"
 );

 cover.style.cssText = `
  width:100%;
  min-height:155px;
  border-radius:16px;
  background:var(--panel) center/cover no-repeat;
 `;

 if(safeImage(currentProfile.cover_url)){

  cover.style.backgroundImage =
   `url("${currentProfile.cover_url}")`;
 }

 container.appendChild(cover);


 // AVATAR

 const avatar = createElement(
  "div",
  "community-avatar"
 );

 avatar.style.cssText = `
  width:86px;
  height:86px;
  margin:-45px 0 10px 18px;
  position:relative;
  border:4px solid var(--bg);
  border-radius:50%;
  overflow:hidden;
  background:var(--panel);
 `;

 if(safeImage(currentProfile.avatar_url)){

  const image = createElement("img");

  image.src = currentProfile.avatar_url;
  image.alt = "Profile";

  image.style.cssText = `
   width:100%;
   height:100%;
   object-fit:cover;
  `;

  avatar.appendChild(image);

 }else{

  avatar.textContent = initial(currentName());
 }

 container.appendChild(avatar);


 // NAME AND DESCRIPTION

 container.appendChild(
  createElement("h3","",currentName())
 );

 container.appendChild(
  createElement(
   "p",
   "",
   currentProfile.short_description ||
   "No description added."
  )
 );


 // EDIT PROFILE FORM

 const form = createElement(
  "form",
  "community-profile-form"
 );

 form.style.cssText = `
  display:flex;
  flex-direction:column;
  gap:12px;
  margin-top:18px;
 `;

 form.appendChild(
  createElement("h3","","Edit Profile")
 );

 const name = addProfileField(
  form,
  "Name",
  currentProfile.display_name
 );

 const description = addProfileField(
  form,
  "Short Description",
  currentProfile.short_description
 );

 const school = addProfileField(
  form,
  "Institution",
  currentProfile.school
 );

 const phone = addProfileField(
  form,
  "Mobile Number",
  currentPrivate.phone,
  "tel"
 );

 const address = addProfileField(
  form,
  "Address",
  currentPrivate.address
 );

 addImageField(
  form,
  "Profile Logo / Photo",
  file=>{
   selectedAvatar = file;
  }
 );

 addImageField(
  form,
  "Cover Banner",
  file=>{
   selectedCover = file;
  }
 );


 // SAVE BUTTON

 const save = makeButton(
  "Save Profile",
  "community-publish-btn"
 );

 save.type = "submit";

 form.appendChild(save);

 form.addEventListener("submit",async event=>{

  event.preventDefault();

  save.disabled = true;
  save.textContent = "Saving...";

  try{

   await saveProfile({
    name:name.value,
    description:description.value,
    school:school.value,
    phone:phone.value,
    address:address.value
   });

   await renderMe(container);

   showNotice("Profile saved successfully.");

  }catch(error){

   console.error(error);

   showNotice(
    error.message ||
    "Profile could not be saved."
   );

  }finally{

   save.disabled = false;
   save.textContent = "Save Profile";
  }
 });

 container.appendChild(form);

 createProfileTabs(container);
}


// ================================================
// POST CARD
// ================================================

function renderPostCard(container,post,ownPost){

 const card = createElement(
  "article",
  "community-post"
 );

 card.id = "community-post-" + post.id;

 const profile = profiles[post.user_id] || {};

 const author =
  profile.display_name ||
  "Community Member";


 // POST HEADER

 const top = createElement(
  "div",
  "community-post-top"
 );

 const avatar = createElement(
  "div",
  "community-avatar"
 );

 if(safeImage(profile.avatar_url)){

  const image = createElement("img");

  image.src = profile.avatar_url;
  image.alt = author;

  image.style.cssText = `
   width:100%;
   height:100%;
   object-fit:cover;
   border-radius:50%;
  `;

  avatar.appendChild(image);

 }else{

  avatar.textContent = initial(author);
 }

 top.appendChild(avatar);

 const info = createElement(
  "div",
  "community-author-info"
 );

 info.appendChild(
  createElement("strong","",author)
 );

 info.appendChild(
  createElement(
   "small",
   "",
   dateText(post.created_at)
  )
 );

 top.appendChild(info);

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

 if(safeImage(post.image_url)){

  const image = createElement(
   "img",
   "community-post-image"
  );

  image.src = post.image_url;
  image.alt = "Community post";
  image.loading = "lazy";

  card.appendChild(image);
 }


 // REACTIONS

 const reactionRow = createElement(
  "div",
  "community-reactions"
 );

 EMOJIS.forEach(emoji=>{

  const button = makeButton(
   emoji,
   "community-reaction community-reaction-button"
  );

  const selected =
   myReaction(post.id)?.reaction_type === emoji;

  if(selected){
   button.classList.add("selected");
  }

  button.addEventListener("click",async()=>{

   if(!requireLogin()) return;

   button.disabled = true;

   try{

    await toggleReaction(post.id,emoji);

    await refreshData();

    const feed = card.closest(
     ".community-feed-panel"
    );

    if(feed){

     await renderFeed(feed);

    }else{

     const profileContent = card.closest(
      ".community-profile-tab-content"
     );

     if(profileContent){

      renderProfileTab(
       profileContent,
       profileContent.dataset.activeTab || "posts"
      );
     }
    }

   }catch(error){

    console.error(error);

    showNotice(
     error.message ||
     "Reaction failed."
    );

   }finally{

    button.disabled = false;
   }
  });

  reactionRow.appendChild(button);
 });

 card.appendChild(reactionRow);


 // COMMENT BUTTON

 const actionRow = createElement(
  "div",
  "community-post-actions"
 );

 const commentButton = makeButton(
  "Comment",
  "community-comment-toggle"
 );

 commentButton.addEventListener("click",()=>{

  if(!requireLogin()) return;

  openComments(post);
 });

 actionRow.appendChild(commentButton);

 card.appendChild(actionRow);


 // COMMENT PREVIEW

 const preview = createElement(
  "div",
  "community-comments-preview"
 );

 comments
  .filter(comment=>
   String(comment.post_id) === String(post.id)
  )
  .slice(0,2)
  .forEach(comment=>{

   const commentProfile =
    profiles[comment.user_id] || {};

   const line = createElement(
    "div",
    "community-comment-preview-item"
   );

   line.textContent =
    (commentProfile.display_name || "Member") +
    ": " +
    comment.comment_text;

   preview.appendChild(line);
  });

 card.appendChild(preview);


 // DELETE OWN POST

 if(ownPost){

  const remove = makeButton(
   "Delete Post",
   "community-delete-post"
  );

  remove.addEventListener("click",async()=>{

   if(!requireLogin()) return;

   if(!confirm(
    "Are you sure you want to delete this post?"
   )){
    return;
   }

   remove.disabled = true;

   try{

    const {error} = await db
     .from("community_posts")
     .delete()
     .eq("id",post.id)
     .eq("user_id",currentUser.id);

    if(error) throw error;

    await refreshData();

    showNotice("Post deleted successfully.");

    const feed = document.querySelector(
     ".community-feed-panel"
    );

    if(feed){
     await renderFeed(feed);
    }

    const profileContent = document.querySelector(
     ".community-profile-tab-content"
    );

    if(profileContent){

     renderProfileTab(
      profileContent,
      profileContent.dataset.activeTab || "posts"
     );
    }

   }catch(error){

    console.error(error);

    showNotice(
     error.message ||
     "Delete failed."
    );

   }finally{

    remove.disabled = false;
   }
  });

  card.appendChild(remove);
 }

 container.appendChild(card);
}


// ================================================
// COMMENT WINDOW
// ================================================

function openComments(post){

 activePost = post;

 const overlay = createElement(
  "div",
  "community-comment-overlay"
 );

 overlay.style.cssText = `
  position:fixed;
  inset:0;
  z-index:99999;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  background:rgba(0,0,0,.65);
 `;

 const sheet = createElement(
  "section",
  "community-comment-sheet"
 );

 sheet.style.cssText = `
  width:100%;
  max-width:650px;
  max-height:80vh;
  min-height:55vh;
  overflow:auto;
  box-sizing:border-box;
  padding:16px;
  background:var(--bg);
  color:var(--white);
  border-radius:20px 20px 0 0;
 `;


 // HEADER

 const header = createElement(
  "div",
  "community-comment-sheet-header"
 );

 header.style.cssText = `
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:15px;
 `;

 header.appendChild(
  createElement("strong","","Comments")
 );

 const close = makeButton(
  "✕",
  "community-comment-close"
 );

 close.addEventListener("click",()=>{
  overlay.remove();
 });

 header.appendChild(close);

 sheet.appendChild(header);


 // COMMENT LIST

 const list = createElement(
  "div",
  "community-comment-sheet-list"
 );

 function drawComments(){

  list.innerHTML = "";

  const items = comments.filter(comment=>
   String(comment.post_id) === String(post.id)
  );

  if(!items.length){

   list.appendChild(
    createElement(
     "p",
     "community-empty",
     "No comments yet."
    )
   );

   return;
  }

  items.forEach(comment=>{

   const profile =
    profiles[comment.user_id] || {};

   const row = createElement(
    "div",
    "community-comment-preview-item"
   );

   row.textContent =
    (profile.display_name || "Community Member") +
    ": " +
    comment.comment_text;

   list.appendChild(row);
  });
 }

 drawComments();

 sheet.appendChild(list);


 // COMMENT FORM

 const form = createElement(
  "form",
  "community-comment-sheet-form"
 );

 form.style.cssText = `
  display:flex;
  gap:8px;
  margin-top:15px;
 `;

 const input = createElement("input");

 input.type = "text";
 input.placeholder = "Write a comment...";
 input.maxLength = 500;
 input.required = true;

 input.style.cssText = `
  flex:1;
  min-width:0;
  padding:12px;
  border:1px solid var(--border);
  border-radius:25px;
  background:var(--panel);
  color:var(--white);
 `;

 const send = makeButton(
  "Send",
  "community-comment-sheet-send"
 );

 send.type = "submit";

 form.appendChild(input);
 form.appendChild(send);

 form.addEventListener("submit",async event=>{

  event.preventDefault();

  if(!requireLogin()) return;

  send.disabled = true;

  try{

   await addComment(post.id,input.value);

   input.value = "";

   drawComments();

   const feed = document.querySelector(
    ".community-feed-panel"
   );

   if(feed){
    await renderFeed(feed);
   }

   showNotice("Comment added.");

  }catch(error){

   console.error(error);

   showNotice(
    error.message ||
    "Comment failed."
   );

  }finally{

   send.disabled = false;
  }
 });

 sheet.appendChild(form);


 // CLOSE ON BACKDROP

 overlay.appendChild(sheet);

 overlay.addEventListener("click",event=>{

  if(event.target === overlay){
   overlay.remove();
  }
 });

 document.body.appendChild(overlay);
}

 // ================================================
// CREATE POST COMPOSER
// ================================================

function createComposer(container,postScope){

 if(!currentUser) return;

 const scope = postScope || "community_home";

 // Creator Panel and other privileged sections
 if(
  scope !== "community_home" &&
  !isCreator()
 ){
  return;
 }

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


 // IMAGE PREVIEW

 const preview = createElement(
  "img",
  "community-preview"
 );

 preview.alt = "Selected image preview";

 preview.style.cssText = `
  display:none;
  width:100%;
  max-height:300px;
  object-fit:contain;
 `;

 composer.appendChild(preview);


 // IMAGE INPUT

 const fileInput = createElement("input");

 fileInput.type = "file";
 fileInput.accept = "image/jpeg,image/png,image/webp";

 composer.appendChild(fileInput);

 let chosenFile = null;

 fileInput.addEventListener("change",()=>{

  chosenFile = fileInput.files?.[0] || null;

  if(!chosenFile){
   preview.style.display = "none";
   return;
  }

  if(chosenFile.size > 5 * 1024 * 1024){

   chosenFile = null;
   fileInput.value = "";

   showNotice("Image must be 5 MB or less.");

   return;
  }

  if(![
   "image/jpeg",
   "image/png",
   "image/webp"
  ].includes(chosenFile.type)){

   chosenFile = null;
   fileInput.value = "";

   showNotice("Choose JPG, PNG or WEBP.");

   return;
  }

  const reader = new FileReader();

  reader.onload = event=>{
   preview.src = event.target.result;
   preview.style.display = "block";
  };

  reader.readAsDataURL(chosenFile);
 });


 // PUBLISH BUTTON

 const publish = makeButton(
  "Publish",
  "community-publish-btn"
 );

 publish.addEventListener("click",async()=>{

  if(!requireLogin()) return;

  publish.disabled = true;
  publish.textContent = "Publishing...";

  try{

   await publishPost(
    textarea.value,
    chosenFile,
    scope
   );

   textarea.value = "";
   fileInput.value = "";

   chosenFile = null;

   preview.src = "";
   preview.style.display = "none";

   await refreshData();

   await renderFeed(
    container,
    scope
   );

   showNotice("Post published successfully.");

  }catch(error){

   console.error(error);

   showNotice(
    error.message ||
    "Publish failed."
   );

  }finally{

   publish.disabled = false;
   publish.textContent = "Publish";
  }
 });

 composer.appendChild(publish);

 container.appendChild(composer);
}


// ================================================
// COMMUNITY FEED
// ================================================

async function renderFeed(container,postScope){

 if(!container) return;

 const scope = postScope || "community_home";

 container.innerHTML = "";

 container.appendChild(
  createElement(
   "h3",
   "community-feed-title",
   scope === "community_home"
    ? "Community Feed"
    : "Creator Panel Posts"
  )
 );


 // ALL LOGGED-IN USERS CAN POST ON HOME

 // CREATOR ROLES ONLY OUTSIDE COMMUNITY HOME

 createComposer(container,scope);


 // SEARCH

 const search = createElement(
  "input",
  "community-feed-search"
 );

 search.type = "search";
 search.placeholder = "Search posts...";

 search.value = currentFeedSearchQuery;

 search.style.cssText = `
  width:100%;
  box-sizing:border-box;
  padding:12px;
  margin:12px 0;
  border:1px solid var(--border);
  border-radius:12px;
  background:var(--panel);
  color:var(--white);
 `;

 container.appendChild(search);


 // POST LIST

 const list = createElement(
  "div",
  "community-feed"
 );

 container.appendChild(list);


 function draw(){

  list.innerHTML = "";

    const query = search.value
   .trim()
   .toLowerCase();

  currentFeedSearchQuery = search.value;

  const filtered = posts.filter(post=>{

   const postScopeValue =
    post.post_scope || "community_home";

   // Keep each scope separate

   if(postScopeValue !== scope){
    return false;
   }

   const profile = profiles[post.user_id] || {};

   const captionMatch =
    String(post.caption || "")
     .toLowerCase()
     .includes(query);

   const nameMatch =
    String(profile.display_name || "")
     .toLowerCase()
     .includes(query);

   return captionMatch || nameMatch;
  });


  if(!filtered.length){

   list.appendChild(
    createElement(
     "p",
     "community-empty",
     query
      ? "No posts found."
      : "No posts yet."
    )
   );

   return;
  }


  filtered.forEach(post=>{

   renderPostCard(
    list,
    post,
    currentUser &&
    post.user_id === currentUser.id
   );
  });
 }

 search.addEventListener("input",draw);

 draw();
}


// ================================================
// CREATOR PANEL
// ================================================

async function renderCreator(container){

 container.innerHTML = "";

 container.appendChild(
  createElement(
   "h3",
   "",
   "Creator Panel"
  )
 );

 container.appendChild(
  createElement(
   "p",
   "",
   "Explore Community posts, react and comment."
  )
 );


 if(!currentUser){

  container.appendChild(
   createElement(
    "p",
    "community-empty",
    LOGIN_ERROR
   )
  );

  return;
 }


 if(isCreator()){

  container.appendChild(
   createElement(
    "p",
    "community-demo-tag",
    "Authorized Role: " + currentRole
   )
  );

 }else{

  container.appendChild(
   createElement(
    "p",
    "community-empty",
    "You can browse posts, react and comment. Publishing outside Community Homepage is available only to authorized Creators."
   )
  );
 }


 const feed = createElement(
  "div",
  "community-feed-panel"
 );

 container.appendChild(feed);


 // Creator-only publishing

 await renderFeed(
  feed,
  "creator_panel"
 );
}


// ================================================
// NOTIFICATION BADGE COUNT
// ================================================

async function getUnreadNotificationCount(){

 if(!currentUser) return 0;

 const {count,error} = await db
  .from("community_notifications")
  .select("*",{
   count:"exact",
   head:true
  })
  .eq("recipient_id",currentUser.id)
  .eq("is_read",false);

 if(error){
  console.error(error);
  return 0;
 }

 return count || 0;
}


// ================================================
// NOTIFICATIONS
// ================================================

async function renderNotifications(container){

 container.innerHTML = "";

 container.appendChild(
  createElement(
   "h3",
   "",
   "Notifications"
  )
 );

 if(!currentUser){

  container.appendChild(
   createElement(
    "p",
    "community-empty",
    LOGIN_ERROR
   )
  );

  return;
 }


 const {data,error} = await db
  .from("community_notifications")
  .select("*")
  .eq("recipient_id",currentUser.id)
  .order("created_at",{
   ascending:false
  });

 if(error){

  showNotice(error.message);

  return;
 }


 if(!data?.length){

  container.appendChild(
   createElement(
    "p",
    "community-empty",
    "No notifications yet."
   )
  );

  return;
 }


 data.forEach(item=>{

  const card = createElement(
   "div",
   "community-notification-item"
  );

  card.style.cssText = `
   padding:13px;
   margin-bottom:10px;
   border:1px solid var(--border);
   border-radius:12px;
   background:var(--panel);
   color:var(--white);
  `;

  card.appendChild(
   createElement(
    "div",
    "",
    item.notification_type || "Notification"
   )
  );

  card.appendChild(
   createElement(
    "small",
    "",
    dateText(item.created_at)
   )
  );


  if(!item.is_read){

   const mark = makeButton(
    "Mark as read",
    "community-notification-read"
   );

   mark.addEventListener("click",async()=>{

    mark.disabled = true;

    try{

     const {error:updateError} = await db
      .from("community_notifications")
      .update({
       is_read:true
      })
      .eq("id",item.id)
      .eq("recipient_id",currentUser.id);

     if(updateError) throw updateError;

     await renderNotifications(container);

     showNotice("Notification marked as read.");

    }catch(error){

     console.error(error);

     showNotice(
      error.message ||
      "Unable to update notification."
     );

    }finally{

     mark.disabled = false;
    }
   });

   card.appendChild(mark);
  }

  container.appendChild(card);
 });
}

 // ==============================
// PART 4/4 — PAGE, NAVIGATION & INITIALIZATION
// ==============================

let communityRenderPromise = null;

async function renderCommunityPage() {
  // The main router owns page navigation. Community must render only
  // while ?page=community is the active route.
  const route = new URLSearchParams(window.location.search).get("page");
  if (route !== "community") return;

  // index.html provides #pageContent inside #innerPage.
  const page = document.getElementById("pageContent");

  if (!page) {
    console.error("Community container #pageContent was not found.");
    return;
  }

  // Prevent Router and Supabase auth events from rendering simultaneously.
  if (communityRenderPromise) return communityRenderPromise;

  communityRenderPromise = (async function () {
  page.innerHTML = "";
  document.body.classList.add("community-active");

  // Hide the old inline feed search.
  if (!document.getElementById("community-search-style")) {
    const style = document.createElement("style");
    style.id = "community-search-style";
    style.textContent = `
      .community-feed-search {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  await loadSession();
  await refreshData();

  const header = createElement("header", "community-header");

  const brand = createElement("div", "community-brand");
  brand.textContent = "Community";

  const headerActions = createElement("div", "community-header-actions");

  const searchButton = makeButton("⌕", "community-icon-btn");
  searchButton.type = "button";
  searchButton.setAttribute("aria-label", "Open search");
  searchButton.title = "Search";

  const searchInput = createElement("input", "community-search");
  searchInput.type = "search";
  searchInput.placeholder = "Search posts or people...";
  searchInput.setAttribute("aria-label", "Search community");
  searchInput.value = currentFeedSearchQuery || "";
  searchInput.style.display = "none";

  headerActions.appendChild(searchButton);
  headerActions.appendChild(searchInput);

  header.appendChild(brand);
  header.appendChild(headerActions);

  const nav = createElement("nav", "community-nav");
  nav.setAttribute("aria-label", "Community navigation");

  const main = createElement("main", "community-main");

  const noticeArea = createElement("div", "community-notice-area");

  const feedPanel = createElement("section", "community-feed-panel");
  const mePanel = createElement("section", "community-section-panel");
  const creatorPanel = createElement("section", "community-section-panel");
  const notificationPanel = createElement("section", "community-section-panel");

  mePanel.style.display = "none";
  creatorPanel.style.display = "none";
  notificationPanel.style.display = "none";

  main.appendChild(noticeArea);
  main.appendChild(feedPanel);
  main.appendChild(mePanel);
  main.appendChild(creatorPanel);
  main.appendChild(notificationPanel);

  page.appendChild(header);
  page.appendChild(main);
  page.appendChild(nav);

  const panels = {
    home: feedPanel,
    me: mePanel,
    creator: creatorPanel,
    notifications: notificationPanel
  };

  let activePage = "home";

  function showPanel(name) {
    activePage = name;

    Object.entries(panels).forEach(([key, panel]) => {
      panel.style.display = key === name ? "" : "none";
    });

    nav.querySelectorAll("button").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === name
      );
    });
  }

  const navItems = [
    { id: "home", label: "Home", icon: "⌂" },
    { id: "me", label: "Me", icon: "●" },
    { id: "creator", label: "Creator Panel", icon: "✦" },
    { id: "notifications", label: "Notifications", icon: "♢" }
  ];

  const notificationBadge = document.createElement("span");
  notificationBadge.className = "community-notification-dot";
  notificationBadge.style.display = "none";

  const navButtons = {};

  navItems.forEach(item => {
    const button = makeButton("", "community-nav-button");
    button.type = "button";
    button.dataset.page = item.id;
    button.setAttribute("aria-label", item.label);
    button.title = item.label;

    const iconWrap = createElement("span", "community-nav-icon-wrap");
    const icon = createElement("span", "community-nav-icon", item.icon);
    iconWrap.appendChild(icon);

    if (item.id === "notifications") {
      iconWrap.appendChild(notificationBadge);
    }

    const label = createElement("span", "community-nav-label", item.label);

    button.appendChild(iconWrap);
    button.appendChild(label);

    button.addEventListener("click", async () => {
      showPanel(item.id);

      if (item.id === "home") {
        await refreshData();
        renderFeed(feedPanel, "community_home");
      }

      if (item.id === "me") {
        await refreshData();
        await renderMe(mePanel);
      }

      if (item.id === "creator") {
        await refreshData();
        await renderCreator(creatorPanel);
      }

      if (item.id === "notifications") {
        await renderNotifications(notificationPanel);
        updateNotificationBadge();
      }
    });

    navButtons[item.id] = button;
    nav.appendChild(button);
  });

  async function updateNotificationBadge() {
    if (!currentUser) {
      notificationBadge.style.display = "none";
      return;
    }

    try {
      const { count, error } = await db
        .from("community_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);

      if (error) throw error;

      notificationBadge.style.display = count > 0 ? "inline-block" : "none";
      notificationBadge.title = count > 0
        ? `${count} unread notifications`
        : "";
    } catch (error) {
      console.error("Notification badge error:", error);
      notificationBadge.style.display = "none";
    }
  }

  searchButton.addEventListener("click", () => {
    const isOpen = searchInput.style.display !== "none";

    if (isOpen) {
      searchInput.style.display = "none";
      searchInput.value = "";
      currentFeedSearchQuery = "";
      searchButton.setAttribute("aria-label", "Open search");

      if (activePage === "home") {
        renderFeed(feedPanel, "community_home");
      }
    } else {
      searchInput.style.display = "block";
      searchButton.setAttribute("aria-label", "Close search");
      searchInput.focus();
    }
  });

  searchInput.addEventListener("input", () => {
    currentFeedSearchQuery = searchInput.value.trim();

    if (activePage === "home") {
      renderFeed(feedPanel, "community_home");
    }
  });

  // Initial page
  showPanel("home");
  renderFeed(feedPanel, "community_home");
  updateNotificationBadge();

  // Expose refresh function for other community scripts.
  window.cmaCommunityRefresh = async function () {
    await refreshData();

    if (activePage === "home") {
      renderFeed(feedPanel, "community_home");
    } else if (activePage === "me") {
      await renderMe(mePanel);
    } else if (activePage === "creator") {
      await renderCreator(creatorPanel);
    } else if (activePage === "notifications") {
      await renderNotifications(notificationPanel);
    }

    updateNotificationBadge();
  };
  })();

  try {
    await communityRenderPromise;
  } finally {
    communityRenderPromise = null;
  }
}


// ==============================
// AUTH STATE CHANGES
// ==============================

if (db && db.auth) {
  db.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    // The Router is the only owner of navigation. Do not render Community
    // on homepage or on unrelated pages just because #pageContent exists.
    const activeRoute = new URLSearchParams(window.location.search).get("page");
    if (
      event !== "INITIAL_SESSION" &&
      activeRoute === "community" &&
      document.getElementById("pageContent")
    ) {
      // Defer database work until Supabase finishes its auth callback.
      Promise.resolve().then(() => renderCommunityPage());
    }
  });
}


// ==============================
// GLOBAL ACCESS
// ==============================

window.renderCommunityPage = renderCommunityPage;

// Do not auto-render on DOMContentLoaded. router.js calls this function
// only after it has opened the Community route.

})(); 

                            
