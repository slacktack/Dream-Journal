"use client";

import { useEffect, useRef, useState } from "react";

import BackButton from "@/components/BackButton";

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
      <header className="flex items-center justify-between gap-3 pr-12 lg:pr-0">
        <BackButton label="The marquee" onClick={onBack} />
        <span
          className="glass animate-rise hidden items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted sm:flex"
          style={{ animationDelay: "60ms" }}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              recording ? "animate-rec bg-chip-reshoot" : "bg-faint/60"
            }`}
          />
          {recording ? (live ? "recording · transcribing" : "recording") : "standby"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
          Roll 01 · The dream
        </span>
      </header>

      <div className="mt-6 grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          className="animate-rise flex h-full min-h-[380px] min-w-0 flex-col"
          style={{ animationDelay: "100ms" }}
        >
          <div className="glass-strong relative flex flex-1 flex-col overflow-hidden rounded-3xl shadow-[0_50px_120px_-50px_var(--glow-shadow)]">
            <div className="flex items-center justify-between gap-3 border-b border-edge px-5 py-3.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">
                Your dream, word for word
              </span>
              <span
                className={`flex items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] ${
                  live ? "text-chip-reshoot" : "text-faint"
                }`}
              >
                {live ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-rec rounded-full bg-chip-reshoot" />
                    transcribing
                  </>
                ) : (
                  "tonight, 3am"
                )}
              </span>
            </div>

            <textarea
              value={dream}
              onChange={(event) => onDream(event.target.value)}
              autoFocus={autoFocus}
              spellCheck={false}
              placeholder="The moon applied for my job, and I had to interview it in a bathroom that kept adding doors..."
              className="min-h-[280px] flex-1 resize-none bg-transparent px-5 py-5 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:outline-none"
            />

            <div className="flex items-center gap-4 border-t border-edge px-5 py-3.5">
              <button
                type="button"
                onClick={recording ? stopAll : () => void start()}
                className={`flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
                  recording
                    ? "bg-chip-reshoot/15 text-chip-reshoot ring-1 ring-inset ring-chip-reshoot/40"
                    : "btn-primary"
                }`}
              >
                {!recording && <span className="sheen" aria-hidden />}
                <span className="relative grid h-4 w-4 place-items-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                </span>
                {recording ? "Stop" : "Speak"}
              </button>

              <div ref={barsRef} className="flex h-9 min-w-0 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
                {Array.from({ length: BARS }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] shrink-0 rounded-full bg-gradient-to-t from-violet to-fuchsia opacity-80"
                    style={{ height: recording ? "10%" : "8%" }}
                  />
                ))}
              </div>

              <span className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-faint sm:block">
                {supported ? "mic → local transcript" : "typing mode"}
              </span>
            </div>
          </div>

          <p className="mt-3 px-1 font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            {dream.trim().length} characters · minimum 8 · anything you mumble stays dramatic
          </p>
        </section>

        <aside
          className="glass animate-rise flex min-w-0 flex-col gap-6 rounded-3xl p-6"
          style={{ animationDelay: "200ms" }}
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              The crew
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-faint">
              Real names get cast with dramatic roles.
            </p>
            {cast.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cast.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-2 rounded-full border border-edge-strong bg-panel-strong py-1 pl-1 pr-2.5"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet/40 to-fuchsia/40 font-mono text-[10px] text-ink">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-xs text-ink">{name}</span>
                    <button
                      type="button"
                      onClick={() => onCast(cast.filter((n) => n !== name))}
                      className="cursor-pointer text-faint transition-colors hover:text-chip-reshoot"
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
                className="min-w-0 flex-1 rounded-xl border border-edge bg-input px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCastMember}
                className="btn-ghost cursor-pointer rounded-xl px-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink"
              >
                add
              </button>
            </div>
          </div>

          <div className="border-t border-edge pt-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                Location scout
              </span>
              <input
                value={city}
                onChange={(event) => onCity(event.target.value)}
                placeholder="Mumbai"
                className="rounded-xl border border-edge bg-input px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none"
              />
            </label>
          </div>

          <div className="border-t border-edge pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Genre whisper
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {VIBES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onVibe(option)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-all ${
                    vibe === option
                      ? "bg-gradient-to-r from-violet to-fuchsia text-white shadow-[0_8px_24px_-8px_var(--glow-shadow)]"
                      : "border border-edge bg-panel text-muted hover:border-edge-strong hover:text-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Skip it and the director reads the mood of your dream. Hindi dreams
              come back as Hindi trailers, voices and all.
            </p>
          </div>
        </aside>
      </div>

      <div className="glass-strong fixed inset-x-0 bottom-0 z-30 p-4 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <button
            type="button"
            onClick={onRoll}
            disabled={!readyToRoll}
            className="btn-primary flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-2xl px-6 py-4 text-[15px] font-semibold uppercase tracking-[0.18em] lg:flex-none lg:px-12"
          >
            <span className="sheen" aria-hidden />
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
            </svg>
            Roll camera
          </button>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-faint lg:block">
            The free studio films one scene at a time
            <br />— the wait is part of the show
          </p>
        </div>
      </div>
    </div>
  );
}
