"use client";

const SAMPLES = [
  "Last night I was late for an exam but the exam was a beach and my professor was a crab",
  "My teeth fell out one by one and I caught them in a little bucket like pearls",
  "I was driving my childhood home down the highway like it was a car",
];

const MARQUEE_LINE =
  "NOW SHOWING — YOUR SUBCONSCIOUS — SHOT ON LOCATION IN YOUR HEAD — NO ACTORS WERE HARMED — RATED D FOR DREAMS — ";

interface MarqueeProps {
  onStart: (mode: "speak" | "type") => void;
  onSample: (text: string) => void;
}

export default function Marquee({ onStart, onSample }: MarqueeProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col overflow-hidden px-4 sm:px-6">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(122,76,255,0.22),transparent)] blur-3xl animate-drift"
        aria-hidden
      />

      <header className="flex items-center justify-between py-5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        <span className="text-zinc-400">Dream Journal Pictures</span>
        <span className="hidden sm:block">36mm · Dolby Dream · Somewhere, 3AM</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-7 py-10 text-center">
        <p
          className="animate-rise font-mono text-[10px] uppercase tracking-[0.42em] text-gold/90"
          style={{ animationDelay: "40ms" }}
        >
          A voice note · directed by you
        </p>

        <h1
          className="animate-rise font-display text-shimmer text-[clamp(4rem,16vw,11.5rem)] leading-[0.86] tracking-[0.04em]"
          style={{ animationDelay: "120ms" }}
        >
          DREAM
          <br />
          JOURNAL
        </h1>

        <p
          className="animate-rise max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base"
          style={{ animationDelay: "220ms" }}
        >
          Mumble a dream. We roll cameras, cast your friends, and premiere a
          30-second trailer of your subconscious — tonight only.
        </p>

        <div
          className="animate-rise flex flex-col items-center gap-5"
          style={{ animationDelay: "320ms" }}
        >
          <button
            type="button"
            onClick={() => onStart("speak")}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b from-amber-200 to-amber-400 px-10 py-5 shadow-[0_24px_70px_-18px_rgba(245,197,24,0.55)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-white/40 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
              aria-hidden
            />
            <span className="flex items-center gap-3 font-display text-2xl tracking-[0.14em] text-black sm:text-3xl">
              <span className="h-2.5 w-2.5 animate-rec rounded-full bg-red-600" />
              SPEAK YOUR DREAM
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStart("type")}
            className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500 underline decoration-zinc-700 underline-offset-8 transition-colors hover:text-amber-200"
          >
            or write it down
          </button>
        </div>

        <div
          className="animate-rise mt-6 w-full max-w-3xl"
          style={{ animationDelay: "440ms" }}
        >
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-600">
            From the archive · fan favourites
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {SAMPLES.map((sample, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSample(sample)}
                className={`w-56 cursor-pointer rounded-lg border border-white/10 bg-gradient-to-b from-[#15151d] to-[#0b0b10] p-3 pb-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-300/40 hover:shadow-[0_20px_46px_-20px_rgba(245,197,24,0.35)] ${
                  index === 0
                    ? "-rotate-2"
                    : index === 1
                      ? "rotate-1"
                      : "rotate-2"
                }`}
              >
                <span className="sprockets block h-2.5 rounded-[3px]" aria-hidden />
                <span className="mt-3 block text-xs italic leading-relaxed text-zinc-300">
                  “{sample}”
                </span>
                <span className="mt-3 block font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-600">
                  Mini-trailer · 30s · rated D
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="overflow-hidden border-y border-white/5 py-3">
        <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-600">
          {[0, 1].map((copy) => (
            <span key={copy} className="pr-6">
              {MARQUEE_LINE + MARQUEE_LINE}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
