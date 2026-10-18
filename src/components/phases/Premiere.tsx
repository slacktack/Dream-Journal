"use client";

import type { RefObject } from "react";
import type { Aspect, TrailerScript } from "@/lib/trailer/types";

interface PremiereProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  script: TrailerScript;
  thumbs: (string | null)[];
  aspect: Aspect;
  playing: boolean;
  exporting: boolean;
  muted: boolean;
  progress: number;
  onPlayPause: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  onToggleAspect: () => void;
  onDownload: () => void;
  onNewTake: () => void;
  onBack: () => void;
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}

function IconReplay() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

function IconMute({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <>
          <line x1="16" y1="9" x2="21" y2="15" />
          <line x1="21" y1="9" x2="16" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function Premiere({
  canvasRef,
  script,
  thumbs,
  aspect,
  playing,
  exporting,
  muted,
  progress,
  onPlayPause,
  onReplay,
  onToggleMute,
  onToggleAspect,
  onDownload,
  onNewTake,
  onBack,
}: PremiereProps) {
  const glassBtn =
    "flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-200 backdrop-blur transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-35";

  const contactSheet = thumbs.filter((thumb): thumb is string => Boolean(thumb));

  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center px-4 pb-16 pt-8 sm:px-6">
      <div className="lb-top pointer-events-none fixed inset-x-0 top-0 z-20 h-[6vh] bg-black" aria-hidden />
      <div className="lb-bot pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[6vh] bg-black" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-80 max-w-3xl animate-glow rounded-full bg-[radial-gradient(closest-side,rgba(245,197,24,0.18),transparent)] blur-3xl"
        aria-hidden
      />

      <header className="animate-rise flex w-full max-w-4xl items-center justify-between font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-500" style={{ animationDelay: "40ms" }}>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-zinc-500 transition-colors hover:text-amber-200"
        >
          ← the booth
        </button>
        <span>Now showing · {script.genre}</span>
      </header>

      <div
        className={`animate-rise mt-8 w-full ${
          aspect === "16:9" ? "max-w-4xl" : "max-w-[min(92vw,400px)]"
        }`}
        style={{ animationDelay: "140ms" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_70px_160px_-45px_rgba(0,0,0,1)]">
          <canvas ref={canvasRef} className="block h-auto w-full" />
          {exporting && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
              <div
                className="h-full bg-amber-300 transition-[width] duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="animate-rise mt-6 flex w-full max-w-4xl flex-wrap items-center justify-center gap-2" style={{ animationDelay: "240ms" }}>
        <button type="button" className={glassBtn} onClick={onPlayPause} disabled={exporting}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className={glassBtn} onClick={onReplay} disabled={exporting}>
          <IconReplay />
          Replay
        </button>
        <button type="button" className={glassBtn} onClick={onToggleMute}>
          <IconMute muted={muted} />
          {muted ? "Unmute" : "Mute"}
        </button>
        <button type="button" className={glassBtn} onClick={onToggleAspect} disabled={exporting}>
          {aspect === "16:9" ? "16:9" : "9:16"}
        </button>
        <button
          type="button"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-amber-200 to-amber-400 px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_16px_44px_-16px_rgba(245,197,24,0.7)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onDownload}
          disabled={exporting}
        >
          <IconDownload />
          {exporting ? `Rendering ${Math.round(progress * 100)}%` : "Download"}
        </button>
      </div>

      <div className="mt-10 h-px w-full max-w-4xl bg-white/10">
        <div
          className="h-px bg-gradient-to-r from-amber-300 to-amber-200 transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div
        className="animate-rise mt-12 w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8"
        style={{ animationDelay: "340ms" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl tracking-[0.05em] text-zinc-50 sm:text-5xl">
              {script.title.toUpperCase()}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{script.tagline}</p>
          </div>
          <span className="rounded border border-amber-300/50 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-amber-200">
            {script.rating.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Starring
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {script.cast.map((member, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-300/15 font-mono text-xs text-amber-200">
                  {member.actor.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {member.actor}
                  </p>
                  <p className="truncate text-xs text-zinc-500">as {member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {contactSheet.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              The contact sheet
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {contactSheet.map((thumb, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- object URL previews from generated frames
                <img
                  key={index}
                  src={thumb}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded object-cover opacity-80 ring-1 ring-white/10 transition-opacity hover:opacity-100"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-600">
            {script.lang.toUpperCase()} original · generated live in your browser
          </p>
          <button
            type="button"
            onClick={onNewTake}
            className="cursor-pointer rounded-xl border border-white/15 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-amber-300/50 hover:text-amber-200"
          >
            new take
          </button>
        </div>
      </div>
    </div>
  );
}
