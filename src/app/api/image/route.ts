export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const REFERRER = "dreamjournal.vercel.app";
const TOKEN = process.env.POLLINATIONS_TOKEN ?? "";

const TONE_STYLE: Record<string, string> = {
  horror:
    "cinematic horror film still, anamorphic 35mm lens, deep cold shadows, desaturated teal and rust grade, volumetric fog, film grain, no text, no letters, no watermark",
  blockbuster:
    "cinematic blockbuster film still, anamorphic 35mm lens, golden hour hero lighting, epic scale, high contrast amber and teal grade, lens flares, film grain, no text, no letters, no watermark",
  romance:
    "cinematic romance film still, anamorphic lens, warm golden sunlight, soft dreamy bokeh, glowing skin tones, honey and rose pastel grade, tender bright mood, film grain, no text, no letters, no watermark",
  noir:
    "cinematic film noir still, high contrast black and white, hard venetian blind shadows, cigarette smoke haze, rain-slick streets, dramatic chiaroscuro, film grain, no text, no letters, no watermark",
  fantasy:
    "cinematic fantasy film still, anamorphic lens, lush vivid colors, magical god rays, ethereal glowing mist, emerald and violet grade, awe-inspiring scale, film grain, no text, no letters, no watermark",
  comedy:
    "cinematic comedy film still, bright saturated colors, crisp playful daylight, bold cheerful production design, punchy teal and coral grade, fun energetic mood, film grain, no text, no letters, no watermark",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function attempt(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/jpeg,image/png,image/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(50_000),
  });
}

export async function POST(request: Request) {
  let body: { prompt?: string; aspect?: string; seed?: number; tone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return Response.json({ error: "Missing prompt" }, { status: 400 });

  const aspect = body.aspect === "9:16" ? "9:16" : "16:9";
  const [width, height] = aspect === "9:16" ? [720, 1280] : [1280, 720];
  const seed = Number.isFinite(body.seed) ? Math.floor(body.seed as number) : 7;
  const style = TONE_STYLE[typeof body.tone === "string" ? body.tone : ""] ?? TONE_STYLE.blockbuster;

  let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${prompt}, ${style}`,
  )}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&referrer=${REFERRER}`;
  if (TOKEN) url += `&token=${encodeURIComponent(TOKEN)}`;

  let response: Response | null = null;
  try {
    response = await attempt(url);
  } catch {
    await sleep(1200);
    try {
      response = await attempt(url);
    } catch {
      return Response.json({ error: "Image engine unreachable" }, { status: 502 });
    }
  }

  if (response.ok) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength >= 1000) {
      return new Response(buffer, {
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }
  }

  if (response.status === 402 || response.status === 429) {
    const retryAfter = Math.min(
      Math.max(Number(response.headers.get("retry-after")) || 6, 4),
      10,
    );
    return Response.json(
      { error: "Image engine is cooling down", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  return Response.json(
    { error: `Image generation failed (${response.status})` },
    { status: 502 },
  );
}
