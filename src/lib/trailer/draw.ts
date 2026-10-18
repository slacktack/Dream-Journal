import type { SceneWindow, TrailerScript } from "./types";
import { LEAD, END_PAD } from "./types";

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

export interface DrawState {
  script: TrailerScript;
  windows: SceneWindow[];
  images: (ImageBitmap | null)[];
  total: number;
  fontDisplay: string;
  fontUi: string;
  patterns: CanvasPattern[];
  aspect: "16:9" | "9:16";
}

export function makeNoisePatterns(ctx: CanvasRenderingContext2D): CanvasPattern[] {
  const alphas = [0.13, 0.085, 0.05];
  return alphas.map((alpha) => {
    const tile = document.createElement("canvas");
    tile.width = 256;
    tile.height = 256;
    const tctx = tile.getContext("2d");
    if (!tctx) return ctx.createPattern(tile, "repeat") as CanvasPattern;
    const img = tctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 255 * alpha;
    }
    tctx.putImageData(img, 0, 0);
    return ctx.createPattern(tile, "repeat")!;
  });
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function setFont(
  ctx: Ctx2D,
  font: string,
  letterSpacing: string,
  fill: string,
  align: CanvasTextAlign = "center",
) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  try {
    ctx.letterSpacing = letterSpacing;
  } catch {
    /* unsupported */
  }
}

function wrapText(ctx: Ctx2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCover(
  ctx: Ctx2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  W: number,
  H: number,
  scale: number,
  tx: number,
  ty: number,
) {
  const base = Math.max(W / iw, H / ih) * scale;
  const dw = iw * base;
  const dh = ih * base;
  ctx.drawImage(img, (W - dw) / 2 + tx, (H - dh) / 2 + ty, dw, dh);
}

function drawFallbackBg(ctx: Ctx2D, W: number, H: number, index: number) {
  const palettes: [string, string, string][] = [
    ["#0b0d16", "#1a1430", "#3b2a5a"],
    ["#0d0b0a", "#2a1a12", "#5a3a1e"],
    ["#080d0d", "#12262a", "#1e4a52"],
  ];
  const p = palettes[index % palettes.length];
  const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
  g.addColorStop(0, p[2]);
  g.addColorStop(0.45, p[1]);
  g.addColorStop(1, p[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawScene(
  ctx: Ctx2D,
  state: DrawState,
  t: number,
): { bar: number } {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const bar = state.aspect === "16:9" ? (H - W / 2.35) / 2 : (H - W / 0.6) / 2;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const { windows, images } = state;

  if (t < LEAD) {
    const a = clamp01((t - 0.25) / 0.6) * (1 - clamp01((t - (LEAD - 0.45)) / 0.45));
    if (a > 0.01) {
      setFont(ctx, `500 ${Math.round(H * 0.021)}px ${state.fontUi}`, "6px", `rgba(232,232,240,${a * 0.85})`);
      ctx.fillText("DREAM JOURNAL PICTURES", W / 2, H * 0.47);
      setFont(ctx, `400 ${Math.round(H * 0.016)}px ${state.fontUi}`, "3px", `rgba(200,200,212,${a * 0.6})`);
      ctx.fillText("p r e s e n t s", W / 2, H * 0.515);
    }
    return { bar };
  }

  const last = windows[windows.length - 1];
  const lastEnd = last ? last.start + last.dur : LEAD;
  if (t >= lastEnd) {
    return { bar };
  }

  let idx = 0;
  let local = 0;
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    if (t >= w.start && t < w.start + w.dur) {
      idx = i;
      local = t - w.start;
      break;
    }
  }
  const w = windows[idx];
  if (!w) return { bar };
  const p = clamp01(local / w.dur);
  const kind = w.scene.kind;
  const img = images[idx];

  const isImageScene = kind === "setup" || kind === "escalation" || kind === "twist" || kind === "title";

  if (isImageScene) {
    const dir = idx % 2 === 0 ? 1 : -1;
    const scale = 1.08 + 0.1 * (dir > 0 ? p : 1 - p);
    const tx = (p - 0.5) * 24 * dir;
    const ty = (p - 0.5) * 12 * (dir > 0 ? -1 : 1);
    try {
      ctx.filter = "contrast(1.08) saturate(0.92) brightness(0.96) sepia(0.12)";
    } catch {
      /* no filter support */
    }
    if (img) {
      drawCover(ctx, img, img.width, img.height, W, H, scale, tx, ty);
    } else {
      drawFallbackBg(ctx, W, H, idx);
    }
    try {
      ctx.filter = "none";
    } catch {
      /* noop */
    }
  }

  if (kind === "title") {
    ctx.fillStyle = `rgba(0,0,0,${0.38 + 0.12 * clamp01(local / w.dur)})`;
    ctx.fillRect(0, 0, W, H);

    const tr = easeOutBack(clamp01(local / 0.45));
    const shake = local < 0.5 ? (1 - local / 0.5) * 16 : 0;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    const scale = 1 + 0.6 * (1 - tr);

    ctx.save();
    ctx.translate(W / 2 + sx, H * 0.44 + sy);
    ctx.scale(scale, scale);
    const titleSize = Math.round(H * (state.aspect === "9:16" ? 0.085 : 0.12));
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 26;
    setFont(ctx, `400 ${titleSize}px ${state.fontDisplay}`, "10px", "rgba(240,238,232,0.97)");
    ctx.fillText(state.script.title.toUpperCase(), 0, 0);
    ctx.restore();

    const sub = clamp01((local - 0.35) / 0.4);
    if (sub > 0.01) {
      setFont(ctx, `500 ${Math.round(H * 0.022)}px ${state.fontUi}`, "7px", `rgba(232,193,90,${sub * 0.95})`);
      ctx.fillText(state.script.genre.toUpperCase(), W / 2, H * 0.44 - titleSize * 0.86);
      setFont(ctx, `400 ${Math.round(H * 0.023)}px ${state.fontUi}`, "2px", `rgba(216,216,226,${sub * 0.85})`);
      ctx.fillText(state.script.tagline, W / 2, H * 0.44 + titleSize * 0.85);
    }
  }

  if (kind === "end_card") {
    const a = clamp01(local / 0.6);
    const H2 = H;
    setFont(ctx, `500 ${Math.round(H2 * 0.018)}px ${state.fontUi}`, "5px", `rgba(180,180,192,${a * 0.8})`);
    ctx.fillText("DREAM JOURNAL PICTURES", W / 2, H2 * 0.16);

    setFont(ctx, `400 ${Math.round(H2 * 0.07)}px ${state.fontDisplay}`, "8px", `rgba(240,238,232,${a})`);
    ctx.fillText(state.script.title.toUpperCase(), W / 2, H2 * 0.27);

    setFont(ctx, `400 ${Math.round(H2 * 0.024)}px ${state.fontUi}`, "1px", `rgba(210,210,222,${a * 0.9})`);
    ctx.fillText(state.script.tagline, W / 2, H2 * 0.345);

    ctx.strokeStyle = `rgba(232,193,90,${a * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.34, H2 * 0.39);
    ctx.lineTo(W * 0.66, H2 * 0.39);
    ctx.stroke();

    setFont(ctx, `500 ${Math.round(H2 * 0.016)}px ${state.fontUi}`, "4px", `rgba(160,160,174,${a * 0.85})`);
    ctx.fillText("STARRING", W / 2, H2 * 0.435);

    const cast = state.script.cast.slice(0, 4);
    cast.forEach((member, i) => {
      const y = H2 * 0.485 + i * H2 * 0.062;
      setFont(ctx, `400 ${Math.round(H2 * 0.028)}px ${state.fontDisplay}`, "3px", `rgba(236,236,242,${a})`);
      ctx.fillText(member.actor.toUpperCase(), W / 2, y);
      setFont(ctx, `400 ${Math.round(H2 * 0.016)}px ${state.fontUi}`, "3px", `rgba(159,159,172,${a * 0.9})`);
      ctx.fillText(`as ${member.role}`, W / 2, y + H2 * 0.032);
    });

    const ratingY = H2 * 0.485 + cast.length * H2 * 0.062 + H2 * 0.055;
    ctx.save();
    ctx.strokeStyle = `rgba(232,193,90,${a * 0.75})`;
    ctx.lineWidth = 1.5;
    ctx.font = `600 ${Math.round(H2 * 0.019)}px ${state.fontUi}`;
    const textW = ctx.measureText(state.script.rating.toUpperCase()).width;
    const pad = H2 * 0.02;
    ctx.strokeRect(W / 2 - textW / 2 - pad, ratingY - H2 * 0.026, textW + pad * 2, H2 * 0.052);
    ctx.restore();
    setFont(ctx, `600 ${Math.round(H2 * 0.019)}px ${state.fontUi}`, "2px", `rgba(232,193,90,${a * 0.95})`);
    ctx.fillText(state.script.rating.toUpperCase(), W / 2, ratingY);

    setFont(ctx, `400 ${Math.round(H2 * 0.015)}px ${state.fontUi}`, "3px", `rgba(140,140,152,${a * 0.8})`);
    ctx.fillText("IN THEATERS WHENEVER YOU WAKE UP", W / 2, H2 * 0.9);
  }

  if (kind === "setup" || kind === "escalation" || kind === "twist") {
    if (w.voStart >= 0 && w.scene.vo) {
      const tt = t - w.voStart;
      const end = w.voDur + 0.6;
      if (tt > -0.3 && tt < end) {
        const alpha = clamp01((tt + 0.3) / 0.4) * (1 - clamp01((tt - end + 0.4) / 0.4));
        const size = Math.round(H * (state.aspect === "9:16" ? 0.03 : 0.032));
        setFont(ctx, `600 ${size}px ${state.fontUi}`, "0.5px", `rgba(245,245,248,${alpha * 0.96})`);
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = 12;
        const lines = wrapText(ctx, w.scene.vo.toUpperCase(), W * 0.86);
        const lh = size * 1.5;
        const baseY = H - bar - 26 - (lines.length - 1) * lh;
        lines.forEach((line, i) => {
          ctx.fillText(line, W / 2, baseY + i * lh);
        });
        ctx.shadowBlur = 0;
      }
    }
  }

  return { bar };
}

export function drawFrame(ctx: CanvasRenderingContext2D, state: DrawState, t: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const c = ctx as Ctx2D;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;

  const { bar } = drawScene(c, state, t);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, bar);
  ctx.fillRect(0, H - bar, W, bar);

  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (t >= LEAD && t < state.total) {
    let idx = -1;
    let local = 0;
    for (let i = 0; i < state.windows.length; i++) {
      const wi = state.windows[i];
      if (t >= wi.start && t < wi.start + wi.dur) {
        idx = i;
        local = t - wi.start;
        break;
      }
    }
    const kind = idx >= 0 ? state.windows[idx].scene.kind : null;
    const cut = t - LEAD < 0.09;
    if (kind && (kind === "escalation" || kind === "twist" || kind === "title") && (local < 0.06 || cut)) {
      const flash = local < 0.06 ? 0.25 * (1 - local / 0.06) : 0.12;
      ctx.fillStyle = `rgba(255,255,255,${flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  for (const pattern of state.patterns) {
    const ox = Math.random() * 256;
    const oy = Math.random() * 256;
    ctx.save();
    ctx.translate(-ox, -oy);
    ctx.globalAlpha = 0.38 + Math.random() * 0.22;
    ctx.fillStyle = pattern;
    ctx.fillRect(ox, oy, W + 256, H + 256);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = `rgba(255,240,220,${0.015 + Math.random() * 0.01})`;
  ctx.fillRect(0, 0, W, H);

  if (t >= state.total - 0.01 && t < state.total + END_PAD) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }
}
