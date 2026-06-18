# AI Support Assistant (deployable, with backend)

A small Express app that serves a chat widget and answers questions about a business using **RAG** — it retrieves the most relevant knowledge-base entry and asks an LLM to answer using only that context. The API key stays on the server.

This is the "real app" version of the in-browser demo. Same assistant, but production-shaped: a backend you can host, swap the knowledge base, and connect to a client's systems.

## Run locally

```bash
cd chatbot-app
npm install
npm start
# open http://localhost:3000
```

With **no API key**, it runs in **demo mode** and answers straight from the knowledge base — perfect for showing a client. To enable real AI answers:

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...
npm start
```

## How it works

```
Browser (public/index.html)  ──POST /api/chat──▶  server.js
                                                    │
                                          retrieve() picks the best
                                          knowledge-base entry
                                                    │
                                   ┌────────────────┴───────────────┐
                                   ▼                                ▼
                          no key → return the              key → ask the LLM to answer
                          entry directly (demo)            using ONLY that entry (RAG)
```

- `server.js` — the backend: retrieval, the LLM call, and the `/api/chat` route.
- `public/index.html` — the chat UI (talks to `/api/chat` on the same origin).
- The knowledge base is the `KB` array near the top of `server.js`. **Replace it with the client's real content** to rebrand.

## Use Claude instead of OpenAI

In `server.js`, point `llmAnswer()` at `https://api.anthropic.com/v1/messages`, add the header `anthropic-version: 2023-06-01`, set `x-api-key` to your key, and use Anthropic's request/response shape (`messages` + `system`, read `data.content[0].text`).

## Deploy (free / cheap options)

- **Render** or **Railway**: new Web Service → connect this repo → build `npm install`, start `npm start` → add `OPENAI_API_KEY` as an environment variable.
- Set the embed snippet on the client's site, or host the whole widget and link to it.

## Security notes

- The key is read from `process.env` and **never sent to the browser**.
- `.env` is git-ignored — never commit real keys.
- Input is length-capped; add rate limiting before a public launch.
