# Project Dossier — Harbour Wang (Nano-233)

Verified from local source, git history and the GitHub API. ABG was never opened.
Superseded claims from the first pass are corrected below.

## Headline findings

1. **`Tarot-Society` has no code.** The repo contains only a README. The actual
   full-stack tarot work is `TarotLibrary` (React + Express + Sequelize + Postgres).
2. **`spotting-worldcup` is an empty repo** (0 files) — the real work lives locally
   in `Casting/spotting-sheet/spotting-worldcup`. The GitHub link was a dead link.
3. **`Huddle` is not your repo.** It is `anakavtaradze/Huddle` (initial UI by anakavtaradze,
   Vega port by Aryaman). You authored 8 of 11 commits — the "Group Pick" recommendation
   engine and the Bedrock AI-ideas endpoint. Treat as collaboration, credit accordingly.
4. **`wuxia_base` no longer exists**; it was folded into `Wuxia` (388 commits).
5. **`Logbook` is a personal archive**, not a logbook system: passport, lease and bank
   statement PDFs sit next to three genuine engineering write-ups.
6. **A live DeepSeek API key is in plaintext** at `alignment/config.json`
   (`sk-33e9…8260`). Rotate it and move it to an env var before pushing anything.

## Verified project profiles

### Wuxia — 388 commits, the deepest project
Single-player Chinese wuxia RPG. Split architecture: an LLM narrates, a deterministic
engine owns all state. Not a wrapper — the docs specify an action-costed calendar
(时辰 units), a timeline of conditional world events that fire whether or not the player
is present, seeded RNG streams, snapshot rewind that erodes only a personal layer,
five attributes, a paid-free-text currency (心弦) priced by input length, a two-layer
input filter, and a port interface so the LLM can be faked in tests. Stack: Python 3.12,
uv, Pydantic v2, SQLite, FastAPI (NDJSON streaming), DeepSeek adapter, Godot 4 client later.

### Football Kaleidoscope — Microsoft "Inside the Game"
2,803 files, public, deployed to Azure Container Apps. A synthetic match engine plus a
newsroom of agents on Microsoft Foundry / Agent Framework. Fan, analyst and scout views,
nine languages, what-if replays, and evaluation graded against the engine's ground truth.

### Ture Aid — 25 commits
Tauri 2 + Rust core + React 19 UI for NZ criminal defence barristers. Real dependencies:
`mail-parser`, `lopdf`, `regex`. One trust boundary in Rust: ingest → read (pdfium/OCR)
→ match → file → redact → dates → `.ics`. SQLite + SQLCipher with the key in Windows
Credential Manager. "Nothing leaves your laptop" is a hard requirement, not a setting.

### BioCore ARG — 48 commits
Serverless monorepo on AWS CDK. Command-pattern state machine router (single endpoint,
`currentLocation` in DynamoDB) rather than a REST API, plus a Python microservice that
parses a string-manipulation puzzle language (`LYSE`, `LIGATE`, `TRIM`, `EXPRESS`,
`PURGE`, `CATALYZE`, `ISOTOPE`, `EXPORT`). Puzzles hide in pastebins, PDFs and chat
widgets; a `BroadcastChannel` single-tab policy enforces one session.

### EchoForge / echoforge-engine
Two-repo split: `EchoForge` (8 files — product shell, docs, sync script) and
`echoforge-engine` (297 files — the w-okada/deiteris voice-changer fork). The research
doc is genuinely technical: it identifies CUDA-graph capture as the highest-leverage
latency win and documents exactly what the fork already has (TF32, jit.script, FAISS
on GPU, FCPE/RMVPE/Crepe) versus what it lacks (`torch.compile`, CUDA graphs).

### TRLP (XHS-planner) — The Real Lazy Person
AutoGen multi-agent travel planning with a live Neo4j GraphRAG layer. Four agents
(search, budget, figure, manager) plus a writer. Hybrid retrieval via MCP (Xiaohongshu)
and DuckDuckGo/Tavily, a Graphviz itinerary graph, a 2,000-word guide, Pandas budget
breakdown, and graceful degradation to mock data when an API is down. Contains three
sub-projects: `auto-trip-planner-xiaohongshu`, `trip-grounder`, `xhs-mcp-bin`.

### PitchProbe
Actually: LangGraph `StateGraph` + FastAPI + Postgres + a Next.js frontend, using
**Gemini** via `langchain_google_genai` — not OpenAI. Tools are football-specific:
players across clubs, career path, career stats, seasonal stats, stats for a club.

### Broadcast
Fastify 5, not Express. Local-only studio (port 3001) composites sources, scenes and a
mixer on canvas and pushes WebRTC/WHIP to mediamtx; the public server republishes as HLS
with 480/360 renditions behind a session, with AltCHA, rate limiting, chat over WebSocket,
and a Cloudflare tunnel in front. "Live" is derived from the media server, not the studio UI.

### The Appraiser (Gallery-puzzle) — 15 commits, all yours
Deduction roguelike. A seeded puzzle generator guarantees a unique solution; the design
moves past the prototype to active investigation (four tools spending a scarce Scrutiny
pool), a gallery that physically grows as progression, and a Hades-style museum meta layer.
Placards constrain two unknowns at once: where a work hangs, and whether it is fake.

### ELEGY — 115 cards
Original Chinese card game: nine card types (神体/神谕, 信徒, 材料, 密印, 仪式, 远征, 秘典,
灾兆, 崩溃牌), sigil tiers, corruption, veiled state, unmasking, and a four-phase turn
structure (黄昏 → 研究 → 行动 → 隐匿). Rulebook authored in Markdown with CSS and rendered
to PDF by a Python pipeline that also cuts sprite sheets.

### Rogue Run
Unity/C#, 8,733 files. NUS Orbital Artemis with the Judges' Choice Award. Procedural
sequencing, A* pathfinding, composite/observer enemy architecture, Cinemachine confinement.
Playable on itch.io.

### Remaining verified

- **Speed Tarot** — Next.js 14 + Tailwind + Framer Motion, 78 card artworks, Void Tarot deck.
- **TarotLibrary** — React card list over an Express/Sequelize/Postgres API. Small; the
  card data model is the interesting part, not the UI.
- **Brighton Kit Detector** — YOLOv11s, 6 kits, hand-labelled dataset, OpenCV inference app.
- **Travel-CV** — Faster R-CNN (ResNet-50-FPN), 10 COCO classes, ~2,000 images, loss ~0.34.
- **OCRCaptcha** — CRNN + CTC for Keras 3/TensorFlow, custom loss, GPU augmentation.
- **Pixel Stuck** — Pygame; array-backed level engine, pickled levels, editor, speedrun timer.
- **st-tg-bridge** — FastAPI webhook mapping Telegram updates onto SillyTavern ChatBridge.
- **TETR.IO Bot** — colour-matching board reader, multiprocessing search, b2b/T-spin focus.
- **Scouting Reels / Brighton-Bilibili** — ffmpeg pipeline plus football scouting boards
  (heatmaps, duel maps, cover-area diagrams) used for real player analysis.
- **World Cup Spotting Sheet** — API-Football squad cache → formation-correct lineup board.
- **Alignment Vote Analyzer** — Playwright scrape + LLM classification of reply-voting.
- **ELEGY, Appraiser, Wuxia, Rogue Run, Pixel Stuck, TETR.IO** — games, all kept.

## Portfolio decision (23 → 20)

Cut from the site: **Tarot Society** (no code), **Tarot Library** (superseded by Speed
Tarot), **Logbook** (personal archive; the write-ups are strong but the repo is not
shareable), **Huddle** (not your repo — better as a "collaborations" line than a project).

Also excluded as requested: Birthday AR, Brighthive Exercise, Code Evaluation System,
SillyTavern DDLC, Music, Podcast, Clipchamp.

## Still worth deciding

- **Logbook write-ups** (`DATA_PREVIEW_RETROSPECTIVE.md`, `STUDIOS_WEEK_SUMMARY.md`,
  `PROJECT_IMPLEMENTATION_LOGBOOK_TWO_WEEKS.md`) are the strongest professional writing
  in the whole set — deep systems reasoning on scoping, VFS layout, and SQL allowlists.
  Worth extracting into a standalone "Notes" section with the PDFs removed.
- **Huddle**: attribute as a team project with named contributors, or leave out.
- **Private repos**: Ture Aid, Wuxia, EchoForge, BioGen, Speed Tarot, Logbook are all
  private, so no public links. Profile cards should say "private" rather than link 404s.
