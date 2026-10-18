"use client";

import type { TrailerScript } from "@/lib/trailer/types";

import BackButton from "@/components/BackButton";

export type SceneState = "waiting" | "filming" | "ready" | "reshoot";

interface ProductionProps {
  take: number;
  label: string;
  pct: number;
  waiting: number | null;
  script: TrailerScript | null;
  sceneStates: SceneState[];
  thumbs: (string | null)[];
  error: string;
  onBack: () => void;
}

const KIND_LABEL: Record<string, string> = {
  setup: "Setup",
  escalation: "Escalation",
  twist: "The twist",
  title: "Title card",
  end_card: "The poster",
};

function stateStamp(state: SceneState): string {
  switch (state) {
    case "filming":
      return "REC";
    case "ready":
      return "Locked";
    case "reshoot":
      return "Reshoot";
    default:
      return "Queued";
  }
}

export default function Production({
  take,
  label,
  pct,
  waiting,
  script,
  sceneStates,
  thumbs,
  error,
  onBack,
}: ProductionProps) {
  const pctLabel = Math.round(pct * 100);

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-3 pr-12 lg:pr-0">
        <BackButton label="The booth" onClick={onBack} />
        <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.28em] text-faint sm:block">
          Dream Journal Pictures · Sound Stage 9
        </span>
        <span className="glass shrink-0 rounded-full px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          take {String(take).padStart(2, "0")}
        </span>
      </header>

      {error ? (
        <div className="glass-strong animate-pop mx-auto mt-20 w-full max-w-md rounded-3xl p-7 text-center shadow-[0_40px_120px_-40px_var(--glow-shadow)]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-chip-reshoot/15 text-2xl">
            🎬
          </span>
          <p className="mt-4 font-display text-2xl text-ink">The shoot got cancelled</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{error}</p>
          <button
            type="button"
            onClick={onBack}
            className="btn-primary mt-7 inline-flex h-11 cursor-pointer items-center rounded-full px-6 text-[12px] font-semibold uppercase tracking-[0.16em]"
          >
            <span className="sheen" aria-hidden />
            Back to the booth
          </button>
        </div>
      ) : (
        <>
          <div className="animate-rise mt-14 text-center" style={{ animationDelay: "60ms" }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-accent">
              Now filming
            </p>
            <h2 className="mt-3 font-display text-4xl text-ink sm:text-6xl">
              {label}
            </h2>
            {script && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.26em] text-faint">
                {script.title} · {script.genre}
              </p>
            )}

            {waiting !== null && (
              <p className="animate-pop mx-auto mt-5 inline-flex items-center gap-2.5 rounded-full border border-chip-filming/30 bg-chip-filming/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-chip-filming">
                <span className="h-1.5 w-1.5 animate-rec rounded-full bg-chip-filming" />
                Next shot in {Math.max(waiting, 0)}s — the film lab develops one reel at a time
              </p>
            )}
          </div>

          <div className="animate-rise mx-auto mt-10 w-full max-w-2xl" style={{ animationDelay: "140ms" }}>
            <div className="glass relative h-3 overflow-hidden rounded-full">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-violet via-fuchsia to-cyan transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(pctLabel, 2)}%` }}
              >
                <span className="absolute inset-y-0 right-0 w-8 bg-white/40 blur-sm" aria-hidden />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-faint">
              <span>Processing reel</span>
              <span className="text-accent">{pctLabel}%</span>
            </div>
          </div>

          <div
            className="animate-rise mt-10 grid grid-cols-2 gap-4 pb-4 sm:grid-cols-3"
            style={{ animationDelay: "220ms" }}
          >
            {script?.scenes.map((scene, index) => {
              const state = sceneStates[index] ?? "waiting";
              const thumb = thumbs[index];
              const isPoster = scene.kind === "end_card";
              const isTitle = scene.kind === "title";
              return (
                <div
                  key={index}
                  className={`glass overflow-hidden rounded-2xl p-2.5 transition-all duration-500 hover:-translate-y-1 ${
                    state === "filming" ? "border-chip-filming/50 shadow-[0_20px_60px_-24px_var(--glow-shadow)]" : ""
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-black/60">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- object URL previews from generated frames
                      <img
                        src={thumb}
                        alt=""
                        className={`h-full w-full object-cover transition-opacity duration-700 ${
                          state === "ready" ? "opacity-100" : "opacity-60"
                        }`}
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-4 text-center">
                        {isPoster ? (
                          <span className="text-shimmer font-display text-lg">
                            {script.title}
                          </span>
                        ) : isTitle ? (
                          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
                            Title card
                          </span>
                        ) : state === "reshoot" ? (
                          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-chip-reshoot">
                            Reshoot queued…
                          </span>
                        ) : (
                          <span className="flex gap-1.5" aria-hidden>
                            {[0, 1, 2].map((dot) => (
                              <span
                                key={dot}
                                className="h-1.5 w-1.5 animate-rec rounded-full bg-faint/60"
                                style={{ animationDelay: `${dot * 220}ms` }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    )}

                    {state === "filming" && (
                      <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-chip-filming backdrop-blur">
                        <span className="h-1.5 w-1.5 animate-rec rounded-full bg-chip-filming" />
                        filming
                      </span>
                    )}
                    {state === "ready" && (
                      <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-chip-ready backdrop-blur">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m4 12.5 5 5L20 6.5" />
                        </svg>
                        in the can
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    <span>
                      Scene {String(index + 1).padStart(2, "0")} ·{" "}
                      {KIND_LABEL[scene.kind] ?? scene.kind}
                    </span>
                    <span
                      className={
                        state === "ready"
                          ? "text-chip-ready"
                          : state === "filming"
                            ? "text-chip-filming"
                            : state === "reshoot"
                              ? "text-chip-reshoot"
                              : ""
                      }
                    >
                      {stateStamp(state)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 pb-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
            The free studio films one scene at a time · the wait is part of the show
          </p>
        </>
      )}
    </div>
  );
}
