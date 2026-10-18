"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultLike };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const VIBES = [
  "Blockbuster",
  "A24 horror",
  "Rom-com",
  "Neo-noir mystery",
  "Epic fantasy",
  "Deadpan comedy",
];

const BARS = 36;

interface BoothProps {
  dream: string;
  onDream: (value: string) => void;
  cast: string[];
  onCast: (value: string[]) => void;
  city: string;
  onCity: (value: string) => void;
  vibe: string;
  onVibe: (value: string) => void;
  autoFocus: boolean;
  onBack: () => void;
  onRoll: () => void;
}

export default function Booth({
  dream,
  onDream,
  cast,
  onCast,
  city,
  onCity,
  vibe,
  onVibe,
  autoFocus,
  onBack,
  onRoll,
}: BoothProps) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const [live, setLive] = useState(false);
  const [castDraft, setCastDraft] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const rafRef = useRef(0);
  const finalRef = useRef("");
  const baseRef = useRef("");
  const barsRef = useRef<HTMLDivElement | null>(null);
  const dreamRef = useRef(dream);
  const onDreamRef = useRef(onDream);

  useEffect(() => {
    dreamRef.current = dream;
    onDreamRef.current = onDream;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- speech support is only detectable in the browser
    setSupported(getRecognitionCtor() !== null);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  function stopAll() {
    cancelAnimationFrame(rafRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setRecording(false);
    setLive(false);
  }

  function animate() {
    const analyser = analyserRef.current;
    const bars = barsRef.current;
    rafRef.current = requestAnimationFrame(animate);
    if (!analyser || !bars) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const children = bars.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const wobble = 0.55 + Math.random() * 0.45;
      const height = Math.max(8, Math.min(100, rms * 430 * wobble));
      el.style.height = `${height}%`;
    }
  }

  async function start() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const Ctor = getRecognitionCtor();
      if (Ctor) {
        const recognition = new Ctor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        baseRef.current = dreamRef.current.trim();
        finalRef.current = "";
        recognition.onresult = (event) => {
          let interim = "";
          let finalText = finalRef.current;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += `${result[0].transcript} `;
            } else {
              interim += result[0].transcript;
            }
          }
          finalRef.current = finalText;
          const combined = `${baseRef.current} ${finalText}${interim}`
            .replace(/\s+/g, " ")
            .trim();
          onDreamRef.current(combined);
        };
        recognition.onerror = () => setLive(false);
        recognition.onend = () => {
          setLive(false);
          if (recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              /* noop */
            }
          }
        };
        recognitionRef.current = recognition;
        recognition.start();
        setLive(true);
      }

      setRecording(true);
      cancelAnimationFrame(rafRef.current);
      animate();
    } catch {
      stopAll();
    }
  }

  function addCastMember() {
    const names = castDraft
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    const merged = [...cast];
    for (const name of names) {
      if (merged.length >= 4) break;
      if (!merged.some((m) => m.toLowerCase() === name.toLowerCase())) {
        merged.push(name);
      }
    }
    onCast(merged);
    setCastDraft("");
  }

  const readyToRoll = dream.trim().length >= 8;

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-32 pt-5 sm:px-6 lg:pb-12">
      <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-zinc-500 transition-colors hover:text-amber-200"
        >
          ← the marquee
        </button>
        <span className="animate-rise hidden text-zinc-400 sm:block" style={{ animationDelay: "60ms" }}>
          Roll 01 · The Dream
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              recording ? "animate-rec bg-red-500" : "bg-zinc-700"
            }`}
          />
          {recording ? "recording" : "standby"}
        </span>
      </header>

      <div className="mt-6 grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section
          className="animate-rise flex h-full min-h-[380px] flex-col"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl bg-[#f4edda] shadow-[0_50px_110px_-35px_rgba(0,0,0,0.95)]">
            <div className="pointer-events-none absolute inset-y-0 left-10 w-px bg-red-400/50" aria-hidden />
            <div className="pointer-events-none absolute inset-y-0 left-[3.05rem] w-px bg-red-400/20" aria-hidden />

            <div className="flex items-center justify-between border-b border-[#e2d6bb] py-3 pl-16 pr-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a7a5c]">
              <span>Fade in · your dream</span>
              <span className={live ? "text-[#b23a2e]" : ""}>
                {live ? "● transcribing" : "int. your head — night"}
              </span>
            </div>

            <textarea
              value={dream}
              onChange={(event) => onDream(event.target.value)}
              autoFocus={autoFocus}
              spellCheck={false}
              placeholder="Last night I was late for an exam but the exam was a beach and my professor was a crab..."
              className="ruled min-h-[280px] flex-1 resize-none bg-transparent py-4 pl-16 pr-6 font-mono text-[15px] leading-8 text-[#221c12] placeholder:text-[#a3957a] focus:outline-none"
            />

            <div className="flex items-center gap-4 border-t border-[#e2d6bb] py-3 pl-16 pr-5">
              <button
                type="button"
                onClick={recording ? stopAll : () => void start()}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  recording
                    ? "border-red-500/60 bg-red-500/15 text-red-600"
                    : "border-[#c9b98f] bg-[#efe6cf] text-[#6b5c3c] hover:border-[#a38b52] hover:text-[#4d4128]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    recording ? "animate-rec bg-red-600" : "bg-[#b23a2e]"
                  }`}
                />
                {recording ? "stop" : "speak"}
              </button>

              <div ref={barsRef} className="flex h-9 min-w-0 flex-1 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: BARS }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] shrink-0 rounded-full bg-[#c58e2a]"
                    style={{ height: recording ? "10%" : "8%" }}
                  />
                ))}
              </div>

              <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7a5c] sm:block">
                {supported ? "mic → local transcript" : "typing mode"}
              </span>
            </div>
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-600">
            {dream.trim().length} characters · minimum 8 · anything you mumble stays dramatic
          </p>
        </section>

        <aside
          className="animate-rise flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          style={{ animationDelay: "200ms" }}
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              The crew
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Real names get cast with dramatic roles.
            </p>
            {cast.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cast.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] py-1 pl-1 pr-2.5"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-300/20 font-mono text-[10px] text-amber-200">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-200">{name}</span>
                    <button
                      type="button"
                      onClick={() => onCast(cast.filter((n) => n !== name))}
                      className="cursor-pointer text-zinc-500 transition-colors hover:text-red-300"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={castDraft}
                onChange={(event) => setCastDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addCastMember();
                  }
                }}
                placeholder="Rohan, Priya, Mom"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-300/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCastMember}
                className="cursor-pointer rounded-lg border border-dashed border-white/20 px-3 text-xs text-zinc-400 transition-colors hover:border-amber-300/50 hover:text-amber-200"
              >
                add
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Location scout
              </span>
              <input
                value={city}
                onChange={(event) => onCity(event.target.value)}
                placeholder="Mumbai"
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-300/40 focus:outline-none"
              />
            </label>
          </div>

          <div className="border-t border-white/5 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              Genre whisper
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {VIBES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onVibe(option)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    vibe === option
                      ? "border-amber-300/60 bg-amber-300/15 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
              Skip it and the director reads the mood of your dream. Hindi dreams
              come back as Hindi trailers, voices and all.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050507]/90 p-4 backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <button
            type="button"
            onClick={onRoll}
            disabled={!readyToRoll}
            className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-amber-200 to-amber-400 px-6 py-4 font-display text-xl tracking-[0.16em] text-black shadow-[0_20px_60px_-20px_rgba(245,197,24,0.6)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 disabled:shadow-none lg:flex-none lg:px-12"
          >
            <span className="animate-spin-slow text-lg leading-none" aria-hidden>
              ◉
            </span>
            ROLL CAMERA
          </button>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600 lg:block">
            The free studio films one scene at a time
            <br />
            — about a minute of shooting
          </p>
        </div>
      </div>
    </div>
  );
}
