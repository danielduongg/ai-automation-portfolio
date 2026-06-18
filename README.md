# AI Automation Portfolio

Custom **AI support assistants** and **workflow automations** for local and small businesses — built by [Your Name].

This repo is both my portfolio site and a set of working sample projects. Because the assistants are real, custom builds (not drag-and-drop templates), they can be trained on a client's own content and wired into the tools they already use.

🔗 **Live site:** https://danielduongg.github.io/ai-automation-portfolio/
💬 **Live chatbot demo:** open `chatbot-demo.html` (runs in the browser, no key needed)

---

## What's inside

| Path | What it is |
|------|------------|
| `index.html` | The portfolio site — services, live chatbot demo, sample work, contact. Served by GitHub Pages. |
| `chatbot-demo.html` | A self-contained AI support assistant (RAG-style) that runs fully in the browser. Rebrandable in minutes. |
| `chatbot-app/` | The **deployable** version of the assistant — an Express backend that keeps the API key server-side and answers via real RAG. |
| `automations/lead-to-crm-email.n8n.json` | An importable n8n workflow: website inquiry → CRM → AI-personalized email reply. |

---

## Sample projects

**1. 24/7 AI support assistant (RAG).** Answers customer questions instantly from a business's own information, shows the source it used, captures leads, and hands off anything it can't answer. See `chatbot-demo.html` (browser demo) and `chatbot-app/` (deployable, with a backend and live LLM answers).

**2. Lead → CRM → AI reply automation (n8n).** Every website inquiry is logged to a CRM and gets a warm, personalized AI reply within seconds — so no lead goes cold. Import `automations/lead-to-crm-email.n8n.json` into n8n and add credentials.

---

## Run / deploy

**Portfolio site** — it's static. Enable GitHub Pages (Settings → Pages → deploy from `main`, root) and it's live at the URL above.

**Chatbot app** — see [`chatbot-app/README.md`](chatbot-app/README.md):

```bash
cd chatbot-app
npm install
npm start        # http://localhost:3000  (demo mode without a key)
```

Add an `OPENAI_API_KEY` (or switch to Claude) to enable real RAG answers, then deploy to Render/Railway/Fly.

---

## Tech

Vanilla HTML/CSS/JS · Node.js + Express · OpenAI / Claude APIs · n8n · Make.com · RAG

## License

MIT — see [LICENSE](LICENSE).
