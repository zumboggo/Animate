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
  'cabin-dining': `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-label="A warm, spacious dining hall inside a big log cabin">
      <defs>
        <linearGradient id="cabin-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#dba568"/><stop offset="1" stop-color="#a9683f"/>
        </linearGradient>
        <linearGradient id="cabin-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8f5635"/><stop offset="1" stop-color="#603a29"/>
        </linearGradient>
        <linearGradient id="cabin-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9edcf7"/><stop offset="1" stop-color="#e8f6ff"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#cabin-wall)"/>
      <g opacity="0.32" stroke="#74452f" stroke-width="7">
        <path d="M0 92H1600M0 178H1600M0 264H1600M0 350H1600M0 436H1600M0 522H1600M0 608H1600"/>
      </g>
      <path d="M0 0H1600V86L800 28 0 86Z" fill="#5b3928"/>
      <path d="M90 0L530 390M1510 0L1070 390M800 0V330" stroke="#543322" stroke-width="38" opacity="0.92"/>
      <rect y="650" width="1600" height="250" fill="url(#cabin-floor)"/>
      <g stroke="#4f3022" stroke-width="14">
        <rect x="105" y="175" width="330" height="300" rx="10" fill="url(#cabin-window)"/>
        <path d="M270 180V470M110 320H430"/>
        <rect x="1165" y="175" width="330" height="300" rx="10" fill="url(#cabin-window)"/>
        <path d="M1330 180V470M1170 320H1490"/>
      </g>
      <g fill="#f8fbff" opacity="0.9"><ellipse cx="190" cy="250" rx="58" ry="22"/><ellipse cx="351" cy="376" rx="48" ry="18"/><ellipse cx="1260" cy="245" rx="65" ry="23"/><ellipse cx="1410" cy="375" rx="52" ry="19"/></g>
      <g>
        <path d="M630 640V330Q800 250 970 330V640Z" fill="#6a3e2a" stroke="#4a2b20" stroke-width="18"/>
        <path d="M684 622V398Q800 342 916 398V622Z" fill="#31251f"/>
        <path d="M708 606V446Q800 410 892 446V606Z" fill="#f4a340"/>
        <path d="M730 586V480Q800 454 870 480V586Z" fill="#ffd16e" opacity="0.86"/>
        <rect x="595" y="306" width="410" height="60" rx="24" fill="#805037" stroke="#4a2b20" stroke-width="14"/>
      </g>
      <g fill="#f7e5b6">
        <circle cx="555" cy="155" r="13"/><circle cx="800" cy="128" r="13"/><circle cx="1045" cy="155" r="13"/>
      </g>
      <g stroke="#70432c" stroke-width="14" fill="#bd7a48">
        <path d="M470 690V520Q520 470 570 520V690"/><path d="M1030 690V520Q1080 470 1130 520V690"/>
      </g>
      <g fill="#f4d495" opacity="0.75"><rect x="70" y="548" width="245" height="20" rx="10"/><rect x="1285" y="548" width="245" height="20" rx="10"/></g>
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

/** Scene props that must sit in front of the actors, such as a dining table. */
const SCENE_FOREGROUNDS: Record<string, string> = {
  'cabin-dining': `
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-label="A long cabin table set with many places and pancakes">
      <defs>
        <linearGradient id="table-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#b97743"/><stop offset="1" stop-color="#75442c"/>
        </linearGradient>
        <filter id="table-shadow" x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#332117" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#table-shadow)">
        <path d="M-80 650L1680 650 1510 910H90Z" fill="url(#table-top)" stroke="#573320" stroke-width="18"/>
        <path d="M25 700H1575" stroke="#d49a61" stroke-width="6" opacity="0.48"/>
        <path d="M90 815H1510" stroke="#4e2e20" stroke-width="8" opacity="0.45"/>
      </g>
      <g fill="#fff9e9" stroke="#d8c8a9" stroke-width="6">
        <ellipse cx="170" cy="724" rx="86" ry="29"/><ellipse cx="360" cy="748" rx="88" ry="31"/>
        <ellipse cx="560" cy="770" rx="96" ry="34"/><ellipse cx="780" cy="785" rx="98" ry="35"/>
        <ellipse cx="1010" cy="778" rx="96" ry="34"/><ellipse cx="1220" cy="755" rx="90" ry="31"/>
        <ellipse cx="1410" cy="728" rx="85" ry="29"/>
      </g>
      <g fill="none" stroke="#d8c8a9" stroke-width="7" stroke-linecap="round">
        <path d="M86 690L58 776M255 706L270 790M447 719L454 818M666 733L670 836M897 732L892 832M1116 716L1108 806M1320 694L1300 779M1495 682L1525 765"/>
      </g>
      <!-- Grace's remaining half stack. -->
      <g transform="translate(497 720)">
        <path d="M0 40Q63 62 126 40V68Q64 91 0 68Z" fill="#d99442"/>
        <ellipse cx="63" cy="40" rx="64" ry="22" fill="#efb75d" stroke="#bd7532" stroke-width="5"/>
        <path d="M63 18A64 22 0 0 1 127 40A64 22 0 0 1 63 62Z" fill="#f8ca76"/>
        <path d="M63 18V62" stroke="#fff2bd" stroke-width="5"/>
        <rect x="83" y="25" width="24" height="14" rx="4" fill="#f9e292" transform="rotate(10 95 32)"/>
      </g>
      <!-- Elliott's lonely quarter pancake. -->
      <g transform="translate(990 727)">
        <path d="M0 0A69 25 0 0 1 69 25L7 45A69 25 0 0 1 0 0Z" fill="#efb75d" stroke="#bd7532" stroke-width="5"/>
        <path d="M8 8L66 26L10 39Z" fill="#f8ca76"/>
        <rect x="23" y="11" width="20" height="12" rx="4" fill="#f9e292" transform="rotate(12 33 17)"/>
      </g>
      <g transform="translate(744 660)">
        <path d="M0 22Q30 0 60 22L52 100Q30 112 8 100Z" fill="#f4c25e" stroke="#8b562d" stroke-width="6"/>
        <path d="M18 8Q30 -12 42 8" fill="none" stroke="#8b562d" stroke-width="7"/>
        <text x="30" y="69" text-anchor="middle" font-family="system-ui,sans-serif" font-size="25" font-weight="900" fill="#8b562d">SYRUP</text>
      </g>
      <g fill="#f2f7fa" stroke="#aab9c2" stroke-width="5">
        <path d="M225 645H277L265 711Q251 723 237 711Z"/><path d="M1290 650H1342L1330 716Q1316 728 1302 716Z"/>
      </g>
    </svg>`,
};

export const SCENE_NAMES = Object.keys(SCENES);

/**
 * Registers a runtime image backdrop (e.g. an AI-generated background from
 * the user's scene library). The name becomes usable in `scene:` lines.
 */
export function registerImageScene(name: string, url: string): void {
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.draggable = false;
  SCENES[name] = img.outerHTML;
}

export function isRegisteredScene(name: string): boolean {
  return name in SCENES;
}

/** Built-in scenes plus any registered image scenes, in registration order. */
export function getSceneNames(): string[] {
  return Object.keys(SCENES);
}

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
  private foregroundLayers: [HTMLDivElement, HTMLDivElement];
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

    const foregroundA = document.createElement('div');
    foregroundA.className = 'scene-foreground-layer';
    const foregroundB = document.createElement('div');
    foregroundB.className = 'scene-foreground-layer';
    foregroundB.style.opacity = '0';
    this.foregroundLayers = [foregroundA, foregroundB];

    shake.append(sceneA, sceneB, this.actorLayer, foregroundA, foregroundB);

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
    const incomingForeground = this.foregroundLayers[1 - this.activeScene];
    const outgoingForeground = this.foregroundLayers[this.activeScene];
    incoming.innerHTML = markup;
    incomingForeground.innerHTML = SCENE_FOREGROUNDS[name] ?? '';
    if (instant) {
      incoming.style.transitionDuration = '0s';
      outgoing.style.transitionDuration = '0s';
      incomingForeground.style.transitionDuration = '0s';
      outgoingForeground.style.transitionDuration = '0s';
    } else {
      incoming.style.transitionDuration = '';
      outgoing.style.transitionDuration = '';
      incomingForeground.style.transitionDuration = '';
      outgoingForeground.style.transitionDuration = '';
    }
    incoming.style.opacity = '1';
    outgoing.style.opacity = '0';
    incomingForeground.style.opacity = '1';
    outgoingForeground.style.opacity = '0';
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
    this.foregroundLayers[0].innerHTML = '';
    this.foregroundLayers[1].innerHTML = '';
    this.foregroundLayers[0].style.opacity = '0';
    this.foregroundLayers[1].style.opacity = '0';
  }
}
