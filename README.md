# Dream Journal — The Trailer Studio

Voice-note a dream. Get a 30-second cinematic trailer back: title cards, genre-matched voiceover, a live score, fake cast, and your friends as stars — premiered in a four-act cinema UI (marquee → booth → production floor → premiere).

> "Last night I was late for an exam but the exam was a beach" → *"This summer… one man… will not graduate."*

## The experience

1. **The Marquee** — full-screen title with film grain, shimmer, and archive reels to start from.
2. **The Booth** — mumble the dream into a screenplay-styled page with live transcription; cast your crew, pick a city and a genre whisper. Dreams in Hindi come back as Hindi trailers (Devanagari script, Hindi neural voice) — any language the LLM detects.
3. **The Production Floor** — nothing is hidden: a live polaroid board films each scene as it generates, with a sprocket film-strip progress and slate readouts.
4. **The Premiere** — cinema mode with letterbox bars, ambient glow, Ken Burns shots, 2.35:1 framing, film grain, captions, a title slam, and a post-credit poster card with the contact sheet. Download as MP4/WebM.

## How it works

- `/api/script` — LLM writes the screenplay (setup → escalations → twist → title → end card), picks a `tone` (horror / blockbuster / romance / noir / fantasy / comedy) and detects the dream's `lang`.
- `/api/tts` — Microsoft Edge neural TTS: the voice and prosody are chosen from tone × language (horror: deep, slow, cold; romance: warm female; fantasy: grand). gTTS fallback.
- `/api/image` — Pollinations paints each scene as a cinematic film still (one shot at a time, paced for the free tier).
- **Live score** — WebAudio: the tonal palette (drones, braams, risers, sub hits) shifts per tone, with voiceover ducking.
- **Renderer** — canvas draws the whole trailer; MediaRecorder exports it.

## Personalize

- **Cast** — friends' names get dramatic roles. **City** — your city becomes the set. **Vibe** — genre whisper or let the director read the dream's mood.
- **Aspect** — cinematic 16:9 or phone-native 9:16. **Language** — auto: English, Hindi, Spanish, French, German, Japanese, Tamil, and more.

## Stack

- Next.js (App Router) + React + Tailwind CSS v4 — no video libraries
- Canvas trailer engine + WebAudio score, MediaRecorder export
- Free generation: Pollinations (images), msedge-tts (voice), BuyHatke LLM gateway — no API keys required

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Optional environment overrides:

```bash
DREAM_LLM_URL=   # default: https://ail.buyhatke.com/v1/opencode/chat/completions
DREAM_LLM_MODEL= # default: deepseek-v4.1-flash-free
```

## Notes

- Scene images are generated sequentially (the free image engine rate-limits parallel calls), so a full trailer takes about a minute — the production board makes the wait the show.
- Preview works everywhere; MP4 download works where `MediaRecorder` supports it (Chrome, Safari), WebM otherwise.
