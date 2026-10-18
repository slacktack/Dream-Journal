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
    <div className="relative z-10 flex min-h-dvh flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-5 pr-12 font-mono text-[10px] uppercase tracking-[0.3em] text-faint lg:pr-0">
        <span className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-violet to-fuchsia" />
          Dream Journal Pictures
        </span>
        <span className="hidden sm:block">Trailer studio · open all night</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-7 py-10 text-center">
        <p
          className="glass animate-rise inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
          style={{ animationDelay: "40ms" }}
        >
          <span className="text-shimmer">✦</span>
          A voice note, directed by you
        </p>

        <h1
          className="animate-rise text-shimmer font-display text-[clamp(3.6rem,15vw,10.5rem)] leading-[0.9]"
          style={{ animationDelay: "120ms" }}
        >
          Dream
          <br />
          Journal
        </h1>

        <p
          className="animate-rise max-w-md text-sm leading-relaxed text-muted sm:text-base"
          style={{ animationDelay: "220ms" }}
        >
          Mumble a dream. We write the screenplay, cast your friends, score it,
          and premiere a 30-second trailer of your subconscious — tonight only.
        </p>

        <div
          className="animate-rise flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
          style={{ animationDelay: "320ms" }}
        >
          <button
            type="button"
            onClick={() => onStart("speak")}
            className="btn-primary flex h-14 cursor-pointer items-center gap-3 rounded-full px-8"
          >
            <span className="sheen" aria-hidden />
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em]">
              Speak your dream
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStart("type")}
            className="btn-ghost flex h-14 cursor-pointer items-center gap-2 rounded-full px-7 text-[13px] font-semibold uppercase tracking-[0.18em]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Write it down
          </button>
        </div>

        <div
          className="animate-rise mt-8 w-full max-w-4xl"
          style={{ animationDelay: "440ms" }}
        >
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-faint">
            From the archive · fan favourites
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {SAMPLES.map((sample, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSample(sample)}
                className="glass animate-pop group flex cursor-pointer flex-col rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-edge-strong hover:shadow-[0_24px_60px_-24px_var(--glow-shadow)]"
                style={{ animationDelay: `${480 + index * 90}ms` }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-faint">
                  Reel {String(index + 1).padStart(2, "0")} · rated D
                </span>
                <span className="mt-3 flex-1 text-[13px] italic leading-relaxed text-ink/90">
                  “{sample}”
                </span>
                <span className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Roll this
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="overflow-hidden py-4">
        <div className="glass flex w-max animate-marquee items-center rounded-full px-5 py-2.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
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
