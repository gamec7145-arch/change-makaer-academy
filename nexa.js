// =====================================================
// CHANGE MAKER ACADEMY - NEXA AI  (100% FREE: Google Gemini API free tier)
// Vercel serverless function
//
//   POST /api/nexa
//   body : { messages:[{role:"user"|"assistant",content:"..."}], image?:{mime,data} }
//   reply: Server-Sent Events:  data: {"t":"text chunk"}  ...  data: {"done":true}
//          (shuru-te kono error hole normal JSON { error } + HTTP status)
//
// Vercel -> Settings -> Environment Variables:
//   GEMINI_API_KEY        (required) https://aistudio.google.com/apikey  (free)
//   NEXA_MODEL            (optional) default: gemini-2.5-flash
//   NEXA_FALLBACK_MODEL   (optional) default: gemini-2.5-flash-lite
//                         (main model-er free quota shesh hole eta try kore)
// Key kokhono frontend-e jay na.
// =====================================================

const BASE = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.NEXA_MODEL || "gemini-2.5-flash";
const FALLBACK = process.env.NEXA_FALLBACK_MODEL || "gemini-2.5-flash-lite";

const MAX_MESSAGES = 16;          // history-te max koyta message
const MAX_CHARS = 2000;           // ekta message-er max length
const MAX_OUTPUT_TOKENS = 1500;
const MAX_IMAGE_B64 = 3_500_000;  // ~2.6MB image (Vercel body limit 4.5MB)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const PER_MIN = 12;               // ek IP-theke 1 minute-e max request
const PER_DAY = 80;               // ek IP-theke din-e max request (free quota bachate)

const SYSTEM_PROMPT = [
  "You are Nexa AI, the study partner of Change Maker Academy, a Bangladeshi online learning platform for SSC, HSC and admission students.",
  "Reply in the same language the student writes in. If they write Bangla (or Banglish), reply in simple Bangla. If they write English, reply in English.",
  "Explain step by step with simple words and short examples. Keep answers focused, because students read on a phone.",
  "Help with studies: Bangla, English, ICT, Math, Physics, Chemistry, Biology, admission prep, exam tips, study routines and motivation.",
  "If the student sends a photo (a textbook page, a question paper, handwritten notes, a diagram), read it carefully first. If it contains a question, answer it step by step. If it is notes or a page, explain or summarize it. If some part is blurry or unreadable, say exactly which part and ask for a clearer photo instead of guessing.",
  "Never identify real people from their faces. If a photo is not about studying, say so politely and steer back to studies.",
  "If you are not sure about a fact or a calculation, say so instead of guessing. Never invent exam dates, fees or rules of the academy.",
  "Formatting: short paragraphs, short bullet lists, **bold** for key terms. Do NOT use markdown headings, tables or LaTeX. Write math in plain text like x^2, a/b, sqrt(x), or with symbols like \u00d7 \u00f7 \u221a \u03c0."
].join("\n");

// ---------- tiny in-memory rate limiter (per serverless instance, best effort) ----------
const minHits = new Map();
const dayHits = new Map();
function limited(ip) {
  const now = Date.now();
  const m = (minHits.get(ip) || []).filter((t) => now - t < 60_000);
  m.push(now);
  minHits.set(ip, m);

  const day = new Date().toISOString().slice(0, 10);
  const d = dayHits.get(ip);
  const count = d && d.day === day ? d.n + 1 : 1;
  dayHits.set(ip, { day, n: count });

  if (minHits.size > 5000) minHits.clear();
  if (dayHits.size > 5000) dayHits.clear();
  if (m.length > PER_MIN) return "min";
  if (count > PER_DAY) return "day";
  return null;
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const text = String(m.content == null ? "" : m.content).slice(0, MAX_CHARS).trim();
    if (!text) continue;
    const role = m.role === "assistant" ? "model" : "user";
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts[0].text += "\n" + text; // role alternate rakhte merge
    else out.push({ role, parts: [{ text }] });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

function buildPayload(contents, image, useThinkingConfig) {
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.6 }
  };
  if (useThinkingConfig) {
    // flash/flash-lite: text-e thinking off (taratari + quota bachay), photo-te ektu thinking
    payload.generationConfig.thinkingConfig = { thinkingBudget: image ? 1024 : 0 };
  }
  return payload;
}

async function callGemini(model, key, payload) {
  return fetch(`${BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(payload)
  });
}

module.exports = async function handler(req, res) {
  const json = (status, obj) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(obj));
  };

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(405, { error: "Method not allowed" });
  }

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return json(500, { error: "Nexa AI এখনো সেটআপ করা হয়নি (GEMINI_API_KEY নেই)।" });

  const ip = String(req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "unknown")
    .split(",")[0].trim();
  const lim = limited(ip);
  if (lim === "min") return json(429, { error: "অনেক তাড়াতাড়ি প্রশ্ন করছো। একটু পরে আবার চেষ্টা করো।" });
  if (lim === "day") return json(429, { error: "আজকের প্রশ্নের সীমা শেষ। কাল আবার চেষ্টা করো।" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const contents = cleanMessages(body.messages);
  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return json(400, { error: "কোনো প্রশ্ন পাওয়া যায়নি।" });
  }

  // ---- optional photo: last user message-er sathe jora hoy ----
  let image = null;
  if (body.image) {
    const mime = String(body.image.mime || "");
    const data = String(body.image.data || "");
    if (!ALLOWED_MIME.includes(mime)) return json(400, { error: "শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।" });
    if (!data || data.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(data)) {
      return json(400, { error: "ছবিটা খুব বড় বা নষ্ট। ছোট করে আবার দাও।" });
    }
    image = { mime, data };
    const lastParts = contents[contents.length - 1].parts;
    if (lastParts[0].text === "[ছবি]") {
      lastParts[0].text = "এই ছবিতে যা আছে পড়ে বুঝিয়ে দাও। প্রশ্ন থাকলে ধাপে ধাপে উত্তর দাও।";
    }
    lastParts.push({ inlineData: { mimeType: mime, data } });
  }

  // ---- call Gemini (main model -> fallback model) ----
  let useThinking = true;
  let upstream;
  try {
    upstream = await callGemini(MODEL, key, buildPayload(contents, image, useThinking));
    if (upstream.status === 400 && useThinking) { // thinkingConfig support na korle bad diye abar
      useThinking = false;
      upstream = await callGemini(MODEL, key, buildPayload(contents, image, useThinking));
    }
    if (!upstream.ok && [404, 429, 500, 503].includes(upstream.status) && FALLBACK && FALLBACK !== MODEL) {
      upstream = await callGemini(FALLBACK, key, buildPayload(contents, image, useThinking));
      if (upstream.status === 400 && useThinking) {
        useThinking = false;
        upstream = await callGemini(FALLBACK, key, buildPayload(contents, image, useThinking));
      }
    }
  } catch (err) {
    console.error("Gemini fetch failed", err);
    return json(502, { error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করো।" });
  }

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try { detail = (await upstream.text()).slice(0, 300); } catch (e) {}
    console.error("Gemini error", upstream.status, detail);
    if (upstream.status === 429) return json(429, { error: "Nexa AI এখন অনেক ব্যস্ত। একটু পরে আবার চেষ্টা করো।" });
    if (upstream.status === 401 || upstream.status === 403) return json(500, { error: "Nexa AI-এর API key ঠিক নেই।" });
    return json(502, { error: "Nexa AI উত্তর দিতে পারলো না। আবার চেষ্টা করো।" });
  }

  // ---- stream back as simple SSE ----
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const reader = upstream.body.getReader();
  let clientGone = false;
  req.on("close", () => { clientGone = true; reader.cancel().catch(() => {}); });

  const send = (obj) => { if (!clientGone) res.write("data: " + JSON.stringify(obj) + "\n\n"); };
  const decoder = new TextDecoder();
  let buf = "";
  let sentAny = false;
  let blocked = false;

  const handleLine = (line) => {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") return;
    let j;
    try { j = JSON.parse(raw); } catch (e) { return; }
    if (j.promptFeedback && j.promptFeedback.blockReason) blocked = true;
    const cand = j.candidates && j.candidates[0];
    if (!cand) return;
    const parts = (cand.content && cand.content.parts) || [];
    for (const p of parts) {
      if (p.text && !p.thought) { sentAny = true; send({ t: p.text }); }
    }
    if (cand.finishReason === "SAFETY" || cand.finishReason === "PROHIBITED_CONTENT") blocked = true;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        handleLine(buf.slice(0, i).replace(/\r$/, ""));
        buf = buf.slice(i + 1);
      }
    }
    if (buf) handleLine(buf.replace(/\r$/, ""));
    if (!sentAny) {
      send({ t: blocked
        ? "দুঃখিত, এই প্রশ্নের উত্তর আমি দিতে পারছি না। অন্যভাবে জিজ্ঞেস করো।"
        : "দুঃখিত, উত্তর খুঁজে পাইনি। আবার বলো?" });
    }
    send({ done: true });
  } catch (err) {
    if (!clientGone) { console.error("Stream failed", err); send({ error: "উত্তর আসতে আসতে থেমে গেছে। আবার চেষ্টা করো।" }); }
  }
  if (!clientGone) res.end();
};
