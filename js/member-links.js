/* =========================================================
   CHANGE MAKER ACADEMY — CLICKABLE MEMBER ID
   App-er jekhanei Member ID (8 okkhor) lekha thakuk — profile, post,
   comment, message — seta link hoye jay ar click korle oi user-er
   Community profile khule. Shudhu sotti-kar user thaklei link hoy,
   tai onno sadharon number/lekha link hoy na.
========================================================= */
(function () {
  "use strict";

  // 8 hex character; boro UUID ba URL-er ongsho hole na
  const PATTERN = /(?<![\w\-\/=.@#])[0-9a-f]{8}(?![\w\-\/=@]|\.\w)/gi;
  const SKIP = "a,button,input,textarea,select,option,script,style,svg,[contenteditable]:not([contenteditable='false'])";
  const users = new Map(); // id -> Promise<user_id | null>

  function lookup(id) {
    const key = id.toLowerCase();
    if (!users.has(key)) {
      users.set(key, (async () => {
        const { data, error } = await window.cmaSupabase
          .from("cma_community_profiles")
          .select("user_id")
          .gte("user_id", key + "-0000-0000-0000-000000000000")
          .lte("user_id", key + "-ffff-ffff-ffff-ffffffffffff")
          .limit(2);
        if (error) throw error;
        return data && data.length === 1 ? data[0].user_id : null;
      })().catch(() => { users.delete(key); return null; }));
    }
    return users.get(key);
  }

  async function linkNode(node) {
    const text = node.nodeValue;
    const matches = [...text.matchAll(PATTERN)];
    if (!matches.length) return;
    const found = await Promise.all(matches.map(m => lookup(m[0])));
    // opekkhar moddhe page bodle gele kichu korbo na
    if (!node.isConnected || node.nodeValue !== text || !found.some(Boolean)) return;
    const out = document.createDocumentFragment();
    let last = 0;
    matches.forEach((match, i) => {
      if (!found[i]) return;
      out.append(text.slice(last, match.index));
      const a = document.createElement("a");
      a.className = "cma-member-link";
      a.href = "?page=community-profile&userId=" + encodeURIComponent(found[i]);
      a.textContent = match[0];
      out.append(a);
      last = match.index + match[0].length;
    });
    out.append(text.slice(last));
    node.replaceWith(out);
  }

  function scan(root) {
    if (!window.cmaSupabase || !root.isConnected) return;
    const element = root.nodeType === 1 ? root : root.parentElement;
    if (!element || element.closest(SKIP)) return;
    const wanted = node => {
      PATTERN.lastIndex = 0;
      return PATTERN.test(node.nodeValue) && !node.parentElement.closest(SKIP);
    };
    if (root.nodeType === 3) { if (wanted(root)) linkNode(root); return; }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (wanted(walker.currentNode)) nodes.push(walker.currentNode);
    nodes.forEach(linkNode);
  }

  // Capture phase: post/message card-er nijer click handler-er age
  window.addEventListener("click", event => {
    const link = event.target.closest && event.target.closest("a.cma-member-link");
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    history.pushState({}, "", link.getAttribute("href"));
    window.renderRoute();
  }, true);

  function start() {
    const style = document.createElement("style");
    style.textContent = "a.cma-member-link{color:inherit!important;font-weight:800;text-decoration:underline!important;text-underline-offset:3px;cursor:pointer}";
    document.head.appendChild(style);
    new MutationObserver(changes => changes.forEach(change => {
      if (change.type === "characterData") scan(change.target);
      else change.addedNodes.forEach(node => { if (node.nodeType === 1 || node.nodeType === 3) scan(node); });
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
    scan(document.body);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
