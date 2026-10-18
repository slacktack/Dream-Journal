"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Booth from "@/components/phases/Booth";
import Marquee from "@/components/phases/Marquee";
import Premiere from "@/components/phases/Premiere";
import Production, { type SceneState } from "@/components/phases/Production";
import { TrailerEngine, type TrailerAssets } from "@/lib/trailer/engine";
import {
  hashText,
  sceneSeed,
  type Aspect,
  type TrailerScript,
} from "@/lib/trailer/types";

type Phase = "marquee" | "booth" | "production" | "premiere";

const FALLBACK_FONTS = {
  display: '"Bebas Neue", "Arial Narrow", Impact, sans-serif',
  ui: "ui-sans-serif, system-ui, sans-serif",
};

const DEVANAGARI =
  '"Noto Sans Devanagari", "Kohinoor Devanagari", "Devanagari Sangam MN"';

let sharedAudioCtx: AudioContext | null = null;
function ensureAudioCtx(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new Ctor();
  }
  return sharedAudioCtx;
}

function readFonts() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const display = cs.getPropertyValue("--font-display").trim();
    const ui = cs.getPropertyValue("--font-sans").trim();
    return {
      display: display
        ? `${display}, "Arial Narrow", Impact, ${DEVANAGARI}, sans-serif`
        : FALLBACK_FONTS.display,
      ui: ui
        ? `${ui}, ui-sans-serif, system-ui, ${DEVANAGARI}, sans-serif`
        : FALLBACK_FONTS.ui,
    };
  } catch {
    return FALLBACK_FONTS;
  }
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "dream"
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SceneImage {
  bitmap: ImageBitmap;
  url: string;
}

async function fetchSceneImage(
  prompt: string,
  seed: number,
  aspect: string,
  index: number,
  failed: number[],
): Promise<SceneImage | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect, seed }),
      });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 1000) {
          const url = URL.createObjectURL(blob);
          const bitmap = await createImageBitmap(blob);
          return { bitmap, url };
        }
      } else if (response.status === 429) {
        const data = (await response.json().catch(() => ({}))) as { retryAfter?: number };
        const wait = Math.min(Math.max(Number(data.retryAfter) || 15, 6), 26) * 1000;
        await sleep(wait);
        continue;
      }
    } catch {
      /* network hiccup */
    }
    await sleep(2500);
  }
  if (!failed.includes(index)) failed.push(index);
  return null;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("marquee");
  const [startMode, setStartMode] = useState<"speak" | "type">("speak");

  const [dream, setDream] = useState("");
  const [castList, setCastList] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [vibe, setVibe] = useState("Blockbuster");

  const [script, setScript] = useState<TrailerScript | null>(null);
  const [sceneStates, setSceneStates] = useState<SceneState[]>([]);
  const [thumbs, setThumbs] = useState<(string | null)[]>([]);
  const [stageLabel, setStageLabel] = useState("");
  const [stagePct, setStagePct] = useState(0);
  const [error, setError] = useState("");
  const [take, setTake] = useState(1);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aspect, setAspect] = useState<Aspect>("16:9");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TrailerEngine | null>(null);
  const assetsRef = useRef<TrailerAssets | null>(null);
  const scriptRef = useRef<TrailerScript | null>(null);
  const mutedRef = useRef(muted);
  const takeRef = useRef(1);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- device-based default, client only
      setAspect("9:16");
    }
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  const mountEngine = useCallback(
    async (nextScript: TrailerScript, assets: TrailerAssets, nextAspect: Aspect) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      engineRef.current?.dispose();
      const fonts = readFonts();
      const opts = {
        aspect: nextAspect,
        tone: nextScript.tone,
        fontDisplay: fonts.display,
        fontUi: fonts.ui,
      };
      await TrailerEngine.prepareFonts(canvas, opts);
      const engine = new TrailerEngine(canvas, nextScript, assets, opts);
      engine.onProgress = (t, total) => setProgress(total > 0 ? t / total : 0);
      engine.onEnded = () => setPlaying(false);
      engine.setMuted(mutedRef.current);
      engineRef.current = engine;
      return engine;
    },
    [],
  );

  useEffect(() => {
    if (phase !== "premiere") return;
    const nextScript = scriptRef.current;
    const assets = assetsRef.current;
    if (!nextScript || !assets || engineRef.current) return;
    let cancelled = false;
    (async () => {
      const engine = await mountEngine(nextScript, assets, aspect);
      if (!engine || cancelled) return;
      await engine.play();
      setPlaying(true);
    })();
    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      setPlaying(false);
    };
  }, [phase, aspect, mountEngine]);

  function markScene(index: number, state: SceneState) {
    setSceneStates((prev) => {
      const next = [...prev];
      next[index] = state;
      return next;
    });
  }

  async function generate() {
    const text = dream.trim();
    if (text.length < 8 || phase === "production") return;

    takeRef.current += 1;
    setTake(takeRef.current);
    setPhase("production");
    setError("");
    setPlaying(false);
    setProgress(0);
    setScript(null);
    setSceneStates([]);
    setThumbs([]);
    engineRef.current?.dispose();
    engineRef.current = null;
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];

    try {
      setStageLabel("Writing the screenplay");
      setStagePct(0.05);

      const scriptResponse = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream: text, cast: castList, city, vibe }),
      });
      if (!scriptResponse.ok) {
        const data = (await scriptResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "The screenplay writer is napping. Try again.");
      }
      const nextScript = (await scriptResponse.json()) as TrailerScript;
      setScript(nextScript);
      setSceneStates(
        nextScript.scenes.map((scene) => (scene.kind === "end_card" ? "ready" : "waiting")),
      );
      setThumbs(nextScript.scenes.map(() => null));

      setStageLabel("Recording the voiceover");
      setStagePct(0.14);
      const audioCtx = ensureAudioCtx();
      const voBuffers = await Promise.all(
        nextScript.scenes.map(async (scene) => {
          if (!scene.vo || scene.kind === "title" || scene.kind === "end_card") return null;
          try {
            const response = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: scene.vo,
                lang: nextScript.lang,
                tone: nextScript.tone,
              }),
            });
            if (!response.ok) return null;
            const buffer = await response.arrayBuffer();
            return await audioCtx.decodeAudioData(buffer);
          } catch {
            return null;
          }
        }),
      );

      const base = hashText(text);
      const images: TrailerAssets["images"] = nextScript.scenes.map(() => null);
      const total = nextScript.scenes.length;
      const titleIndex = nextScript.scenes.findIndex((s) => s.kind === "title");
      const twistIndex = nextScript.scenes.findIndex((s) => s.kind === "twist");
      const failed: number[] = [];
      const shotCount = nextScript.scenes.filter(
        (s) => s.kind !== "end_card" && s.kind !== "title",
      ).length;
      let shots = 0;

      for (let i = 0; i < total; i++) {
        const scene = nextScript.scenes[i];
        if (scene.kind === "end_card" || scene.kind === "title") continue;
        shots += 1;
        setStageLabel(`Filming scene ${shots} of ${shotCount}`);
        setStagePct(0.2 + (0.72 * shots) / shotCount);
        markScene(i, "filming");
        const shot = await fetchSceneImage(
          scene.imagePrompt,
          sceneSeed(base, i, takeRef.current),
          aspect,
          i,
          failed,
        );
        if (shot) {
          images[i] = shot.bitmap;
          urlsRef.current.push(shot.url);
          setThumbs((prev) => {
            const next = [...prev];
            next[i] = shot.url;
            return next;
          });
          markScene(i, "ready");
        } else {
          markScene(i, "reshoot");
        }
        await sleep(1800);
      }

      if (titleIndex >= 0) {
        images[titleIndex] =
          twistIndex >= 0 && images[twistIndex] ? images[twistIndex] : null;
      }

      if (failed.length > 0) {
        setStageLabel("Reshooting the lost scenes");
        setStagePct(0.93);
        for (const i of failed) {
          await sleep(6000);
          markScene(i, "filming");
          const retry = await fetchSceneImage(
            nextScript.scenes[i].imagePrompt,
            sceneSeed(base, i, takeRef.current),
            aspect,
            i,
            [],
          );
          if (retry) {
            images[i] = retry.bitmap;
            if (titleIndex >= 0 && i === twistIndex) images[titleIndex] = retry.bitmap;
            urlsRef.current.push(retry.url);
            setThumbs((prev) => {
              const next = [...prev];
              next[i] = retry.url;
              return next;
            });
            markScene(i, "ready");
          } else {
            markScene(i, "reshoot");
          }
        }
      }

      setStageLabel("Scoring and color grading");
      setStagePct(0.97);
      assetsRef.current = { images, voBuffers };

      await sleep(700);
      setStagePct(1);
      setPhase("premiere");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  async function handlePlayPause() {
    const engine = engineRef.current;
    if (!engine || exporting) return;
    if (playing) {
      await engine.pause();
      setPlaying(false);
    } else if (progress > 0.001 && progress < 0.999) {
      await engine.resume();
      setPlaying(true);
    } else {
      await engine.play();
      setPlaying(true);
    }
  }

  async function handleReplay() {
    const engine = engineRef.current;
    if (!engine || exporting) return;
    await engine.play();
    setPlaying(true);
  }

  function handleToggleMute() {
    const next = !muted;
    setMuted(next);
    engineRef.current?.setMuted(next);
  }

  async function handleToggleAspect() {
    const nextScript = scriptRef.current;
    const assets = assetsRef.current;
    if (!nextScript || !assets || exporting) return;
    const next: Aspect = aspect === "16:9" ? "9:16" : "16:9";
    setAspect(next);
    await mountEngine(nextScript, assets, next);
    setPlaying(false);
    setProgress(0);
  }

  async function handleDownload() {
    const engine = engineRef.current;
    if (!engine || exporting) return;
    setExporting(true);
    setPlaying(true);
    try {
      const { blob, ext } = await engine.exportVideo();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slugify(scriptRef.current?.title ?? "dream")}-trailer.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setError("Export failed in this browser. Try Chrome or Safari. Playback still works.");
    } finally {
      setExporting(false);
      setPlaying(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {phase === "marquee" && (
        <Marquee
          onStart={(mode) => {
            setStartMode(mode);
            setPhase("booth");
          }}
          onSample={(sample) => {
            setDream(sample);
            setStartMode("type");
            setPhase("booth");
          }}
        />
      )}

      {phase === "booth" && (
        <Booth
          dream={dream}
          onDream={setDream}
          cast={castList}
          onCast={setCastList}
          city={city}
          onCity={setCity}
          vibe={vibe}
          onVibe={setVibe}
          autoFocus={startMode === "type"}
          onBack={() => setPhase("marquee")}
          onRoll={() => void generate()}
        />
      )}

      {phase === "production" && (
        <Production
          take={take}
          label={stageLabel || "Preparing the shoot"}
          pct={stagePct}
          script={script}
          sceneStates={sceneStates}
          thumbs={thumbs}
          error={error}
          onBack={() => setPhase("booth")}
        />
      )}

      {phase === "premiere" && script && (
        <Premiere
          canvasRef={canvasRef}
          script={script}
          thumbs={thumbs}
          aspect={aspect}
          playing={playing}
          exporting={exporting}
          muted={muted}
          progress={progress}
          onPlayPause={() => void handlePlayPause()}
          onReplay={() => void handleReplay()}
          onToggleMute={handleToggleMute}
          onToggleAspect={() => void handleToggleAspect()}
          onDownload={() => void handleDownload()}
          onNewTake={() => setPhase("booth")}
          onBack={() => setPhase("booth")}
        />
      )}
    </div>
  );
}
