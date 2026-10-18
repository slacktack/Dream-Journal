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
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} h-full`}
    >
      <body className="min-h-dvh bg-[#050507] text-zinc-100 antialiased">
        <div className="film-grain" aria-hidden />
        <div className="film-vignette" aria-hidden />
        {children}
      </body>
    </html>
  );
}
