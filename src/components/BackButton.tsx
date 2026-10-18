"use client";

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

export default function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group glass inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition-all hover:text-ink hover:border-edge-strong"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path
          d="M7.5 2 3.5 6l4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
