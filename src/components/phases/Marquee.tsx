"use client";

const SAMPLES = [
  "The moon applied for my job, and I had to interview it in a bathroom that kept adding doors",
  "Every time I told a lie a pigeon flew out of my mouth, and by midnight they had formed a government",
  "I was best man at my own funeral, and the eulogy was just my ex laughing in surround sound",
];

const MARQUEE_LINE =
  "NOW SHOWING — YOUR SUBCONSCIOUS — SHOT ON LOCATION IN YOUR HEAD — NO ACTORS WERE HARMED — RATED D FOR DREAMS — ";

interface MarqueeProps {
  onStart: (mode: "speak" | "type") => void;
  onSample: (text: string) => void;
}

export default function Marquee({ onStart, onSample }: MarqueeProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col px-4 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between border-b border-edge py-4 pr-12">
        <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
          <span className="h-2.5 w-2.5 bg-accent" aria-hidden />
          Dream Journal Pictures
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-faint sm:block">
          Trailer studio · open all night
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <p
              className="animate-rise font-mono text-[10px] uppercase tracking-[0.4em] text-accent"
              style={{ animationDelay: "40ms" }}
            >
              Issue 01 — tonight only
            </p>

            <h1
              className="animate-rise mt-5 font-display text-[clamp(4.4rem,17vw,12rem)] leading-[0.82] tracking-[0.01em]"
              style={{ animationDelay: "110ms" }}
            >
              <span className="block text-ink">DREAM</span>
              <span className="block text-accent">JOURNAL</span>
            </h1>

            <p
              className="animate-rise mt-7 max-w-md text-[15px] leading-relaxed text-muted"
              style={{ animationDelay: "200ms" }}
            >
              Mumble a dream. We write the screenplay, cast your friends, score
              it, and premiere a 30-second trailer of your subconscious.
            </p>

            <div
              className="animate-rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: "280ms" }}
            >
              <button
                type="button"
                onClick={() => onStart("speak")}
                className="btn-primary flex h-13 cursor-pointer items-center justify-center gap-3 rounded-lg px-8 py-3.5"
              >
                <span className="grid h-6 w-6 place-items-center rounded-sm bg-black/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                </span>
                <span className="text-[13px] font-bold uppercase tracking-[0.16em]">
                  Speak your dream
                </span>
              </button>

              <button
                type="button"
                onClick={() => onStart("type")}
                className="btn-ghost flex h-13 cursor-pointer items-center justify-center gap-2.5 rounded-lg px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.16em]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Write it down
              </button>
            </div>
          </div>

          <div
            className="animate-rise flex flex-col justify-end"
            style={{ animationDelay: "360ms" }}
          >
            <p className="border-b border-edge pb-3 font-mono text-[10px] uppercase tracking-[0.34em] text-faint">
              From the archive — fan favourites
            </p>
            <div className="flex flex-col">
              {SAMPLES.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSample(sample)}
                  className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-edge py-4 text-left transition-colors hover:bg-panel"
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-faint transition-colors group-hover:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] italic leading-relaxed text-ink/90">
                      “{sample}”
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                      Mini-trailer · 30s · rated D
                    </span>
                  </span>
                  <span className="flex items-center gap-2 self-center font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                    <span className="hidden sm:inline">Roll this</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="overflow-hidden border-t border-edge py-3.5">
        <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
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
