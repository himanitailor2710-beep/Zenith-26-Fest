// Zenith '26 — Live Cartoon Festival Show Animation Engine
// Recreates the vibrant cartoon fest scene: Authentic cartoon characters (Shinchan, Chhota Bheem,
// Motu & Patlu, Dora, Tom & Jerry), rhythmic stage concert spotlights, continuous fireworks,
// spinning Catherine wheels, ground golden sparkler fountains, and carnival fairy lights.

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

  // Festive Color Palette
  const FEST_COLORS = [
    { r: 255, g: 75, b: 140 },   // Neon Hot Pink
    { r: 255, g: 220, b: 30 },   // Sunshine Gold
    { r: 0, g: 235, b: 255 },    // Electric Cyan
    { r: 170, g: 90, b: 255 },   // Royal Violet
    { r: 60, g: 235, b: 145 },   // Neon Emerald
    { r: 255, g: 130, b: 45 },   // Sunset Orange
    { r: 255, g: 255, b: 255 },  // Pure Starlight White
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
      <!-- 1. Authentic Cartoon Festival Stage Scene (Immediate load, no flickering or poster flash) -->
      <div id="fest-stage-backdrop" class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700" 
           style="background-image: url('/assets/fest-bg.jpg'); filter: brightness(0.96) contrast(1.08) saturate(1.25); opacity: 0.92;">
      </div>

      <!-- 2. Gentle Festive Ambient Overlay (Light & transparent, eliminates dark feeling) -->
      <div id="fest-tint-overlay" class="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-slate-950/50 transition-opacity duration-500"></div>

      <!-- 3. Dynamic Rhythmic Stage Concert Spotlights (Flashing & sweeping across the DJ stage) -->
      <div id="stage-spotlights-container" class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="spotlight-beam beam-1"></div>
        <div class="spotlight-beam beam-2"></div>
        <div class="spotlight-beam beam-3"></div>
        <div class="spotlight-beam beam-4"></div>
      </div>

      <!-- 4. Carnival Fairy String Lights Garland across the Top -->
      <div id="fairy-lights-garland" class="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 overflow-hidden">
        <div class="fairy-light-wire"></div>
      </div>

      <!-- 5. Interactive Fireworks, Catherine Wheels & Sparkler Fountains Canvas -->
      <canvas id="fest-fireworks-canvas" class="absolute inset-0 w-full h-full pointer-events-none z-20"></canvas>

      <!-- 6. LIVE DANCING CARTOON CHARACTERS (Real 2D Cartoon Art with Footlights) -->
      <div id="fest-characters-container" class="absolute inset-x-0 bottom-4 sm:bottom-6 pointer-events-none z-25 flex items-end justify-around px-4 sm:px-12 max-w-7xl mx-auto">
        
        <!-- Character 1: PATLU (Waving Golden Sparkler) -->
        <div class="char-wrapper char-patlu" title="Patlu waving sparkler">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce patlu-anim">
            <img src="/assets/characters/patlu.png" alt="Patlu" class="h-28 sm:h-36 object-contain drop-shadow-[0_4px_16px_rgba(250,204,21,0.6)]" />
          </div>
        </div>

        <!-- Character 2: MOTU (Dancing with Samosa) -->
        <div class="char-wrapper char-motu" title="Motu dancing">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce motu-anim">
            <img src="/assets/characters/motu.png" alt="Motu" class="h-28 sm:h-36 object-contain drop-shadow-[0_4px_16px_rgba(239,68,68,0.6)]" />
          </div>
        </div>

        <!-- Character 3: CHHOTA BHEEM (Flexing & Celebrating) -->
        <div class="char-wrapper char-bheem" title="Chhota Bheem celebrating">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce bheem-anim">
            <img src="/assets/characters/chhota-bheem.png" alt="Chhota Bheem" class="h-28 sm:h-36 object-contain drop-shadow-[0_4px_18px_rgba(249,115,22,0.6)]" />
          </div>
        </div>

        <!-- Character 4: TOM & JERRY (Rocking Band Duo) -->
        <div class="char-wrapper char-tomjerry hidden sm:block" title="Tom and Jerry">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce tomjerry-anim">
            <img src="/assets/characters/tom-jerry.png" alt="Tom & Jerry" class="h-28 sm:h-36 object-contain drop-shadow-[0_4px_18px_rgba(236,72,153,0.6)]" />
          </div>
        </div>

        <!-- Character 5: DORA THE EXPLORER (Bouncing & Waving) -->
        <div class="char-wrapper char-dora hidden sm:block" title="Dora waving">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce dora-anim">
            <img src="/assets/characters/dora.png" alt="Dora" class="h-26 sm:h-34 object-contain drop-shadow-[0_4px_16px_rgba(244,114,182,0.6)]" />
          </div>
        </div>

        <!-- Character 6: SHINCHAN (Cheeky Hip-Shake Dance!) -->
        <div class="char-wrapper char-shinchan" title="Shinchan funny dance">
          <div class="stage-footlight"></div>
          <div class="char-body-bounce shinchan-anim">
            <img src="/assets/characters/shinchan.png" alt="Shinchan" class="h-24 sm:h-32 object-contain drop-shadow-[0_4px_18px_rgba(244,63,94,0.7)]" />
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
      /* Moving Sweeping Stage Laser Spotlights */
      .spotlight-beam {
        position: absolute;
        bottom: -20px;
        width: 170px;
        height: 110vh;
        clip-path: polygon(48% 100%, 52% 100%, 100% 0%, 0% 0%);
        transform-origin: bottom center;
        filter: blur(28px);
        opacity: 0.55;
        mix-blend-mode: screen;
        pointer-events-none;
      }
      .beam-1 {
        left: 15%;
        background: linear-gradient(to top, rgba(236, 72, 153, 0.9), rgba(168, 85, 247, 0.3), transparent);
        animation: sweepBeam1 6.5s ease-in-out infinite alternate;
      }
      .beam-2 {
        left: 36%;
        background: linear-gradient(to top, rgba(6, 182, 212, 0.9), rgba(59, 130, 246, 0.3), transparent);
        animation: sweepBeam2 8s ease-in-out infinite alternate;
      }
      .beam-3 {
        left: 64%;
        background: linear-gradient(to top, rgba(250, 204, 21, 0.9), rgba(249, 115, 22, 0.3), transparent);
        animation: sweepBeam3 6s ease-in-out infinite alternate;
      }
      .beam-4 {
        left: 84%;
        background: linear-gradient(to top, rgba(16, 185, 129, 0.9), rgba(14, 165, 233, 0.3), transparent);
        animation: sweepBeam4 8.5s ease-in-out infinite alternate;
      }

      @keyframes sweepBeam1 {
        0% { transform: rotate(-38deg); opacity: 0.4; }
        50% { opacity: 0.7; }
        100% { transform: rotate(16deg); opacity: 0.45; }
      }
      @keyframes sweepBeam2 {
        0% { transform: rotate(-20deg); opacity: 0.45; }
        100% { transform: rotate(36deg); opacity: 0.65; }
      }
      @keyframes sweepBeam3 {
        0% { transform: rotate(28deg); opacity: 0.45; }
        100% { transform: rotate(-32deg); opacity: 0.7; }
      }
      @keyframes sweepBeam4 {
        0% { transform: rotate(40deg); opacity: 0.4; }
        100% { transform: rotate(-10deg); opacity: 0.65; }
      }

      /* Stage Footlights under characters */
      .stage-footlight {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 75px;
        height: 16px;
        background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.6) 0%, rgba(236, 72, 153, 0.35) 50%, transparent 75%);
        border-radius: 50%;
        filter: blur(5px);
      }

      /* DANCING CARTOON CHARACTERS (Natural Cartoon Rhythm) */
      .char-wrapper {
        position: relative;
        transition: transform 0.3s ease;
      }

      /* Patlu Waving Groove */
      .patlu-anim {
        animation: patluDance 1.5s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes patluDance {
        0% { transform: translateY(0) rotate(-2deg); }
        50% { transform: translateY(-12px) rotate(3deg); }
        100% { transform: translateY(-4px) rotate(1deg); }
      }

      /* Motu Jolly Samosa Belly Bounce */
      .motu-anim {
        animation: motuDance 1.3s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes motuDance {
        0% { transform: scale(1) translateY(0) rotate(2deg); }
        50% { transform: scale(1.04, 0.96) translateY(-10px) rotate(-2deg); }
        100% { transform: scale(0.98, 1.03) translateY(-2px) rotate(2deg); }
      }

      /* Chhota Bheem Energetic Celebration Jump */
      .bheem-anim {
        animation: bheemJump 1.1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes bheemJump {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-20px) scale(1.06); }
        100% { transform: translateY(-4px) scale(0.98); }
      }

      /* Tom & Jerry Playful Rhythm */
      .tomjerry-anim {
        animation: tomJerryRock 1.4s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes tomJerryRock {
        0% { transform: rotate(-3deg) translateY(0); }
        50% { transform: rotate(4deg) translateY(-8px); }
        100% { transform: rotate(-1deg) translateY(-2px); }
      }

      /* Dora Waving & Dancing */
      .dora-anim {
        animation: doraStep 1.6s ease-in-out infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes doraStep {
        0% { transform: translateY(0) rotate(-3deg); }
        50% { transform: translateY(-10px) rotate(3deg); }
        100% { transform: translateY(-2px) rotate(-1deg); }
      }

      /* Shinchan Signature Hip Dance */
      .shinchan-anim {
        animation: shinchanHipGroove 1.0s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
        transform-origin: bottom center;
      }
      @keyframes shinchanHipGroove {
        0% { transform: translateY(0) rotate(-7deg); }
        50% { transform: translateY(-14px) rotate(6deg) scale(1.04); }
        100% { transform: translateY(-3px) rotate(8deg); }
      }

      /* Fairy String Lights along Top */
      .fairy-light-wire {
        position: absolute;
        top: 8px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1));
      }
      .fairy-bulb {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        animation: bulbFlicker 1.8s ease-in-out infinite alternate;
      }
      @keyframes bulbFlicker {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      /* Floating Festive Balloons */
      .fest-balloon {
        position: absolute;
        bottom: -100px;
        width: 32px;
        height: 42px;
        border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
        box-shadow: inset -4px -4px 10px rgba(0,0,0,0.25), 0 0 16px rgba(255,255,255,0.4);
        animation: balloonFloatUp linear forwards;
      }
      .fest-balloon::after {
        content: "";
        position: absolute;
        bottom: -16px;
        left: 50%;
        width: 1px;
        height: 18px;
        background: rgba(255,255,255,0.6);
        transform: translateX(-50%);
      }
      @keyframes balloonFloatUp {
        0% { transform: translateY(0) rotate(0deg); opacity: 0.85; }
        50% { transform: translateY(-55vh) rotate(6deg); }
        100% { transform: translateY(-110vh) rotate(-10deg); opacity: 0; }
      }

      /* Stage Focus Showcase Mode (Dims cards so user can watch cartoon fest stage) */
      body.stage-focus-active main,
      body.stage-focus-active header > div:first-child > div:last-child,
      body.stage-focus-active section {
        opacity: 0.12 !important;
        filter: blur(2px);
        transition: opacity 0.5s ease, filter 0.5s ease;
        pointer-events: none;
      }
      body.stage-focus-active #fest-tint-overlay {
        opacity: 0.05 !important;
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
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    explode() {
      this.exploded = true;
      const count = 45 + Math.floor(Math.random() * 30);
      const spread = 4.5 + Math.random() * 3;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.2 - 0.1);
        const speed = spread * (0.4 + Math.random() * 0.9);
        particles.push(
          new Particle(
            this.x,
            this.y,
            this.color,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            45 + Math.random() * 30,
            2.5 + Math.random() * 2
          )
        );
      }
    }
  }

  class Particle {
    constructor(x, y, color, vx, vy, maxLife = 50, size = 3) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = vx;
      this.vy = vy;
      this.life = maxLife;
      this.maxLife = maxLife;
      this.size = size;
      this.gravity = 0.08;
      this.drag = 0.982;
      this.sparkle = Math.random() > 0.4;
    }

    update() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      const r = this.sparkle && Math.random() > 0.4 ? this.size * 1.5 : this.size;

      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.4, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
      grad.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Ground Sparkler Fountains (Golden jets from reference pots)
  function emitSparklerFountains() {
    if (!isAnimationRunning) return;

    const leftX = width * 0.07;
    const rightX = width * 0.93;
    const fountainY = height - 15;

    const goldColor = { r: 255, g: 225, b: 90 };
    const magentaColor = { r: 244, g: 63, b: 180 };

    for (let i = 0; i < 3; i++) {
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

      if (timestamp - lastRocketTime > 1100 + Math.random() * 800) {
        launchRandomRocket();
        lastRocketTime = timestamp;
      }

      if (timestamp - lastBalloonTime > 5500 + Math.random() * 3500) {
        spawnBalloon();
        lastBalloonTime = timestamp;
      }
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.update();
      r.draw(ctx);
      if (r.exploded) rockets.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(i, 1);
    }

    animFrameId = requestAnimationFrame(animationLoop);
  }

  // Floating Controller Pill: Toggle Animation & Stage Showcase Mode
  function setupControls() {
    const controlPill = document.createElement("div");
    controlPill.id = "fest-anim-control-bar";
    controlPill.className =
      "fixed bottom-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/90 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl";

    controlPill.innerHTML = `
      <!-- Cartoon Fest Status -->
      <button id="fest-anim-toggle" class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-xs font-black text-white transition-all shadow-md">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span id="fest-toggle-label">🎪 Cartoon Fest: Live</span>
      </button>

      <!-- Watch Stage Showcase Mode -->
      <button id="fest-focus-toggle" class="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-black text-cyan-300 border border-white/20 transition-all" title="Toggle Stage Focus (Dim panels to watch full cartoon stage & characters)">
        <span>👁️ Watch Stage</span>
      </button>
    `;

    document.body.appendChild(controlPill);

    const toggleBtn = document.getElementById("fest-anim-toggle");
    const focusBtn = document.getElementById("fest-focus-toggle");

    // Play / Pause Visuals
    toggleBtn.addEventListener("click", () => {
      isAnimationRunning = !isAnimationRunning;
      const label = document.getElementById("fest-toggle-label");
      const dot = toggleBtn.querySelector("span:first-child");
      const beams = document.getElementById("stage-spotlights-container");
      const chars = document.getElementById("fest-characters-container");

      if (isAnimationRunning) {
        label.textContent = "🎪 Cartoon Fest: Live";
        toggleBtn.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-xs font-black text-white transition-all shadow-md";
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping";
        if (beams) beams.style.display = "block";
        if (chars) chars.style.opacity = "1";
      } else {
        label.textContent = "⏸️ Stage Paused";
        toggleBtn.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-black text-slate-300 transition-all";
        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
        if (beams) beams.style.display = "none";
        if (chars) chars.style.opacity = "0.3";
        particles = [];
        rockets = [];
      }
    });

    // Toggle Stage Focus Showcase Mode
    focusBtn.addEventListener("click", () => {
      isFocusStageMode = !isFocusStageMode;
      if (isFocusStageMode) {
        document.body.classList.add("stage-focus-active");
        focusBtn.innerHTML = "<span>↩️ Return to Fest</span>";
        focusBtn.classList.remove("bg-white/15", "text-cyan-300");
        focusBtn.classList.add("bg-pink-600", "text-white", "animate-pulse");
      } else {
        document.body.classList.remove("stage-focus-active");
        focusBtn.innerHTML = "<span>👁️ Watch Stage</span>";
        focusBtn.classList.remove("bg-pink-600", "text-white", "animate-pulse");
        focusBtn.classList.add("bg-white/15", "text-cyan-300");
      }
    });
  }
})();
