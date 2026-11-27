// ============================================
// RAKORDO LOADING ANIMATION
// ============================================

const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// Configuration
const CONFIG = {
    particleCount: 200,
    phases: {
        fadeIn: 450,
        scatter: 550,
        converge: 700,
        formR: 1150,
        holdR: 400,
        fadeOut: 650
    }
};

let particles = [];
let animationFrame;
let width, height;
let dpr = window.devicePixelRatio || 1;
let currentPhase = 'fadeIn';
let letterRPoints = [];

const BRAND_COLOR = '#00F397';
const BRAND_RGB = { r: 0, g: 140, b: 138 };
const R_FONT_SIZE = 240;

let useBrandColor = false;

// Resize canvas
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

// Glowing orb particle (white center → mint green edges)
class Particle {
    constructor(index) {
        this.index = index;
        // Start from random positions spread across the screen
        this.x = width * 0.1 + Math.random() * width * 0.8;
        this.y = height * 0.1 + Math.random() * height * 0.8;
        this.targetX = this.x;
        this.targetY = this.y;
        this.size = 2 + Math.random() * 2.5;
        this.baseSize = this.size;
        this.targetSize = this.size;
        this.alpha = 0;
        this.targetAlpha = 0;
        
        // Spring physics for ultra-smooth movement
        this.velX = 0;
        this.velY = 0;
        this.friction = 0.93;
        this.attraction = 0.008;
        
        // Gentle floating
        this.floatAngle = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.004 + Math.random() * 0.004;
        this.floatRadius = 2 + Math.random() * 3;
        this.floatActive = 1;
        
        // Glow pulse
        this.glowPhase = Math.random() * Math.PI * 2;
        this.glowSpeed = 0.012 + Math.random() * 0.01;
        
        // Color variation
        this.greenIntensity = 0.5 + Math.random() * 0.5;
    }

    setTarget(x, y, attraction, friction) {
        this.targetX = x;
        this.targetY = y;
        if (attraction !== undefined) this.attraction = attraction;
        if (friction !== undefined) this.friction = friction;
    }

    update(time) {
        // Spring-based smooth movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        this.velX += dx * this.attraction;
        this.velY += dy * this.attraction;
        this.velX *= this.friction;
        this.velY *= this.friction;
        
        this.x += this.velX;
        this.y += this.velY;
        
        // Smooth alpha interpolation
        this.alpha += (this.targetAlpha - this.alpha) * 0.05;
        
        // Smooth size interpolation
        this.size += (this.targetSize - this.size) * 0.06;
        
        // Floating motion
        this.floatAngle += this.floatSpeed;
        
        // Glow pulsing
        this.glowPhase += this.glowSpeed;
    }

    draw() {
        if (this.alpha < 0.01) return;
        
        const glowFactor = 0.75 + Math.sin(this.glowPhase) * 0.25;
        const floatMult = this.floatActive;
        const drawX = this.x + Math.cos(this.floatAngle) * this.floatRadius * floatMult;
        const drawY = this.y + Math.sin(this.floatAngle) * this.floatRadius * floatMult;
        // Always use the single brand color for orbs
        const baseColor = BRAND_RGB;
        
        ctx.save();
        ctx.globalAlpha = this.alpha * glowFactor;
        
        // Outer glow halo
            const outerGlow = ctx.createRadialGradient(
                drawX, drawY, 0,
                drawX, drawY, this.size * 1.6
            );
            outerGlow.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${0.16 * this.greenIntensity})`);
            outerGlow.addColorStop(0.35, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${0.12 * this.greenIntensity})`);
            outerGlow.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();
        
        // Main orb: white center → brand color edges
        const orbGradient = ctx.createRadialGradient(
            drawX, drawY, 0,
            drawX, drawY, this.size
        );
            orbGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            orbGradient.addColorStop(0.18, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.95)`);
            orbGradient.addColorStop(0.45, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${0.85 * this.greenIntensity})`);
            orbGradient.addColorStop(0.8, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${0.45 * this.greenIntensity})`);
            orbGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.12)`);
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = orbGradient;
        ctx.fill();
        
        ctx.restore();
    }
}

// Extract points from text rendered on offscreen canvas
function getTextPoints(text, fontSize, maxPoints) {
    // Simpler offscreen rendering at CSS pixel size for reliable sampling
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');

    offCanvas.width = Math.max(1, Math.floor(width));
    offCanvas.height = Math.max(1, Math.floor(height));

    // Scaled font size relative to canvas width
    const scaledFontSize = Math.min(fontSize, width * 0.22);
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    offCtx.fillStyle = '#000';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = `800 ${scaledFontSize}px Satoshi, sans-serif`;
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const points = [];
    const gap = Math.max(2, Math.floor(scaledFontSize / 26));

    for (let y = 0; y < offCanvas.height; y += gap) {
        for (let x = 0; x < offCanvas.width; x += gap) {
            const i = (y * offCanvas.width + x) * 4;
            if (imageData.data[i + 3] > 128) {
                points.push({ x, y });
            }
        }
    }
    
    // Shuffle for random distribution
    for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
    }

    return points.slice(0, maxPoints);
}

// Center a collection of points so their bounding-box center matches canvas center
function centerPoints(points) {
    if (!points || points.length === 0) return points;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const dx = (width / 2) - centerX;
    const dy = (height / 2) - centerY;
    return points.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        particles.push(new Particle(i));
    }
}

// ===== PHASE IMPLEMENTATIONS =====

function phaseFadeIn() {
    particles.forEach((p, i) => {
        p.targetAlpha = 0.7 + Math.random() * 0.3;
        p.targetSize = p.baseSize;
        p.attraction = 0.008;
        p.friction = 0.95;
        p.floatActive = 1;
    });
}

function phaseScatter() {
    particles.forEach((p) => {
        p.setTarget(
            width * 0.12 + Math.random() * width * 0.76,
            height * 0.12 + Math.random() * height * 0.76,
            0.006,
            0.94
        );
        p.targetAlpha = 0.65 + Math.random() * 0.3;
        p.targetSize = p.baseSize;
        p.floatActive = 1;
        p.floatRadius = 3 + Math.random() * 5;
    });
}

function phaseConverge() {
    const cx = width / 2;
    const cy = height / 2;
    
    particles.forEach((p, i) => {
        const angle = (i / particles.length) * Math.PI * 5;
        const radius = 15 + Math.random() * 50;
        p.setTarget(
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius,
            0.01,
            0.91
        );
        p.targetAlpha = 0.8;
        p.targetSize = p.baseSize * 0.85;
        p.floatActive = 0.3;
    });
}

function phaseFormR() {
    letterRPoints = getTextPoints('R', R_FONT_SIZE, CONFIG.particleCount);
    letterRPoints = centerPoints(letterRPoints);

    if (letterRPoints.length === 0) return;

    // Sort points to create a more regular, grid-like mapping for the R shape
    const sorted = letterRPoints.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));

    particles.forEach((p, i) => {
        const point = sorted[i % sorted.length];
        // Stronger attraction + lower friction for crisp locking into shape
        p.setTarget(point.x, point.y, 0.06, 0.82);
        p.targetAlpha = 1;
        p.targetSize = Math.max(1.4, Math.min(3, width * 0.006));
        p.floatActive = 0.02;
    });
}

function phaseHoldR() {
    particles.forEach(p => {
        p.attraction = 0.018;
        p.friction = 0.86;
        p.targetAlpha = 1;
        p.floatActive = 0.05;
    });
}

function setBrandColor(active) {
    useBrandColor = active;
    particles.forEach(p => {
        p.greenIntensity = active ? 1 : 0.5 + Math.random() * 0.5;
    });
}

// Main animation loop
let loopStartTime;

function animate(timestamp) {
    if (!loopStartTime) loopStartTime = timestamp;
    const time = (timestamp - loopStartTime) / 1000;
    
    ctx.clearRect(0, 0, width, height);
    
    // Update and draw all particles
    particles.forEach(p => {
        p.update(time);
        p.draw();
    });
    
    animationFrame = requestAnimationFrame(animate);
}

// Sequence controller
async function runSequence() {
    const { phases } = CONFIG;
    
    // Phase 1: Fade in
    currentPhase = 'fadeIn';
    phaseFadeIn();
    await wait(phases.fadeIn);
    
    // Phase 2: Scatter freely
    currentPhase = 'scatter';
    phaseScatter();
    await wait(phases.scatter);
    
    // Phase 3: Converge to center
    currentPhase = 'converge';
    phaseConverge();
    await wait(phases.converge);
    
    // Phase 4: Form "R" letter
    currentPhase = 'formR';
    phaseFormR();
    await wait(phases.formR);
    
    // Phase 5: Hold "R" in brand color
    currentPhase = 'holdR';
    setBrandColor(true);
    phaseHoldR();
    await wait(phases.holdR);
    
    // Crossfade the particle R into a crisp typographic wordmark.
    currentPhase = 'wordmark';
    const wordmark = document.createElement('div');
    wordmark.textContent = 'Rakordo';
    wordmark.setAttribute('aria-hidden', 'true');
    Object.assign(wordmark.style, {
        position: 'fixed', inset: '0', zIndex: '101',
        display: 'grid', placeItems: 'center', pointerEvents: 'none',
        fontFamily: 'var(--font-satoshi)', fontWeight: '700',
        fontSize: 'clamp(48px, 9vw, 104px)', letterSpacing: '-0.045em',
        color: 'var(--color-secondary)', opacity: '0',
        filter: 'blur(8px)', transform: 'scale(0.97)',
        transition: 'opacity 650ms ease, filter 650ms ease, transform 650ms ease'
    });
    document.body.appendChild(wordmark);
    canvas.style.transition = 'opacity 450ms ease';
    canvas.style.opacity = '0';
    await wait(220);
    wordmark.style.opacity = '1';
    wordmark.style.filter = 'blur(0)';
    wordmark.style.transform = 'scale(1)';
    await wait(450);
    cancelAnimationFrame(animationFrame);
    canvas.style.display = 'none';
    await wait(650);
    wordmark.style.opacity = '0';
    wordmark.style.transform = 'scale(1.02)';
    await wait(phases.fadeOut);
    wordmark.remove();
    showHero();
}

// Show hero section with staggered reveal using CSS transitions
function showHero() {
    const hero = document.getElementById('hero-section');
    hero.style.visibility = 'visible';
    hero.style.opacity = '1';
    document.body.style.overflow = 'auto';

    const revealSequence = [
        { selector: '.hero-header', delay: 0 },
        { selector: '.hero-badge', delay: 180 },
        { selector: '.hero-title', delay: 280 },
        { selector: '.hero-description', delay: 380 },
        { selector: '.hero-cta', delay: 460 },
        { selector: '.hero-visual', delay: 520 },
        { selector: '.hero-footer', delay: 580 }
    ];

    revealSequence.forEach(({ selector, delay }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, delay);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize everything
function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.style.display = 'none';
        showHero();
        return;
    }
    resizeCanvas();
    initParticles();
    
    // Pre-calculate text points
    letterRPoints = getTextPoints('R', R_FONT_SIZE, CONFIG.particleCount);

    
    // Start animation loop
    animationFrame = requestAnimationFrame(animate);
    
    // Start sequence after brief delay
    setTimeout(runSequence, 150);
    
    // Handle resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        letterRPoints = getTextPoints('R', R_FONT_SIZE, CONFIG.particleCount);

    });
}

// Wait for fonts to load then start
if (document.fonts) {
    Promise.race([document.fonts.load('700 100px Satoshi'), wait(1500)]).then(init, init);
} else {
    window.addEventListener('load', init);
}