"use client";

import type { RefObject } from "react";

import BackButton from "@/components/BackButton";
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
    "glass flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-all hover:border-edge-strong hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35";

  const contactSheet = thumbs.filter((thumb): thumb is string => Boolean(thumb));

  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center px-4 pb-16 pt-8 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-16 mx-auto h-96 max-w-3xl animate-pop rounded-full bg-[radial-gradient(closest-side,var(--aurora-a),transparent)] blur-3xl"
        aria-hidden
      />

      <header
        className="animate-rise flex w-full max-w-4xl items-center justify-between gap-4 pr-12 lg:pr-0"
        style={{ animationDelay: "40ms" }}
      >
        <BackButton label="The booth" onClick={onBack} />
        <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-faint">
          <span className="h-1.5 w-1.5 animate-rec rounded-full bg-gradient-to-br from-violet to-fuchsia" />
          <span className="truncate">World premiere · {script.genre}</span>
        </span>
      </header>

      <div
        className={`animate-rise mt-8 w-full ${
          aspect === "16:9" ? "max-w-4xl" : "max-w-[min(92vw,400px)]"
        }`}
        style={{ animationDelay: "140ms" }}
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-violet/50 via-fuchsia/40 to-cyan/40 p-px shadow-[0_70px_160px_-45px_var(--stage-shadow)]">
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-black">
            <canvas ref={canvasRef} className="block h-auto w-full" />
            {exporting && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
                <div
                  className="h-full bg-gradient-to-r from-violet via-fuchsia to-cyan transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="animate-rise mt-6 flex w-full max-w-4xl flex-wrap items-center justify-center gap-2"
        style={{ animationDelay: "240ms" }}
      >
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
          className="btn-primary flex h-11 cursor-pointer items-center gap-2 rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.14em]"
          onClick={onDownload}
          disabled={exporting}
        >
          <span className="sheen" aria-hidden />
          <IconDownload />
          {exporting ? `Rendering ${Math.round(progress * 100)}%` : "Download"}
        </button>
      </div>

      <div className="mt-10 h-px w-full max-w-4xl bg-edge">
        <div
          className="h-px bg-gradient-to-r from-violet via-fuchsia to-cyan transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div
        className="glass-strong animate-rise mt-12 w-full max-w-2xl rounded-3xl p-6 shadow-[0_50px_140px_-60px_var(--glow-shadow)] sm:p-8"
        style={{ animationDelay: "340ms" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
              Tonight&apos;s feature
            </p>
            <h2 className="text-gradient mt-2 font-display text-4xl sm:text-5xl">
              {script.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{script.tagline}</p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-violet/15 to-fuchsia/15 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.18em] text-accent ring-1 ring-inset ring-edge-strong">
            {script.rating.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 border-t border-edge pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
            Starring
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {script.cast.map((member, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet/30 to-fuchsia/30 font-display text-sm text-ink ring-1 ring-inset ring-edge">
                  {member.actor.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {member.actor}
                  </p>
                  <p className="truncate text-xs text-faint">as {member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {contactSheet.length > 0 && (
          <div className="mt-6 border-t border-edge pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
              The contact sheet
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {contactSheet.map((thumb, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- object URL previews from generated frames
                <img
                  key={index}
                  src={thumb}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-xl object-cover opacity-80 ring-1 ring-edge transition-all hover:-translate-y-0.5 hover:opacity-100"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-edge pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            {script.lang.toUpperCase()} original · generated live in your browser
          </p>
          <button
            type="button"
            onClick={onNewTake}
            className="btn-ghost cursor-pointer rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink"
          >
            New take
          </button>
        </div>
      </div>
    </div>
  );
}
