import { StageEffects } from '../animation/stageEffects';
import peppaLandUrl from '../../assets/backgrounds/peppa-land.png?url';

/**
 * Built-in vector backdrops. M3 will add image backgrounds from
 * assets/backgrounds/; a scene name will first look for an image, then fall
 * back to these.
 */
const SCENES: Record<string, string> = {
  'peppa-land': `
    <img src="${peppaLandUrl}" alt="" draggable="false" />`,
  camp: `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="camp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8fc9e8"/><stop offset="1" stop-color="#f7d9a3"/>
        </linearGradient>
        <linearGradient id="camp-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#9a6335"/><stop offset="1" stop-color="#6f4327"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#camp-sky)"/>
      <circle cx="1370" cy="125" r="72" fill="#ffe68a"/>
      <path d="M0,510 Q260,390 510,520 Q790,350 1040,520 Q1320,370 1600,500 L1600,900 L0,900 Z" fill="#447c4b"/>
      <rect y="640" width="1600" height="260" fill="#73a354"/>
      <path d="M0,760 Q390,680 780,770 T1600,740 L1600,900 L0,900 Z" fill="#d3b77b" opacity="0.7"/>
      <g fill="#315f3b">
        <path d="M80,650 L205,210 L330,650 Z"/><path d="M250,650 L390,170 L530,650 Z"/>
        <path d="M1260,650 L1390,190 L1520,650 Z"/>
      </g>
      <g fill="#5f3d26">
        <rect x="192" y="520" width="26" height="160"/><rect x="377" y="520" width="28" height="160"/><rect x="1377" y="520" width="28" height="160"/>
      </g>
      <g>
        <rect x="880" y="300" width="410" height="370" rx="16" fill="url(#camp-wood)" stroke="#52321f" stroke-width="12"/>
        <path d="M840,318 L1085,160 L1330,318 Z" fill="#5d3823" stroke="#452719" stroke-width="12"/>
        <rect x="940" y="386" width="290" height="142" rx="10" fill="#fff4d2" stroke="#4d2e1d" stroke-width="14"/>
        <rect x="925" y="525" width="320" height="35" rx="9" fill="#cc8b46"/>
        <rect x="980" y="320" width="210" height="52" rx="20" fill="#f1c75d" stroke="#5c3822" stroke-width="8"/>
        <text x="1085" y="354" text-anchor="middle" font-family="system-ui, sans-serif" font-size="30" font-weight="800" fill="#5c3822">TREAT SPOT</text>
        <g transform="translate(985 410)">
          <path d="M0,0 L28,82 L56,0 Z" fill="#d59a5d"/><circle cx="28" cy="0" r="31" fill="#f6a9bf"/><circle cx="16" cy="-7" r="4" fill="#ef475e"/>
        </g>
        <g transform="translate(1090 415)">
          <path d="M0,0 Q34,-18 68,0 L60,80 Q34,94 8,80 Z" fill="#eece4f" stroke="#d18b35" stroke-width="5"/>
          <path d="M18,5 L25,72 M38,2 L42,78 M57,6 L54,70" stroke="#f7e98c" stroke-width="8"/>
        </g>
      </g>
      <g fill="#f3e8c5" opacity="0.85"><circle cx="610" cy="705" r="7"/><circle cx="670" cy="742" r="6"/><circle cx="748" cy="700" r="8"/></g>
    </svg>`,
  park: `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ed0f7"/><stop offset="1" stop-color="#dff2fc"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#pk-sky)"/>
      <circle cx="1380" cy="140" r="75" fill="#ffe07a"/>
      <g fill="#ffffff" opacity="0.92">
        <ellipse cx="320" cy="160" rx="95" ry="34"/><ellipse cx="405" cy="140" rx="70" ry="28"/>
        <ellipse cx="900" cy="110" rx="80" ry="30"/><ellipse cx="978" cy="132" rx="60" ry="24"/>
      </g>
      <path d="M0,600 Q400,480 800,590 T1600,570 L1600,900 L0,900 Z" fill="#9ed86f"/>
      <rect y="690" width="1600" height="210" fill="#7cc353"/>
      <g>
        <rect x="180" y="440" width="46" height="250" rx="18" fill="#8a5a33"/>
        <circle cx="205" cy="400" r="105" fill="#5eab46"/>
        <circle cx="128" cy="452" r="75" fill="#6cbd52"/>
        <circle cx="287" cy="456" r="80" fill="#54a03f"/>
      </g>
      <g>
        <rect x="1150" y="524" width="260" height="20" rx="8" fill="#a9713d"/>
        <rect x="1150" y="552" width="260" height="16" rx="8" fill="#b57f4a"/>
        <rect x="1150" y="604" width="260" height="26" rx="8" fill="#a9713d"/>
        <rect x="1168" y="626" width="20" height="88" fill="#7e5027"/>
        <rect x="1372" y="626" width="20" height="88" fill="#7e5027"/>
      </g>
      <g fill="#f2a7c3">
        <circle cx="620" cy="720" r="12"/><circle cx="700" cy="752" r="10"/><circle cx="540" cy="760" r="10"/>
      </g>
    </svg>`,

  bedroom: `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fdeed6"/><stop offset="1" stop-color="#f5dcb7"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bd-wall)"/>
      <rect y="640" width="1600" height="260" fill="#c89b6f"/>
      <rect y="640" width="1600" height="18" fill="#b2854f"/>
      <g>
        <rect x="1040" y="110" width="320" height="270" rx="10" fill="#9adcf5" stroke="#8a5a33" stroke-width="14"/>
        <line x1="1200" y1="115" x2="1200" y2="375" stroke="#8a5a33" stroke-width="10"/>
        <line x1="1046" y1="245" x2="1354" y2="245" stroke="#8a5a33" stroke-width="10"/>
        <circle cx="1120" cy="180" r="26" fill="#ffffff" opacity="0.85"/>
        <rect x="1000" y="90" width="34" height="320" rx="12" fill="#e2777a"/>
        <rect x="1366" y="90" width="34" height="320" rx="12" fill="#e2777a"/>
      </g>
      <g>
        <rect x="80" y="440" width="42" height="240" rx="12" fill="#8a5a33"/>
        <rect x="100" y="548" width="340" height="86" rx="18" fill="#ffffff"/>
        <rect x="196" y="548" width="244" height="86" rx="18" fill="#7bb8f0"/>
        <rect x="112" y="522" width="96" height="44" rx="16" fill="#fff7ea"/>
        <rect x="92" y="630" width="360" height="40" rx="10" fill="#a9713d"/>
      </g>
      <ellipse cx="820" cy="790" rx="270" ry="62" fill="#e2777a"/>
      <ellipse cx="820" cy="790" rx="190" ry="42" fill="#ef9a9c"/>
      <g fill="#ffd166">
        <circle cx="480" cy="180" r="14"/><circle cx="620" cy="120" r="10"/><circle cx="720" cy="220" r="12"/>
        <circle cx="360" cy="280" r="9"/>
      </g>
    </svg>`,

  street: `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff9d76"/><stop offset="1" stop-color="#7b5ea7"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#st-sky)"/>
      <circle cx="1200" cy="330" r="60" fill="#ffe07a"/>
      <g fill="#3c4066">
        <rect x="60" y="240" width="220" height="440"/>
        <rect x="320" y="330" width="180" height="350"/>
        <rect x="540" y="200" width="240" height="480"/>
        <rect x="820" y="360" width="170" height="320"/>
        <rect x="1030" y="280" width="220" height="400"/>
        <rect x="1290" y="380" width="250" height="300"/>
      </g>
      <g fill="#ffd166" opacity="0.9">
        <rect x="100" y="290" width="34" height="40"/><rect x="180" y="290" width="34" height="40"/>
        <rect x="100" y="380" width="34" height="40"/><rect x="180" y="380" width="34" height="40"/>
        <rect x="590" y="260" width="36" height="44"/><rect x="670" y="260" width="36" height="44"/>
        <rect x="590" y="360" width="36" height="44"/><rect x="1080" y="330" width="36" height="44"/>
        <rect x="1160" y="330" width="36" height="44"/><rect x="1080" y="430" width="36" height="44"/>
        <rect x="1340" y="430" width="34" height="40"/><rect x="1420" y="430" width="34" height="40"/>
      </g>
      <rect y="660" width="1600" height="60" fill="#9b9baf"/>
      <rect y="720" width="1600" height="180" fill="#3b3b46"/>
      <g fill="#f5f5f5">
        <rect x="80" y="800" width="110" height="14" rx="7"/>
        <rect x="360" y="800" width="110" height="14" rx="7"/>
        <rect x="640" y="800" width="110" height="14" rx="7"/>
        <rect x="920" y="800" width="110" height="14" rx="7"/>
        <rect x="1200" y="800" width="110" height="14" rx="7"/>
        <rect x="1480" y="800" width="110" height="14" rx="7"/>
      </g>
      <g>
        <rect x="1450" y="360" width="14" height="310" rx="6" fill="#2b2d3d"/>
        <circle cx="1457" cy="345" r="26" fill="#ffe9a8"/>
      </g>
    </svg>`,
};

export const SCENE_NAMES = Object.keys(SCENES);

/**
 * Owns the stage DOM: camera/shake layers, two crossfading scene layers, the
 * actor layer, bubbles, overlays. Transform layout (outer → inner):
 * stage → camera (zoom) → shake layer → scene + actors. Bubbles and overlays
 * sit outside the camera so text stays put during zooms and shakes.
 */
export class Stage {
  readonly el: HTMLDivElement;
  readonly actorLayer: HTMLDivElement;
  readonly bubbleLayer: HTMLDivElement;
  readonly effects: StageEffects;

  private sceneLayers: [HTMLDivElement, HTMLDivElement];
  private activeScene = 0;
  private hintEl: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'stage';

    const camera = document.createElement('div');
    camera.className = 'camera';
    const shake = document.createElement('div');
    shake.className = 'shake-layer';
    camera.appendChild(shake);

    const sceneA = document.createElement('div');
    sceneA.className = 'scene-layer';
    const sceneB = document.createElement('div');
    sceneB.className = 'scene-layer';
    sceneB.style.opacity = '0';
    this.sceneLayers = [sceneA, sceneB];

    this.actorLayer = document.createElement('div');
    this.actorLayer.className = 'actor-layer';

    shake.append(sceneA, sceneB, this.actorLayer);

    const fadeOverlay = document.createElement('div');
    fadeOverlay.className = 'fade-overlay';

    this.bubbleLayer = document.createElement('div');

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'advance-hint';
    this.hintEl.textContent = '▼';
    this.hintEl.style.display = 'none';

    this.el.append(camera, fadeOverlay, this.bubbleLayer, this.hintEl);
    parent.appendChild(this.el);

    this.effects = new StageEffects(camera, shake, fadeOverlay);
  }

  setScene(name: string, instant = false): void {
    const markup = SCENES[name] ?? '';
    const incoming = this.sceneLayers[1 - this.activeScene];
    const outgoing = this.sceneLayers[this.activeScene];
    incoming.innerHTML = markup;
    if (instant) {
      incoming.style.transitionDuration = '0s';
      outgoing.style.transitionDuration = '0s';
    } else {
      incoming.style.transitionDuration = '';
      outgoing.style.transitionDuration = '';
    }
    incoming.style.opacity = '1';
    outgoing.style.opacity = '0';
    this.activeScene = 1 - this.activeScene;
  }

  showAdvanceHint(show: boolean): void {
    this.hintEl.style.display = show ? '' : 'none';
  }

  /** Clears actors and effects for a fresh story run. */
  reset(): void {
    this.actorLayer.innerHTML = '';
    this.bubbleLayer.innerHTML = '';
    this.effects.clear();
    this.showAdvanceHint(false);
    this.sceneLayers[0].innerHTML = '';
    this.sceneLayers[1].innerHTML = '';
    this.sceneLayers[0].style.opacity = '0';
    this.sceneLayers[1].style.opacity = '0';
  }
}
