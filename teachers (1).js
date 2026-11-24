// ==================================================
// CHANGE MAKER ACADEMY
// TEACHERS: ALL TEACHERS LIST + TEACHER PROFILE
//
// Data: Supabase table "cma_teachers" (supabase/cma_teachers.sql)
//   Admin panel theke teacher add/edit hoy, ar ekta teacher ke
//   ekta Community profile er sathe link kora hoy:
//     community_user_id = cma_community_profiles.user_id
//
// Routes (router.js theke call hoy):
//   ?page=teachers                      -> sob teacher (2 column + search)
//   ?page=teachers-profile&id=<id>      -> teacher er profile page
//   Community Profile button            -> ?page=community-profile&userId=<community_user_id>
// ==================================================

(function () {
  "use strict";

  const USER_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4.2 3.8-6.5 7.5-6.5s6.9 2.3 7.5 6.5"/></svg>';

  const COMMUNITY_ICON =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.6c2.6.1 5 1.7 5 4.4"/></svg>';

  const BACK_ICON =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

  let teachersPromise = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
    );
  }

  function safeImage(url) {
    const u = String(url || "").trim();
    return /^(https?:\/\/|\/|\.\/|data:image\/)/i.test(u) ? u : "";
  }

  function profileUrl(teacher) {
    return "?page=teachers-profile&id=" + encodeURIComponent(teacher.id);
  }

  function communityUrl(teacher) {
    return (
      "?page=community-profile&userId=" +
      encodeURIComponent(teacher.community_user_id)
    );
  }

  // ------------------------------------------------
  // DATA
  // ------------------------------------------------

  // supabase-config.js ektu deri te ready hole-o ektu opekkha kore
  async function waitForDb() {
    for (let i = 0; i < 30 && !window.cmaSupabase; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return window.cmaSupabase || null;
  }

  async function fetchTeachers() {
    const db = await waitForDb();
    if (!db) throw new Error("Supabase not ready");

    const { data, error } = await db
      .from("cma_teachers")
      .select(
        "id,name,subject,phone,photo_url,community_user_id,sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const teachers = data || [];

    // Linked Community profile er nam + avatar (photo_url na thakle avatar use hobe)
    const ids = teachers
      .map((t) => t.community_user_id)
      .filter(Boolean);

    if (ids.length) {
      try {
        const { data: profiles } = await db
          .from("cma_community_profiles")
          .select("user_id,full_name,avatar_url")
          .in("user_id", ids);

        const byId = {};
        (profiles || []).forEach((p) => {
          byId[p.user_id] = p;
        });

        teachers.forEach((t) => {
          t.community = byId[t.community_user_id] || null;
        });
      } catch (err) {
        console.warn("Community profile lookup skipped:", err);
      }
    }

    return teachers;
  }

  function loadTeachers() {
    if (!teachersPromise) {
      teachersPromise = fetchTeachers().catch((err) => {
        console.error("Teachers load failed:", err);
        teachersPromise = null;
        return [];
      });
    }
    return teachersPromise;
  }

  function photoOf(teacher) {
    return (
      safeImage(teacher.photo_url) ||
      safeImage(teacher.community && teacher.community.avatar_url)
    );
  }

  function photoHtml(teacher) {
    const url = photoOf(teacher);
    return url
      ? '<img src="' + esc(url) + '" alt="' + esc(teacher.name) + '" loading="lazy">'
      : USER_ICON;
  }

  // ------------------------------------------------
  // STYLES (ekbar inject hoy)
  // ------------------------------------------------

  function injectStyles() {
    if (document.getElementById("cmaTeachersCss")) return;

    const style = document.createElement("style");
    style.id = "cmaTeachersCss";
    style.textContent = `
.cma-tv{max-width:900px;margin:0 auto;padding:4px 0 calc(110px + env(safe-area-inset-bottom));color:var(--ink,#1c2236)}
body.teachers-active #cmaSearch{display:none!important}
.cma-tv .tv-head{display:flex;align-items:center;gap:12px;margin:2px 0 16px}
.cma-tv .tv-back{flex:0 0 44px;width:44px;height:44px;display:grid;place-items:center;border-radius:15px;background:var(--soft,#fff2f1);color:var(--c2,#c4283f);text-decoration:none;box-shadow:inset 0 0 0 1px rgba(231,71,85,.16)}
.cma-tv .tv-back:active{transform:scale(.92)}
.cma-tv .tv-head h1{margin:0;font-size:22px;font-weight:900;line-height:1.2}
.cma-tv .tv-head h1 em{font-style:normal;color:var(--c2,#c4283f)}
.cma-tv .tv-head small{display:block;margin-top:2px;font-size:12.5px;font-weight:700;color:var(--mut,#69728a)}
.cma-tv .tv-cap small.chip{margin-top:5px;padding:3px 11px;border-radius:99px;background:var(--soft,#fff2f1);color:var(--c2,#c4283f);font-weight:700;font-size:12px}
.cma-tv .tv-card.ghost{pointer-events:none}
.cma-tv .tv-card.ghost .tv-cap b{color:#9aa1b3}
.cma-tv h1.tv-title em{font-style:normal;color:var(--c2,#c4283f)}
.cma-tv .tv-search{position:relative;margin:0 0 16px}
.cma-tv .tv-search svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#b8707c;pointer-events:none}
.cma-tv .tv-search input{width:100%;box-sizing:border-box;height:50px;padding:0 16px 0 46px;border:1.5px solid var(--line,#f6dedd);border-radius:16px;background:#fff;font:inherit;font-size:16px;color:inherit;outline:none;box-shadow:0 8px 20px -14px rgba(201,42,68,.5)}
.cma-tv .tv-search input:focus{border-color:#ef4a52;box-shadow:0 0 0 3px rgba(239,74,82,.14)}
.cma-tv .tv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(min-width:760px){.cma-tv .tv-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}
.cma-tv .tv-card{display:flex;flex-direction:column;overflow:hidden;text-decoration:none;color:inherit;background:#fff;border:1px solid var(--line,#f6dedd);border-radius:22px;box-shadow:0 12px 26px -16px rgba(20,35,60,.35);transition:transform .2s}
.cma-tv .tv-card:active{transform:scale(.97)}
.cma-tv .tv-photo{display:grid;place-items:center;aspect-ratio:1/1.05;color:#d9697a;background:linear-gradient(160deg,#ffe3e1,#fff6f4);overflow:hidden}
.cma-tv .tv-photo svg{width:46%;height:auto}
.cma-tv .tv-photo img{width:100%;height:100%;object-fit:cover;display:block}
.cma-tv .tv-cap{display:flex;flex-direction:column;align-items:center;gap:2px;padding:11px 8px 14px;text-align:center}
.cma-tv .tv-cap b{font-size:16px;font-weight:800;line-height:1.3}
.cma-tv .tv-cap small{font-size:13px;color:var(--mut,#69728a)}
.cma-tv .tv-empty{grid-column:1/-1;text-align:center;padding:48px 10px;color:var(--mut,#69728a);font-size:15px}
.cma-tv .tv-prof{max-width:460px;margin:8px auto 0}
.cma-tv .tv-prof-photo{display:grid;place-items:center;aspect-ratio:1/1;border-radius:28px;overflow:hidden;color:#d9697a;background:linear-gradient(160deg,#ffe3e1,#fff6f4);border:1px solid var(--line,#f6dedd);box-shadow:0 18px 34px -20px rgba(20,35,60,.4)}
.cma-tv .tv-prof-photo svg{width:42%;height:auto}
.cma-tv .tv-prof-photo img{width:100%;height:100%;object-fit:cover;display:block}
.cma-tv .tv-prof h2{margin:18px 0 4px;text-align:center;font-size:25px;font-weight:900;line-height:1.25}
.cma-tv .tv-rows{margin-top:16px;background:#fff;border:1px solid var(--line,#f6dedd);border-radius:20px;overflow:hidden}
.cma-tv .tv-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 18px;font-size:16px}
.cma-tv .tv-row+.tv-row{border-top:1px solid var(--line,#f6dedd)}
.cma-tv .tv-row span{color:var(--mut,#69728a);font-weight:700;flex:0 0 auto}
.cma-tv .tv-row b{font-weight:800;text-align:right;min-width:0;overflow-wrap:anywhere}
.cma-tv .tv-row a{color:var(--c2,#c4283f);text-decoration:none}
.cma-tv .tv-blank{display:inline-block;width:150px;max-width:100%;height:1.2em;border-bottom:2px dashed #e3b9bd;vertical-align:bottom}
.cma-tv .tv-comm{display:flex;align-items:center;gap:14px;margin-top:14px;padding:15px 18px;text-decoration:none;color:#fff;border-radius:20px;background:linear-gradient(135deg,#ef4a52,#c92a44);box-shadow:0 14px 26px -12px rgba(201,42,68,.7)}
.cma-tv .tv-comm:active{transform:scale(.98)}
.cma-tv .tv-comm i{flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:rgba(255,255,255,.2)}
.cma-tv .tv-comm span{flex:1;min-width:0}
.cma-tv .tv-comm b{display:block;font-size:16.5px;font-weight:800}
.cma-tv .tv-comm small{display:block;font-size:12.5px;opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cma-tv .tv-comm em{font-style:normal;font-size:20px}
.cma-tv .tv-comm.off{background:#fff;color:var(--mut,#69728a);border:1.5px dashed #e3b9bd;box-shadow:none;pointer-events:none}
.cma-tv .tv-comm.off i{background:var(--soft,#fff2f1);color:#d9697a}
.cma-tv .tv-loading{padding:60px 0;text-align:center;color:var(--mut,#69728a)}
.teacher-photo img{width:100%;height:100%;object-fit:cover;display:block}
`;
    document.head.appendChild(style);
  }

  // ------------------------------------------------
  // PAGES
  // ------------------------------------------------

  function mount(html) {
    const content = document.getElementById("pageContent");
    if (!content) return null;
    content.innerHTML = '<div class="cma-tv">' + html + "</div>";
    return content.firstElementChild;
  }

  function cardHtml(teacher) {
    return (
      '<a class="tv-card" href="' + esc(profileUrl(teacher)) + '">' +
      '<span class="tv-photo">' + photoHtml(teacher) + "</span>" +
      '<span class="tv-cap"><b>' + esc(teacher.name) + "</b>" +
      (teacher.subject ? '<small class="chip">' + esc(teacher.subject) + "</small>" : "") + "</span></a>"
    );
  }

  function ghostCards() {
    const one =
      '<span class="tv-card ghost"><span class="tv-photo">' + USER_ICON + '</span>' +
      '<span class="tv-cap"><b>শিক্ষকের নাম</b><small class="chip">বিষয়</small></span></span>';
    return one.repeat(4);
  }

  async function renderList() {
    setPage("আমাদের শিক্ষক", "Our Teachers", "", "", "?");

    const root = mount('<div class="tv-loading">লোড হচ্ছে...</div>');
    if (!root) return;

    const teachers = await loadTeachers();
    if (!root.isConnected) return; // user onno page e chole gese

    root.innerHTML =
      '<div class="tv-head"><a class="tv-back" href="?" aria-label="Home">' + BACK_ICON + '</a>' +
      '<div><h1>আমাদের <em>শিক্ষক</em></h1><small>' + (teachers.length ? teachers.length + ' জন অভিজ্ঞ শিক্ষক' : 'প্রতিটি বিষয়ে অভিজ্ঞ শিক্ষক') + '</small></div></div>' +
      '<div class="tv-search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input id="tvSearch" type="search" placeholder="শিক্ষকের নাম লিখে খুঁজো..." autocomplete="off"></div>' +
      '<div class="tv-grid" id="tvGrid"></div>';

    const input = root.querySelector("#tvSearch");
    const grid = root.querySelector("#tvGrid");

    function draw() {
      const q = input.value.trim().toLowerCase();
      const list = teachers.filter(
        (t) =>
          !q ||
          String(t.name || "").toLowerCase().includes(q) ||
          String(t.subject || "").toLowerCase().includes(q)
      );

      grid.innerHTML = list.length
        ? list.map(cardHtml).join("")
        : teachers.length
          ? '<div class="tv-empty">কোনো শিক্ষক পাওয়া যায়নি</div>'
          : ghostCards();
    }

    input.addEventListener("input", draw);
    draw();
  }

  async function renderProfile() {
    const id = new URLSearchParams(window.location.search).get("id");

    setPage("শিক্ষকের প্রোফাইল", "Teacher", "", "", "?page=teachers");
    const head =
      '<div class="tv-head"><a class="tv-back" href="?page=teachers" aria-label="Back">' + BACK_ICON + '</a>' +
      '<div><h1>শিক্ষকের <em>প্রোফাইল</em></h1></div></div>';

    const root = mount('<div class="tv-loading">লোড হচ্ছে...</div>');
    if (!root) return;

    const teachers = await loadTeachers();
    if (!root.isConnected) return;

    const t = teachers.find((x) => String(x.id) === String(id));

    if (!t) {
      root.innerHTML = '<div class="tv-empty">শিক্ষককে পাওয়া যায়নি</div>';
      return;
    }

    document.title = t.name + " | Change Maker Academy";

    const phone = String(t.phone || "").trim();

    const community = t.community_user_id
      ? '<a class="tv-comm" href="' + esc(communityUrl(t)) + '">' +
        "<i>" + COMMUNITY_ICON + "</i>" +
        "<span><b>কমিউনিটি প্রোফাইল</b><small>" +
        esc((t.community && t.community.full_name) || "কমিউনিটিতে দেখো") +
        "</small></span><em>→</em></a>"
      : '<div class="tv-comm off"><i>' + COMMUNITY_ICON + "</i>" +
        "<span><b>কমিউনিটি প্রোফাইল</b><small>এখনো যুক্ত করা হয়নি</small></span></div>";

    root.innerHTML =
      head +
      '<div class="tv-prof">' +
      '<div class="tv-prof-photo">' + photoHtml(t) + "</div>" +
      "<h2>" + esc(t.name) + "</h2>" +
      '<div class="tv-rows">' +
      '<div class="tv-row"><span>বিষয়</span><b>' + esc(t.subject) + "</b></div>" +
      '<div class="tv-row"><span>নম্বর</span><b>' +
      (phone
        ? '<a href="tel:' + esc(phone.replace(/[^\d+]/g, "")) + '">' + esc(phone) + "</a>"
        : '<i class="tv-blank"></i>') +
      "</b></div></div>" +
      community +
      "</div>";
  }

  // router.js theke call hoy
  window.renderTeachersPage = function (page) {
    injectStyles();
    window.scrollTo(0, 0);

    if (page === "teachers-profile") {
      renderProfile();
    } else {
      renderList();
    }
  };

  // ------------------------------------------------
  // HOMEPAGE CAROUSEL: real teacher ashle placeholder card soriye dey
  // ------------------------------------------------

  async function fillHomeCarousel() {
    const el = document.getElementById("cmaTeacherCarousel");
    if (!el) return;

    const teachers = (await loadTeachers()).slice(0, 10);
    if (!teachers.length) return; // placeholder card gulo thakbe

    injectStyles();

    el.innerHTML = teachers
      .map(
        (t) =>
          '<a class="cma-teacher-card" href="' + esc(profileUrl(t)) + '">' +
          '<span class="teacher-photo">' + photoHtml(t) + "</span>" +
          '<span class="teacher-caption"><b>' + esc(t.name) + "</b>" +
          "<small>" + esc(t.subject) + "</small></span></a>"
      )
      .join("");

    if (typeof window.CMA_refreshTeachers === "function") {
      window.CMA_refreshTeachers();
    }
  }

  function start() {
    // supabase-config.js age load hoy; tobuo ektu opekkha kori
    let tries = 0;
    (function wait() {
      if (window.cmaSupabase || tries++ > 20) {
        fillHomeCarousel();
      } else {
        setTimeout(wait, 150);
      }
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
