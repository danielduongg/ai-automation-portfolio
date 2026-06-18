/**
 * AI Support Assistant — deployable backend (RAG)
 * --------------------------------------------------------------------------
 * Serves the chat UI in /public and exposes POST /api/chat.
 * The OpenAI key stays on the SERVER (never exposed to the browser).
 *
 *   - No OPENAI_API_KEY set  -> "demo" mode: answers straight from the
 *                               knowledge base (great for showing clients).
 *   - OPENAI_API_KEY set     -> "RAG" mode: retrieves the most relevant
 *                               knowledge-base entry and asks the LLM to
 *                               answer using ONLY that context.
 *
 * Run:   npm install && npm start
 * Deploy: Render / Railway / Fly.io / any Node host. Set OPENAI_API_KEY.
 * --------------------------------------------------------------------------
 */
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== Knowledge base — replace with the client's real content ===== */
const BRAND = "The Copper Table";
const ESCALATION =
  "Happy to help with that — let me get you to our team. Could you share your name and a phone number or email, and we'll follow up shortly? You can also reach us at (555) 248-7100.";

const KB = [
  { source: "Hours", keywords: ["hours","open","close","closing","opening","weekend","saturday","sunday","monday","what time","late","kitchen close"],
    answer: "We're open Tuesday–Thursday 5pm–10pm, Friday & Saturday 5pm–11pm, and Sunday 4pm–9pm. We're closed Mondays. The kitchen stops taking orders 30 minutes before close." },
  { source: "Reservations", keywords: ["reservation","reserve","book","booking","table","tonight","seating","walk in","walk-in","availability","party of"],
    answer: "We'd love to have you! Book a table at coppertable.example/reserve, or tell me your date, time, and party size and I'll pass it to our host team. For parties of 7+ we use a quick set menu." },
  { source: "Location & Parking", keywords: ["where","location","address","parking","park","directions","find you","valet","map"],
    answer: "We're at 88 Foundry Street, downtown, on the corner of Foundry & 2nd. There's a public lot directly behind us, and complimentary valet on Friday and Saturday evenings." },
  { source: "Menu & Cuisine", keywords: ["menu","food","cuisine","serve","dishes","specials","what kind","steak","seafood","pasta","drinks","cocktails","wine"],
    answer: "We're a modern American kitchen — wood-fired steaks and seafood, seasonal pasta, shareable starters, and a full cocktail and wine list. See the current menu at coppertable.example/menu." },
  { source: "Dietary Options", keywords: ["vegan","vegetarian","gluten","gluten-free","gf","allergy","allergies","dairy","nut","celiac","dietary","plant based"],
    answer: "Absolutely — we have clearly marked vegetarian, vegan, and gluten-free dishes, and the kitchen can accommodate most allergies. Just let your server know (or add a note to your reservation)." },
  { source: "Private Events & Catering", keywords: ["event","events","private","party","catering","cater","large group","rehearsal","birthday","corporate","buyout","banquet","host"],
    answer: "Yes! We host private events and offer off-site catering. Our semi-private room seats up to 30, with full buyouts for larger groups. Share your date, headcount, and occasion and our events lead will send packages." },
  { source: "Takeout & Delivery", keywords: ["takeout","take out","to go","pickup","pick up","delivery","deliver","order online","doordash","uber eats"],
    answer: "Order takeout for pickup at coppertable.example/order. We also deliver through DoorDash and Uber Eats within about 5 miles." },
  { source: "Happy Hour", keywords: ["happy hour","specials","deals","discount","drink special","bar"],
    answer: "Happy hour is Tuesday–Friday, 5pm–6:30pm at the bar: half-price select cocktails, $7 wines by the glass, and $9 small plates." },
  { source: "Dress Code", keywords: ["dress","dress code","attire","wear","formal","casual"],
    answer: "We're smart-casual — most guests come as they are after work. No strict dress code, though we ask for no athletic wear in the main dining room." },
  { source: "Kids & Groups", keywords: ["kids","child","children","family","high chair","stroller","kid friendly","menu for kids"],
    answer: "Kids are welcome before 8pm — we have a small kids' menu and high chairs. Earlier seatings work best with little ones." }
];

/* ===== Retrieval (keyword scoring stands in for vector search) ===== */
const STOPWORDS = new Set(["the","a","an","is","are","do","you","i","my","me","to","of","for","and","in","on","at","can","what","when","how","does","with","your","we","it","this","that","any","please","hi","hello","hey"]);
const stem = (w) => (w.length > 3 ? w.replace(/s$/, "") : w);
const tokenize = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOPWORDS.has(w));

function retrieve(query) {
  const qTokens = tokenize(query).map(stem);
  const qPhrase = query.toLowerCase();
  let best = null, bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (kw.includes(" ")) { if (qPhrase.includes(kw)) score += 2.5; }
      else if (qTokens.includes(stem(kw))) score += 1;
    }
    const ans = tokenize(entry.answer).map(stem);
    for (const t of qTokens) if (ans.includes(t)) score += 0.2;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return { entry: best, confidence: bestScore > 0 ? bestScore / (bestScore + 1.5) : 0 };
}
const THRESHOLD = 0.25;

/* ===== LLM call (RAG): answer ONLY from retrieved context ===== */
async function llmAnswer(query, context) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content:
          `You are the warm, concise assistant for ${BRAND}, a restaurant. Answer the guest in 1–3 sentences using ONLY the CONTEXT below. ` +
          `If the context does not contain the answer, do not guess — say you'll connect them with the team. Never invent prices, hours, or menu items.\n\nCONTEXT:\n${context}` },
        { role: "user", content: query }
      ]
    })
  });
  if (!res.ok) throw new Error("LLM error " + res.status);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/* ===== API ===== */
app.post("/api/chat", async (req, res) => {
  const query = ((req.body && req.body.query) || "").toString().slice(0, 500).trim();
  if (!query) return res.status(400).json({ error: "Missing 'query'." });

  const { entry, confidence } = retrieve(query);
  const grounded = entry && confidence >= THRESHOLD;
  const source = grounded ? entry.source : null;

  // Demo mode: no key, answer straight from the knowledge base.
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ answer: grounded ? entry.answer : ESCALATION, source, mode: "demo" });
  }
  // RAG mode: ground the LLM in the retrieved context.
  try {
    const context = grounded ? entry.answer : "(no matching information was found)";
    const answer = await llmAnswer(query, context);
    return res.json({ answer, source, mode: "rag" });
  } catch (e) {
    // Fail safe: fall back to the retrieved answer if the LLM call fails.
    return res.json({ answer: grounded ? entry.answer : ESCALATION, source, mode: "fallback" });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI support assistant running on http://localhost:${PORT}  (mode: ${process.env.OPENAI_API_KEY ? "RAG" : "demo"})`));
