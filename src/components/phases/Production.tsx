"use client";

import type { TrailerScript } from "@/lib/trailer/types";

export type SceneState = "waiting" | "filming" | "ready" | "reshoot";

interface ProductionProps {
  take: number;
  label: string;
  pct: number;
  script: TrailerScript | null;
  sceneStates: SceneState[];
  thumbs: (string | null)[];
  error: string;
  onBack: () => void;
}

const KIND_LABEL: Record<string, string> = {
  setup: "SETUP",
  escalation: "ESCALATION",
  twist: "THE TWIST",
  title: "TITLE CARD",
  end_card: "THE POSTER",
};

function stateStamp(state: SceneState): string {
  switch (state) {
    case "filming":
      return "REC";
    case "ready":
      return "LOCKED";
    case "reshoot":
      return "RESHOOT";
    default:
      return "QUEUED";
  }
}

export default function Production({
  take,
  label,
  pct,
  script,
  sceneStates,
  thumbs,
  error,
  onBack,
}: ProductionProps) {
  const pctLabel = Math.round(pct * 100);

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-zinc-500 transition-colors hover:text-amber-200"
        >
          ← the booth
        </button>
        <span className="text-zinc-400">Dream Journal Pictures · Sound Stage 9</span>
        <span>take {String(take).padStart(2, "0")}</span>
      </header>

      {error ? (
        <div className="animate-rise mx-auto mt-16 w-full max-w-md rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-6 text-center">
          <p className="font-display text-2xl tracking-[0.08em] text-red-300">
            THE PROJECT IS CURSED
          </p>
          <p className="mt-3 text-sm leading-relaxed text-red-200/80">{error}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 cursor-pointer rounded-xl border border-red-400/40 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.24em] text-red-200 transition-colors hover:bg-red-500/10"
          >
            back to the booth
          </button>
        </div>
      ) : (
        <>
          <div
            className="animate-rise mt-10 text-center"
            style={{ animationDelay: "60ms" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-gold/80">
              Now filming
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-[0.06em] text-zinc-100 sm:text-6xl">
              {label.toUpperCase()}
            </h2>
            {script && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                {script.title} · {script.genre}
              </p>
            )}
          </div>

          <div className="animate-rise mt-9" style={{ animationDelay: "140ms" }}>
            <div className="relative h-12 overflow-hidden rounded-lg border border-white/10 bg-black/60">
              <div className="sprockets absolute inset-x-0 top-1 h-2 opacity-70" aria-hidden />
              <div className="sprockets absolute inset-x-0 bottom-1 h-2 opacity-70" aria-hidden />
              <div
                className="absolute inset-y-2 left-0 rounded-sm bg-gradient-to-r from-amber-300/60 via-amber-300/80 to-amber-200 transition-[width] duration-500"
                style={{ width: `${pctLabel}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600">
              <span>Processing reel</span>
              <span className="text-amber-200/90">{pctLabel}%</span>
            </div>
          </div>

          <div className="animate-rise mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3" style={{ animationDelay: "220ms" }}>
            {script?.scenes.map((scene, index) => {
              const state = sceneStates[index] ?? "waiting";
              const thumb = thumbs[index];
              const isPoster = scene.kind === "end_card";
              const isTitle = scene.kind === "title";
              return (
                <div
                  key={index}
                  className={`rounded-sm bg-[#e9e2d2] p-2 pb-7 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:-translate-y-1 ${
                    index % 2 === 0 ? "-rotate-1" : "rotate-1"
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden rounded-[3px] bg-[#101014]">
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
                      <div className="grid h-full place-items-center px-3 text-center">
                        {isPoster ? (
                          <span className="text-shimmer font-display text-lg tracking-[0.08em]">
                            {script.title.toUpperCase()}
                          </span>
                        ) : isTitle ? (
                          <span className="animate-rec font-display text-lg tracking-[0.3em] text-zinc-500">
                            TITLE
                          </span>
                        ) : state === "reshoot" ? (
                          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300/90">
                            reshoot queued…
                          </span>
                        ) : (
                          <span className="font-display text-2xl tracking-[0.2em] text-zinc-700">
                            · · ·
                          </span>
                        )}
                      </div>
                    )}
                    {state === "filming" && (
                      <span className="absolute left-1.5 top-1.5 flex items-center gap-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-red-300">
                        <span className="h-1.5 w-1.5 animate-rec rounded-full bg-red-500" />
                        filming
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b5f49]">
                    <span>
                      Scene {String(index + 1).padStart(2, "0")} · {KIND_LABEL[scene.kind] ?? scene.kind}
                    </span>
                    <span
                      className={
                        state === "ready"
                          ? "text-[#3f7a3f]"
                          : state === "filming"
                            ? "text-[#b23a2e]"
                            : state === "reshoot"
                              ? "text-[#a37227]"
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

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            The free studio films one scene at a time · the wait is part of the show
          </p>
        </>
      )}
    </div>
  );
}
