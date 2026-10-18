import type { SceneWindow, ToneKey } from "./types";
import { DUCK_LEVEL, VO_RATE } from "./types";

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export interface ScoreProfile {
  root: number;
  partials: number[];
  droneLevel: number;
  riserPeak: number;
  subGain: number;
  braamGain: number;
  tickFreq: number;
  whooshGain: number;
  endHitGain: number;
}

export const SCORE_PROFILES: Record<ToneKey, ScoreProfile> = {
  blockbuster: {
    root: 55,
    partials: [55, 82.5],
    droneLevel: 0.05,
    riserPeak: 0.26,
    subGain: 0.5,
    braamGain: 0.95,
    tickFreq: 1500,
    whooshGain: 0.28,
    endHitGain: 0.35,
  },
  horror: {
    root: 46.25,
    partials: [46.25, 65.4, 92.5],
    droneLevel: 0.075,
    riserPeak: 0.18,
    subGain: 0.62,
    braamGain: 1,
    tickFreq: 900,
    whooshGain: 0.12,
    endHitGain: 0.45,
  },
  romance: {
    root: 65.4,
    partials: [65.4, 98, 130.8],
    droneLevel: 0.055,
    riserPeak: 0.14,
    subGain: 0.3,
    braamGain: 0.35,
    tickFreq: 2200,
    whooshGain: 0.18,
    endHitGain: 0.25,
  },
  noir: {
    root: 49,
    partials: [49, 58.3, 73.5],
    droneLevel: 0.065,
    riserPeak: 0.2,
    subGain: 0.45,
    braamGain: 0.7,
    tickFreq: 1200,
    whooshGain: 0.2,
    endHitGain: 0.32,
  },
  fantasy: {
    root: 55,
    partials: [55, 82.5, 110, 164.8],
    droneLevel: 0.06,
    riserPeak: 0.28,
    subGain: 0.45,
    braamGain: 0.9,
    tickFreq: 1600,
    whooshGain: 0.24,
    endHitGain: 0.35,
  },
  comedy: {
    root: 73.4,
    partials: [73.4, 110, 146.8],
    droneLevel: 0.045,
    riserPeak: 0.16,
    subGain: 0.3,
    braamGain: 0.4,
    tickFreq: 2400,
    whooshGain: 0.3,
    endHitGain: 0.22,
  },
};

interface DroneVoice {
  osc: OscillatorNode;
  gain: GainNode;
}

export class Score {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly music: GainNode;
  readonly voice: GainNode;
  readonly profile: ScoreProfile;

  private droneGain: GainNode;
  private droneVoices: DroneVoice[] = [];
  private noise: AudioBuffer;
  private sources: AudioScheduledSourceNode[] = [];

  constructor(ctx: AudioContext, tone: ToneKey) {
    this.ctx = ctx;
    this.profile = SCORE_PROFILES[tone] ?? SCORE_PROFILES.blockbuster;

    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(ctx.destination);

    this.music = ctx.createGain();
    this.music.gain.value = 1;
    this.music.connect(this.master);

    this.voice = ctx.createGain();
    this.voice.gain.value = 1;
    this.voice.connect(this.master);

    this.noise = makeNoiseBuffer(ctx, 2);

    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.0001;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 55;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(lp);
      osc.start();
      this.droneVoices.push({ osc, gain });
    }
    lp.connect(this.droneGain);
    this.droneGain.connect(this.music);
  }

  private applyPartials() {
    const partials = this.profile.partials;
    this.droneVoices.forEach(({ osc, gain }, i) => {
      if (i < partials.length) {
        osc.frequency.value = partials[i];
        gain.gain.value = 1 / partials.length;
      } else {
        gain.gain.value = 0;
      }
    });
  }

  private track<T extends AudioScheduledSourceNode>(node: T): T {
    this.sources.push(node);
    return node;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    return this.track(src);
  }

  private riser(t: number, dur: number, scale = 1) {
    const peak = this.profile.riserPeak * scale;
    const src = this.noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.92);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    src.connect(bp).connect(g).connect(this.music);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  private tick(t: number) {
    const osc = this.track(this.ctx.createOscillator());
    osc.type = "square";
    osc.frequency.value = this.profile.tickFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g).connect(this.music);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  private subHit(t: number, scale = 1) {
    const gain = this.profile.subGain * scale;
    const osc = this.track(this.ctx.createOscillator());
    osc.type = "sine";
    osc.frequency.setValueAtTime(this.profile.root, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(this.profile.root * 0.55, 24), t + 0.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    osc.connect(g).connect(this.music);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  private braam(t: number) {
    const gain = this.profile.braamGain;
    if (gain <= 0.01) return;
    const root = this.profile.root * 2;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(140, t + 1.2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.setValueAtTime(gain, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    lp.connect(g).connect(this.music);
    for (const f of [root, root * 1.012, root * 2]) {
      const osc = this.track(this.ctx.createOscillator());
      osc.type = "sawtooth";
      osc.frequency.value = f;
      const og = this.ctx.createGain();
      og.gain.value = 0.3;
      osc.connect(og).connect(lp);
      osc.start(t);
      osc.stop(t + 1.9);
    }
  }

  private whoosh(t: number) {
    const src = this.noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(5000, t);
    bp.frequency.exponentialRampToValueAtTime(280, t + 0.55);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(this.profile.whooshGain, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    src.connect(bp).connect(g).connect(this.music);
    src.start(t);
    src.stop(t + 0.7);
  }

  private droneSwell(t: number, level: number) {
    this.droneGain.gain.setTargetAtTime(level, Math.max(t - 0.05, 0), 0.5);
    this.droneGain.gain.setTargetAtTime(this.profile.droneLevel, t + 1.2, 0.8);
  }

  reset() {
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* noop */
      }
    }
    this.sources = [];
    for (const param of [
      this.master.gain,
      this.music.gain,
      this.droneGain.gain,
    ]) {
      param.cancelScheduledValues(0);
      param.setValueAtTime(0.0001, 0);
    }
    this.master.gain.setValueAtTime(1, 0);
    this.music.gain.setValueAtTime(1, 0);
    this.droneGain.gain.setValueAtTime(0.0001, 0);
  }

  schedule(
    t0: number,
    windows: SceneWindow[],
    voBuffers: (AudioBuffer | null)[],
    total: number,
  ) {
    this.reset();
    this.applyPartials();
    const t = (rel: number) => t0 + rel;

    this.master.gain.setValueAtTime(0.0001, t0);
    this.master.gain.linearRampToValueAtTime(1, t0 + 0.08);
    this.master.gain.setValueAtTime(1, t0 + Math.max(total - 0.55, 0.2));
    this.master.gain.setTargetAtTime(0, t0 + total - 0.5, 0.16);

    this.droneGain.gain.setValueAtTime(0.0001, t0);
    this.droneGain.gain.setTargetAtTime(this.profile.droneLevel, t0 + 0.1, 0.9);

    for (const w of windows) {
      const start = t(w.start);
      switch (w.scene.kind) {
        case "setup":
          if (w.start > 1.25) this.riser(start - 1.2, 1.2, 0.85);
          this.tick(start);
          break;
        case "escalation":
          this.tick(start);
          this.subHit(start, 1);
          this.droneSwell(start, this.profile.droneLevel * 1.7);
          break;
        case "twist":
          this.riser(start - 1.4, 1.4, 1);
          this.subHit(start, 1.1);
          this.droneSwell(start, this.profile.droneLevel * 1.9);
          break;
        case "title":
          this.riser(start - 2.2, 2.2, 1.15);
          this.braam(start);
          this.whoosh(start);
          this.droneSwell(start, this.profile.droneLevel * 2.4);
          break;
        case "end_card":
          this.subHit(start, this.profile.endHitGain / Math.max(this.profile.subGain, 0.01));
          break;
      }
      const buffer = voBuffers[w.index];
      if (w.voStart >= 0 && buffer) {
        const src = this.track(this.ctx.createBufferSource());
        src.buffer = buffer;
        src.playbackRate.value = VO_RATE;
        src.connect(this.voice);
        src.start(t(w.voStart));
        this.music.gain.setTargetAtTime(
          DUCK_LEVEL,
          t(Math.max(w.voStart - 0.05, 0)),
          0.08,
        );
        this.music.gain.setTargetAtTime(1, t(w.voStart + w.voDur + 0.35), 0.25);
      }
    }
  }

  connectExport(dest: MediaStreamAudioDestinationNode) {
    this.master.connect(dest);
  }

  disconnectExport(dest: MediaStreamAudioDestinationNode) {
    try {
      this.master.disconnect(dest);
    } catch {
      /* noop */
    }
  }

  setMuted(muted: boolean) {
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
  }

  stopAll() {
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        /* noop */
      }
    }
    this.sources = [];
  }
}
