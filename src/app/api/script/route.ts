import {
  normalizeKinds,
  TONE_KEYS,
  type CastMember,
  type Scene,
  type SceneKind,
  type ToneKey,
  type TrailerScript,
} from "@/lib/trailer/types";

export const maxDuration = 60;

const ENDPOINT =
  process.env.DREAM_LLM_URL ??
  "https://ail.buyhatke.com/v1/opencode/chat/completions";
const MODEL = process.env.DREAM_LLM_MODEL ?? "deepseek-v4.1-flash-free";

const VALID_KINDS: SceneKind[] = ["setup", "escalation", "twist", "title", "end_card"];

function buildPrompt(
  dream: string,
  cast: string[],
  city: string,
  vibe: string,
): string {
  const castLine = cast.length
    ? `Feature these real people as cast members (invent dramatic roles for them): ${cast.join(", ")}.`
    : "Invent 2-4 cast members with fun dramatic stage names.";
  const cityLine = city.trim()
    ? `Set the trailer in ${city.trim()}.`
    : "Pick one real-feeling city as the set.";
  const vibeLine = vibe.trim() ? `Tone: ${vibe.trim()}.` : "";

  return `You are an elite movie-trailer screenwriter. Turn the dream below into a 30-second cinematic trailer script.

Dream: """${dream}"""
${castLine} ${cityLine} ${vibeLine}

Language rules:
- Detect the language of the dream. Write "title", "tagline", "genre", "rating" and every "vo" in THAT SAME language (Hindi must be written in Devanagari script, never romanized).
- "lang" = ISO 639-1 code of that language, e.g. "en", "hi", "es".
- "imagePrompt" must ALWAYS be in English, regardless of dream language.

Tone rules:
- Pick exactly one "tone" from: horror, blockbuster, romance, noir, fantasy, comedy. It drives the score and the voiceover style.
- Let the dream's mood decide, and respect the requested vibe if given.

Rules:
- Exactly 6 or 7 scenes in this order: 1 "setup", then 2-3 "escalation", 1 "twist", 1 "title", 1 "end_card".
- setup / escalation / twist: "vo" is one punchy voiceover line, max 14 words, present tense, escalating drama. No quotes inside.
- title and end_card: "vo" must be an empty string.
- "imagePrompt": vivid cinematic film-still description (subject, location, lighting, mood), 15-35 words, absolutely no text or letters in the image.
- title: 2-4 words, cinematic and funny.
- genre: dramatic label, e.g. "A Dream-Psychological Thriller".
- tagline: max 12 words, trailer-voice style.
- rating: funny fake rating, e.g. "RATED D FOR DREAMS".
- cast: 2-4 members, actor = a real first name, role = dramatic character name.

Return ONLY strict JSON, no markdown, exactly this shape:
{"title":"The Beach Exam","genre":"A Dream-Psychological Thriller","tagline":"This summer, one man will not graduate.","rating":"RATED D FOR DREAMS","tone":"horror","lang":"en","cast":[{"actor":"Rohan","role":"The Crab of Judgment"}],"scenes":[{"kind":"setup","vo":"Last night I showed up late.","imagePrompt":"..."},{"kind":"escalation","vo":"...","imagePrompt":"..."},{"kind":"escalation","vo":"...","imagePrompt":"..."},{"kind":"twist","vo":"...","imagePrompt":"..."},{"kind":"title","vo":"","imagePrompt":"..."},{"kind":"end_card","vo":"","imagePrompt":"empty"}]}`;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeScript(raw: unknown): TrailerScript {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const cast: CastMember[] = Array.isArray(obj.cast)
    ? (obj.cast as unknown[])
        .map((member) => {
          const m = (member && typeof member === "object" ? member : {}) as Record<string, unknown>;
          return { actor: str(m.actor, 40), role: str(m.role, 60) };
        })
        .filter((m) => m.actor)
        .slice(0, 4)
    : [];

  const scenes: Scene[] = Array.isArray(obj.scenes)
    ? (obj.scenes as unknown[])
        .map((scene) => {
          const s = (scene && typeof scene === "object" ? scene : {}) as Record<string, unknown>;
          const kind = VALID_KINDS.includes(s.kind as SceneKind)
            ? (s.kind as SceneKind)
            : "escalation";
          return {
            kind,
            vo: str(s.vo, 140).replace(/^["'“”]+|["'“”]+$/g, ""),
            imagePrompt: str(s.imagePrompt, 400),
          };
        })
        .filter((s) => s.imagePrompt)
    : [];

  const ordered = normalizeKinds(scenes);
  for (const scene of ordered) {
    if (scene.kind === "title" || scene.kind === "end_card") scene.vo = "";
  }

  if (!ordered.some((s) => s.kind === "setup")) {
    ordered.unshift({
      kind: "setup",
      vo: "It started like any other night.",
      imagePrompt: "cinematic wide establishing shot of a moody city at dusk, lone figure walking, volumetric fog, dramatic lighting",
    });
  }
  if (!ordered.some((s) => s.kind === "twist")) {
    ordered.push({
      kind: "twist",
      vo: "But nothing about tonight is normal.",
      imagePrompt: "cinematic low angle shot of a surreal looming landscape, threatening sky, dramatic god rays, film grain",
    });
  }
  if (!ordered.some((s) => s.kind === "title")) {
    ordered.push({
      kind: "title",
      vo: "",
      imagePrompt: "cinematic empty stage with dramatic spotlight, dust in the air, dark moody atmosphere",
    });
  }
  if (!ordered.some((s) => s.kind === "end_card")) {
    ordered.push({ kind: "end_card", vo: "", imagePrompt: "empty" });
  }

  return {
    title: str(obj.title, 60) || "Untitled Dream",
    genre: str(obj.genre, 60) || "A Dream-Thing",
    tagline: str(obj.tagline, 120) || "Some dreams refuse to end.",
    rating: str(obj.rating, 40) || "RATED D FOR DREAMS",
    tone: TONE_KEYS.includes(obj.tone as ToneKey) ? (obj.tone as ToneKey) : "blockbuster",
    lang: str(obj.lang, 2).toLowerCase() || "en",
    cast:
      cast.length > 0
        ? cast
        : [
            { actor: "You", role: "The Dreamer" },
            { actor: "The Alarm", role: "The Antagonist" },
          ],
    scenes: ordered,
  };
}

export async function POST(request: Request) {
  let body: {
    dream?: string;
    cast?: string[];
    city?: string;
    vibe?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dream = typeof body.dream === "string" ? body.dream.trim() : "";
  if (dream.length < 8) {
    return Response.json({ error: "Tell me a slightly longer dream." }, { status: 400 });
  }
  const cast = Array.isArray(body.cast)
    ? body.cast.map((c) => String(c).trim()).filter(Boolean).slice(0, 4)
    : [];
  const city = typeof body.city === "string" ? body.city : "";
  const vibe = typeof body.vibe === "string" ? body.vibe : "";

  const messages = [
    {
      role: "system",
      content:
        "You write tight cinematic trailer scripts. Always respond with strict JSON only, no markdown fences, no commentary.",
    },
    { role: "user", content: buildPrompt(dream, cast, city, vibe) },
  ];

  const attempts: Array<Record<string, unknown>> = [
    { model: MODEL, messages, temperature: 0.95, max_tokens: 1600, response_format: { type: "json_object" } },
    { model: MODEL, messages, temperature: 0.95, max_tokens: 1600 },
  ];

  let lastError = "Script generation failed";
  for (const payload of attempts) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(50_000),
      });
      if (!response.ok) {
        lastError = `LLM ${response.status}`;
        continue;
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      if (!content) {
        lastError = "Empty LLM reply";
        continue;
      }
      const script = normalizeScript(extractJson(content));
      return Response.json(script);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return Response.json({ error: lastError }, { status: 502 });
}
