export type Aspect = "16:9" | "9:16";

export type SceneKind = "setup" | "escalation" | "twist" | "title" | "end_card";

export type ToneKey =
  | "horror"
  | "blockbuster"
  | "romance"
  | "noir"
  | "fantasy"
  | "comedy";

export const TONE_KEYS: ToneKey[] = [
  "horror",
  "blockbuster",
  "romance",
  "noir",
  "fantasy",
  "comedy",
];

export interface Scene {
  kind: SceneKind;
  vo: string;
  imagePrompt: string;
}

export interface CastMember {
  actor: string;
  role: string;
}

export interface TrailerScript {
  title: string;
  genre: string;
  tagline: string;
  rating: string;
  tone: ToneKey;
  lang: string;
  cast: CastMember[];
  scenes: Scene[];
}

export const BASE_DURATION: Record<SceneKind, number> = {
  setup: 2.6,
  escalation: 2.2,
  twist: 2.9,
  title: 2.6,
  end_card: 3.1,
};

export const LEAD = 1.6;
export const END_PAD = 1.4;
export const VO_GAP = 0.55;
export const VO_DELAY = 0.15;
export const VO_RATE = 1.0;
export const DUCK_LEVEL = 0.45;

export interface SceneWindow {
  scene: Scene;
  index: number;
  start: number;
  dur: number;
  voStart: number;
  voDur: number;
}

export function buildTimeline(
  scenes: Scene[],
  voDurs: number[],
): { windows: SceneWindow[]; total: number } {
  let cursor = LEAD;
  const windows: SceneWindow[] = [];
  scenes.forEach((scene, index) => {
    const base = BASE_DURATION[scene.kind] ?? 2.4;
    const spoken =
      scene.kind !== "title" &&
      scene.kind !== "end_card" &&
      scene.vo.trim().length > 0;
    const raw = spoken ? (voDurs[index] ?? 0) : 0;
    const voDur = raw > 0 ? raw / VO_RATE : 0;
    const hasVoice = spoken && voDur > 0;
    const dur = hasVoice ? Math.max(base, voDur + VO_GAP) + 0.2 : base;
    windows.push({
      scene,
      index,
      start: cursor,
      dur,
      voStart: hasVoice ? cursor + VO_DELAY : -1,
      voDur: hasVoice ? voDur : 0,
    });
    cursor += dur;
  });
  return { windows, total: cursor + END_PAD };
}

export const KIND_ORDER: SceneKind[] = [
  "setup",
  "escalation",
  "twist",
  "title",
  "end_card",
];

export function normalizeKinds<T extends { kind: string }>(scenes: T[]): T[] {
  return KIND_ORDER.flatMap((kind) => scenes.filter((s) => s.kind === kind));
}

export function sceneSeed(base: number, index: number, take: number): number {
  return (base + index * 97 + take * 7919) % 99991;
}

export function hashText(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 99991;
}
