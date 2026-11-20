/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY SEARCH MODULE
   Search members and posts
========================================= */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;

    if (!Core || !Core.db) {
        console.error("Community Core is not loaded.");
        return;
    }

    const db = Core.db;

    const MIN_LENGTH = 2;
    const LIMIT = 20;
    const DEBOUNCE_MS = 400;

    /* ---------- helpers ---------- */

    function esc(value) {
        const text = String(value == null ? "" : value);

        if (typeof Core.escapeHTML === "function") {
            return Core.escapeHTML(text);
        }

        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Remove characters that have a special meaning in database filters
    function cleanQuery(value) {
        return String(value || "")
            .replace(/[%,()\\*_]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function timeAgo(iso) {
        const date = new Date(iso);

        if (isNaN(date.getTime())) return "";

        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return "Just now";

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours + (hours === 1 ? " hour ago" : " hours ago");
        }

        const days = Math.floor(hours / 24);
        if (days < 30) {
            return days + (days === 1 ? " day ago" : " days ago");
        }

        return date.toLocaleDateString();
    }

    // Escape text, then wrap the searched words in <mark>
    function highlight(text, query) {
        const source = String(text == null ? "" : text);
        const needle = String(query || "").trim();

        if (!needle) return esc(source);

        const lower = source.toLowerCase();
        const lowerNeedle = needle.toLowerCase();

        let output = "";
        let index = 0;

        while (index <= source.length) {
            const found = lower.indexOf(lowerNeedle, index);

            if (found === -1) {
                output += esc(source.slice(index));
                break;
            }

            output += esc(source.slice(index, found));
            output +=
                '<mark class="cma-search-mark">' +
                esc(source.slice(found, found + needle.length)) +
                "</mark>";

            index = found + needle.length;
        }

        return output;
    }

    function excerpt(text, query) {
        const source = String(text || "");
        const maxLength = 220;

        if (source.length <= maxLength) return source;

        const found = source
            .toLowerCase()
            .indexOf(String(query || "").trim().toLowerCase());

        const start = found > 60 ? found - 60 : 0;
        const piece = source.slice(start, start + maxLength);

        return (start > 0 ? "… " : "") +
            piece +
            (start + maxLength < source.length ? " …" : "");
    }

    function avatarHTML(profile, size) {
        const name = profile?.full_name || "Member";
        const initial = esc(name.trim().charAt(0).toUpperCase() || "M");
        const url = profile?.avatar_url;

        if (url) {
            return (
                '<img class="cma-search-avatar" src="' + esc(url) +
                '" alt="" loading="lazy"' +
                ' style="width:' + size + "px;height:" + size + 'px;">'
            );
        }

        return (
            '<div class="cma-search-avatar cma-search-avatar-letter"' +
            ' style="width:' + size + "px;height:" + size + 'px;">' +
            initial + "</div>"
        );
    }

    /* ---------- styles (added once) ---------- */

    function ensureStyles() {
        if (document.getElementById("cma-search-styles")) return;

        const style = document.createElement("style");
        style.id = "cma-search-styles";

        style.textContent = `
.cma-search-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 14px;
}

.cma-search-back {
  width: 40px;
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--cma-border, #1F3263);
  border-radius: 12px;
  background: var(--cma-card, #0E1A36);
  color: var(--cma-white, #FFFFFF);
  cursor: pointer;
}

.cma-search-title {
  margin: 0;
  color: var(--cma-white, #FFFFFF);
  font-size: 20px;
  font-weight: 800;
}

.cma-search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.cma-search-input {
  flex: 1;
  min-width: 0;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid var(--cma-border, #1F3263);
  border-radius: 14px;
  outline: none;
  background: var(--cma-panel, #0F1D3F);
  color: var(--cma-white, #FFFFFF);
  font-family: inherit;
  font-size: 14px;
}

.cma-search-input::placeholder {
  color: var(--cma-muted, #9FB0D0);
}

.cma-search-input:focus {
  border-color: var(--cma-green, #3B82F6);
}

.cma-search-submit {
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #4C93FF, #2563EB);
  color: #FFFFFF;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.cma-search-submit:active {
  opacity: 0.8;
}

.cma-search-tabs {
  display: flex;
  border-bottom: 1px solid var(--cma-border, #1F3263);
  margin-bottom: 14px;
}

.cma-search-tab {
  flex: 1;
  padding: 12px 0;
  margin-bottom: -1px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--cma-muted, #9FB0D0);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.cma-search-tab.active {
  color: var(--cma-green, #3B82F6);
  border-bottom-color: var(--cma-green, #3B82F6);
}

.cma-search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cma-search-message {
  padding: 30px 10px;
  text-align: center;
  color: var(--cma-muted, #9FB0D0);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.cma-search-item {
  padding: 14px;
  border: 1px solid var(--cma-border, #1F3263);
  border-radius: 17px;
  background: var(--cma-card, #0E1A36);
  color: var(--cma-white, #FFFFFF);
}

.cma-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cma-search-avatar {
  flex: none;
  border-radius: 50%;
  object-fit: cover;
}

.cma-search-avatar-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cma-avatar, #1D4FBF);
  color: #FFFFFF;
  font-weight: 800;
}

.cma-search-info {
  flex: 1;
  min-width: 0;
}

.cma-search-name {
  display: block;
  color: var(--cma-white, #FFFFFF);
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.cma-search-sub {
  display: block;
  margin-top: 2px;
  color: var(--cma-muted, #9FB0D0);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.cma-search-open {
  flex: none;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--cma-border, #1F3263);
  border-radius: 12px;
  background: transparent;
  color: var(--cma-mint, #7DB1FF);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.cma-search-text {
  margin: 12px 0 0;
  color: var(--cma-white, #FFFFFF);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.cma-search-image {
  display: block;
  width: 100%;
  max-height: 260px;
  margin-top: 12px;
  object-fit: cover;
  border-radius: 12px;
}

.cma-search-mark {
  padding: 0 2px;
  border-radius: 4px;
  background: rgba(59,130,246, 0.35);
  color: inherit;
}
`;

        document.head.appendChild(style);
    }

    /* ---------- module ---------- */

    const Search = {

        state: null,

        resetState() {
            this.state = {
                query: "",
                tab: "members",
                token: 0,
                timer: null,
                members: [],
                posts: [],
                status: "idle"   // idle | short | loading | done | error
            };
        },

        async render(root) {
            root = root || Core.getRoot?.();
            if (!root) return;

            ensureStyles();
            this.resetState();

            root.innerHTML = `
                <main class="cma-community cma-search-page">

                    <header class="cma-search-header">
                        <button type="button" class="cma-search-back"
                            data-cma-search-back aria-label="Back">
                            <svg viewBox="0 0 24 24" width="22" height="22"
                                fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" aria-hidden="true">
                                <path d="M15 5l-7 7 7 7"/>
                            </svg>
                        </button>
                        <h1 class="cma-search-title">Search</h1>
                    </header>

                    <form class="cma-search-form" role="search"
                        id="cmaSearchForm">
                        <input
                            class="cma-search-input"
                            id="cmaSearchInput"
                            type="search"
                            placeholder="Search members or posts..."
                            aria-label="Search members or posts"
                            autocomplete="off"
                            maxlength="60">
                        <button class="cma-search-submit" type="submit">
                            Search
                        </button>
                    </form>

                    <div class="cma-search-tabs" id="cmaSearchTabs">
                        <button type="button"
                            class="cma-search-tab active"
                            data-cma-search-tab="members">Members</button>
                        <button type="button"
                            class="cma-search-tab"
                            data-cma-search-tab="posts">Posts</button>
                    </div>

                    <section class="cma-search-results"
                        id="cmaSearchResults"
                        aria-live="polite"></section>

                </main>
            `;

            const page = root.querySelector(".cma-search-page");
            this.bind(page);
            this.renderResults(page);

            const input = page.querySelector("#cmaSearchInput");
            if (input) input.focus();

            // This page has no top bar: remove it if another script added it
            setTimeout(function () {
                root.querySelectorAll("[data-cma-topbar]")
                    .forEach(function (bar) { bar.remove(); });
            }, 50);
        },

        bind(page) {
            const form = page.querySelector("#cmaSearchForm");
            const input = page.querySelector("#cmaSearchInput");

            form.addEventListener("submit", event => {
                event.preventDefault();
                clearTimeout(this.state.timer);
                this.run(page, input.value);
            });

            input.addEventListener("input", () => {
                clearTimeout(this.state.timer);

                this.state.timer = setTimeout(() => {
                    this.run(page, input.value);
                }, DEBOUNCE_MS);
            });

            page.addEventListener("click", event => {
                const tab = event.target.closest("[data-cma-search-tab]");

                if (tab) {
                    this.state.tab = tab.dataset.cmaSearchTab;
                    this.renderResults(page);
                    return;
                }

                if (event.target.closest("[data-cma-search-back]")) {
                    window.dispatchEvent(new CustomEvent("cma:navigate", {
                        detail: { page: "home" }
                    }));
                    return;
                }

                const open = event.target.closest("[data-cma-search-open]");

                if (open) {
                    window.dispatchEvent(new CustomEvent("cma:navigate", {
                        detail: {
                            page: "profile",
                            userId: open.dataset.cmaSearchOpen
                        }
                    }));
                }
            });
        },

        async run(page, rawValue) {
            const typed = String(rawValue || "").replace(/\s+/g, " ").trim();
            const safe = cleanQuery(typed);
            const state = this.state;

            state.query = typed;
            state.token += 1;
            const token = state.token;

            if (safe.length < MIN_LENGTH) {
                state.members = [];
                state.posts = [];
                state.status = typed ? "short" : "idle";
                this.renderResults(page);
                return;
            }

            state.status = "loading";
            this.renderResults(page);

            try {
                const [members, posts] = await Promise.all([
                    this.findMembers(safe),
                    this.findPosts(safe)
                ]);

                // A newer search started while we were waiting
                if (token !== this.state.token) return;

                state.members = members;
                state.posts = posts;
                state.status = "done";

            } catch (error) {
                console.error("Community search error:", error);

                if (token !== this.state.token) return;

                state.members = [];
                state.posts = [];
                state.status = "error";
            }

            this.renderResults(page);
        },

        async findMembers(safe) {
            const { data, error } = await db
                .from("cma_community_profiles")
                .select(
                    "user_id, full_name, short_description, institution, avatar_url"
                )
                .or(
                    "full_name.ilike.%" + safe + "%," +
                    "institution.ilike.%" + safe + "%"
                )
                .limit(LIMIT);

            if (error) throw error;

            return data || [];
        },

        async findPosts(safe) {
            const { data, error } = await db
                .from("cma_community_posts")
                .select("id, user_id, content, image_url, created_at")
                .ilike("content", "%" + safe + "%")
                .order("created_at", { ascending: false })
                .limit(LIMIT);

            if (error) throw error;

            const posts = data || [];

            if (!posts.length) return posts;

            const ids = [...new Set(posts.map(post => post.user_id))]
                .filter(Boolean);

            const { data: profiles, error: profileError } = await db
                .from("cma_community_profiles")
                .select("user_id, full_name, avatar_url")
                .in("user_id", ids);

            if (profileError) {
                console.error("Search profile lookup error:", profileError);
            }

            const map = {};
            (profiles || []).forEach(profile => {
                map[profile.user_id] = profile;
            });

            posts.forEach(post => {
                post.author = map[post.user_id] || null;
            });

            return posts;
        },

        renderResults(page) {
            const box = page.querySelector("#cmaSearchResults");
            const state = this.state;

            if (!box) return;

            // tab labels with counts
            page.querySelectorAll("[data-cma-search-tab]").forEach(button => {
                const tab = button.dataset.cmaSearchTab;
                const label = tab === "members" ? "Members" : "Posts";
                const count = state.status === "done"
                    ? " (" + state[tab].length + ")"
                    : "";

                button.textContent = label + count;
                button.classList.toggle("active", tab === state.tab);
            });

            if (state.status === "idle") {
                box.innerHTML =
                    '<p class="cma-search-message">' +
                    "Search for community members or posts.</p>";
                return;
            }

            if (state.status === "short") {
                box.innerHTML =
                    '<p class="cma-search-message">' +
                    "Type at least " + MIN_LENGTH +
                    " characters to search.</p>";
                return;
            }

            if (state.status === "loading") {
                box.innerHTML =
                    '<p class="cma-search-message">Searching...</p>';
                return;
            }

            if (state.status === "error") {
                box.innerHTML =
                    '<p class="cma-search-message">' +
                    "Search could not be completed. " +
                    "Please try again.</p>";
                return;
            }

            const list = state[state.tab];

            if (!list.length) {
                box.innerHTML =
                    '<p class="cma-search-message">No ' +
                    (state.tab === "members" ? "members" : "posts") +
                    " found for \u201C" + esc(state.query) +
                    "\u201D.</p>";
                return;
            }

            box.innerHTML = state.tab === "members"
                ? list.map(item => this.memberHTML(item)).join("")
                : list.map(item => this.postHTML(item)).join("");
        },

        memberHTML(profile) {
            const name = profile.full_name || "Member";
            const sub = profile.institution || profile.short_description || "";

            const currentUser = Core.getCurrentUser?.();
            const isYou = currentUser?.id && currentUser.id === profile.user_id;

            return `
                <article class="cma-search-item">
                    <div class="cma-search-row">
                        ${avatarHTML(profile, 46)}
                        <div class="cma-search-info">
                            <span class="cma-search-name">
                                ${highlight(name, this.state.query)}${isYou ? " (You)" : ""}
                            </span>
                            ${sub
                                ? '<span class="cma-search-sub">' +
                                  highlight(sub, this.state.query) +
                                  "</span>"
                                : ""}
                        </div>
                        <button type="button" class="cma-search-open"
                            data-cma-search-open="${esc(profile.user_id)}">
                            View Profile
                        </button>
                    </div>
                </article>
            `;
        },

        postHTML(post) {
            const name = post.author?.full_name || "Member";
            const text = excerpt(post.content, this.state.query);

            return `
                <article class="cma-search-item">
                    <div class="cma-search-row">
                        ${avatarHTML(post.author, 38)}
                        <div class="cma-search-info">
                            <span class="cma-search-name">${esc(name)}</span>
                            <span class="cma-search-sub">
                                ${esc(timeAgo(post.created_at))}
                            </span>
                        </div>
                        <button type="button" class="cma-search-open"
                            data-cma-search-open="${esc(post.user_id)}">
                            View Profile
                        </button>
                    </div>

                    <p class="cma-search-text">${highlight(text, this.state.query)}</p>

                    ${post.image_url
                        ? '<img class="cma-search-image" src="' +
                          esc(post.image_url) +
                          '" alt="" loading="lazy">'
                        : ""}
                </article>
            `;
        }
    };

    Search.resetState();

    window.CMACommunitySearch = Search;
})();
