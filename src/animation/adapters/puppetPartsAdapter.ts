import { settings } from '../../engine/settings';
import type {
  CastEntry,
  CharacterAction,
  CharacterEmotion,
  CharacterPose,
  Gait,
} from '../../engine/storyTypes';
import { sleep } from '../../engine/timing';
import { CLIPS } from '../../rig/clips';
import { RIG_POSES } from '../../rig/poseTemplates';
import type { ActingMotion, AnimationOptions, PoseTransitionOptions } from '../animationTypes';
import { PuppetBoneAnimator } from '../puppetBoneAnimator';
import type { PuppetCharacterManifest, PuppetRigDefinition } from '../puppetRigTypes';
import { BaseAdapter, warnOnce } from './baseAdapter';

interface ClipSpec {
  clip: string;
  loops?: number;
  rate?: number;
  energetic?: boolean;
}

const ACTION_CLIPS: Partial<Record<CharacterAction, ClipSpec>> = {
  nod: { clip: 'nod' },
  shakeHead: { clip: 'shakeHead' },
  wave: { clip: 'wave' },
  jump: { clip: 'jump', energetic: true },
  bounce: { clip: 'bounce' },
  recoil: { clip: 'recoil' },
  tremble: { clip: 'tremble', loops: 6, energetic: true },
  actScared: { clip: 'tremble', loops: 6, energetic: true },
  treePose: { clip: 'treePose' },
  sit: { clip: 'sit' },
  laugh: { clip: 'laugh' },
  cry: { clip: 'cry' },
  point: { clip: 'point' },
  dance: { clip: 'dance', loops: 2, energetic: true },
  fall: { clip: 'fall', energetic: true },
};

const SPECIAL_POSES = new Set<CharacterPose>([
  'talkHappy',
  'talkAngry',
  'scared',
  'laugh',
  'sit',
  'point',
  'handsOnHips',
  'surprised',
  'dance',
  'fall',
]);

/**
 * Hybrid generated-art adapter.
 *
 * Idle, dialogue, walking, blinking, nodding, waving, trembling, and other
 * small actions use nested HTML bones assembled from the character manifest.
 * Difficult acting beats crossfade to the supplied coherent full-body poses.
 */
export class PuppetPartsAdapter extends BaseAdapter {
  private scaleLayer: HTMLDivElement | null = null;
  private animationLayer: HTMLDivElement | null = null;
  private puppet: HTMLDivElement | null = null;
  private rigArt: HTMLDivElement | null = null;
  private activeSprite: HTMLImageElement | null = null;
  private standbySprite: HTMLImageElement | null = null;
  private animator: PuppetBoneAnimator | null = null;
  private bones = new Map<string, HTMLDivElement>();
  private features = new Map<'brows' | 'eyes' | 'mouth' | 'headClosed' | 'headOpen', HTMLImageElement>();
  private rigDefinition: PuppetRigDefinition | null = null;
  private currentEmotion: CharacterEmotion = 'neutral';
  private currentAsset = '';
  private swapVersion = 0;
  private idling = false;
  private talking = false;
  private talkOpen = false;
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private talkTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    inner.classList.add('puppet-parts-host');
    this.scaleLayer = document.createElement('div');
    this.scaleLayer.className = 'puppet-scale-layer';
    this.scaleLayer.style.height = `${((this.entry.scale ?? this.entry.appearance?.height ?? 1) * 100).toFixed(1)}%`;

    this.animationLayer = document.createElement('div');
    this.animationLayer.className = 'puppet-animation-layer';
    this.puppet = document.createElement('div');
    this.puppet.className = 'puppet puppet-hybrid';
    this.puppet.dataset.animation = 'loading-rig';

    this.rigArt = document.createElement('div');
    this.rigArt.className = 'puppet-rig-art';
    this.activeSprite = this.makeSprite('is-active');
    this.standbySprite = this.makeSprite('');
    this.puppet.append(this.rigArt, this.activeSprite, this.standbySprite, this.makeDebugOverlay());
    this.animationLayer.appendChild(this.puppet);
    this.scaleLayer.appendChild(this.animationLayer);
    inner.appendChild(this.scaleLayer);

    const initial = this.entry.asset ?? this.entry.poseAssets?.idle;
    if (initial) {
      this.currentAsset = initial;
      this.activeSprite.src = initial;
      this.applyPoseScale(this.activeSprite, 'idle');
    } else {
      this.activeSprite.hidden = true;
    }
    void this.loadLayeredRig();
  }

  unmount(): void {
    this.swapVersion += 1;
    this.stopBlinking();
    this.stopTalking();
    this.animator?.dispose();
    this.animator = null;
    this.bones.clear();
    this.features.clear();
    this.rigDefinition = null;
    this.scaleLayer = null;
    this.animationLayer = null;
    this.puppet = null;
    this.rigArt = null;
    this.activeSprite = null;
    this.standbySprite = null;
    super.unmount();
  }

  async setEmotion(emotion: CharacterEmotion): Promise<void> {
    this.currentEmotion = emotion;
    if (this.rigDefinition && !this.rigDefinition.face) {
      if (emotion === 'neutral') {
        this.showRig();
        return;
      }
      const source = this.entry.emotionAssets?.[emotion];
      if (source) {
        this.stopIdle();
        await this.showPoseSprite(source, this.poseForEmotion(emotion));
        return;
      }
    }
    this.updateFace();
  }

  async transitionToPose(pose: CharacterPose, options: PoseTransitionOptions = {}): Promise<boolean> {
    if (!this.puppet || !this.animationLayer) return false;
    this.setDebugAnimation(pose);

    const preferSprite = options.preferSprite ?? SPECIAL_POSES.has(pose);
    // Only use an exact pose asset here. Falling back to the neutral sprite
    // would hide a perfectly good puppet interpretation of the requested cue.
    const specialSource = preferSprite ? this.entry.poseAssets?.[pose] : undefined;
    if (specialSource) {
      this.stopIdle();
      const shown = await this.showPoseSprite(specialSource, pose);
      if (!shown) return this.transitionRigToPose(pose, options);
      await this.playWholeBodyMotion(options.motion ?? 'settle');
      return true;
    }
    return this.transitionRigToPose(pose, options);
  }

  async playAction(action: CharacterAction, _options?: AnimationOptions): Promise<void> {
    if (!this.animationLayer || !this.puppet) return;
    if (action === 'idle' || action === 'stand') {
      await this.transitionToPose('idle', { durationMs: 280, motion: 'settle' });
      return;
    }
    if (action === 'turnAround') {
      await this.turnAround();
      return;
    }

    const spec = ACTION_CLIPS[action];
    if (this.animator && spec) {
      this.showRig();
      if (spec.energetic && settings.reduceMotion) {
        await sleep(220);
        return;
      }
      this.stopIdle();
      this.setDebugAnimation(action);
      await this.animator.play(CLIPS[spec.clip], { loops: spec.loops, rate: spec.rate });
      if (!CLIPS[spec.clip].holdEnd) {
        await this.animator.toRest(190);
        this.startIdle();
      }
      return;
    }

    // A clean whole-character fallback remains available while a manifest is
    // loading or if an optional bone clip is unavailable.
    await this.playFallbackMotion(action);
  }

  startIdle(): void {
    if (this.idling || settings.reduceMotion) return;
    this.idling = true;
    this.animationLayer?.classList.add('is-idle');
    if (this.animator) void this.animator.play(CLIPS.idle);
  }

  stopIdle(): void {
    this.idling = false;
    this.animationLayer?.classList.remove('is-idle');
    this.animator?.stop();
  }

  startTalking(): void {
    this.talking = true;
    this.animationLayer?.classList.add('is-talking');
    if ((!this.features.get('mouth') && !this.features.get('headOpen')) || this.talkTimer) return;
    const advanceMouth = () => {
      if (!this.talking) return;
      this.talkOpen = !this.talkOpen;
      this.updateMouth();
      // A lightly varied cadence reads more like syllables than a mechanical flap.
      const delay = this.talkOpen ? 105 : 150 + Math.round(Math.random() * 70);
      this.talkTimer = setTimeout(advanceMouth, delay);
    };
    this.talkTimer = setTimeout(advanceMouth, 90);
  }

  stopTalking(): void {
    this.talking = false;
    this.talkOpen = false;
    this.animationLayer?.classList.remove('is-talking');
    if (this.talkTimer) clearTimeout(this.talkTimer);
    this.talkTimer = null;
    this.updateMouth();
  }

  protected onMoveStart(gait: Gait): void {
    this.stopIdle();
    this.showRig();
    this.setDebugAnimation(gait === 'run' ? 'run' : 'walk');
    this.animationLayer?.classList.add(gait === 'run' ? 'is-running' : 'is-walking');
    if (this.animator) void this.animator.play(CLIPS.walk, { rate: gait === 'run' ? 1.75 : 1 });
  }

  protected onMoveEnd(): void {
    this.animationLayer?.classList.remove('is-walking', 'is-running');
    if (!this.animator) {
      this.startIdle();
      return;
    }
    this.animator.stop();
    void this.animator.toRest(220).then(() => this.startIdle());
  }

  private async loadLayeredRig(): Promise<void> {
    if (!this.entry.assetManifest || !this.rigArt || !this.puppet) return;
    try {
      // Character manifests are authoring assets and can change independently
      // of the JS bundle; avoid a stale browser copy after an art update.
      const response = await fetch(this.entry.assetManifest, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest returned ${response.status}`);
      const manifest = await response.json() as PuppetCharacterManifest;
      if (manifest.renderMode !== 'hybrid' || !manifest.rig) throw new Error('manifest has no hybrid rig');
      if (!this.rigArt || !this.puppet) return;
      this.rigDefinition = manifest.rig;
      this.buildRig(manifest.rig);
      const images = [...this.rigArt.querySelectorAll('img')];
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
      if (!this.rigArt || !this.puppet) return;
      this.animator = new PuppetBoneAnimator(this.bones, manifest.rig.rotationScale ?? 0.7);
      this.populateDebugOverlay(manifest.rig);
      this.updateFace();
      if (manifest.rig.face && !manifest.rig.talkingHead && !this.isMouthOnlyFace()) this.startBlinking();
      if (!manifest.rig.face && this.currentEmotion !== 'neutral') {
        const source = this.entry.emotionAssets?.[this.currentEmotion];
        const shown = source
          ? await this.showPoseSprite(source, this.poseForEmotion(this.currentEmotion))
          : false;
        if (!shown) this.showRig();
      } else {
        this.showRig();
      }
      this.setDebugAnimation('idle');
      this.startIdle();
    } catch (error) {
      warnOnce(
        `puppet-manifest-${this.entry.displayName}`,
        `${this.entry.displayName}'s layered rig could not load; keeping clean pose sprites. ${String(error)}`,
      );
      this.setDebugAnimation('pose fallback');
      this.startIdle();
    }
  }

  private buildRig(definition: PuppetRigDefinition): void {
    if (!this.rigArt) return;
    this.rigArt.replaceChildren();
    this.rigArt.style.aspectRatio = String(definition.aspectRatio);
    this.bones.clear();
    this.features.clear();

    for (const [name, bone] of Object.entries(definition.bones)) {
      const element = document.createElement('div');
      element.className = 'puppet-bone';
      element.dataset.bone = name;
      element.style.transformOrigin = `${bone.pivot[0]}% ${bone.pivot[1]}%`;
      element.style.zIndex = String(bone.z ?? 0);
      this.bones.set(name, element);
    }
    for (const [name, bone] of Object.entries(definition.bones)) {
      const element = this.bones.get(name)!;
      const parent = bone.parent ? this.bones.get(bone.parent) : undefined;
      (parent ?? this.rigArt).appendChild(element);
    }
    for (const layer of definition.layers) {
      const bone = this.bones.get(layer.bone);
      if (!bone) continue;
      const image = document.createElement('img');
      image.className = 'puppet-rig-layer';
      image.dataset.layer = layer.name;
      image.src = layer.asset;
      image.alt = '';
      image.draggable = false;
      const [left, top, width, height] = layer.box;
      Object.assign(image.style, {
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: String(layer.z ?? 0),
      });
      if (layer.feature === 'headOpen') {
        image.style.opacity = '0';
        image.style.visibility = 'hidden';
      }
      bone.appendChild(image);
      if (layer.feature) this.features.set(layer.feature, image);
    }
  }

  private async transitionRigToPose(pose: CharacterPose, options: PoseTransitionOptions): Promise<boolean> {
    this.showRig();
    if (!this.animator) {
      const fallback = this.resolvePoseAsset(pose) ?? this.entry.asset;
      return fallback ? this.showPoseSprite(fallback, pose) : false;
    }
    this.stopIdle();
    const template = RIG_POSES[pose] ?? RIG_POSES.idle;
    const durationMs = options.durationMs ?? 280;
    if (this.puppet) {
      this.puppet.style.transitionDuration = `${durationMs}ms`;
      this.puppet.style.transform = template.presentation;
    }
    await this.animator.toPose(template.bones, durationMs, pose);
    await this.playWholeBodyMotion(options.motion ?? template.motion ?? 'none');
    if (pose === 'idle') this.startIdle();
    return true;
  }

  private showRig(): void {
    this.puppet?.classList.add('is-rig-active');
    this.puppet?.classList.remove('is-special-pose');
    this.setDebugMode('puppet');
  }

  private async showPoseSprite(source: string, pose: CharacterPose): Promise<boolean> {
    const swapped = await this.swapTo(source, pose);
    if (!swapped) return false;
    this.puppet?.classList.remove('is-rig-active');
    this.puppet?.classList.add('is-special-pose');
    this.setDebugMode('pose sprite');
    return true;
  }

  private resolvePoseAsset(pose: CharacterPose): string | undefined {
    return this.entry.poseAssets?.[pose]
      ?? this.entry.emotionAssets?.[this.currentEmotion]
      ?? this.entry.asset;
  }

  private poseForEmotion(emotion: CharacterEmotion): CharacterPose {
    if (emotion === 'happy') return 'talkHappy';
    if (emotion === 'angry') return 'talkAngry';
    if (emotion === 'laughing') return 'laugh';
    if (emotion === 'scared' || emotion === 'sad') return 'scared';
    if (emotion === 'surprised') return 'surprised';
    return 'talkNeutral';
  }

  private makeSprite(extraClass: string): HTMLImageElement {
    const image = document.createElement('img');
    image.className = `puppet-pose-sprite ${extraClass}`.trim();
    image.alt = this.entry.displayName;
    image.draggable = false;
    return image;
  }

  private async swapTo(source: string, pose: CharacterPose): Promise<boolean> {
    if (!this.activeSprite || !this.standbySprite) return false;
    if (source === this.currentAsset) {
      this.applyPoseScale(this.activeSprite, pose);
      return true;
    }
    const version = ++this.swapVersion;
    const incoming = this.standbySprite;
    incoming.src = source;
    this.applyPoseScale(incoming, pose);
    try {
      await incoming.decode();
    } catch {
      warnOnce(`puppet-pose-${this.entry.displayName}-${pose}`, `${this.entry.displayName}'s ${pose} sprite could not load.`);
      return false;
    }
    if (version !== this.swapVersion || !this.activeSprite || !this.standbySprite) return false;
    incoming.classList.add('is-active');
    this.activeSprite.classList.remove('is-active');
    await sleep(settings.reduceMotion ? 40 : 170);
    const outgoing = this.activeSprite;
    this.activeSprite = incoming;
    this.standbySprite = outgoing;
    this.currentAsset = source;
    return true;
  }

  private applyPoseScale(image: HTMLImageElement, pose: CharacterPose): void {
    image.style.height = `${((this.entry.poseScales?.[pose] ?? 1) * 100).toFixed(1)}%`;
  }

  private updateFace(): void {
    if (this.rigDefinition?.talkingHead) {
      this.updateMouth();
      return;
    }
    const face = this.rigDefinition?.face;
    if (!face) return;
    if (!this.isMouthOnlyFace()) {
      const brows = this.features.get('brows');
      const eyes = this.features.get('eyes');
      if (brows) brows.src = face.brows[this.currentEmotion] ?? face.brows.neutral;
      if (eyes) eyes.src = face.eyes[this.currentEmotion] ?? face.eyes.neutral;
    }
    this.updateMouth();
  }

  private isMouthOnlyFace(): boolean {
    return this.entry.faceAnimation === 'mouthOnly' || this.rigDefinition?.face?.mode === 'mouthOnly';
  }

  private updateMouth(): void {
    if (this.rigDefinition?.talkingHead) {
      const closed = this.features.get('headClosed');
      const open = this.features.get('headOpen');
      if (!closed || !open) return;
      const showOpen = this.talking && this.talkOpen;
      closed.style.opacity = showOpen ? '0' : '1';
      closed.style.visibility = showOpen ? 'hidden' : 'visible';
      open.style.opacity = showOpen ? '1' : '0';
      open.style.visibility = showOpen ? 'visible' : 'hidden';
      return;
    }
    const face = this.rigDefinition?.face;
    const mouth = this.features.get('mouth');
    if (!face || !mouth) return;
    mouth.src = this.talking && this.talkOpen
      ? face.mouths.talk
      : face.mouths[this.currentEmotion] ?? face.mouths.neutral;
  }

  private startBlinking(): void {
    if (this.blinkTimer || settings.reduceMotion) return;
    const schedule = () => {
      this.blinkTimer = setTimeout(() => {
        const face = this.rigDefinition?.face;
        const eyes = this.features.get('eyes');
        if (face && eyes && this.currentEmotion !== 'laughing') {
          eyes.src = face.eyes.closed;
          setTimeout(() => {
            if (this.rigDefinition && this.features.get('eyes') === eyes) {
              eyes.src = face.eyes[this.currentEmotion] ?? face.eyes.neutral;
            }
          }, 125);
        }
        this.blinkTimer = null;
        schedule();
      }, 2500 + Math.random() * 4000);
    };
    schedule();
  }

  private stopBlinking(): void {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.blinkTimer = null;
  }

  private async playFallbackMotion(action: CharacterAction): Promise<void> {
    if (!this.animationLayer || settings.reduceMotion) {
      await sleep(140);
      return;
    }
    const frames: Partial<Record<CharacterAction, Keyframe[]>> = {
      nod: [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(0)' }],
      shakeHead: [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
      wave: [{ transform: 'rotate(0)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(0)' }],
      jump: [{ transform: 'translateY(0)' }, { transform: 'translateY(-24px)' }, { transform: 'translateY(0)' }],
      tremble: [{ transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
    };
    await this.animationLayer.animate(frames[action] ?? [{ opacity: 1 }, { opacity: 0.98 }, { opacity: 1 }], {
      duration: action === 'tremble' ? 480 : 600,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }).finished.catch(() => undefined);
  }

  private async playWholeBodyMotion(motion: ActingMotion): Promise<void> {
    if (!this.animationLayer || motion === 'none' || motion === 'talk') return;
    if (settings.reduceMotion) {
      await sleep(100);
      return;
    }
    const specs: Partial<Record<ActingMotion, { frames: Keyframe[]; ms: number }>> = {
      settle: { frames: [{ transform: 'translateY(2px)' }, { transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], ms: 260 },
      laugh: { frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], ms: 720 },
      recoil: { frames: [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(-8px) scale(.985)' }, { transform: 'translateX(1px) scale(1)' }], ms: 360 },
      dance: { frames: [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-4px,-3px) rotate(-1.5deg)' }, { transform: 'translate(4px,0) rotate(1.5deg)' }, { transform: 'translate(0,0) rotate(0)' }], ms: 980 },
    };
    const spec = specs[motion];
    if (!spec) return;
    await this.animationLayer.animate(spec.frames, { duration: spec.ms, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }).finished.catch(() => undefined);
  }

  private async turnAround(): Promise<void> {
    if (!this.inner) return;
    const next = this.facing === 'left' ? 'right' : 'left';
    this.inner.style.transition = 'transform 180ms ease-in';
    this.inner.style.transform = 'scaleX(0)';
    await sleep(180);
    this.setFacing(next);
    this.inner.style.transition = 'transform 200ms ease-out';
    this.inner.style.transform = next === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    await sleep(200);
    this.inner.style.transition = '';
  }

  private makeDebugOverlay(): HTMLDivElement {
    const debug = document.createElement('div');
    debug.className = 'puppet-debug-overlay';
    debug.setAttribute('aria-hidden', 'true');
    debug.innerHTML = `
      <span class="puppet-debug-name">${this.entry.displayName} &middot; hybrid rig</span>
      <span class="puppet-debug-animation">loading</span>
      <span class="puppet-debug-mode">loading</span>
      <span class="puppet-debug-layers">loading manifest</span>
      <i class="puppet-debug-baseline" data-label="stage baseline"></i>
    `;
    return debug;
  }

  private populateDebugOverlay(definition: PuppetRigDefinition): void {
    const overlay = this.puppet?.querySelector<HTMLElement>('.puppet-debug-overlay');
    if (!overlay) return;
    overlay.querySelectorAll('.puppet-debug-pivot').forEach((node) => node.remove());
    for (const [name, bone] of Object.entries(definition.bones)) {
      if (name === 'root') continue;
      const pivot = document.createElement('i');
      pivot.className = 'puppet-debug-pivot';
      if (name === 'head') pivot.classList.add('is-head-anchor');
      if (name === 'leftUpperArm' || name === 'rightUpperArm') pivot.classList.add('is-shoulder-anchor');
      pivot.dataset.label = name;
      pivot.style.left = `${bone.pivot[0]}%`;
      pivot.style.top = `${bone.pivot[1]}%`;
      overlay.appendChild(pivot);
    }
    const headLayer = definition.layers.find((layer) => layer.feature === 'headClosed')
      ?? definition.layers.find((layer) => layer.name === 'head');
    if (headLayer) {
      const [left, top, width, height] = headLayer.box;
      const mouth = document.createElement('i');
      mouth.className = 'puppet-debug-pivot is-mouth-anchor';
      mouth.dataset.label = 'mouth';
      mouth.style.left = `${left + width * 0.5}%`;
      mouth.style.top = `${top + height * 0.76}%`;
      overlay.appendChild(mouth);
    }
    const baseline = overlay.querySelector<HTMLElement>('.puppet-debug-baseline');
    if (baseline) baseline.style.top = `${definition.bones.root?.pivot[1] ?? 95}%`;
    const labels = overlay.querySelector<HTMLElement>('.puppet-debug-layers');
    if (labels) labels.textContent = definition.layers.map((layer) => layer.name).join(' · ');
  }

  private setDebugAnimation(name: string): void {
    if (this.puppet) this.puppet.dataset.animation = name;
    const label = this.puppet?.querySelector<HTMLElement>('.puppet-debug-animation');
    if (label) label.textContent = name;
  }

  private setDebugMode(mode: string): void {
    const label = this.puppet?.querySelector<HTMLElement>('.puppet-debug-mode');
    if (label) label.textContent = mode;
  }
}
