/* ==================================================
   CHANGE MAKER ACADEMY
   COMPLETE COMMUNITY SYSTEM
   PART 1 OF 2
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

let selectedPostImage = null;
let selectedAvatar = null;
let selectedCover = null;

let activePost = null;
let currentFilter = "";

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

 return String(name || "U").trim().charAt(0).toUpperCase() || "U";
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

 const {data:privateData,error:privateError} = await db
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
  throw new Error("Only JPG, PNG and WEBP images are allowed.");
 }

 if(file.size > 5*1024*1024){
  throw new Error("Image size must be 5 MB or less.");
 }

 const extension = file.name.split(".").pop().toLowerCase();

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
  avatarUrl = await uploadImage(selectedAvatar,"profile");
 }

 if(selectedCover){
  coverUrl = await uploadImage(selectedCover,"cover");
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
  .upsert(profileData,{onConflict:"user_id"});

 if(error) throw error;

 const privateData = {
  user_id:currentUser.id,
  phone:values.phone.trim(),
  address:values.address.trim()
 };

 const {error:privateError} = await db
  .from("community_private_profiles")
  .upsert(privateData,{onConflict:"user_id"});

 if(privateError) throw privateError;

 selectedAvatar = null;
 selectedCover = null;

 await loadProfile();
}


// ================================================
// PUBLISH POST
// ================================================

async function publishPost(caption,file){

 if(!requireLogin()) return;

 if(!isCreator()){
  throw new Error("Only Admin, Moderator and Developer can publish posts.");
 }

 if(!caption.trim() && !file){
  throw new Error("Write something or select a photo.");
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
   image_url:imageUrl
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
    .update({reaction_type:emoji})
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

 if(!text.trim()) return;

 const {error} = await db
  .from("community_comments")
  .insert({
   post_id:postId,
   user_id:currentUser.id,
   comment_text:text.trim()
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

 wrapper.appendChild(createElement("span","",label));

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
// FILE FIELD
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

 wrapper.appendChild(createElement("span","",label));

 const input = createElement("input");

 input.type = "file";
 input.accept = "image/jpeg,image/png,image/webp";

 input.addEventListener("change",()=>{

  const file = input.files?.[0];

  if(!file) return;

  if(file.size > 5*1024*1024){
   showNotice("Image must be 5 MB or less.");
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

 const tabs = createElement("div","community-profile-tabs");

 tabs.style.cssText = `
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin:22px 0 15px;
 `;

 const content = createElement("div","community-profile-tab-content");

 container.appendChild(tabs);
 container.appendChild(content);

 const items = [
  ["Photos","photos"],
  ["React On","reacted"],
  ["My Posts","posts"]
 ];

 items.forEach((item,index)=>{

  const b = makeButton(item[0],"community-profile-tab");

  if(index === 0) b.classList.add("active");

  b.addEventListener("click",()=>{

   tabs.querySelectorAll("button").forEach(x=>
    x.classList.remove("active")
   );

   b.classList.add("active");

   renderProfileTab(content,item[1]);
  });

  tabs.appendChild(b);
 });

 renderProfileTab(content,"photos");
}


// ================================================
// RENDER PROFILE TAB
// ================================================

function renderProfileTab(container,type){

 container.innerHTML = "";

 if(type === "photos"){

  const photos = posts.filter(post=>
   post.user_id === currentUser.id &&
   post.image_url
  );

  if(!photos.length){
   container.appendChild(
    createElement("p","community-empty","No photos yet.")
   );
   return;
  }

  const grid = createElement("div","community-photo-grid");

  grid.style.cssText = `
   display:grid;
   grid-template-columns:repeat(3,minmax(0,1fr));
   gap:7px;
  `;

  photos.forEach(post=>{

   const image = createElement("img","community-post-image");

   image.src = post.image_url;
   image.alt = post.caption || "My photo";

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
     target.scrollIntoView({behavior:"smooth"});
    }else{
     showNotice(post.caption || "Your photo");
    }
   });

   grid.appendChild(image);
  });

  container.appendChild(grid);
  return;
 }

 if(type === "reacted"){

  const myItems = reactions
   .map(reaction=>posts.find(post=>
    String(post.id) === String(reaction.post_id)
   ))
   .filter(Boolean);

  if(!myItems.length){
   container.appendChild(
    createElement("p","community-empty","You haven't reacted to any posts yet.")
   );
   return;
  }

  myItems.forEach(post=>
   renderPostCard(container,post,false)
  );

  return;
 }

 if(type === "posts"){

  container.appendChild(
   createElement("h3","","My Posts")
  );

  const mine = posts
   .filter(post=>post.user_id === currentUser.id)
   .sort((a,b)=>
    new Date(b.created_at)-new Date(a.created_at)
   );

  if(!mine.length){
   container.appendChild(
    createElement("p","community-empty","You haven't published any posts yet.")
   );
   return;
  }

  mine.forEach(post=>
   renderPostCard(container,post,true)
  );
 }
}


// ================================================
// ME PAGE
// ================================================

async function renderMe(container){

 container.innerHTML = "";

 if(!currentUser){
  container.appendChild(createElement("p","community-empty",LOGIN_ERROR));
  return;
 }

 const title = createElement("h3","","My Profile");

 container.appendChild(title);

 const cover = createElement("div","community-profile-cover");

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

 const avatar = createElement("div","community-avatar");

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

 container.appendChild(
  createElement("h3","",currentName())
 );

 container.appendChild(
  createElement(
   "p",
   "",
   currentProfile.short_description || "No description added."
  )
 );

 const form = createElement("form","community-profile-form");

 form.style.cssText = `
  display:flex;
  flex-direction:column;
  gap:12px;
  margin-top:18px;
 `;

 form.appendChild(createElement("h3","","Edit Profile"));

 const name = addProfileField(
  form,"Name",currentProfile.display_name
 );

 const description = addProfileField(
  form,"Short Description",
  currentProfile.short_description
 );

 const school = addProfileField(
  form,"Institution",
  currentProfile.school
 );

 const phone = addProfileField(
  form,"Mobile Number",
  currentPrivate.phone,
  "tel"
 );

 const address = addProfileField(
  form,"Address",
  currentPrivate.address
 );

 addImageField(form,"Profile Logo / Photo",file=>{
  selectedAvatar = file;
 });

 addImageField(form,"Cover Banner",file=>{
  selectedCover = file;
 });

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
   showNotice(error.message || "Profile could not be saved.");

  }finally{

   save.disabled = false;
   save.textContent = "Save Profile";
  }
 });

 container.appendChild(form);

 createProfileTabs(container);
}

// ================================================
// PART 2 CONTINUES
// ================================================
 /* ==================================================
   CHANGE MAKER ACADEMY
   COMPLETE COMMUNITY SYSTEM
   PART 2 OF 2
================================================== */

// ================================================
// POST CARD
// ================================================

function renderPostCard(container,post,ownPost){

 const card = createElement("article","community-post");

 card.id = "community-post-" + post.id;

 const profile = profiles[post.user_id] || {};

 const author = profile.display_name || "Community Member";

 const top = createElement("div","community-post-top");

 const avatar = createElement("div","community-avatar");

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

 const info = createElement("div","community-author-info");

 info.appendChild(
  createElement("strong","",author)
 );

 info.appendChild(
  createElement("small","",dateText(post.created_at))
 );

 top.appendChild(info);
 card.appendChild(top);

 if(post.caption){

  card.appendChild(
   createElement("p","community-caption",post.caption)
  );
 }

 if(safeImage(post.image_url)){

  const image = createElement("img","community-post-image");

  image.src = post.image_url;
  image.alt = "Community post";
  image.loading = "lazy";

  card.appendChild(image);
 }

 // REACTIONS

 const reactionRow = createElement("div","community-reactions");

 EMOJIS.forEach(emoji=>{

  const b = makeButton(
   emoji,
   "community-reaction community-reaction-button"
  );

  const selected =
   myReaction(post.id)?.reaction_type === emoji;

  if(selected) b.classList.add("selected");

  b.addEventListener("click",async()=>{

   b.disabled = true;

   try{

    await toggleReaction(post.id,emoji);

    await renderFeed(
     document.querySelector(".community-feed-panel")
    );

   }catch(error){

    console.error(error);
    showNotice(error.message || "Reaction failed.");

   }finally{

    b.disabled = false;
   }
  });

  reactionRow.appendChild(b);
 });

 card.appendChild(reactionRow);

 // COMMENTS

 const actionRow = createElement("div","community-post-actions");

 const commentButton = makeButton(
  "Comment",
  "community-comment-toggle"
 );

 commentButton.addEventListener("click",()=>{
  openComments(post);
 });

 actionRow.appendChild(commentButton);
 card.appendChild(actionRow);

 const preview = createElement("div","community-comments-preview");

 comments
  .filter(comment=>
   String(comment.post_id) === String(post.id)
  )
  .slice(0,2)
  .forEach(comment=>{

   const commentProfile = profiles[comment.user_id] || {};

   const line = createElement(
    "div",
    "community-comment-preview-item"
   );

   line.textContent =
    (commentProfile.display_name || "Member") +
    ": " + comment.comment_text;

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

   if(!confirm("Are you sure you want to delete this post?")){
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

    await loadPosts();
    await loadProfiles();

    showNotice("Post deleted successfully.");

    const feed = document.querySelector(".community-feed-panel");

    if(feed) await renderFeed(feed);

    const me = document.querySelector(".community-section-panel");

    if(me && me.style.display !== "none"){
     await renderMe(me);
    }

   }catch(error){

    console.error(error);
    showNotice(error.message || "Delete failed.");

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

 const overlay = createElement("div","community-comment-overlay");

 overlay.style.cssText = `
  position:fixed;
  inset:0;
  z-index:99999;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  background:rgba(0,0,0,.65);
 `;

 const sheet = createElement("section","community-comment-sheet");

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

 header.appendChild(createElement("strong","","Comments"));

 const close = makeButton("✕","community-comment-close");

 close.addEventListener("click",()=>{
  overlay.remove();
 });

 header.appendChild(close);
 sheet.appendChild(header);

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
    createElement("p","community-empty","No comments yet.")
   );
   return;
  }

  items.forEach(comment=>{

   const profile = profiles[comment.user_id] || {};

   const row = createElement("div","community-comment-preview-item");

   row.textContent =
    (profile.display_name || "Community Member") +
    ": " + comment.comment_text;

   list.appendChild(row);
  });
 }

 drawComments();

 sheet.appendChild(list);

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

 const send = makeButton("Send","community-comment-sheet-send");

 send.type = "submit";

 form.appendChild(input);
 form.appendChild(send);

 form.addEventListener("submit",async event=>{

  event.preventDefault();

  send.disabled = true;

  try{

   await addComment(post.id,input.value);

   await drawComments();

   input.value = "";

   drawComments();

   await renderFeed(
    document.querySelector(".community-feed-panel")
   );

   notice("Comment added.");

  }catch(error){

   console.error(error);
   showNotice(error.message || "Comment failed.");

  }finally{

   send.disabled = false;
  }
 });

 sheet.appendChild(form);

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

function createComposer(container){

 if(!currentUser || !isCreator()) return;

 const composer = createElement(
  "section",
  "community-composer"
 );

 composer.appendChild(
  createElement("h3","community-composer-title","Create a Post")
 );

 const textarea = createElement("textarea");

 textarea.placeholder = "What's on your mind?";
 textarea.maxLength = 2000;

 composer.appendChild(textarea);

 const preview = createElement("img","community-preview");

 preview.alt = "Selected image preview";
 preview.style.cssText = `
  display:none;
  width:100%;
  max-height:300px;
  object-fit:contain;
 `;

 composer.appendChild(preview);

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

  if(chosenFile.size > 5*1024*1024){
   chosenFile = null;
   fileInput.value = "";
   showNotice("Image must be 5 MB or less.");
   return;
  }

  if(!["image/jpeg","image/png","image/webp"].includes(chosenFile.type)){
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

 const publish = makeButton(
  "Publish",
  "community-publish-btn"
 );

 publish.addEventListener("click",async()=>{

  publish.disabled = true;
  publish.textContent = "Publishing...";

  try{

   await publishPost(textarea.value,chosenFile);

   textarea.value = "";
   fileInput.value = "";
   chosenFile = null;

   preview.src = "";
   preview.style.display = "none";

   await refreshData();

   await renderFeed(container);

   showNotice("Post published successfully.");

  }catch(error){

   console.error(error);
   showNotice(error.message || "Publish failed.");

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

async function renderFeed(container){

 if(!container) return;

 container.innerHTML = "";

 container.appendChild(
  createElement("h3","community-feed-title","Community Feed")
 );

 createComposer(container);

 const search = createElement("input","community-feed-search");

 search.type = "search";
 search.placeholder = "Search posts...";

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

 const list = createElement("div","community-feed");

 container.appendChild(list);

 function draw(){

  list.innerHTML = "";

  const query = search.value.trim().toLowerCase();

  const filtered = posts.filter(post=>{

   const profile = profiles[post.user_id] || {};

   return (
    String(post.caption || "").toLowerCase().includes(query) ||
    String(profile.display_name || "").toLowerCase().includes(query)
   );
  });

  if(!filtered.length){

   list.appendChild(
    createElement("p","community-empty","No posts found.")
   );

   return;
  }

  filtered.forEach(post=>{

   renderPostCard(
    list,
    post,
    currentUser && post.user_id === currentUser.id
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
  createElement("h3","","Creator Panel")
 );

 container.appendChild(
  createElement(
   "p",
   "",
   "Explore Community posts, react and comment."
  )
 );

 if(currentUser && isCreator()){

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
    "You can browse posts, react and comment. Publishing is available only to authorized Creators."
   )
  );
 }

 const feed = createElement("div","community-feed-panel");

 container.appendChild(feed);

 await renderFeed(feed);
}


// ================================================
// NOTIFICATIONS
// ================================================

async function renderNotifications(container){

 container.innerHTML = "";

 container.appendChild(
  createElement("h3","","Notifications")
 );

 if(!currentUser){
  container.appendChild(
   createElement("p","community-empty",LOGIN_ERROR)
  );
  return;
 }

 const {data,error} = await db
  .from("community_notifications")
  .select("*")
  .eq("recipient_id",currentUser.id)
  .order("created_at",{ascending:false});

 if(error){
  showNotice(error.message);
  return;
 }

 if(!data?.length){

  container.appendChild(
   createElement("p","community-empty","No notifications yet.")
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
   createElement("small","",dateText(item.created_at))
  );

  if(!item.is_read){

   const mark = makeButton(
    "Mark as read",
    "community-notification-read"
   );

   mark.addEventListener("click",async()=>{

    const {error:updateError} = await db
     .from("community_notifications")
     .update({is_read:true})
     .eq("id",item.id)
     .eq("recipient_id",currentUser.id);

    if(updateError){
     showNotice(updateError.message);
     return;
    }

    await renderNotifications(container);
   });

   card.appendChild(mark);
  }

  container.appendChild(card);
 });
}


// ================================================
// MAIN COMMUNITY PAGE
// ================================================

async function renderCommunityPage(){

 const pageContent = document.getElementById("pageContent");

 if(!pageContent) return;

 if(!db){
  pageContent.textContent =
   "Supabase connection unavailable.";
  return;
 }

 document.body.classList.add("community-active");

 pageContent.innerHTML = "";

 const root = createElement("div","community-page");

 const header = createElement("header","community-header");

 const brand = createElement("a","community-brand");

 brand.href = "?page=community";
 brand.innerHTML = 'CHANGE MAKER <span>COMMUNITY</span>';

 header.appendChild(brand);

 const nav = createElement("nav","community-nav");

 const main = createElement("main","community-main");

 const noticeBox = createElement("div","community-notice");

 main.appendChild(noticeBox);

 const feedPanel = createElement("section","community-feed-panel");

 const sectionPanel = createElement("section","community-section-panel");

 const notificationPanel = createElement(
  "section",
  "community-notification-panel"
 );

 sectionPanel.style.display = "none";
 notificationPanel.style.display = "none";

 const navItems = [
  ["Home","home"],
  ["Me","me"],
  ["Creator Panel","creator"],
  ["Notification","notifications"]
 ];

 navItems.forEach((item,index)=>{

  const b = makeButton(
   item[0],
   index === 0 ? "active" : ""
  );

  b.addEventListener("click",async()=>{

   nav.querySelectorAll("button").forEach(button=>
    button.classList.remove("active")
   );

   b.classList.add("active");

   feedPanel.style.display = "none";
   sectionPanel.style.display = "none";
   notificationPanel.style.display = "none";

   try{

    if(item[1] === "home"){

     feedPanel.style.display = "block";

     await refreshData();

     await renderFeed(feedPanel);
    }

    if(item[1] === "me"){

     sectionPanel.style.display = "block";

     await refreshData();

     await renderMe(sectionPanel);
    }

    if(item[1] === "creator"){

     sectionPanel.style.display = "block";

     await refreshData();

     await renderCreator(sectionPanel);
    }

    if(item[1] === "notifications"){

     notificationPanel.style.display = "block";

     await renderNotifications(notificationPanel);
    }

   }catch(error){

    console.error(error);
    showNotice(error.message || "Unable to open section.");
   }
  });

  nav.appendChild(b);
 });

 header.appendChild(nav);

 root.appendChild(header);

 main.appendChild(feedPanel);

 root.appendChild(main);
 root.appendChild(sectionPanel);
 root.appendChild(notificationPanel);

 pageContent.appendChild(root);

 try{

  await refreshData();

  await renderFeed(feedPanel);

 }catch(error){

  console.error("Community error:",error);

  showNotice(
   error.message || "Unable to load Community."
  );
 }
}


// ================================================
// GLOBAL ROUTE
// ================================================

window.renderCommunityPage = renderCommunityPage;


// ================================================
// AUTH STATE CHANGES
// ================================================

if(db){

 db.auth.onAuthStateChange(async()=>{

  const page = new URLSearchParams(
   window.location.search
  ).get("page");

  if(page === "community"){

   try{

    await refreshData();

    await renderCommunityPage();

   }catch(error){

    console.error(error);
   }
  }
 });
}


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
