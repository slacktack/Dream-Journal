import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dream Journal — The Trailer Studio",
  description:
    "Mumble a dream. We roll cameras, hire your friends, and premiere a 30-second cinematic trailer of your subconscious — tonight only.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07060d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f5fb" },
  ],
  width: "device-width",
  initialScale: 1,
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("dj-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <div className="aurora" aria-hidden>
          <div className="blob" />
          <div className="blob b2" />
        </div>
        {children}
      </body>
    </html>
  );
}
