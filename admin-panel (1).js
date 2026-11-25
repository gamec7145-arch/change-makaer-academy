/* =========================================================
   CHANGE MAKER ACADEMY — SECURE CONTENT ADMIN PANEL
   Authentication: Supabase Auth + cma_admin_users
   Media: public cma-admin-media storage bucket
========================================================= */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const db = () => window.cmaSupabase;
  const BUCKET = "cma-admin-media";
  const CLASS_NAMES = { "6":"ষষ্ঠ শ্রেণি", "7":"সপ্তম শ্রেণি", "8":"অষ্টম শ্রেণি", "9":"নবম শ্রেণি", "10":"দশম শ্রেণি", "11":"একাদশ–দ্বাদশ" };
  const CLASS_SUBJECTS = {
    "6":[["bangla","বাংলা"],["english","ইংরেজি"],["math","গণিত"],["science","বিজ্ঞান"],["bgs","বাংলাদেশ ও বিশ্বপরিচয়"],["ict","তথ্য ও যোগাযোগ প্রযুক্তি"],["religion","ধর্ম ও নৈতিক শিক্ষা"],["physical-education","শারীরিক শিক্ষা ও স্বাস্থ্য"],["work-life","কর্ম ও জীবনমুখী শিক্ষা"],["agriculture","কৃষিশিক্ষা"],["home-science","গার্হস্থ্যবিজ্ঞান"],["arts-crafts","চারু ও কারুকলা"]],
    "7":null,"8":null,
    "9":[["bangla","বাংলা"],["english","ইংরেজি"],["general-math","সাধারণ গণিত"],["religion","ধর্ম ও নৈতিক শিক্ষা"],["ict","তথ্য ও যোগাযোগ প্রযুক্তি"],["career-education","ক্যারিয়ার শিক্ষা"],["physical-education","শারীরিক শিক্ষা, স্বাস্থ্যবিজ্ঞান ও খেলাধুলা"],["physics","পদার্থবিজ্ঞান"],["chemistry","রসায়ন"],["biology","জীববিজ্ঞান"],["higher-math","উচ্চতর গণিত"],["bangladesh-global-studies","বাংলাদেশ ও বিশ্বপরিচয়"],["business-entrepreneurship","ব্যবসায় উদ্যোগ"],["accounting","হিসাববিজ্ঞান"],["finance-banking","ফিন্যান্স ও ব্যাংকিং"],["history","বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা"],["geography","ভূগোল ও পরিবেশ"],["economics","অর্থনীতি"],["civics","পৌরনীতি ও নাগরিকতা"],["general-science","সাধারণ বিজ্ঞান"],["agriculture","কৃষিশিক্ষা"],["home-science","গার্হস্থ্যবিজ্ঞান"],["arts-crafts","চারু ও কারুকলা"],["music","সংগীত"]],
    "10":null,
    "11":[["bangla","বাংলা"],["english","ইংরেজি"],["ict","তথ্য ও যোগাযোগ প্রযুক্তি"],["physics","পদার্থবিজ্ঞান"],["chemistry","রসায়ন"],["biology","জীববিজ্ঞান"],["higher-math","উচ্চতর গণিত"],["business-management","ব্যবসায় সংগঠন ও ব্যবস্থাপনা"],["accounting","হিসাববিজ্ঞান"],["finance-banking","ফিন্যান্স, ব্যাংকিং ও বিমা"],["production-marketing","উৎপাদন ব্যবস্থাপনা ও বিপণন"],["tourism-hospitality","পর্যটন ও আতিথেয়তা"],["human-resource","মানবসম্পদ ব্যবস্থাপনা"],["history","ইতিহাস"],["islamic-history","ইসলামের ইতিহাস ও সংস্কৃতি"],["civics","পৌরনীতি ও সুশাসন"],["economics","অর্থনীতি"],["logic","যুক্তিবিদ্যা"],["sociology","সমাজবিজ্ঞান"],["social-work","সমাজকর্ম"],["islamic-studies","ইসলাম শিক্ষা"],["anthropology","নৃবিজ্ঞান"],["geography","ভূগোল"],["psychology","মনোবিজ্ঞান"],["statistics","পরিসংখ্যান"],["agriculture","কৃষিশিক্ষা"],["home-science","গার্হস্থ্য বিজ্ঞান"],["soil-science","মৃত্তিকা বিজ্ঞান"],["engineering-drawing","প্রকৌশল অঙ্কন"],["fine-arts","চারুকলা"],["sports","ক্রীড়া"]]
  };
  CLASS_SUBJECTS["7"] = CLASS_SUBJECTS["6"];
  CLASS_SUBJECTS["8"] = CLASS_SUBJECTS["6"];
  CLASS_SUBJECTS["10"] = CLASS_SUBJECTS["9"];
  const GROUPS = [["science","বিজ্ঞান"],["arts","মানবিক"],["commerce","ব্যবসায় শিক্ষা"]];
  const SSC_SUBJECT_GROUPS = {
    physics:["science"], chemistry:["science"], biology:["science"], "higher-math":["science"],
    "bangladesh-global-studies":["science","commerce"],
    "business-entrepreneurship":["commerce"], accounting:["commerce"], "finance-banking":["commerce"],
    history:["arts"], geography:["arts"], economics:["arts"], civics:["arts"],
    "general-science":["arts","commerce"]
  };
  const HSC_SUBJECT_GROUPS = {
    physics:["science"], chemistry:["science"], biology:["science"], "higher-math":["science"],
    "business-management":["commerce"], accounting:["commerce"], "finance-banking":["commerce"],
    "production-marketing":["commerce"], "tourism-hospitality":["commerce"], "human-resource":["commerce"],
    history:["arts"], "islamic-history":["arts"], civics:["arts"], economics:["arts"], logic:["arts"],
    sociology:["arts"], "social-work":["arts"], "islamic-studies":["arts"], anthropology:["arts"]
  };
  function classSubjectOptions(classNo, groupKey) {
    const all = CLASS_SUBJECTS[String(classNo)] || [];
    const number = Number(classNo);
    if (number < 9 || !groupKey) return all;
    const groupMap = number <= 10 ? SSC_SUBJECT_GROUPS : HSC_SUBJECT_GROUPS;
    return all.filter(([key]) => !groupMap[key] || groupMap[key].includes(groupKey));
  }
  const ADMISSION_SUBJECTS = [
    ["bangla","বাংলা","all"],["english","ইংরেজি","all"],["ict","তথ্য ও যোগাযোগ প্রযুক্তি","all"],
    ["physics","পদার্থবিজ্ঞান","science"],["chemistry","রসায়ন","science"],["biology","জীববিজ্ঞান","science"],["higher-math","উচ্চতর গণিত","science"],
    ["business-management","ব্যবসায় সংগঠন ও ব্যবস্থাপনা","commerce"],["accounting","হিসাববিজ্ঞান","commerce"],["finance-banking","ফিন্যান্স, ব্যাংকিং ও বিমা","commerce"],["production-marketing","উৎপাদন ব্যবস্থাপনা ও বিপণন","commerce"],["tourism-hospitality","পর্যটন ও আতিথেয়তা","commerce"],["human-resource","মানবসম্পদ ব্যবস্থাপনা","commerce"],
    ["history","ইতিহাস","arts"],["islamic-history","ইসলামের ইতিহাস ও সংস্কৃতি","arts"],["civics","পৌরনীতি ও সুশাসন","arts"],["economics","অর্থনীতি","arts"],["logic","যুক্তিবিদ্যা","arts"],["sociology","সমাজবিজ্ঞান","arts"],["social-work","সমাজকর্ম","arts"],["islamic-studies","ইসলাম শিক্ষা","arts"],["anthropology","নৃবিজ্ঞান","arts"]
  ];

  let currentUser = null;
  let currentRole = "";
  let currentArea = "";

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function notify(text, type) {
    const host = $("notice"); host.innerHTML = "";
    if (!text) return;
    host.appendChild(el("div", "notice " + (type || "info"), text));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // Phone-er Back button: form → list → Dashboard → website
  let goUp = null;
  const inSubEntry = () => !!(history.state && history.state.cmaAdminSub);
  function addSubEntry() { if (!inSubEntry()) history.pushState({ cmaAdminSub: 1 }, ""); }
  window.addEventListener("popstate", () => {
    const up = goUp; goUp = null;
    if (!up) return;
    notify("");
    up();
    if (!$("workspaceView").classList.contains("hide")) addSubEntry();
  });

  function showView(view) {
    if (view !== "workspace") {
      goUp = null;
      if (inSubEntry()) history.back();
    }
    $("loginView").classList.toggle("hide", view !== "login");
    $("dashboardView").classList.toggle("hide", view !== "dashboard");
    $("workspaceView").classList.toggle("hide", view !== "workspace");
    $("logoutBtn").classList.toggle("hide", view === "login");
  }
  function setWorkspace(title, description) {
    $("workspaceTitle").textContent = title;
    $("workspaceDesc").textContent = description || "";
    $("workspace").innerHTML = "";
    showView("workspace");
    goUp = () => showView("dashboard");
    addSubEntry();
    notify("");
    window.scrollTo(0, 0);
  }
  function makeButton(label, cls, action) {
    const b = el("button", "btn " + (cls || ""), label); b.type = "button";
    b.addEventListener("click", action); return b;
  }
  function addField(host, label, control, hint) {
    const wrap = el("div", "field"); wrap.append(el("label", "", label), control);
    if (hint) wrap.append(el("small", "hint", hint));
    host.append(wrap); return control;
  }
  function textControl(value, placeholder, type) {
    const i = el("input"); i.type = type || "text"; i.value = value == null ? "" : value;
    if (placeholder) i.placeholder = placeholder; return i;
  }
  function areaControl(value, placeholder) {
    const a = el("textarea"); a.value = value || ""; if (placeholder) a.placeholder = placeholder; return a;
  }
  function selectControl(options, value, placeholder) {
    const s = el("select");
    if (placeholder !== false) { const first = el("option", "", "নির্বাচন করো"); first.value = ""; s.append(first); }
    options.forEach(item => {
      const o = el("option", "", item[1]); o.value = item[0]; s.append(o);
    });
    if (value != null) s.value = String(value);
    return s;
  }
  function checkboxLine(label, checked) {
    const line = el("label", "checkrow"); const c = el("input"); c.type = "checkbox"; c.checked = !!checked;
    line.append(c, document.createTextNode(label)); return { line, input: c };
  }
  function imageFor(record) {
    return record.image_url || record.thumbnail_url || record.photo_url || "";
  }
  function safeText(v) { return String(v == null ? "" : v); }
  function safeUrl(v) { return /^https?:\/\//i.test(String(v || "").trim()) ? String(v).trim() : ""; }

  async function waitForDb() {
    for (let i = 0; i < 40 && !db(); i++) await new Promise(resolve => setTimeout(resolve, 100));
    if (!db()) throw new Error("Supabase client পাওয়া যায়নি। আবার পেজ লোড করো।");
    return db();
  }
  async function authorize(user) {
    const { data, error } = await db()
      .from("cma_admin_users")
      .select("user_id, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      await db().auth.signOut();

      currentUser = null;
      currentRole = "";

      showView("login");

      notify(
        "এই Gmail-এ Admin permission দেওয়া নেই। অনুমোদিত account ব্যবহার করো।",
        "err"
      );

      return false;
    }

    currentUser = user;
    currentRole = "admin";

    $("adminIdentity").textContent =
      (user.email || data.email || "Admin") + " • Admin";

    showView("dashboard");
    notify("Admin Panel-এ স্বাগতম।", "ok");

    return true;
  }
  async function init() {
    try {
      const client = await waitForDb();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data && data.session && data.session.user) await authorize(data.session.user);
      else showView("login");
    } catch (error) { showView("login"); notify(error.message || "Admin Panel চালু করা যায়নি।", "err"); }
  }

  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("loginSubmit"); button.disabled = true; notify("");
    try {
      await waitForDb();
      const email = $("adminEmail").value.trim();
      const password = $("adminPassword").value;
      const { data, error } = await db().auth.signInWithPassword({ email, password });
      if (error) throw error;
      const accepted = await authorize(data.user);
      if (accepted) $("adminPassword").value = "";
    } catch (error) { notify("Login করা যায়নি: " + (error.message || "অজানা সমস্যা"), "err"); }
    finally { button.disabled = false; }
  });
  $("logoutBtn").addEventListener("click", async () => { if (db()) await db().auth.signOut(); currentUser = null; currentRole = ""; showView("login"); notify("Logout সম্পন্ন হয়েছে।", "ok"); });
  // Home button: admin panel history-te na rekhe website-e ber hoy
  $("homeBtn").addEventListener("click", event => {
    event.preventDefault();
    const leave = () => location.replace("./");
    if (!inSubEntry()) return leave();
    goUp = null;
    window.addEventListener("popstate", leave, { once: true });
    history.back();
  });
  $("backDashboard").addEventListener("click", () => { currentArea = ""; showView("dashboard"); notify(""); });

  async function uploadFile(file, folder) {
    if (!file) return "";
    const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 9) + "." + extension;
    const { error } = await db().storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: false });
    if (error) throw error;
    return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function removeFile(url) {
    const marker = "/" + BUCKET + "/"; const raw = String(url || ""); const at = raw.indexOf(marker);
    if (at < 0) return;
    const path = decodeURIComponent(raw.slice(at + marker.length).split("?")[0]);
    const { error } = await db().storage.from(BUCKET).remove([path]);
    if (error) console.warn("Media file cleanup skipped", error.message);
  }
  function fileControl(label, accept, oldUrl) {
    const wrap = el("div"); const input = el("input"); input.type = "file"; input.accept = accept;
    const info = el("div", "file-name", oldUrl ? "বর্তমান ফাইল সংরক্ষিত আছে; বদলাতে নতুন ফাইল বেছে নাও।" : "কোনো ফাইল নির্বাচন করা হয়নি।");
    let preview = null;
    if (accept.indexOf("image") >= 0) {
      preview = el("img", "preview"); preview.alt = label;
      if (oldUrl) preview.src = oldUrl; else preview.classList.add("hide");
      wrap.append(input, preview, info);
    } else wrap.append(input, info);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      info.textContent = "নির্বাচিত: " + file.name;
      if (preview) { preview.src = URL.createObjectURL(file); preview.classList.remove("hide"); }
    });
    return { wrap, input, oldUrl: oldUrl || "", preview };
  }

  // Generic create/edit/list manager for tables that already power a student page.
  async function openListManager(config) {
    currentArea = config.area || currentArea;
    setWorkspace(config.title, config.description || "তালিকা থেকে পোস্ট এডিট, ডিলিট বা নতুন পোস্ট যোগ করো।");
    if (config.onBack) goUp = config.onBack;
    const host = $("workspace");
    const actions = el("div", "actions");
    actions.append(makeButton("+ নতুন যোগ করো", "", () => openRecordForm(config, null, () => openListManager(config))));
    if (config.backLabel) actions.append(makeButton("← " + config.backLabel, "ghost", config.onBack || (() => showView("dashboard"))));
    host.append(actions);
    const list = el("div"); host.append(list);

    async function loadRows() {
      list.innerHTML = ""; list.append(el("div", "loading", "লোড হচ্ছে…"));
      try {
        let query = db().from(config.table).select("*");
        Object.entries(config.filter || {}).forEach(([key, value]) => { query = query.eq(key, value); });
        if (config.orderBy) query = query.order(config.orderBy, { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        list.innerHTML = "";
        if (!data || !data.length) { list.append(el("div", "empty", config.emptyText || "এখনো কোনো পোস্ট নেই। নতুন যোগ করো।")); return; }
        data.forEach(record => {
          const item = el("article", "item");
          const image = imageFor(record);
          if (image) { const im = el("img"); im.src = image; im.alt = ""; item.append(im); } else item.append(el("div", "thumb"));
          const info = el("div", "info"); info.append(el("b", "", config.itemTitle ? config.itemTitle(record) : (record.title || record.name || "Untitled")));
          if (config.itemSub) info.append(el("small", "", config.itemSub(record)));
          else if (record.is_active === false) info.append(el("small", "", "স্টুডেন্টদের কাছে লুকানো"));
          item.append(info);
          const acts = el("div", "acts");
          if (config.childAction) acts.append(makeButton(config.childAction.label, "soft small", () => config.childAction.run(record)));
          acts.append(makeButton("এডিট", "ghost small", () => openRecordForm(config, record, () => openListManager(config))));
          acts.append(makeButton("ডিলিট", "danger small", async () => {
            if (!confirm("এই পোস্টটি ডিলিট করবে?")) return;
            try {
              if (config.beforeDelete) await config.beforeDelete(record);
              const { error: delError } = await db().from(config.table).delete().eq("id", record.id);
              if (delError) throw delError;
              if (config.fileKeys) for (const key of config.fileKeys) await removeFile(record[key]);
              notify("পোস্ট ডিলিট হয়েছে।", "ok"); await loadRows();
            } catch (error) { notify("ডিলিট করা যায়নি: " + error.message, "err"); }
          }));
          item.append(acts); list.append(item);
        });
      } catch (error) { list.innerHTML = ""; list.append(el("div", "empty", "ডেটা লোড করা যায়নি: " + error.message)); }
    }
    await loadRows();
  }

  async function openRecordForm(config, record, afterSave) {
    const host = $("workspace"); host.innerHTML = "";
    goUp = () => afterSave();
    const form = el("form", "panel"); form.style.boxShadow = "none";
    form.append(el("h3", "", record ? "পোস্ট এডিট" : "নতুন পোস্ট"));
    const controls = {}; const files = {};
    (config.fields || []).forEach(field => {
      let node;
      const current = record ? (field.value ? field.value(record) : record[field.key]) : field.defaultValue;
      if (field.type === "textarea") node = areaControl(current, field.placeholder);
      else if (field.type === "select") node = selectControl(field.options || [], current, true);
      else if (field.type === "file") {
        const f = fileControl(field.label, field.accept || "image/*", current);
        files[field.key] = f; node = f.wrap;
      } else {
        node = textControl(current, field.placeholder, field.type === "number" ? "number" : "text");
        if (field.type === "number") { node.step = field.step || "1"; if (field.min != null) node.min = field.min; }
      }
      if (field.required && node.tagName !== "DIV") node.required = true;
      controls[field.key] = node;
      addField(form, field.label, node, field.hint);
    });
    let active = null;
    if (config.active !== false) { active = checkboxLine("স্টুডেন্টদের দেখাও", record ? record.is_active !== false : true); form.append(active.line); }
    const actions = el("div", "actions"); const save = el("button", "btn", "সেভ করো"); save.type = "submit";
    const cancel = makeButton("বাতিল", "ghost", () => afterSave()); actions.append(save, cancel); form.append(actions); host.append(form);
    form.addEventListener("submit", async event => {
      event.preventDefault(); save.disabled = true; notify("");
      try {
        const payload = { ...(config.filter || {}) }; const oldFiles = [];
        for (const field of (config.fields || [])) {
          const problem = field.validate && field.validate(controls[field.key].value.trim());
          if (problem) throw new Error(problem);
        }
        for (const field of (config.fields || [])) {
          if (field.type === "file") {
            const f = files[field.key]; const selected = f.input.files && f.input.files[0];
            if (selected) { const url = await uploadFile(selected, config.folder || config.table); payload[field.key] = url; if (f.oldUrl) oldFiles.push(f.oldUrl); }
            else payload[field.key] = f.oldUrl || null;
          } else if (field.type === "number") payload[field.key] = controls[field.key].value === "" ? (field.defaultValue || 0) : Number(controls[field.key].value);
          else payload[field.key] = controls[field.key].value.trim();
        }
        for (const field of (config.fields || [])) if (field.resolve) payload[field.key] = await field.resolve(payload[field.key]);
        if (active) payload.is_active = active.input.checked;
        (config.fields || []).forEach(field => { if (field.required && !String(payload[field.key] || "").trim()) throw new Error(field.label + " পূরণ করো।"); });
        if (config.transform) Object.assign(payload, config.transform(payload, record) || {});
        (config.omitFields || []).forEach(key => delete payload[key]);
        let result;
        if (record) result = await db().from(config.table).update(payload).eq("id", record.id);
        else result = await db().from(config.table).insert(payload);
        if (result.error) throw result.error;
        for (const url of oldFiles) await removeFile(url);
        notify("সেভ হয়েছে।", "ok"); await afterSave();
      } catch (error) { notify("সেভ করা যায়নি: " + error.message, "err"); save.disabled = false; }
    });
  }

  // Flexible MCQ editor shared by Exam Preparation and Admission Exam.
  function questionEditor(initialQuestions) {
    let questions = Array.isArray(initialQuestions) ? initialQuestions.map(q => ({
      question: q.question || "", options: Array.isArray(q.options) ? q.options.slice() : ["","","",""],
      multiple: !!(q.multiple || Array.isArray(q.answer)),
      answer: Array.isArray(q.answer) ? q.answer.map(Number) : (q.answer == null ? 0 : Number(q.answer))
    })) : [];
    const wrap = el("div"); const cards = el("div");
    function draw() {
      cards.innerHTML = "";
      questions.forEach((q, qi) => {
        const card = el("section", "qcard"); const top = el("div", "qtop");
        top.append(el("b", "", "প্রশ্ন " + (qi + 1)));
        const remove = makeButton("প্রশ্ন মুছো", "danger small", () => { questions.splice(qi, 1); draw(); }); top.append(remove); card.append(top);
        const qInput = areaControl(q.question, "এখানে প্রশ্ন লিখো…"); qInput.rows = 2; qInput.addEventListener("input", () => q.question = qInput.value); addField(card, "Question", qInput);
        const multi = checkboxLine("এই প্রশ্নের একাধিক উত্তর সঠিক", q.multiple); card.append(multi.line);
        const optionsHost = el("div", "opts"); const count = q.multiple ? 8 : 4;
        while (q.options.length < count) q.options.push("");
        if (q.options.length > count) q.options = q.options.slice(0, count);
        if (q.multiple && !Array.isArray(q.answer)) q.answer = [Number(q.answer || 0)];
        if (!q.multiple && Array.isArray(q.answer)) q.answer = Number(q.answer[0] || 0);
        q.options.forEach((value, oi) => {
          const row = el("div", "optrow"); const input = textControl(value, "Option " + (oi + 1));
          input.addEventListener("input", () => q.options[oi] = input.value);
          const mark = el("label"); const radio = el("input"); radio.type = q.multiple ? "checkbox" : "radio"; radio.name = "correct-" + qi; radio.checked = q.multiple ? q.answer.includes(oi) : q.answer === oi;
          radio.addEventListener("change", () => {
            if (q.multiple) { if (radio.checked && !q.answer.includes(oi)) q.answer.push(oi); else q.answer = q.answer.filter(x => x !== oi); }
            else q.answer = oi;
          });
          mark.append(radio, document.createTextNode("সঠিক")); row.append(input, mark); optionsHost.append(row);
        });
        multi.input.addEventListener("change", () => {
          const oldOptions = q.options.slice();
          q.multiple = multi.input.checked; q.options = oldOptions;
          if (q.multiple) q.answer = Array.isArray(q.answer) ? q.answer : [Number(q.answer || 0)];
          else q.answer = Array.isArray(q.answer) ? Number(q.answer[0] || 0) : q.answer;
          draw();
        });
        card.append(el("div", "tiny", q.multiple ? "৮টি অপশন • একাধিক সঠিক উত্তর নির্বাচন করা যাবে" : "৪টি অপশন • একটি সঠিক উত্তর নির্বাচন করো"), optionsHost);
        cards.append(card);
      });
    }
    const add = makeButton("+ Add Question", "soft", () => { questions.push({ question:"", options:["","","",""], multiple:false, answer:0 }); draw(); });
    wrap.append(cards, add); draw();
    return { element: wrap, getQuestions: () => questions.map(q => ({ question:q.question.trim(), options:q.options.map(x => String(x || "").trim()), multiple:!!q.multiple, answer:q.multiple ? q.answer.map(Number) : Number(q.answer) })) };
  }

  async function openMCQManager(kind, selectedGroup) {
    const admission = kind === "admission";
    const cfg = {
      area: admission ? "admission-exam" : "class-exams",
      table: admission ? "admission_mcq_posts" : "class_prep_mcq_posts",
      title: admission ? "Admission • Exam Posts" : "Exam প্রস্তুতি • MCQ Posts",
      description: admission ? "Admission group, subject, chapter এবং timed MCQ পরীক্ষা পরিচালনা করো।" : "Class 6–12-এর subject, chapter এবং timed MCQ পরীক্ষা পরিচালনা করো।",
      folder: "exam-thumbnails"
    };
    setWorkspace(cfg.title, cfg.description);
    const host = $("workspace");
    const actions = el("div", "actions"); actions.append(makeButton("+ নতুন MCQ পোস্ট", "", () => form(null, () => openMCQManager(kind, selectedGroup)))); host.append(actions);
    const list = el("div"); host.append(list);
    async function load() {
      list.innerHTML = ""; list.append(el("div", "loading", "লোড হচ্ছে…"));
      try {
        let query = db().from(cfg.table).select("*");
        if (admission && selectedGroup) query = query.eq("group_key", selectedGroup);
        const { data, error } = await query.order("sort_order", { ascending:true });
        if (error) throw error;
        list.innerHTML = "";
        if (!data || !data.length) return list.append(el("div", "empty", "এখনো কোনো MCQ পোস্ট নেই।"));
        data.forEach(row => {
          const item = el("article", "item"); if (row.image_url) { const im = el("img"); im.src = row.image_url; item.append(im); } else item.append(el("div", "thumb"));
          const info = el("div", "info"); info.append(el("b", "", row.title || "MCQ Post"));
          const cls = admission ? (GROUPS.find(g=>g[0]===row.group_key)||["","Admission"])[1] : (CLASS_NAMES[String(row.class_no || String(row.program||"").replace("class-",""))] || row.program);
          info.append(el("small", "", cls + " • " + (row.subject || "") + " • " + ((row.questions || []).length) + " প্রশ্ন • " + (row.duration || 20) + " মিনিট")); item.append(info);
          const acts = el("div", "acts"); acts.append(makeButton("এডিট", "ghost small", () => form(row, () => openMCQManager(kind, selectedGroup))), makeButton("ডিলিট", "danger small", async () => {
            if (!confirm("এই MCQ পোস্টটি ডিলিট করবে?")) return;
            const { error: delError } = await db().from(cfg.table).delete().eq("id", row.id);
            if (delError) notify("ডিলিট হয়নি: " + delError.message, "err"); else { await removeFile(row.image_url); notify("পোস্ট ডিলিট হয়েছে।", "ok"); await openMCQManager(kind, selectedGroup); }
          })); item.append(acts); list.append(item);
        });
      } catch (error) { list.innerHTML = ""; list.append(el("div", "empty", "ডেটা লোড করা যায়নি: " + error.message)); }
    }
    function form(record, after) {
      goUp = () => after();
      host.innerHTML = ""; const f = el("form", "panel"); f.style.boxShadow = "none"; f.append(el("h3", "", record ? "MCQ পোস্ট এডিট" : "নতুন MCQ পোস্ট"));
      const controls = {}; const files = {};
      if (admission) {
        controls.group_key = addField(f, "Select Group", selectControl(GROUPS, (record && record.group_key) || selectedGroup));
        const subjectOptions = () => ADMISSION_SUBJECTS.filter(s => s[2] === "all" || s[2] === controls.group_key.value).map(s => [s[0],s[1]]);
        controls.subject = addField(f, "Select Subject", selectControl(subjectOptions(), record && record.subject));
        controls.group_key.addEventListener("change", () => { const old = controls.subject.value; controls.subject.innerHTML = ""; const empty = el("option","","নির্বাচন করো"); empty.value=""; controls.subject.append(empty); subjectOptions().forEach(s=>{const o=el("option","",s[1]);o.value=s[0];controls.subject.append(o)}); if (subjectOptions().some(s=>s[0]===old)) controls.subject.value=old; });
      } else {
        const classOptions = Object.entries(CLASS_NAMES).map(([k,v])=>[k,v]);
        controls.class_no = addField(f, "Select Class", selectControl(classOptions, record && (record.class_no || String(record.program || "").replace("class-",""))));
        controls.group_key = addField(f, "Select Group (Class 9–12)", selectControl([["","গ্রুপ নির্বাচন করো"],...GROUPS], record && record.group_key));
        controls.subject = addField(f, "Select Subject", selectControl(classSubjectOptions(controls.class_no.value || "6", controls.group_key.value), record && record.subject));
        function refreshClassSubjects() {
          const classNo = controls.class_no.value;
          const needsGroup = Number(classNo) >= 9;
          controls.group_key.disabled = !needsGroup;
          controls.group_key.required = needsGroup;
          if (!needsGroup) controls.group_key.value = "";
          const old = controls.subject.value;
          const options = classSubjectOptions(classNo, controls.group_key.value);
          controls.subject.innerHTML = "";
          const empty = el("option", "", "নির্বাচন করো"); empty.value = ""; controls.subject.append(empty);
          options.forEach(([key,name]) => { const option = el("option", "", name); option.value = key; controls.subject.append(option); });
          if (options.some(([key]) => key === old)) controls.subject.value = old;
        }
        controls.class_no.addEventListener("change", () => { controls.group_key.value = ""; refreshClassSubjects(); });
        controls.group_key.addEventListener("change", refreshClassSubjects);
        refreshClassSubjects();
        if (record && record.subject) controls.subject.value = record.subject;
      }
      controls.chapter = addField(f, "Chapter Number", textControl(record && record.chapter, "যেমন: ১"));
      controls.chapter_name = addField(f, "Chapter Name", textControl(record && (record.chapter_name || record.chapterName), "অধ্যায়ের নাম"));
      controls.title = addField(f, "Post Title", textControl(record && record.title, "পরীক্ষার নাম"));
      controls.caption = addField(f, "Short Description", areaControl(record && record.caption, "ঐচ্ছিক বর্ণনা"));
      controls.duration = addField(f, "Set Time (Minutes)", textControl(record ? record.duration : 20, "মিনিট", "number")); controls.duration.min = "1"; controls.duration.max = "300";
      files.image_url = fileControl("Post Thumbnail", "image/*", record && record.image_url); addField(f, "Post Thumbnail", files.image_url.wrap);
      controls.sort_order = addField(f, "Sort Order", textControl(record ? record.sort_order : 0, "0", "number"));
      const editor = questionEditor(record && record.questions);
      const qHead = el("div", "divider"); f.append(qHead, el("h3", "", "Add Questions"), editor.element);
      const active = checkboxLine("স্টুডেন্টদের দেখাও", record ? record.is_active !== false : true); f.append(active.line);
      const actions = el("div", "actions"); const save = el("button", "btn", "পোস্ট সেভ করো"); save.type="submit"; actions.append(save, makeButton("বাতিল", "ghost", after)); f.append(actions); host.append(f);
      f.addEventListener("submit", async event => {
        event.preventDefault(); save.disabled=true;
        try {
          const questions = editor.getQuestions();
          if (!controls.title.value.trim() || !controls.subject.value || !controls.chapter.value.trim() || !controls.chapter_name.value.trim()) throw new Error("শিরোনাম, Subject এবং Chapter-এর তথ্য পূরণ করো।");
          if (!admission && Number(controls.class_no.value) >= 9 && !controls.group_key.value) throw new Error("Class 9–12-এর জন্য Group নির্বাচন করো।");
          if (!questions.length) throw new Error("কমপক্ষে একটি প্রশ্ন যোগ করো।");
          for (let i=0;i<questions.length;i++) {
            const q=questions[i]; if(!q.question || q.options.some(x=>!x)) throw new Error("প্রশ্ন "+(i+1)+"-এর প্রশ্ন ও সব অপশন পূরণ করো।");
            const answers=Array.isArray(q.answer)?q.answer:[q.answer]; if(!answers.length || answers.some(x=>!Number.isInteger(x)||x<0||x>=q.options.length)) throw new Error("প্রশ্ন "+(i+1)+"-এর সঠিক উত্তর নির্বাচন করো।");
          }
          let image = record ? record.image_url || "" : ""; const newFile=files.image_url.input.files && files.image_url.input.files[0];
          if(newFile) image=await uploadFile(newFile,"exam-thumbnails");
          if(!image) throw new Error("Post Thumbnail নির্বাচন করো।");
          const row = { title:controls.title.value.trim(), caption:controls.caption.value.trim(), subject:controls.subject.value,
            chapter:String(controls.chapter.value.trim()), chapter_name:controls.chapter_name.value.trim(), duration:Math.max(1,Number(controls.duration.value||20)),
            questions, image_url:image || null, sort_order:Number(controls.sort_order.value||0), is_active:active.input.checked };
          if(admission) row.group_key=controls.group_key.value;
          else { row.program="class-"+controls.class_no.value; row.class_no=Number(controls.class_no.value); row.group_key=controls.group_key.value || null; }
          const result = record ? await db().from(cfg.table).update(row).eq("id",record.id) : await db().from(cfg.table).insert(row);
          if(result.error) throw result.error;
          if(newFile && record && record.image_url) await removeFile(record.image_url);
          notify("MCQ পোস্ট সেভ হয়েছে।", "ok"); await after();
        } catch(error) { notify("সেভ হয়নি: "+error.message,"err"); save.disabled=false; }
      });
    }
    await load();
  }

  async function openGameChanger() {
    setWorkspace("Game Changer 2.0", "SSC/HSC ভিডিও কোর্স অথবা Admission-এর Exam, PDF ও Class পরিচালনা করো।");
    const host=$("workspace"); const grid=el("div","grid");
    [["SSC","ssc","SSC বিষয় ও অধ্যায়ের ভিডিও"],["HSC","hsc","HSC বিষয় ও অধ্যায়ের ভিডিও"],["Admission","admission","বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা"]].forEach(([title,key,desc])=>{
      const b=el("button","tile");b.type="button";b.append(el("span","ico",key==="admission"?"◇":"▣"),el("span","",title));b.append(el("small","",desc));b.addEventListener("click",()=>key==="admission"?openAdmissionMenu():openGameChangerBatch(key));grid.append(b);
    });host.append(grid);
  }
  async function openGameChangerBatch(batch, initialSubjectId) {
    setWorkspace("Game Changer • "+batch.toUpperCase(), "বিদ্যমান Subject বেছে নিয়ে Chapter Thumbnail, Chapter Name এবং ভিডিও Embed করো।");goUp=openGameChanger;
    const host=$("workspace");
    const back=makeButton("← Game Changer", "ghost", openGameChanger); host.append(back);
    const subjectSelect=selectControl([], ""); addField(host,"Select Subject",subjectSelect);
    const list=el("div");host.append(list);
    let subjects=[];
    async function load() {
      list.innerHTML="";list.append(el("div","loading","লোড হচ্ছে…"));
      try {
        const {data,error}=await db().from("free_subjects").select("*").eq("batch",batch).eq("is_active",true).order("sort_order",{ascending:true});
        if(error)throw error;subjects=data||[];
        subjectSelect.innerHTML="";const blank=el("option","","Select Subject");blank.value="";subjectSelect.append(blank);
        subjects.forEach(s=>{const o=el("option","",s.name);o.value=s.id;subjectSelect.append(o)});
        if (initialSubjectId) subjectSelect.value = String(initialSubjectId);
        list.innerHTML="";if(!subjects.length)list.append(el("div","empty","এই Batch-এ কোনো Subject নেই। আগে free_subjects টেবিলে Subject তৈরি করতে হবে।"));
        else await loadChapters();
      }catch(e){list.innerHTML="";list.append(el("div","empty","ডেটা লোড হয়নি: "+e.message));}
    }
    async function loadChapters() {
      list.innerHTML="";const sub=subjects.find(s=>String(s.id)===String(subjectSelect.value));
      if(!sub){list.append(el("div","empty","একটি Subject বেছে নাও।"));return;}
      try {
        const {data:chapters,error}=await db().from("free_chapters").select("*").eq("subject_id",sub.id).order("sort_order",{ascending:true});if(error)throw error;
        const ids=(chapters||[]).map(c=>c.id);let vids=[];
        if(ids.length){const {data,error:ve}=await db().from("free_videos").select("*").in("chapter_id",ids).order("sort_order",{ascending:true});if(ve)throw ve;vids= data||[];}
        list.innerHTML="";const actions=el("div","actions");actions.append(makeButton("+ নতুন Chapter / Video", "",()=>chapterForm(sub,null,loadChapters)));list.append(actions);
        if(!chapters.length){list.append(el("div","empty","এই Subject-এ কোনো Chapter নেই।"));return;}
        chapters.forEach(ch=>{
          const v=vids.find(x=>String(x.chapter_id)===String(ch.id));const item=el("article","item");const image=ch.thumbnail_url|| (v&&v.thumbnail_url);
          if(image){const im=el("img");im.src=image;item.append(im)}else item.append(el("div","thumb"));
          const info=el("div","info");info.append(el("b","",ch.name));info.append(el("small","",v?v.title+" • ভিডিও যুক্ত":"ভিডিও যুক্ত হয়নি"));item.append(info);
          const acts=el("div","acts");acts.append(makeButton("এডিট","ghost small",()=>chapterForm(sub,{chapter:ch,video:v},loadChapters)),makeButton("ডিলিট","danger small",async()=>{
            if(!confirm("এই Chapter এবং এর ভিডিও ডিলিট করবে?"))return;
            try{const {data:chapterVideos,error:ve}=await db().from("free_videos").select("id,thumbnail_url").eq("chapter_id",ch.id);if(ve)throw ve;for(const video of (chapterVideos||[])){await removeFile(video.thumbnail_url);const {error:de}=await db().from("free_videos").delete().eq("id",video.id);if(de)throw de;}await removeFile(ch.thumbnail_url);const {error:ce}=await db().from("free_chapters").delete().eq("id",ch.id);if(ce)throw ce;notify("Chapter ডিলিট হয়েছে।","ok");loadChapters();}catch(e){notify("ডিলিট হয়নি: "+e.message,"err")}
          }));item.append(acts);list.append(item);
        });
      }catch(e){list.innerHTML="";list.append(el("div","empty","Chapter লোড হয়নি: "+e.message));}
    }
    async function chapterForm(sub,existing,after) {
      host.innerHTML="";goUp=()=>openGameChangerBatch(batch,sub.id);host.append(makeButton("← Subject List","ghost",goUp));
      const f=el("form","panel");f.style.boxShadow="none";f.append(el("h3","",existing?"Chapter / Video এডিট":"নতুন Chapter / Video"));
      const ch=existing&&existing.chapter, v=existing&&existing.video;
      const name=addField(f,"Chapter Name",textControl(ch&&ch.name,"অধ্যায়ের নাম"));
      const thumb=fileControl("Chapter Thumbnail","image/*",ch&&ch.thumbnail_url);addField(f,"Chapter Thumbnail",thumb.wrap);
      const title=addField(f,"Chapter Title / Video Title",textControl(v&&v.title,"ভিডিওর শিরোনাম"));
      const embed=addField(f,"Embed Video (YouTube URL)",textControl(v&&v.youtube_url,"YouTube link"));
      const sort=addField(f,"Sort Order",textControl(ch?ch.sort_order:0,"0","number"));
      const active=checkboxLine("স্টুডেন্টদের দেখাও",ch?ch.is_active!==false:true);f.append(active.line);
      const acts=el("div","actions");const save=el("button","btn","সেভ করো");save.type="submit";acts.append(save,makeButton("বাতিল","ghost",after));f.append(acts);host.append(f);
      f.addEventListener("submit",async e=>{
        e.preventDefault();save.disabled=true;
        try{
          if(!name.value.trim()||!title.value.trim()||!embed.value.trim())throw new Error("Chapter Name, Video Title এবং YouTube link পূরণ করো।");
          if(videoError(embed.value.trim()))throw new Error(videoError(embed.value.trim()));
          let image=ch&&ch.thumbnail_url||"";const file=thumb.input.files&&thumb.input.files[0];if(file)image=await uploadFile(file,"game-changer-thumbnails");
          if(!image)throw new Error("Chapter Thumbnail নির্বাচন করো।");
          const row={subject_id:sub.id,name:name.value.trim(),thumbnail_url:image||null,sort_order:Number(sort.value||0),is_active:active.input.checked};
          let chapterId=ch&&ch.id;
          if(ch){const {error}=await db().from("free_chapters").update(row).eq("id",ch.id);if(error)throw error;}
          else {const {data,error}=await db().from("free_chapters").insert(row).select("id").single();if(error)throw error;chapterId=data.id;}
          const videoRow={chapter_id:chapterId,title:title.value.trim(),youtube_url:embed.value.trim(),thumbnail_url:image||null,sort_order:Number(sort.value||0),is_active:active.input.checked};
          let videoResult;
          if(v) videoResult=await db().from("free_videos").update(videoRow).eq("id",v.id);
          else videoResult=await db().from("free_videos").insert(videoRow);
          if(videoResult.error)throw videoResult.error;
          if(file&&ch&&ch.thumbnail_url)await removeFile(ch.thumbnail_url);
          notify("Game Changer Chapter ও Video সেভ হয়েছে।","ok");await openGameChangerBatch(batch, sub.id);
        }catch(err){notify("সেভ হয়নি: "+err.message,"err");save.disabled=false;}
      });
    }
    subjectSelect.addEventListener("change",loadChapters);await load();
  }
  async function openAdmissionMenu() {
    setWorkspace("Game Changer • Admission", "প্রথমে বিভাগ, তারপর Exam / PDF / Class বেছে নাও।");goUp=openGameChanger;
    const host=$("workspace");const groups=el("div","grid");
    GROUPS.forEach(([key,name])=>{const b=el("button","tile");b.type="button";b.append(el("span","ico","◇"),el("span","",name),el("small","","এই বিভাগের Admission content"));b.addEventListener("click",()=>openAdmissionOptions(key,name));groups.append(b)});host.append(makeButton("← Game Changer","ghost",openGameChanger),groups);
  }
  async function openAdmissionOptions(group,label) {
    setWorkspace("Admission • "+label, "কী ধরনের পোস্ট তৈরি করবে?");goUp=openAdmissionMenu;const host=$("workspace");host.append(makeButton("← বিভাগসমূহ","ghost",openAdmissionMenu));const grid=el("div","grid");
    [["Exam","admission-exam","Timed MCQ exam"],["PDF","admission-pdf","PDF file upload"],["Class","admission-class","Video class embed"]].forEach(([name,key,desc])=>{const b=el("button","tile");b.type="button";b.append(el("span","ico",name==="Exam"?"✎":name==="PDF"?"▤":"▷"),el("span","",name),el("small","",desc));b.addEventListener("click",()=>{
      if(key==="admission-exam")openMCQManager("admission",group);
      if(key==="admission-pdf")openListManager({area:key,table:"admission_sheets",title:"Admission • PDF",description:"নতুন PDF, Thumbnail ও Title যুক্ত করো।",folder:"admission-pdf",filter:{group_key:group},orderBy:"sort_order",fields:[{key:"title",label:"PDF Title",required:true},{key:"caption",label:"Description",type:"textarea"},{key:"thumbnail_url",label:"PDF Thumbnail",type:"file",accept:"image/*",required:true},{key:"pdf_url",label:"PDF Upload",type:"file",accept:"application/pdf",required:true},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["thumbnail_url","pdf_url"],itemSub:r=>r.pdf_url?"PDF যুক্ত আছে":"PDF নেই",backLabel:"Admission Options",onBack:()=>openAdmissionOptions(group,label)});
      if(key==="admission-class")openListManager({area:key,table:"admission_classes",title:"Admission • Classes",description:"ভিডিও embed ও thumbnail দিয়ে ক্লাস পোস্ট করো।",folder:"admission-classes",filter:{group_key:group},orderBy:"sort_order",fields:[{key:"title",label:"Class Title",required:true},{key:"description",label:"Description",type:"textarea"},{key:"thumbnail_url",label:"Select Post Thumbnail",type:"file",accept:"image/*",required:true},{key:"youtube_url",label:"Embed Video (YouTube URL)",required:true},{key:"teacher_name",label:"Teacher Name"},{key:"teacher_photo_url",label:"Teacher Photo",type:"file",accept:"image/*"},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["thumbnail_url","teacher_photo_url"],backLabel:"Admission Options",onBack:()=>openAdmissionOptions(group,label)});
    });grid.append(b)});host.append(grid);
  }

  async function openFreeHomeManager() {
    openListManager({area:"free-home",table:"free_videos",title:"Homepage • Free Classes",description:"SSC/HSC বেছে YouTube video যোগ করো। স্টুডেন্টরা কার্ডে ক্লিক করলে ভিডিও ও Comments page খুলবে।",filter:{is_homepage:true},orderBy:"sort_order",folder:"homepage-free-classes",fields:[{key:"batch",label:"Select Class",type:"select",options:[["ssc","SSC"],["hsc","HSC"]],required:true},{key:"title",label:"Video Title",required:true},{key:"youtube_url",label:"Embed Video (YouTube URL)",required:true,validate:videoError},{key:"thumbnail_url",label:"Post Thumbnail",type:"file",accept:"image/*"},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],transform:(p)=>({is_homepage:true,chapter_id:null}),fileKeys:["thumbnail_url"]});
  }
  async function openBanners() {
    openListManager({area:"banners",table:"banners",title:"Banner Management",description:"নতুন banner upload করলে Homepage-এর একদম শুরুর slider-এ দেখাবে।",orderBy:"sort_order",folder:"banners",fields:[{key:"alt_text",label:"Banner Name / Alt Text",required:true},{key:"image_url",label:"Select Banner Image",type:"file",accept:"image/*",required:true},{key:"link_url",label:"Optional Link URL",placeholder:"https://..."},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["image_url"]});
  }
  async function openTeachers() {
    openListManager({area:"teachers",table:"cma_teachers",title:"Teacher Management",description:"Photo, Name, Subject ও Community User ID দাও — Teacher নিজে থেকেই Homepage ও Teachers page দুই জায়গায় চলে যাবে।",orderBy:"sort_order",folder:"teachers",active:false,fields:[{key:"photo_url",label:"Teacher Photo",type:"file",accept:"image/*",required:true},{key:"name",label:"Teacher Name",required:true},{key:"subject",label:"Subject",required:true},{key:"community_user_id",label:"Community User ID",placeholder:"না থাকলে ফাঁকা রাখো",validate:v=>!v||/^[0-9a-f]{8}$/i.test(v)||UUID.test(v)?"":"Community User ID সঠিক নয়। Profile-এর ৮ অক্ষরের Member ID দাও, অথবা ফাঁকা রাখো।",resolve:async v=>{if(!v||UUID.test(v))return v;const found=await findProfiles(v);if(found.length!==1)throw new Error("এই Member ID-এর কোনো user পাওয়া যায়নি।");return found[0].user_id;}}],transform:(p,record)=>Object.assign({show_on_homepage:true,show_on_teachers_page:true,is_active:true,community_user_id:p.community_user_id||null},record?{}:{sort_order:0}),fileKeys:["photo_url"],itemTitle:r=>r.name,itemSub:r=>r.subject||""});
  }
  const videoError = v => window.CMAVideo.parse(v) ? "" : "ভিডিও লিংকটি চেনা যাচ্ছে না। YouTube ভিডিওর Share → Copy link থেকে লিংক দাও (Channel লিংক নয়)।";
  async function openStories() {
    openListManager({area:"stories",table:"student_stories",title:"শিক্ষার্থীরা যা বলছে",description:"YouTube video embed করো; ভিডিওটি Homepage testimonial carousel-এ দেখাবে।",orderBy:"sort_order",folder:"student-stories",fields:[{key:"title",label:"Story Title",required:true},{key:"student_name",label:"Student Name"},{key:"class_label",label:"Class / Batch"},{key:"video_url",label:"Video Embed URL",required:true,validate:videoError},{key:"thumbnail_url",label:"Video Thumbnail (optional)",type:"file",accept:"image/*"},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["thumbnail_url"],itemSub:r=>[r.student_name,r.class_label].filter(Boolean).join(" • ")});
  }

  // Guide hierarchy: Guide post -> guide_items (Subjects) -> guide_chapters (Chapters + PDF)
  async function openGuides() {
    openListManager({area:"guides",table:"guide_posts",title:"Guide Management",description:"Guide নাম ও Thumbnail তৈরি করো; এরপর Subject, Chapter এবং PDF যোগ করো।",orderBy:"sort_order",folder:"guide",fields:[{key:"title",label:"Select Name / Guide Title",required:true},{key:"description",label:"Description",type:"textarea"},{key:"image_url",label:"Guide Thumbnail",type:"file",accept:"image/*",required:true},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["image_url"],beforeDelete:async post=>{const {data:subjects,error}=await db().from("guide_items").select("id,image_url,pdf_url").eq("post_id",post.id);if(error)throw error;for(const subject of (subjects||[])){const {data:chapters,error:ce}=await db().from("guide_chapters").select("image_url,pdf_url").eq("subject_id",subject.id);if(ce)throw ce;for(const ch of (chapters||[])){await removeFile(ch.image_url);await removeFile(ch.pdf_url);}const {error:de}=await db().from("guide_chapters").delete().eq("subject_id",subject.id);if(de)throw de;await removeFile(subject.image_url);await removeFile(subject.pdf_url);}const {error:di}=await db().from("guide_items").delete().eq("post_id",post.id);if(di)throw di;},childAction:{label:"Subjects",run:post=>openGuideSubjects(post)}});
  }
  async function openGuideSubjects(post) {
    openListManager({area:"guide-subjects",table:"guide_items",title:"Guide • "+post.title+" • Subjects",description:"এই Guide-এর subject name ও thumbnail যোগ করো।",filter:{post_id:post.id},orderBy:"sort_order",folder:"guide-subjects",fields:[{key:"title",label:"Subject Name",required:true},{key:"description",label:"Description",type:"textarea"},{key:"image_url",label:"Subject Thumbnail",type:"file",accept:"image/*",required:true},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["image_url"],beforeDelete:async subject=>{const {data:chapters,error}=await db().from("guide_chapters").select("image_url,pdf_url").eq("subject_id",subject.id);if(error)throw error;for(const ch of (chapters||[])){await removeFile(ch.image_url);await removeFile(ch.pdf_url);}const {error:de}=await db().from("guide_chapters").delete().eq("subject_id",subject.id);if(de)throw de;},childAction:{label:"Chapters",run:subject=>openGuideChapters(post,subject)},backLabel:"Guide List",onBack:openGuides});
  }
  async function openGuideChapters(post,subject) {
    openListManager({area:"guide-chapters",table:"guide_chapters",title:"Guide • "+subject.title+" • Chapters",description:"Chapter Name, Thumbnail এবং PDF ফাইল যোগ করো।",filter:{subject_id:subject.id},orderBy:"sort_order",folder:"guide-chapters",fields:[{key:"title",label:"Chapter Name",required:true},{key:"description",label:"Description",type:"textarea"},{key:"image_url",label:"Chapter Thumbnail",type:"file",accept:"image/*",required:true},{key:"pdf_url",label:"PDF Upload",type:"file",accept:"application/pdf",required:true},{key:"sort_order",label:"Sort Order",type:"number",defaultValue:0}],fileKeys:["image_url","pdf_url"],itemSub:r=>r.pdf_url?"PDF যুক্ত আছে":"PDF যুক্ত হয়নি",backLabel:"Subject List",onBack:()=>openGuideSubjects(post)});
  }

  // ---------- Community user খোঁজা: Member ID (8), পুরো ID অথবা নাম ----------
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const memberId = id => String(id || "").slice(0, 8).toUpperCase();
  async function findProfiles(text) {
    const term = String(text || "").trim();
    let query = db().from("cma_community_profiles").select("user_id,full_name,avatar_url,institution");
    if (UUID.test(term)) query = query.eq("user_id", term.toLowerCase());
    else if (/^[0-9a-f]{8}$/i.test(term)) {
      const low = term.toLowerCase();
      query = query.gte("user_id", low + "-0000-0000-0000-000000000000").lte("user_id", low + "-ffff-ffff-ffff-ffffffffffff");
    } else query = query.ilike("full_name", "%" + term.replace(/[%_\\]/g, "\\$&") + "%");
    const { data, error } = await query.limit(30);
    if (error) throw error;
    return data || [];
  }
  async function profilesById(ids) {
    const map = {};
    if (!ids.length) return map;
    const { data, error } = await db().from("cma_community_profiles").select("user_id,full_name,avatar_url,institution").in("user_id", ids);
    if (error) throw error;
    (data || []).forEach(p => { map[p.user_id] = p; });
    return map;
  }
  // Member ID-te chaple oi user-er Community profile khule
  function memberLink(userId) {
    const a = el("a", "member-link", memberId(userId));
    a.href = "./?page=community-profile&userId=" + encodeURIComponent(userId);
    a.title = "Community profile দেখো";
    return a;
  }
  const nameOf = p => (p && p.full_name) || "নাম নেই";
  const setupHint = error => /cma_exam_results|schema cache|does not exist|row-level security/i.test(error.message || "")
    ? " (Supabase-এ supabase/admin-history-permission.sql run করা হয়েছে কি না দেখো।)" : "";
  function searchBar(placeholder, onSearch) {
    const form = el("form", "field"); const input = textControl("", placeholder, "search");
    const button = el("button", "btn small", "খোঁজো"); button.type = "submit";
    form.append(input, button);
    form.addEventListener("submit", event => { event.preventDefault(); onSearch(); });
    return { form, input };
  }
  function userRow(profile, userId, lines) {
    const item = el("article", "item");
    if (profile && profile.avatar_url && safeUrl(profile.avatar_url)) { const im = el("img"); im.src = profile.avatar_url; im.alt = ""; item.append(im); }
    const info = el("div", "info"); const idLine = el("small", "", "Member ID: "); idLine.append(memberLink(userId));
    info.append(el("b", "", nameOf(profile)), idLine);
    lines.forEach(line => info.append(el("small", "", line)));
    item.append(info); return item;
  }

  // ---------- Exam History ----------
  async function openExamHistory(state) {
    const view = state || { section: "", term: "", limit: 50 };
    setWorkspace("Exam History", "কে কোন section থেকে পরীক্ষা দিয়েছে ও কত পেয়েছে। কার্ডের “Result Sheet” চাপলে সব উত্তর দেখা যাবে।");
    const host = $("workspace");
    const sections = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Admission","Online Examination SSC","Online Examination HSC"];
    const select = selectControl(sections.map(s => [s, s]), view.section, false);
    const all = el("option", "", "সব Section"); all.value = ""; select.prepend(all); select.value = view.section;
    addField(host, "Section", select);
    const search = searchBar("নাম বা Member ID", () => { view.term = search.input.value.trim(); view.limit = 50; load(); });
    search.input.value = view.term; host.append(search.form);
    const list = el("div"); host.append(list);
    select.addEventListener("change", () => { view.section = select.value; view.limit = 50; load(); });

    let ticket = 0;
    async function load() {
      const mine = ++ticket;
      list.innerHTML = ""; list.append(el("div", "loading", "লোড হচ্ছে…"));
      try {
        let query = db().from("cma_exam_results").select("*").order("created_at", { ascending: false });
        if (view.section) query = query.eq("section", view.section);
        if (view.term) {
          const found = await findProfiles(view.term);
          query = query.in("user_id", found.map(p => p.user_id));
        }
        const { data, error } = await query.limit(view.limit);
        if (error) throw error;
        const rows = data || [];
        const people = await profilesById([...new Set(rows.map(r => r.user_id))]);
        if (mine !== ticket) return;
        list.innerHTML = "";
        if (!rows.length) { list.append(el("div", "empty", "কোনো পরীক্ষার result পাওয়া যায়নি।")); return; }
        rows.forEach(r => {
          const item = userRow(people[r.user_id], r.user_id, [
            r.section + " • " + r.exam_title,
            "পেয়েছে " + r.correct + "/" + r.total + " • " + new Date(r.created_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })
          ]);
          const acts = el("div", "acts");
          acts.append(makeButton("Result Sheet", "soft small", () => openResultSheet(r, people[r.user_id], view)));
          item.append(acts); list.append(item);
        });
        if (rows.length === view.limit) list.append(makeButton("আরও দেখো", "ghost full", () => { view.limit += 50; load(); }));
      } catch (error) {
        if (mine !== ticket) return;
        list.innerHTML = ""; list.append(el("div", "empty", "ডেটা লোড করা যায়নি: " + error.message + setupHint(error)));
      }
    }
    await load();
  }
  function openResultSheet(r, profile, view) {
    setWorkspace("Result Sheet", r.section + " • " + r.exam_title);
    goUp = () => openExamHistory(view);
    const host = $("workspace");
    host.append(makeButton("← Exam History", "ghost", goUp));
    const summary = el("section", "qcard");
    [["নাম", nameOf(profile)], ["Member ID", memberLink(r.user_id)], ["Section", r.section], ["Exam", r.exam_title],
     ["Score", r.correct + " / " + r.total + " (" + Math.round(r.correct * 100 / r.total) + "%)"],
     ["সঠিক • ভুল • বাদ", r.correct + " • " + r.wrong + " • " + r.skipped],
     ["সময় লেগেছে", Math.floor(r.seconds / 60) + " মিনিট " + (r.seconds % 60) + " সেকেন্ড"],
     ["তারিখ", new Date(r.created_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })]
    ].forEach(([k, v]) => { const p = el("p"); const value = el("b"); value.append(v); p.append(el("span", "tiny", k + ": "), value); summary.append(p); });
    host.append(summary);
    (Array.isArray(r.answers) ? r.answers : []).forEach((a, i) => {
      const text = indexes => (indexes || []).map(n => safeText((a.options || [])[n])).join("; ");
      const right = (a.chosen || []).length && [...a.chosen].sort().join() === [...(a.correct || [])].sort().join();
      const card = el("section", "qcard");
      card.append(el("b", "", (i + 1) + ". " + safeText(a.question)));
      card.append(el("p", "", (!(a.chosen || []).length ? "— উত্তর দেয়নি" : (right ? "✅ " : "❌ ") + "উত্তর: " + text(a.chosen))));
      if (!right) card.append(el("p", "tiny", "সঠিক উত্তর: " + text(a.correct)));
      host.append(card);
    });
  }

  // ---------- Permission ----------
  const ROLE_NAMES = { admin: "Admin", creator: "Creator", developer: "Developer", moderator: "Moderator" };
  async function openPermissions() {
    setWorkspace("Permission", "User খুঁজে Admin বা Creator করো — তারা Community-র Creator Panel-এ post করতে পারবে।");
    const host = $("workspace");
    const search = searchBar("Member ID বা নাম লিখো", () => runSearch());
    host.append(search.form);
    const results = el("div"); const current = el("div");
    host.append(results, el("div", "divider"), el("h3", "", "যাদের permission আছে"), current);
    let roles = {};

    async function setRole(userId, profile, role) {
      const old = roles[userId];
      const who = nameOf(profile) + " (" + memberId(userId) + ")";
      if (!confirm(role ? who + " কে " + ROLE_NAMES[role] + " করবে?" : who + " এর " + (ROLE_NAMES[old] || old) + " permission সরাবে?")) return;
      try {
        let result;
        const table = db().from("community_creator_roles");
        if (!role) result = await table.delete().eq("user_id", userId);
        else if (old) result = await table.update({ role }).eq("user_id", userId);
        else result = await table.insert({ user_id: userId, role });
        if (result.error) throw result.error;
        await loadRoles();
        if (search.input.value.trim()) await runSearch();
        notify("Permission সেভ হয়েছে।", "ok");
      } catch (error) { notify("সেভ হয়নি: " + error.message + setupHint(error), "err"); }
    }
    function row(profile, userId) {
      const role = roles[userId];
      const item = userRow(profile, userId, [role ? "এখন: " + (ROLE_NAMES[role] || role) : "কোনো permission নেই"]);
      const acts = el("div", "acts");
      if (role !== "admin") acts.append(makeButton("Admin করো", "soft small", () => setRole(userId, profile, "admin")));
      if (role !== "creator") acts.append(makeButton("Creator করো", "soft small", () => setRole(userId, profile, "creator")));
      if (role) acts.append(makeButton("সরাও", "danger small", () => setRole(userId, profile, null)));
      item.append(acts); return item;
    }
    async function loadRoles() {
      try {
        const { data, error } = await db().from("community_creator_roles").select("user_id,role");
        if (error) throw error;
        roles = {}; (data || []).forEach(r => { roles[r.user_id] = r.role; });
        const people = await profilesById(Object.keys(roles));
        current.innerHTML = "";
        if (!Object.keys(roles).length) current.append(el("div", "empty", "এখনো কাউকে permission দেওয়া হয়নি।"));
        Object.keys(roles).forEach(id => current.append(row(people[id], id)));
      } catch (error) { current.innerHTML = ""; current.append(el("div", "empty", "ডেটা লোড করা যায়নি: " + error.message + setupHint(error))); }
    }
    async function runSearch() {
      const term = search.input.value.trim();
      results.innerHTML = "";
      if (!term) return;
      results.append(el("div", "loading", "খোঁজা হচ্ছে…"));
      try {
        const found = await findProfiles(term);
        results.innerHTML = "";
        if (!found.length) results.append(el("div", "empty", "কোনো user পাওয়া যায়নি। User-কে আগে একবার Community profile খুলতে হবে।"));
        found.forEach(p => results.append(row(p, p.user_id)));
      } catch (error) { results.innerHTML = ""; results.append(el("div", "empty", "খোঁজা যায়নি: " + error.message)); }
    }
    await loadRoles();
  }

  $("workspace").addEventListener("click", event => {
    const tile=event.target.closest("[data-area]"); if(!tile)return;
    const key=tile.dataset.area; currentArea=key;
    if(key==="banners")openBanners();
    if(key==="class-exams")openMCQManager("class");
    if(key==="game-changer")openGameChanger();
    if(key==="free-home")openFreeHomeManager();
    if(key==="teachers")openTeachers();
    if(key==="stories")openStories();
    if(key==="guides")openGuides();
    if(key==="exam-history")openExamHistory();
    if(key==="permissions")openPermissions();
  });
  document.addEventListener("click", event => {
    const tile=event.target.closest("[data-area]"); if(!tile)return;
    const key=tile.dataset.area; currentArea=key;
    if(key==="banners")openBanners();
    if(key==="class-exams")openMCQManager("class");
    if(key==="game-changer")openGameChanger();
    if(key==="free-home")openFreeHomeManager();
    if(key==="teachers")openTeachers();
    if(key==="stories")openStories();
    if(key==="guides")openGuides();
    if(key==="exam-history")openExamHistory();
    if(key==="permissions")openPermissions();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
