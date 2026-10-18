import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface VoicePair {
  male: string;
  female: string;
}

const VOICE_MAP: Record<string, VoicePair> = {
  en: { male: "en-US-ChristopherNeural", female: "en-US-AriaNeural" },
  hi: { male: "hi-IN-MadhurNeural", female: "hi-IN-SwaraNeural" },
  es: { male: "es-ES-AlvaroNeural", female: "es-ES-ElviraNeural" },
  fr: { male: "fr-FR-HenriNeural", female: "fr-FR-DeniseNeural" },
  de: { male: "de-DE-ConradNeural", female: "de-DE-KatjaNeural" },
  pt: { male: "pt-BR-AntonioNeural", female: "pt-BR-FranciscaNeural" },
  it: { male: "it-IT-DiegoNeural", female: "it-IT-ElsaNeural" },
  ja: { male: "ja-JP-KeitaNeural", female: "ja-JP-NanamiNeural" },
  ko: { male: "ko-KR-InJoonNeural", female: "ko-KR-SunHiNeural" },
  ta: { male: "ta-IN-ValluvarNeural", female: "ta-IN-PallaviNeural" },
  te: { male: "te-IN-MohanNeural", female: "te-IN-ShrutiNeural" },
  mr: { male: "mr-IN-ManoharNeural", female: "mr-IN-AarohiNeural" },
  bn: { male: "bn-IN-BashkarNeural", female: "bn-IN-TanishaaNeural" },
  ur: { male: "ur-IN-SalmanNeural", female: "ur-IN-GulNeural" },
  ar: { male: "ar-EG-ShakirNeural", female: "ar-EG-SalmaNeural" },
};

interface ToneStyle {
  gender: "male" | "female";
  rate: string;
  pitch: string;
  voice?: Record<string, string>;
}

const TONE_STYLE: Record<string, ToneStyle> = {
  horror: { gender: "male", rate: "-14%", pitch: "-8%", voice: { en: "en-US-ChristopherNeural" } },
  blockbuster: { gender: "male", rate: "-8%", pitch: "-4%", voice: { en: "en-US-BrianNeural" } },
  romance: { gender: "female", rate: "-8%", pitch: "+2%", voice: { en: "en-US-JennyNeural" } },
  noir: { gender: "male", rate: "-12%", pitch: "-6%", voice: { en: "en-US-ChristopherNeural" } },
  fantasy: { gender: "male", rate: "-10%", pitch: "-3%", voice: { en: "en-US-BrianNeural" } },
  comedy: { gender: "female", rate: "-2%", pitch: "+4%", voice: { en: "en-US-AriaNeural" } },
};

function chunkText(text: string, max = 800): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 4);
}

async function synthNeural(
  text: string,
  voice: string,
  rate: string,
  pitch: string,
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate, pitch });
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const merged = Buffer.concat(chunks);
    if (merged.byteLength < 1500) throw new Error("Neural TTS returned empty audio");
    return merged;
  } finally {
    try {
      tts.close();
    } catch {
      /* noop */
    }
  }
}

async function synthFallback(text: string): Promise<Buffer> {
  const chunks = chunkText(text, 170);
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Referer: "https://translate.google.com/" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Fallback TTS ${response.status}`);
    buffers.push(Buffer.from(await response.arrayBuffer()));
  }
  return Buffer.concat(buffers);
}

export async function POST(request: Request) {
  let body: { text?: string; lang?: string; tone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (typeof body.text === "string" ? body.text : "")
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

  const lang = typeof body.lang === "string" ? body.lang.slice(0, 2).toLowerCase() : "en";
  const tone = typeof body.tone === "string" ? body.tone : "blockbuster";
  const voices = VOICE_MAP[lang] ?? VOICE_MAP.en;
  const style = TONE_STYLE[tone] ?? TONE_STYLE.blockbuster;
  const voice = style.voice?.[lang] ?? (style.gender === "female" ? voices.female : voices.male);

  try {
    const audio = await synthNeural(text, voice, style.rate, style.pitch);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    try {
      const audio = await synthFallback(text);
      return new Response(new Uint8Array(audio), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "TTS failed" },
        { status: 502 },
      );
    }
  }
}
