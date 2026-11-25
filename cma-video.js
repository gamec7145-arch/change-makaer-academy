/* =========================================================
   CHANGE MAKER ACADEMY — VIDEO LINK HELPER
   Admin je kono vabe link dile-o (YouTube link / Shorts / iframe
   embed code / https chhara link / Facebook / Google Drive / Vimeo /
   mp4) eki jaiga theke bujhe ney. Homepage, Free Class ebong
   Admin Panel — tintai eta use kore.
========================================================= */
(function () {
  "use strict";

  const ID = /^[\w-]{11}$/;

  function toUrl(value) {
    let input = String(value || "").trim();
    // <iframe src="..."> embed code paste korle src ta ber kore ney
    const src = input.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
    if (src) input = src[1].replace(/&amp;/g, "&");
    if (/^\/\//.test(input)) input = "https:" + input;
    else if (!/^https?:\/\//i.test(input) && /^[\w-]+(\.[\w-]+)+\//.test(input)) input = "https://" + input;
    try {
      const url = new URL(input);
      return /^https?:$/.test(url.protocol) ? url : null;
    } catch (_) { return null; }
  }

  function youtube(id, list) {
    return {
      type: "youtube",
      embed: "https://www.youtube-nocookie.com/embed/" + (id || "videoseries") + "?rel=0&playsinline=1" + (id ? "" : "&list=" + encodeURIComponent(list)),
      thumb: id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "",
      url: id ? "https://www.youtube.com/watch?v=" + id : "https://www.youtube.com/playlist?list=" + encodeURIComponent(list)
    };
  }

  function parse(value) {
    const raw = String(value || "").trim();
    if (ID.test(raw)) return youtube(raw);
    const url = toUrl(raw);
    if (!url) return null;

    const host = url.hostname.replace(/^(www|m|music)\./i, "").toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    const link = url.href;

    if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
      let id = "";
      if (host === "youtu.be") id = parts[0];
      else if (url.searchParams.get("v")) id = url.searchParams.get("v");
      else if (["embed", "shorts", "live", "v", "watch"].includes(parts[0])) id = parts[1];
      if (ID.test(id || "") && id !== "videoseries") return youtube(id);
      const list = url.searchParams.get("list");
      return list ? youtube("", list) : null; // channel / home page link — video na
    }

    if (host === "drive.google.com") {
      const file = (url.pathname.match(/\/file\/d\/([\w-]+)/) || [])[1] || url.searchParams.get("id");
      return file ? { type: "drive", embed: "https://drive.google.com/file/d/" + encodeURIComponent(file) + "/preview", thumb: "", url: link } : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const num = parts.find(p => /^\d+$/.test(p));
      return num ? { type: "vimeo", embed: "https://player.vimeo.com/video/" + num, thumb: "", url: link } : null;
    }

    if (host === "facebook.com" || host === "fb.watch") {
      if (url.pathname === "/plugins/video.php") return { type: "facebook", embed: link, thumb: "", url: url.searchParams.get("href") || link };
      return { type: "facebook", embed: "https://www.facebook.com/plugins/video.php?show_text=false&href=" + encodeURIComponent(link), thumb: "", url: link };
    }

    if (/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return { type: "file", embed: link, thumb: "", url: link };

    return null;
  }

  // Player element banay (iframe ba <video>)
  function player(video, title, autoplay) {
    if (video.type === "file") {
      const v = document.createElement("video");
      v.src = video.embed; v.controls = true; v.playsInline = true; v.autoplay = !!autoplay;
      v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;background:#000";
      return v;
    }
    const f = document.createElement("iframe");
    f.src = video.embed + (autoplay ? (video.embed.indexOf("?") < 0 ? "?" : "&") + "autoplay=1" : "");
    f.title = title || "Video";
    f.allowFullscreen = true;
    f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    return f;
  }

  window.CMAVideo = { parse: parse, player: player };
})();
