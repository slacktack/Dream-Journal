# Dream Journal — The Trailer Studio

Voice-note a dream. Get a 30-second cinematic trailer back: title cards, genre-matched voiceover, a live score, fake cast, and your friends as stars — premiered in a four-act studio UI (marquee → booth → production floor → premiere) with a full dark / light theme.

> "Last night I was late for an exam but the exam was a beach" → *"This summer… one man… will not graduate."*

## The experience

1. **The Marquee** — aurora-glass hero with a shimmering gradient title and archive reels to start from.
2. **The Booth** — mumble the dream into a glass studio pad with live transcription; cast your crew, pick a city and a genre whisper. Dreams in Hindi come back as Hindi trailers (Devanagari script, Hindi neural voice) — any language the LLM detects.
3. **The Production Floor** — nothing is hidden: a live storyboard fills as each scene generates, with a gradient reel-progress and a countdown when the free film lab is developing the next shot.
4. **The Premiere** — the trailer plays on a stage with an animated aurora glow, Ken Burns shots, film grain, captions, a title slam, and a post-credit poster card with the contact sheet. Download as MP4/WebM.

## How it works

- `/api/script` — LLM writes the screenplay (setup → 3-4 escalations → twist → title → end card), picks a `tone` (horror / blockbuster / romance / noir / fantasy / comedy) and detects the dream's `lang`. Your genre whisper forces the tone server-side, so a rom-com stays a rom-com.
- `/api/tts` — Microsoft Edge neural TTS: the voice and prosody are chosen from tone × language (horror: deep, slow, cold; romance: warm golden; comedy: bright). gTTS fallback.
- `/api/image` — Pollinations paints each scene as a genre-graded film still (rom-coms are warm and bright, horror is cold and shadowed), fetched two-wide with patient polling of the free tier and a live countdown while the lab develops each reel.
- **Live score** — WebAudio: the tonal palette (drones, braams, risers, sub hits) shifts per tone, with voiceover ducking.
- **Renderer** — canvas draws the whole trailer; MediaRecorder exports it.

## Personalize

- **Cast** — friends' names get dramatic roles. **City** — your city becomes the set. **Vibe** — genre whisper or let the director read the dream's mood.
- **Aspect** — cinematic 16:9 or phone-native 9:16. **Language** — auto: English, Hindi, Spanish, French, German, Japanese, Tamil, and more.
- **Theme** — cinema dark or matinee light, remembered per device.

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
DREAM_LLM_URL=         # default: https://ail.buyhatke.com/v1/opencode/chat/completions
DREAM_LLM_MODEL=       # default: deepseek-v4.1-flash-free
POLLINATIONS_TOKEN=    # optional: a free pollen key (enter.pollinations.ai) lifts the
                       # 1-image-per-45s free limit — whole trailer renders in ~30s
```

## Notes

- The free image engine rate-limits to one image every ~45 seconds per IP; the production board shows a live countdown between shots, and a pollen key removes the wait entirely.
- Preview works everywhere; MP4 download works where `MediaRecorder` supports it (Chrome, Safari), WebM otherwise.
