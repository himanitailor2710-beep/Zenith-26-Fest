// Zenith '26 — Festive Stage, Fireworks & Particle Animation Engine
// Inspired by festive carnival night scene: Stage spotlights, bursting fireworks,
// Catherine wheels, ground sparklers, fairy string lights, and floating balloons.

(function () {
  let isAnimationRunning = true;
  let canvas, ctx;
  let width, height;
  let particles = [];
  let rockets = [];
  let sparklerFountains = [];
  let balloons = [];
  let stageSpotlights = [];
  let lastRocketTime = 0;
  let lastBalloonTime = 0;
  let animFrameId = null;

  // Festival Color Palette from Reference Image
  const FEST_COLORS = [
    { r: 255, g: 75, b: 130 },   // Neon Pink
    { r: 255, g: 215, b: 0 },    // Golden Sparkle
    { r: 0, g: 235, b: 255 },    // Electric Cyan
    { r: 168, g: 85, b: 247 },   // Violet / Purple
    { r: 52, g: 211, b: 153 },   // Emerald Green
    { r: 251, g: 146, b: 60 },   // Warm Orange
    { r: 255, g: 255, b: 255 },  // Pure Starlight White
  ];

  // Initialize once DOM is ready
  document.addEventListener("DOMContentLoaded", initFestiveBackdrop);

  function initFestiveBackdrop() {
    createBackdropElements();
    setupCanvas();
    setupSpotlights();
    setupFairyLights();
    setupControls();

    window.addEventListener("resize", onResize);

    // Start Animation Loop
    lastRocketTime = performance.now();
    lastBalloonTime = performance.now();
    animFrameId = requestAnimationFrame(animationLoop);
  }

  // Create DOM containers for background layers
  function createBackdropElements() {
    // Check if container already exists
    if (document.getElementById("fest-animation-backdrop")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "fest-animation-backdrop";
    wrapper.className = "fixed inset-0 pointer-events-none z-0 overflow-hidden";
    wrapper.setAttribute("aria-hidden", "true");

    wrapper.innerHTML = `
      <!-- 1. Stage Scene Background Image with subtle cinematic zoom -->
      <div id="fest-stage-bg" class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 transition-opacity duration-700" 
           style="background-image: url('/assets/fest-bg.jpg'); filter: brightness(0.65) saturate(1.25);">
      </div>

      <!-- 2. Night Fest Vignette & Gradient Overlays (preserves full readability) -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950/95"></div>
      <div class="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/60 to-slate-950 pointer-events-none"></div>

      <!-- 3. Dynamic Moving Stage Spotlights (Laser beams sweeping) -->
      <div id="stage-spotlights-container" class="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <div class="spotlight-beam beam-1"></div>
        <div class="spotlight-beam beam-2"></div>
        <div class="spotlight-beam beam-3"></div>
        <div class="spotlight-beam beam-4"></div>
      </div>

      <!-- 4. Fairy String Lights Hanging along top -->
      <div id="fairy-lights-garland" class="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 opacity-90 overflow-hidden">
        <!-- Bulbs generated dynamically -->
      </div>

      <!-- 5. Interactive HTML5 Fireworks & Sparklers Canvas -->
      <canvas id="fest-fireworks-canvas" class="absolute inset-0 w-full h-full pointer-events-none z-20"></canvas>

      <!-- 6. Floating Fest Balloons Container -->
      <div id="fest-balloons-container" class="absolute inset-0 overflow-hidden pointer-events-none z-15"></div>
    `;

    // Insert as first child of body so it stays in the deep background
    document.body.insertBefore(wrapper, document.body.firstChild);

    // Inject CSS for beams and fairy lights
    injectAnimationStyles();
  }

  function injectAnimationStyles() {
    if (document.getElementById("fest-animation-styles")) return;
    const style = document.createElement("style");
    style.id = "fest-animation-styles";
    style.textContent = `
      /* Cinematic Background Ambient Breathing */
      #fest-stage-bg {
        animation: festKenBurns 28s ease-in-out infinite alternate;
        transform-origin: center center;
      }
      @keyframes festKenBurns {
        0% { transform: scale(1.02) translateY(0); }
        50% { transform: scale(1.08) translateY(-10px); }
        100% { transform: scale(1.04) translateY(-4px); }
      }

      /* Sweeping Concert Stage Laser Beams */
      .spotlight-beam {
        position: absolute;
        bottom: -40px;
        width: 140px;
        height: 100vh;
        clip-path: polygon(48% 100%, 52% 100%, 100% 0%, 0% 0%);
        transform-origin: bottom center;
        filter: blur(25px);
        opacity: 0.35;
        mix-blend-mode: screen;
        pointer-events-none;
      }
      .beam-1 {
        left: 20%;
        background: linear-gradient(to top, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.3), transparent);
        animation: sweepBeam1 9s ease-in-out infinite alternate;
      }
      .beam-2 {
        left: 40%;
        background: linear-gradient(to top, rgba(236, 72, 153, 0.9), rgba(244, 63, 94, 0.3), transparent);
        animation: sweepBeam2 11s ease-in-out infinite alternate;
      }
      .beam-3 {
        left: 60%;
        background: linear-gradient(to top, rgba(6, 182, 212, 0.9), rgba(59, 130, 246, 0.3), transparent);
        animation: sweepBeam3 8s ease-in-out infinite alternate;
      }
      .beam-4 {
        left: 80%;
        background: linear-gradient(to top, rgba(234, 179, 8, 0.9), rgba(249, 115, 22, 0.3), transparent);
        animation: sweepBeam4 12s ease-in-out infinite alternate;
      }

      @keyframes sweepBeam1 {
        0% { transform: rotate(-35deg) scaleY(1); opacity: 0.25; }
        50% { opacity: 0.45; }
        100% { transform: rotate(15deg) scaleY(1.05); opacity: 0.25; }
      }
      @keyframes sweepBeam2 {
        0% { transform: rotate(-20deg) scaleY(1.05); opacity: 0.35; }
        100% { transform: rotate(35deg) scaleY(0.95); opacity: 0.2; }
      }
      @keyframes sweepBeam3 {
        0% { transform: rotate(25deg) scaleY(1); opacity: 0.3; }
        100% { transform: rotate(-30deg) scaleY(1.1); opacity: 0.45; }
      }
      @keyframes sweepBeam4 {
        0% { transform: rotate(40deg) scaleY(0.95); opacity: 0.2; }
        100% { transform: rotate(-10deg) scaleY(1.05); opacity: 0.4; }
      }

      /* Fairy Light Bulbs Garland */
      .fairy-light-wire {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 25px;
        border-bottom: 2px dashed rgba(255, 255, 255, 0.25);
        border-radius: 0 0 50% 50% / 0 0 100% 100%;
      }
      .fairy-bulb {
        position: absolute;
        width: 10px;
        height: 14px;
        border-radius: 50% 50% 40% 40%;
        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        animation: bulbTwinkle 2s ease-in-out infinite alternate;
      }
      @keyframes bulbTwinkle {
        0% { opacity: 0.4; filter: brightness(0.8); transform: scale(0.9); }
        50% { opacity: 1; filter: brightness(1.4); transform: scale(1.1); }
        100% { opacity: 0.5; filter: brightness(0.9); transform: scale(0.95); }
      }

      /* Floating Festive Balloon */
      .fest-balloon {
        position: absolute;
        bottom: -80px;
        width: 32px;
        height: 40px;
        border-radius: 50% 50% 48% 48%;
        animation: balloonFloat 16s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        box-shadow: inset -4px -4px 10px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 255, 255, 0.3);
      }
      .fest-balloon::after {
        content: '';
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.4);
      }
      @keyframes balloonFloat {
        0% {
          transform: translateY(0) translateX(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 0.75;
        }
        50% {
          transform: translateY(-50vh) translateX(30px) rotate(8deg);
        }
        90% {
          opacity: 0.75;
        }
        100% {
          transform: translateY(-110vh) translateX(-20px) rotate(-8deg);
          opacity: 0;
        }
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

  function setupSpotlights() {
    // Spotlights run via CSS keyframes for 60fps hardware accelerated rendering
  }

  function setupFairyLights() {
    const garland = document.getElementById("fairy-lights-garland");
    if (!garland) return;
    garland.innerHTML = '<div class="fairy-light-wire"></div>';

    const colors = ["#ff3366", "#ffcc00", "#33ccff", "#33ff99", "#cc33ff", "#ff9933"];
    const bulbCount = Math.floor(window.innerWidth / 35);

    for (let i = 0; i < bulbCount; i++) {
      const bulb = document.createElement("div");
      bulb.className = "fairy-bulb";
      const color = colors[i % colors.length];
      const leftPct = (i / bulbCount) * 100 + (Math.random() * 2 - 1);
      const topOffset = Math.sin((i / bulbCount) * Math.PI) * 12 + 6;

      bulb.style.left = `${leftPct}%`;
      bulb.style.top = `${topOffset}px`;
      bulb.style.color = color;
      bulb.style.backgroundColor = color;
      bulb.style.animationDelay = `${(i * 0.15) % 2.5}s`;
      bulb.style.animationDuration = `${1.6 + (i % 3) * 0.4}s`;

      garland.appendChild(bulb);
    }
  }

  // Floating Balloons Generator
  function spawnBalloon() {
    const container = document.getElementById("fest-balloons-container");
    if (!container || !isAnimationRunning) return;

    const balloon = document.createElement("div");
    balloon.className = "fest-balloon";

    const colors = [
      "linear-gradient(135deg, #f43f5e, #be123c)",
      "linear-gradient(135deg, #38bdf8, #0284c7)",
      "linear-gradient(135deg, #facc15, #ca8a04)",
      "linear-gradient(135deg, #a855f7, #7e22ce)",
      "linear-gradient(135deg, #34d399, #059669)",
      "linear-gradient(135deg, #fb923c, #ea580c)",
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.background = randomColor;
    balloon.style.left = `${5 + Math.random() * 90}%`;
    balloon.style.animationDuration = `${14 + Math.random() * 8}s`;
    balloon.style.transform = `scale(${0.7 + Math.random() * 0.5})`;

    container.appendChild(balloon);

    // Remove when animation finishes
    setTimeout(() => {
      if (balloon.parentNode) {
        balloon.parentNode.removeChild(balloon);
      }
    }, 24000);
  }

  // Fireworks & Ground Sparkler Particle Engine
  class Rocket {
    constructor(startX, targetX, targetY, color, type = "burst") {
      this.x = startX;
      this.y = height + 10;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.type = type; // "burst" or "spiral"
      this.speed = 9 + Math.random() * 3;
      const angle = Math.atan2(targetY - this.y, targetX - this.x);
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.trail = [];
      this.trailLength = 6;
      this.exploded = false;
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }

      this.x += this.vx;
      this.y += this.vy;

      // Check if reached apex / target
      if (this.vy >= 0 || this.y <= this.targetY) {
        this.explode();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Rocket head glow
      ctx.fillStyle = `rgb(255, 255, 255)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
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
    constructor(x, y, color, vx, vy, life = 80, size = 2.5) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = vx;
      this.vy = vy;
      this.alpha = 1;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.gravity = 0.045;
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
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Standard Spherical Firework Explosion
  function createStandardBurst(x, y, color) {
    const count = 65 + Math.floor(Math.random() * 30);
    const speed = 4.5 + Math.random() * 3.5;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.2);
      const spd = speed * (0.3 + Math.random() * 0.7);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const life = 60 + Math.floor(Math.random() * 40);
      const size = 1.8 + Math.random() * 1.6;
      particles.push(new Particle(x, y, color, vx, vy, life, size));
    }
  }

  // Spiral / Catherine Wheel Firework Burst (as in reference image)
  function createSpiralBurst(x, y, color) {
    const spiralArms = 4;
    const particlesPerArm = 22;

    for (let arm = 0; arm < spiralArms; arm++) {
      const baseAngle = (Math.PI * 2 / spiralArms) * arm;
      for (let j = 0; j < particlesPerArm; j++) {
        const angle = baseAngle + j * 0.22;
        const spd = (j / particlesPerArm) * 5.5 + 1.2;
        const vx = Math.cos(angle) * spd;
        const vy = Math.sin(angle) * spd;
        particles.push(new Particle(x, y, color, vx, vy, 85, 2.2));
      }
    }
  }

  // Ground Sparkler Fountains (Anar Fountains)
  function emitSparklerFountains() {
    if (!isAnimationRunning) return;

    // Left Fountain (around 12% width, bottom)
    const leftX = width * 0.08;
    const rightX = width * 0.92;
    const fountainY = height - 10;

    const goldColor = { r: 255, g: 215, b: 80 };
    const cyanColor = { r: 100, g: 235, b: 255 };

    // Emit 2-3 rising sparkling embers per frame from each fountain
    for (let i = 0; i < 2; i++) {
      // Left fountain
      const lAngle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25);
      const lSpeed = 5 + Math.random() * 6;
      particles.push(
        new Particle(
          leftX + (Math.random() * 10 - 5),
          fountainY,
          goldColor,
          Math.cos(lAngle) * lSpeed,
          Math.sin(lAngle) * lSpeed,
          45 + Math.random() * 25,
          1.5 + Math.random() * 1.5
        )
      );

      // Right fountain
      const rAngle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25);
      const rSpeed = 5 + Math.random() * 6;
      particles.push(
        new Particle(
          rightX + (Math.random() * 10 - 5),
          fountainY,
          cyanColor,
          Math.cos(rAngle) * rSpeed,
          Math.sin(rAngle) * rSpeed,
          45 + Math.random() * 25,
          1.5 + Math.random() * 1.5
        )
      );
    }
  }

  // Launch a new random aerial firework rocket
  function launchRandomRocket() {
    const startX = width * (0.2 + Math.random() * 0.6);
    const targetX = startX + (Math.random() * 160 - 80);
    const targetY = height * (0.12 + Math.random() * 0.35); // explode in upper sky
    const color = FEST_COLORS[Math.floor(Math.random() * FEST_COLORS.length)];
    const type = Math.random() > 0.65 ? "spiral" : "burst";

    rockets.push(new Rocket(startX, targetX, targetY, color, type));
  }

  // Main Canvas Render Loop (60 FPS)
  function animationLoop(timestamp) {
    if (!ctx) return;

    // Clear with light transparent fade for subtle trailing effect
    ctx.clearRect(0, 0, width, height);

    if (isAnimationRunning) {
      // Continuous ground sparklers
      emitSparklerFountains();

      // Launch aerial fireworks at rhythmic intervals (every 1.2 to 2.2 seconds)
      if (timestamp - lastRocketTime > 1400 + Math.random() * 900) {
        launchRandomRocket();
        lastRocketTime = timestamp;
      }

      // Spawn drifting balloon periodically
      if (timestamp - lastBalloonTime > 6000 + Math.random() * 4000) {
        spawnBalloon();
        lastBalloonTime = timestamp;
      }
    }

    // Update and draw Rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const rocket = rockets[i];
      rocket.update();
      rocket.draw(ctx);
      if (rocket.exploded) {
        rockets.splice(i, 1);
      }
    }

    // Update and draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    animFrameId = requestAnimationFrame(animationLoop);
  }

  // Interactive Play/Pause Control Pill
  function setupControls() {
    // Add floating toggle button in bottom-right corner or navbar
    const controlPill = document.createElement("button");
    controlPill.id = "fest-anim-toggle";
    controlPill.className =
      "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95";
    controlPill.title = "Toggle Festive Background Animations (Fireworks, Lights, Spotlights)";
    controlPill.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
      <span id="fest-toggle-label">✨ Fest FX: Playing</span>
    `;

    controlPill.addEventListener("click", () => {
      isAnimationRunning = !isAnimationRunning;
      const label = document.getElementById("fest-toggle-label");
      const dot = controlPill.querySelector("span:first-child");
      const beams = document.getElementById("stage-spotlights-container");

      if (isAnimationRunning) {
        label.textContent = "✨ Fest FX: Playing";
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping";
        if (beams) beams.style.display = "block";
      } else {
        label.textContent = "⏸️ Fest FX: Paused";
        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
        if (beams) beams.style.display = "none";
        // Clear active particles
        particles = [];
        rockets = [];
      }
    });

    document.body.appendChild(controlPill);
  }
})();
