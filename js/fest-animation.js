// Zenith '26 — High-Visibility Live Stage, Animated Characters & Fireworks Engine
// Recreates the vibrant cartoon fest scene: Moving dancing characters (Shinchan, Chhota Bheem,
// Motu, Patlu, Dora, Chutki, DJ), live sweeping stage spotlights, continuous fireworks,
// spinning Catherine wheels, ground sparkler fountains, and glowing carnival string lights.

(function () {
  let isAnimationRunning = true;
  let isFocusStageMode = false;
  let canvas, ctx;
  let width, height;
  let particles = [];
  let rockets = [];
  let balloons = [];
  let lastRocketTime = 0;
  let lastBalloonTime = 0;
  let animFrameId = null;

  // Festival Color Palette from Reference Image
  const FEST_COLORS = [
    { r: 255, g: 60, b: 120 },   // Neon Hot Pink
    { r: 255, g: 220, b: 0 },    // Bright Gold
    { r: 0, g: 240, b: 255 },    // Electric Cyan
    { r: 168, g: 85, b: 255 },   // Royal Violet
    { r: 52, g: 235, b: 140 },   // Neon Lime / Emerald
    { r: 255, g: 130, b: 40 },   // Sunset Orange
    { r: 255, g: 255, b: 255 },  // Pure White
  ];

  document.addEventListener("DOMContentLoaded", initFestiveBackdrop);

  function initFestiveBackdrop() {
    createBackdropElements();
    setupCanvas();
    setupFairyLights();
    setupControls();

    window.addEventListener("resize", onResize);

    lastRocketTime = performance.now();
    lastBalloonTime = performance.now();
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function createBackdropElements() {
    if (document.getElementById("fest-animation-backdrop")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "fest-animation-backdrop";
    wrapper.className = "fixed inset-0 pointer-events-none z-0 overflow-hidden";
    wrapper.setAttribute("aria-hidden", "true");

    wrapper.innerHTML = `
      <!-- 1. High-Visibility Stage Scene Background (Clearly visible like a video) -->
      <div id="fest-stage-bg" class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700" 
           style="background-image: url('/assets/fest-bg.jpg'); filter: brightness(0.92) contrast(1.1) saturate(1.25); opacity: 0.85;">
      </div>

      <!-- 2. Gentle Tint Overlay (Ensures buttons/text are readable while video stays vibrant) -->
      <div id="fest-tint-overlay" class="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/35 to-slate-950/70 transition-opacity duration-500"></div>

      <!-- 3. Dynamic Moving Stage Concert Spotlights (Sweeping Laser Beams) -->
      <div id="stage-spotlights-container" class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="spotlight-beam beam-1"></div>
        <div class="spotlight-beam beam-2"></div>
        <div class="spotlight-beam beam-3"></div>
        <div class="spotlight-beam beam-4"></div>
      </div>

      <!-- 4. Fairy String Lights Garland across the Top -->
      <div id="fairy-lights-garland" class="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 overflow-hidden">
        <div class="fairy-light-wire"></div>
      </div>

      <!-- 5. Interactive Fireworks, Catherine Wheels & Sparkler Fountains Canvas -->
      <canvas id="fest-fireworks-canvas" class="absolute inset-0 w-full h-full pointer-events-none z-20"></canvas>

      <!-- 6. LIVE ANIMATED CHARACTERS LAYER (Moving, dancing, waving sparklers) -->
      <div id="fest-characters-container" class="absolute inset-x-0 bottom-6 sm:bottom-10 pointer-events-none z-25 flex items-end justify-around px-4 sm:px-12 max-w-7xl mx-auto">
        
        <!-- Character 1: PATLU (Waving Gold Sparkler) -->
        <div class="char-wrapper char-patlu" title="Patlu dancing with sparkler">
          <div class="char-body-bounce patlu-anim">
            <svg class="w-16 h-28 sm:w-20 sm:h-36 drop-shadow-xl" viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Arm with Sparkler -->
              <g class="arm-sparkler-wave">
                <path d="M70 70 L95 35" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
                <circle cx="98" cy="30" r="5" fill="#fef08a" class="animate-ping"/>
                <polygon points="98,18 103,28 114,30 105,38 107,49 98,42 89,49 91,38 82,30 93,28" fill="#facc15"/>
              </g>
              <!-- Legs & Shoes -->
              <rect x="35" y="130" width="10" height="40" rx="4" fill="#c2410c"/>
              <rect x="55" y="130" width="10" height="40" rx="4" fill="#c2410c"/>
              <ellipse cx="38" cy="172" rx="12" ry="6" fill="#1e293b"/>
              <ellipse cx="62" cy="172" rx="12" ry="6" fill="#1e293b"/>
              <!-- Yellow Kurta Body -->
              <path d="M30 75 Q50 65 70 75 L75 135 L25 135 Z" fill="#eab308"/>
              <circle cx="50" cy="90" r="2.5" fill="#78350f"/>
              <circle cx="50" cy="105" r="2.5" fill="#78350f"/>
              <circle cx="50" cy="120" r="2.5" fill="#78350f"/>
              <!-- Neck & Head (Bald with glasses) -->
              <rect x="44" y="60" width="12" height="15" fill="#fbcfe8"/>
              <ellipse cx="50" cy="40" rx="18" ry="24" fill="#fed7aa"/>
              <!-- Round Glasses -->
              <circle cx="42" cy="38" r="7" stroke="#0f172a" stroke-width="2.5" fill="rgba(255,255,255,0.7)"/>
              <circle cx="58" cy="38" r="7" stroke="#0f172a" stroke-width="2.5" fill="rgba(255,255,255,0.7)"/>
              <line x1="49" y1="38" x2="51" y2="38" stroke="#0f172a" stroke-width="2.5"/>
              <!-- Eyes & Big Smile -->
              <circle cx="43" cy="38" r="2.5" fill="#0f172a"/>
              <circle cx="57" cy="38" r="2.5" fill="#0f172a"/>
              <path d="M42 48 Q50 56 58 48" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Character 2: MOTU (Red Kurta, Eating Samosa & Dancing) -->
        <div class="char-wrapper char-motu" title="Motu dancing with samosa">
          <div class="char-body-bounce motu-anim">
            <svg class="w-20 h-28 sm:w-24 sm:h-36 drop-shadow-xl" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Legs & Shoes -->
              <rect x="40" y="135" width="14" height="35" rx="5" fill="#ea580c"/>
              <rect x="66" y="135" width="14" height="35" rx="5" fill="#ea580c"/>
              <ellipse cx="44" cy="172" rx="14" ry="7" fill="#451a03"/>
              <ellipse cx="76" cy="172" rx="14" ry="7" fill="#451a03"/>
              <!-- Big Round Belly & Red Kurta with Blue Vest -->
              <ellipse cx="60" cy="105" rx="34" ry="32" fill="#dc2626"/>
              <!-- Blue Vest -->
              <path d="M30 80 Q60 90 90 80 L88 120 Q60 130 32 120 Z" fill="#1e3a8a" opacity="0.9"/>
              <!-- Hand with Golden Samosa -->
              <g class="samosa-hand-wave">
                <path d="M85 95 L108 75" stroke="#fbcfe8" stroke-width="8" stroke-linecap="round"/>
                <!-- Golden Triangle Samosa -->
                <polygon points="106,65 120,78 100,85" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
              </g>
              <!-- Head with Moustache -->
              <ellipse cx="60" cy="45" rx="22" ry="24" fill="#fed7aa"/>
              <!-- Moustache -->
              <path d="M42 54 Q50 48 60 54 Q70 48 78 54 Q70 62 60 56 Q50 62 42 54 Z" fill="#1e293b"/>
              <!-- Happy Eyes & Smile -->
              <ellipse cx="50" cy="38" rx="3" ry="4" fill="#0f172a"/>
              <ellipse cx="70" cy="38" rx="3" ry="4" fill="#0f172a"/>
              <path d="M52 60 Q60 68 68 60" stroke="#78350f" stroke-width="2" fill="#ef4444"/>
            </svg>
          </div>
        </div>

        <!-- Character 3: CHHOTA BHEEM (Flexing & Jumping) -->
        <div class="char-wrapper char-bheem" title="Chhota Bheem jumping and celebrating">
          <div class="char-body-bounce bheem-anim">
            <svg class="w-18 h-28 sm:w-22 sm:h-36 drop-shadow-2xl" viewBox="0 0 110 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Arms Flexing Up -->
              <g class="bheem-arms-flex">
                <path d="M30 80 L14 55 L20 40" stroke="#fbb57c" stroke-width="9" stroke-linecap="round"/>
                <path d="M80 80 L96 55 L90 40" stroke="#fbb57c" stroke-width="9" stroke-linecap="round"/>
                <!-- Gold Armlets -->
                <rect x="15" y="48" width="6" height="8" rx="2" fill="#facc15" stroke="#ca8a04"/>
                <rect x="89" y="48" width="6" height="8" rx="2" fill="#facc15" stroke="#ca8a04"/>
              </g>
              <!-- Muscular Torso -->
              <path d="M32 75 Q55 70 78 75 L72 110 L38 110 Z" fill="#fbb57c"/>
              <!-- Gold Necklace -->
              <path d="M45 74 Q55 84 65 74" stroke="#eab308" stroke-width="3" fill="none"/>
              <circle cx="55" cy="85" r="3.5" fill="#ca8a04"/>
              <!-- Orange Dhoti -->
              <path d="M36 108 L74 108 L80 148 Q55 160 30 148 Z" fill="#ea580c"/>
              <path d="M55 108 L55 152" stroke="#c2410c" stroke-width="3"/>
              <!-- Bare Feet jumping -->
              <rect x="42" y="148" width="8" height="18" rx="4" fill="#fbb57c"/>
              <rect x="60" y="148" width="8" height="18" rx="4" fill="#fbb57c"/>
              <ellipse cx="44" cy="168" rx="7" ry="4" fill="#fbb57c"/>
              <ellipse cx="66" cy="168" rx="7" ry="4" fill="#fbb57c"/>
              <!-- Head with signature Hair Tuft -->
              <ellipse cx="55" cy="45" rx="19" ry="21" fill="#fbb57c"/>
              <!-- Hair Tuft (Chhoti) -->
              <path d="M55 24 Q60 12 70 16 Q62 24 58 26" fill="#1e1b4b"/>
              <!-- Red Tilak -->
              <line x1="55" y1="34" x2="55" y2="44" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
              <circle cx="55" cy="46" r="2" fill="#facc15"/>
              <!-- Strong Happy Eyes & Grin -->
              <circle cx="47" cy="44" r="3" fill="#1e1b4b"/>
              <circle cx="63" cy="44" r="3" fill="#1e1b4b"/>
              <path d="M46 54 Q55 64 64 54" stroke="#78350f" stroke-width="2.5" fill="#f87171" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Character 4: DORA THE EXPLORER (Bouncing & Waving) -->
        <div class="char-wrapper char-dora hidden sm:block" title="Dora waving">
          <div class="char-body-bounce dora-anim">
            <svg class="w-18 h-26 sm:w-20 sm:h-34 drop-shadow-xl" viewBox="0 0 110 170" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Purple Backpack -->
              <rect x="22" y="70" width="18" height="30" rx="8" fill="#9333ea" stroke="#6b21a8" stroke-width="2"/>
              <!-- Legs & Yellow Socks, White Shoes -->
              <rect x="42" y="125" width="8" height="24" rx="4" fill="#fbcfe8"/>
              <rect x="60" y="125" width="8" height="24" rx="4" fill="#fbcfe8"/>
              <rect x="41" y="142" width="10" height="10" rx="2" fill="#facc15"/>
              <rect x="59" y="142" width="10" height="10" rx="2" fill="#facc15"/>
              <ellipse cx="44" cy="158" rx="9" ry="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
              <ellipse cx="64" cy="158" rx="9" ry="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
              <!-- Orange Shorts & Pink T-Shirt -->
              <rect x="36" y="112" width="38" height="16" rx="4" fill="#f97316"/>
              <path d="M34 76 Q55 72 76 76 L74 114 L36 114 Z" fill="#ec4899"/>
              <!-- Waving Hand -->
              <g class="dora-arm-wave">
                <path d="M74 80 L96 58 L104 62" stroke="#fbcfe8" stroke-width="7" stroke-linecap="round"/>
                <ellipse cx="106" cy="60" rx="5" ry="5" fill="#fbcfe8"/>
              </g>
              <!-- Head with Iconic Bob Haircuts -->
              <ellipse cx="55" cy="45" rx="22" ry="22" fill="#fbcfe8"/>
              <path d="M30 45 C30 20 80 20 80 45 C80 50 78 55 75 58 C72 45 68 35 55 35 C42 35 38 45 35 58 Z" fill="#78350f"/>
              <!-- Big Cartoon Eyes & Warm Smile -->
              <ellipse cx="47" cy="46" rx="4" ry="5" fill="#78350f"/>
              <ellipse cx="63" cy="46" rx="4" ry="5" fill="#78350f"/>
              <circle cx="46" cy="45" r="1.5" fill="#ffffff"/>
              <circle cx="62" cy="45" r="1.5" fill="#ffffff"/>
              <path d="M47 56 Q55 64 63 56" stroke="#9d174d" stroke-width="2" fill="#f43f5e"/>
            </svg>
          </div>
        </div>

        <!-- Character 5: SHINCHAN (Iconic Cheeky Hip-Shake Dance!) -->
        <div class="char-wrapper char-shinchan" title="Shinchan funny dance">
          <div class="char-body-bounce shinchan-anim">
            <svg class="w-16 h-24 sm:w-20 sm:h-32 drop-shadow-2xl" viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Yellow Shorts & Red T-Shirt -->
              <rect x="30" y="105" width="40" height="20" rx="6" fill="#facc15" stroke="#ca8a04"/>
              <path d="M28 72 Q50 68 72 72 L70 108 L30 108 Z" fill="#ef4444"/>
              <!-- Funny Dancing Legs -->
              <path d="M35 125 L24 146" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
              <path d="M65 125 L76 146" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
              <ellipse cx="22" cy="148" rx="8" ry="5" fill="#ffffff" stroke="#94a3b8"/>
              <ellipse cx="78" cy="148" rx="8" ry="5" fill="#ffffff" stroke="#94a3b8"/>
              <!-- Arms in Funny Dance Pose -->
              <g class="shinchan-hands">
                <path d="M28 78 L12 90 L18 102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round"/>
                <path d="M72 78 L88 90 L82 102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round"/>
              </g>
              <!-- Chunky Head with Big Cheek -->
              <path d="M35 48 C25 45 28 28 48 24 C72 20 80 35 78 48 C76 62 62 68 46 64 C36 62 30 52 35 48 Z" fill="#fed7aa"/>
              <!-- Thick Eyebrows (Signature Shinchan) -->
              <path d="M36 32 Q44 26 50 32" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
              <path d="M58 32 Q64 26 72 32" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
              <!-- Eyes & Cheeky Open Mouth -->
              <circle cx="44" cy="38" r="3.5" fill="#0f172a"/>
              <circle cx="66" cy="38" r="3.5" fill="#0f172a"/>
              <ellipse cx="56" cy="52" rx="6" ry="7" fill="#dc2626" stroke="#991b1b"/>
              <ellipse cx="32" cy="48" rx="4" ry="2.5" fill="#fca5a5" opacity="0.8"/>
            </svg>
          </div>
        </div>

      </div>

      <!-- 7. Floating Fest Balloons Container -->
      <div id="fest-balloons-container" class="absolute inset-0 overflow-hidden pointer-events-none z-15"></div>
    `;

    document.body.insertBefore(wrapper, document.body.firstChild);
    injectAnimationStyles();
  }

  function injectAnimationStyles() {
    if (document.getElementById("fest-animation-styles")) return;
    const style = document.createElement("style");
    style.id = "fest-animation-styles";
    style.textContent = `
      /* Live Stage Background Subtle Pulsing Movement */
      #fest-stage-bg {
        animation: festStageLive 22s ease-in-out infinite alternate;
        transform-origin: center bottom;
      }
      @keyframes festStageLive {
        0% { transform: scale(1.02) translateY(0); filter: brightness(0.92) saturate(1.25); }
        50% { transform: scale(1.06) translateY(-8px); filter: brightness(1.02) saturate(1.35); }
        100% { transform: scale(1.03) translateY(-3px); filter: brightness(0.95) saturate(1.3); }
      }

      /* Moving Sweeping Stage Laser Spotlights */
      .spotlight-beam {
        position: absolute;
        bottom: -30px;
        width: 160px;
        height: 110vh;
        clip-path: polygon(48% 100%, 52% 100%, 100% 0%, 0% 0%);
        transform-origin: bottom center;
        filter: blur(28px);
        opacity: 0.55;
        mix-blend-mode: screen;
        pointer-events-none;
      }
      .beam-1 {
        left: 18%;
        background: linear-gradient(to top, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.4), transparent);
        animation: sweepBeam1 7s ease-in-out infinite alternate;
      }
      .beam-2 {
        left: 38%;
        background: linear-gradient(to top, rgba(244, 63, 94, 0.95), rgba(236, 72, 153, 0.4), transparent);
        animation: sweepBeam2 8.5s ease-in-out infinite alternate;
      }
      .beam-3 {
        left: 62%;
        background: linear-gradient(to top, rgba(6, 182, 212, 0.95), rgba(59, 130, 246, 0.4), transparent);
        animation: sweepBeam3 6.5s ease-in-out infinite alternate;
      }
      .beam-4 {
        left: 82%;
        background: linear-gradient(to top, rgba(234, 179, 8, 0.95), rgba(249, 115, 22, 0.4), transparent);
        animation: sweepBeam4 9s ease-in-out infinite alternate;
      }

      @keyframes sweepBeam1 {
        0% { transform: rotate(-40deg); opacity: 0.4; }
        50% { opacity: 0.7; }
        100% { transform: rotate(18deg); opacity: 0.45; }
      }
      @keyframes sweepBeam2 {
        0% { transform: rotate(-22deg); opacity: 0.5; }
        100% { transform: rotate(38deg); opacity: 0.65; }
      }
      @keyframes sweepBeam3 {
        0% { transform: rotate(30deg); opacity: 0.45; }
        100% { transform: rotate(-35deg); opacity: 0.7; }
      }
      @keyframes sweepBeam4 {
        0% { transform: rotate(42deg); opacity: 0.4; }
        100% { transform: rotate(-12deg); opacity: 0.65; }
      }

      /* DANCING CHARACTERS KEYFRAME ANIMATIONS */
      .char-wrapper {
        transition: transform 0.3s ease;
      }

      /* Patlu Sparkler & Groove */
      .patlu-anim {
        animation: patluDance 1.6s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes patluDance {
        0% { transform: translateY(0) rotate(-3deg); }
        50% { transform: translateY(-12px) rotate(2deg); }
        100% { transform: translateY(-4px) rotate(4deg); }
      }
      .arm-sparkler-wave {
        animation: sparklerArmWave 0.8s ease-in-out infinite alternate;
        transform-origin: 70px 70px;
      }
      @keyframes sparklerArmWave {
        0% { transform: rotate(-15deg); }
        100% { transform: rotate(25deg); }
      }

      /* Motu Jolly Samosa Belly Bounce */
      .motu-anim {
        animation: motuDance 1.4s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes motuDance {
        0% { transform: scale(1) translateY(0) rotate(2deg); }
        50% { transform: scale(1.05, 0.96) translateY(-10px) rotate(-3deg); }
        100% { transform: scale(0.98, 1.04) translateY(-2px) rotate(3deg); }
      }
      .samosa-hand-wave {
        animation: samosaWave 1.1s ease-in-out infinite alternate;
        transform-origin: 85px 95px;
      }
      @keyframes samosaWave {
        0% { transform: rotate(-10deg); }
        100% { transform: rotate(20deg); }
      }

      /* Chhota Bheem Energetic Jumping & Flex */
      .bheem-anim {
        animation: bheemJump 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes bheemJump {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-22px) scale(1.06); }
        100% { transform: translateY(-6px) scale(0.98); }
      }
      .bheem-arms-flex {
        animation: bheemFlexing 0.6s ease-in-out infinite alternate;
        transform-origin: center center;
      }
      @keyframes bheemFlexing {
        0% { transform: scale(0.96) translateY(2px); }
        100% { transform: scale(1.06) translateY(-2px); }
      }

      /* Dora Waving & Stepping */
      .dora-anim {
        animation: doraStep 1.8s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes doraStep {
        0% { transform: translateY(0) rotate(-4deg); }
        50% { transform: translateY(-10px) rotate(4deg); }
        100% { transform: translateY(-2px) rotate(-2deg); }
      }
      .dora-arm-wave {
        animation: doraHandWave 0.7s ease-in-out infinite alternate;
        transform-origin: 74px 80px;
      }
      @keyframes doraHandWave {
        0% { transform: rotate(-25deg); }
        100% { transform: rotate(15deg); }
      }

      /* Shinchan Signature Cheeky Hip-Wiggle Dance! */
      .shinchan-anim {
        animation: shinchanHipWiggle 0.65s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes shinchanHipWiggle {
        0% { transform: translateY(0) rotate(-8deg) translateX(-4px); }
        50% { transform: translateY(-8px) rotate(0deg) scaleX(1.05); }
        100% { transform: translateY(0) rotate(8deg) translateX(4px); }
      }
      .shinchan-hands {
        animation: shinchanArmSwing 0.65s ease-in-out infinite alternate;
      }
      @keyframes shinchanArmSwing {
        0% { transform: translateY(-4px) rotate(-10deg); }
        100% { transform: translateY(4px) rotate(10deg); }
      }

      /* Fairy Light Bulbs Garland along top wire */
      .fairy-light-wire {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 25px;
        border-bottom: 2px dashed rgba(255, 255, 255, 0.35);
        border-radius: 0 0 50% 50% / 0 0 100% 100%;
      }
      .fairy-bulb {
        position: absolute;
        width: 12px;
        height: 16px;
        border-radius: 50% 50% 40% 40%;
        box-shadow: 0 0 12px currentColor, 0 0 24px currentColor;
        animation: bulbTwinkle 1.8s ease-in-out infinite alternate;
      }
      @keyframes bulbTwinkle {
        0% { opacity: 0.5; filter: brightness(0.9); transform: scale(0.9); }
        50% { opacity: 1; filter: brightness(1.6); transform: scale(1.2); }
        100% { opacity: 0.6; filter: brightness(1); transform: scale(0.95); }
      }

      /* Floating Festive Balloon */
      .fest-balloon {
        position: absolute;
        bottom: -80px;
        width: 36px;
        height: 44px;
        border-radius: 50% 50% 48% 48%;
        animation: balloonFloat 14s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        box-shadow: inset -4px -4px 10px rgba(0, 0, 0, 0.3), 0 0 18px rgba(255, 255, 255, 0.4);
      }
      .fest-balloon::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 1.5px;
        height: 22px;
        background: rgba(255, 255, 255, 0.5);
      }
      @keyframes balloonFloat {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
        8% { opacity: 0.85; }
        50% { transform: translateY(-50vh) translateX(35px) rotate(8deg); }
        90% { opacity: 0.85; }
        100% { transform: translateY(-115vh) translateX(-25px) rotate(-8deg); opacity: 0; }
      }

      /* Stage Focus Mode: Dims foreground cards slightly so video plays in full glory */
      body.stage-focus-active #events-section,
      body.stage-focus-active header,
      body.stage-focus-active section {
        opacity: 0.45;
        transition: opacity 0.4s ease;
      }
      body.stage-focus-active #events-section:hover,
      body.stage-focus-active header:hover,
      body.stage-focus-active section:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function setupCanvas() {
    canvas = document.getElementById("fest-fireworks-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    onResize();
  }

  function onResize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function setupFairyLights() {
    const garland = document.getElementById("fairy-lights-garland");
    if (!garland) return;
    garland.innerHTML = '<div class="fairy-light-wire"></div>';

    const colors = ["#ff3366", "#ffcc00", "#00e5ff", "#33ff99", "#d946ef", "#ff7700"];
    const bulbCount = Math.floor(window.innerWidth / 30);

    for (let i = 0; i < bulbCount; i++) {
      const bulb = document.createElement("div");
      bulb.className = "fairy-bulb";
      const color = colors[i % colors.length];
      const leftPct = (i / bulbCount) * 100;
      const topOffset = Math.sin((i / bulbCount) * Math.PI) * 14 + 6;

      bulb.style.left = `${leftPct}%`;
      bulb.style.top = `${topOffset}px`;
      bulb.style.color = color;
      bulb.style.backgroundColor = color;
      bulb.style.animationDelay = `${(i * 0.12) % 2.4}s`;
      bulb.style.animationDuration = `${1.4 + (i % 3) * 0.4}s`;

      garland.appendChild(bulb);
    }
  }

  function spawnBalloon() {
    const container = document.getElementById("fest-balloons-container");
    if (!container || !isAnimationRunning) return;

    const balloon = document.createElement("div");
    balloon.className = "fest-balloon";

    const colors = [
      "linear-gradient(135deg, #f43f5e, #be123c)",
      "linear-gradient(135deg, #06b6d4, #0284c7)",
      "linear-gradient(135deg, #eab308, #ca8a04)",
      "linear-gradient(135deg, #c026d3, #7e22ce)",
      "linear-gradient(135deg, #10b981, #059669)",
      "linear-gradient(135deg, #f97316, #ea580c)",
    ];

    balloon.style.background = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.left = `${4 + Math.random() * 92}%`;
    balloon.style.animationDuration = `${12 + Math.random() * 6}s`;
    balloon.style.transform = `scale(${0.8 + Math.random() * 0.4})`;

    container.appendChild(balloon);

    setTimeout(() => {
      if (balloon.parentNode) {
        balloon.parentNode.removeChild(balloon);
      }
    }, 20000);
  }

  // Particle & Rocket Classes
  class Rocket {
    constructor(startX, targetX, targetY, color, type = "burst") {
      this.x = startX;
      this.y = height + 10;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.type = type;
      this.speed = 10 + Math.random() * 3.5;
      const angle = Math.atan2(targetY - this.y, targetX - this.x);
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.trail = [];
      this.exploded = false;
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 7) this.trail.shift();

      this.x += this.vx;
      this.y += this.vy;

      if (this.vy >= 0 || this.y <= this.targetY) {
        this.explode();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    explode() {
      this.exploded = true;
      if (this.type === "spiral") {
        createSpiralBurst(this.x, this.y, this.color);
      } else {
        createStandardBurst(this.x, this.y, this.color);
      }
    }
  }

  class Particle {
    constructor(x, y, color, vx, vy, life = 80, size = 3) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = vx;
      this.vy = vy;
      this.alpha = 1;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.gravity = 0.05;
      this.friction = 0.965;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function createStandardBurst(x, y, color) {
    const count = 75 + Math.floor(Math.random() * 35);
    const speed = 5.5 + Math.random() * 4;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.2);
      const spd = speed * (0.35 + Math.random() * 0.65);
      particles.push(
        new Particle(
          x,
          y,
          color,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          65 + Math.floor(Math.random() * 35),
          2 + Math.random() * 2
        )
      );
    }
  }

  // Catherine Wheel / Spiral Firework Burst (as in reference image)
  function createSpiralBurst(x, y, color) {
    const spiralArms = 5;
    const perArm = 20;

    for (let arm = 0; arm < spiralArms; arm++) {
      const baseAngle = (Math.PI * 2 / spiralArms) * arm;
      for (let j = 0; j < perArm; j++) {
        const angle = baseAngle + j * 0.24;
        const spd = (j / perArm) * 6 + 1.5;
        particles.push(
          new Particle(
            x,
            y,
            color,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            80,
            2.5
          )
        );
      }
    }
  }

  // Ground Sparkler Fountains (Tall Golden Jets)
  function emitSparklerFountains() {
    if (!isAnimationRunning) return;

    const leftX = width * 0.06;
    const rightX = width * 0.94;
    const fountainY = height - 15;

    const goldColor = { r: 255, g: 220, b: 90 };
    const magentaColor = { r: 244, g: 63, b: 180 };

    for (let i = 0; i < 3; i++) {
      // Left Fountain
      const lAngle = -Math.PI / 2 + (Math.random() * 0.45 - 0.22);
      const lSpeed = 7 + Math.random() * 8;
      particles.push(
        new Particle(
          leftX + (Math.random() * 12 - 6),
          fountainY,
          goldColor,
          Math.cos(lAngle) * lSpeed,
          Math.sin(lAngle) * lSpeed,
          50 + Math.random() * 25,
          2 + Math.random() * 1.5
        )
      );

      // Right Fountain
      const rAngle = -Math.PI / 2 + (Math.random() * 0.45 - 0.22);
      const rSpeed = 7 + Math.random() * 8;
      particles.push(
        new Particle(
          rightX + (Math.random() * 12 - 6),
          fountainY,
          magentaColor,
          Math.cos(rAngle) * rSpeed,
          Math.sin(rAngle) * rSpeed,
          50 + Math.random() * 25,
          2 + Math.random() * 1.5
        )
      );
    }
  }

  function launchRandomRocket() {
    const startX = width * (0.15 + Math.random() * 0.7);
    const targetX = startX + (Math.random() * 180 - 90);
    const targetY = height * (0.1 + Math.random() * 0.35);
    const color = FEST_COLORS[Math.floor(Math.random() * FEST_COLORS.length)];
    const type = Math.random() > 0.5 ? "spiral" : "burst";

    rockets.push(new Rocket(startX, targetX, targetY, color, type));
  }

  function animationLoop(timestamp) {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (isAnimationRunning) {
      emitSparklerFountains();

      // Launch fireworks frequently (every 1.0 to 1.8 seconds)
      if (timestamp - lastRocketTime > 1100 + Math.random() * 800) {
        launchRandomRocket();
        lastRocketTime = timestamp;
      }

      if (timestamp - lastBalloonTime > 5500 + Math.random() * 3500) {
        spawnBalloon();
        lastBalloonTime = timestamp;
      }
    }

    // Update and draw rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.update();
      r.draw(ctx);
      if (r.exploded) rockets.splice(i, 1);
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(i, 1);
    }

    animFrameId = requestAnimationFrame(animationLoop);
  }

  // Floating Controller Pill (Play/Pause & Stage Focus Toggle)
  function setupControls() {
    const controlPill = document.createElement("div");
    controlPill.id = "fest-anim-control-bar";
    controlPill.className =
      "fixed bottom-4 right-4 z-40 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md";

    controlPill.innerHTML = `
      <button id="fest-anim-toggle" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
        <span id="fest-toggle-label">Live Stage: Playing</span>
      </button>
      <button id="fest-focus-toggle" class="px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all" title="Toggle Stage Focus (Dim content to view full cartoon festival stage)">
        <span>👁️ Watch Stage</span>
      </button>
    `;

    document.body.appendChild(controlPill);

    const toggleBtn = document.getElementById("fest-anim-toggle");
    const focusBtn = document.getElementById("fest-focus-toggle");

    toggleBtn.addEventListener("click", () => {
      isAnimationRunning = !isAnimationRunning;
      const label = document.getElementById("fest-toggle-label");
      const dot = toggleBtn.querySelector("span:first-child");
      const beams = document.getElementById("stage-spotlights-container");
      const chars = document.getElementById("fest-characters-container");

      if (isAnimationRunning) {
        label.textContent = "Live Stage: Playing";
        toggleBtn.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md";
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping";
        if (beams) beams.style.display = "block";
        if (chars) chars.style.opacity = "1";
      } else {
        label.textContent = "Live Stage: Paused";
        toggleBtn.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all";
        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
        if (beams) beams.style.display = "none";
        if (chars) chars.style.opacity = "0.3";
        particles = [];
        rockets = [];
      }
    });

    focusBtn.addEventListener("click", () => {
      isFocusStageMode = !isFocusStageMode;
      if (isFocusStageMode) {
        document.body.classList.add("stage-focus-active");
        focusBtn.innerHTML = "<span>↩️ Normal View</span>";
        focusBtn.classList.add("bg-indigo-900/80", "text-indigo-200");
      } else {
        document.body.classList.remove("stage-focus-active");
        focusBtn.innerHTML = "<span>👁️ Watch Stage</span>";
        focusBtn.classList.remove("bg-indigo-900/80", "text-indigo-200");
      }
    });
  }
})();
