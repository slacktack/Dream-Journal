import { drawFrame, makeNoisePatterns, type DrawState } from "./draw";
import { Score } from "./score";
import {
  buildTimeline,
  type Aspect,
  type SceneWindow,
  type ToneKey,
  type TrailerScript,
} from "./types";

export interface TrailerAssets {
  images: (ImageBitmap | null)[];
  voBuffers: (AudioBuffer | null)[];
}

export interface EngineOptions {
  aspect: Aspect;
  tone: ToneKey;
  fontDisplay: string;
  fontUi: string;
}

export class TrailerEngine {
  readonly canvas: HTMLCanvasElement;
  readonly script: TrailerScript;
  readonly assets: TrailerAssets;
  readonly windows: SceneWindow[];
  readonly total: number;
  readonly audioCtx: AudioContext;

  onProgress: ((t: number, total: number) => void) | null = null;
  onEnded: (() => void) | null = null;

  private ctx: CanvasRenderingContext2D;
  private score: Score;
  private state: DrawState;
  private raf = 0;
  private t0 = 0;
  private active = false;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    script: TrailerScript,
    assets: TrailerAssets,
    opts: EngineOptions,
  ) {
    this.canvas = canvas;
    this.script = script;
    this.assets = assets;

    const voDurs = assets.voBuffers.map((b) => (b ? b.duration : 0));
    const { windows, total } = buildTimeline(script.scenes, voDurs);
    this.windows = windows;
    this.total = total;

    canvas.width = opts.aspect === "16:9" ? 1280 : 720;
    canvas.height = opts.aspect === "16:9" ? 720 : 1280;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    this.audioCtx = new AudioContext();
    this.score = new Score(this.audioCtx, opts.tone);

    this.state = {
      script,
      windows,
      images: assets.images,
      total,
      fontDisplay: opts.fontDisplay,
      fontUi: opts.fontUi,
      patterns: makeNoisePatterns(ctx),
      aspect: opts.aspect,
    };

    this.render(0);
  }

  static async prepareFonts(canvas: HTMLCanvasElement, opts: EngineOptions) {
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await Promise.all([
        document.fonts.load(`64px ${opts.fontDisplay}`),
        document.fonts.load(`600 24px ${opts.fontUi}`),
      ]);
      await document.fonts.ready;
    } catch {
      /* fall back to system fonts */
    }
  }

  private render(t: number) {
    drawFrame(this.ctx, this.state, t);
  }

  private loop = () => {
    if (!this.active || this.disposed) return;
    const t = this.audioCtx.currentTime - this.t0;
    if (t >= this.total) {
      this.active = false;
      this.render(this.total - 0.001);
      this.onProgress?.(this.total, this.total);
      this.onEnded?.();
      return;
    }
    this.render(Math.max(0, t));
    this.onProgress?.(t, this.total);
    this.raf = requestAnimationFrame(this.loop);
  };

  async play() {
    if (this.disposed) return;
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
    cancelAnimationFrame(this.raf);
    this.score.stopAll();
    this.t0 = this.audioCtx.currentTime + 0.12;
    this.score.schedule(this.t0, this.windows, this.assets.voBuffers, this.total);
    this.active = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  async pause() {
    if (this.disposed) return;
    this.active = false;
    cancelAnimationFrame(this.raf);
    if (this.audioCtx.state === "running") await this.audioCtx.suspend();
  }

  async resume() {
    if (this.disposed) return;
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();
    this.active = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.loop);
  }

  async stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.score.stopAll();
    if (this.audioCtx.state === "running") await this.audioCtx.suspend();
    this.render(0);
    this.onProgress?.(0, this.total);
  }

  setMuted(muted: boolean) {
    this.score.setMuted(muted);
  }

  async exportVideo(): Promise<{ blob: Blob; ext: string }> {
    const stream = this.canvas.captureStream(30);
    const dest = this.audioCtx.createMediaStreamDestination();
    this.score.connectExport(dest);
    for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);

    const types = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const mime = types.find((type) => {
      try {
        return MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    });

    const recorder = new MediaRecorder(
      stream,
      mime ? { mimeType: mime, videoBitsPerSecond: 9_000_000 } : undefined,
    );
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const stopped = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    });

    await this.play();
    const previousEnded = this.onEnded;
    const ended = new Promise<void>((resolve) => {
      this.onEnded = () => resolve();
    });
    recorder.start(250);
    await ended;
    await new Promise((resolve) => setTimeout(resolve, 400));
    recorder.stop();
    const blob = await stopped;

    this.onEnded = previousEnded;
    this.score.disconnectExport(dest);
    for (const track of dest.stream.getTracks()) track.stop();

    return {
      blob,
      ext: recorder.mimeType.includes("mp4") ? "mp4" : "webm",
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.score.stopAll();
    void this.audioCtx.close().catch(() => {});
  }
}
