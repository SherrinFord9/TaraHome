// ============================================
// TARA AI - Coming Soon Landing Page
// Enhanced with Cinematic Intro & Interactive Features
// ============================================

// ============================================
// Cinematic Intro Animation
// ============================================

class CinematicIntro {
    constructor() {
        this.canvas = document.getElementById('intro-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        this.isComplete = false;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.createParticles();
    }

    createParticles() {
        // Create particles scattered around screen
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 600 + 200;
            
            this.particles.push({
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance,
                targetX: this.centerX,
                targetY: this.centerY,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.02 + 0.01,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }

    animate() {
        if (this.isComplete) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let allConverged = true;
        
        for (let particle of this.particles) {
            // Move towards center
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                allConverged = false;
                particle.x += dx * particle.speed;
                particle.y += dy * particle.speed;
            }
            
            // Draw particle with glow
            this.ctx.fillStyle = `rgba(100, 150, 255, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glow effect
            this.ctx.fillStyle = `rgba(100, 150, 255, ${particle.opacity * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (allConverged) {
            this.isComplete = true;
            this.createPulse();
        } else {
            requestAnimationFrame(() => this.animate());
        }
    }

    createPulse() {
        // Create expanding pulse effect
        let pulseRadius = 0;
        const maxRadius = 300;
        
        const pulse = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            pulseRadius += 15;
            const opacity = 1 - (pulseRadius / maxRadius);
            
            this.ctx.strokeStyle = `rgba(100, 150, 255, ${opacity})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            if (pulseRadius < maxRadius) {
                requestAnimationFrame(pulse);
            } else {
                this.revealLogo();
            }
        };
        
        pulse();
    }

    revealLogo() {
        const logo = document.getElementById('intro-logo');
        const whisper = document.getElementById('intro-whisper');
        
        // Fade in logo
        gsap.to(logo, {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        });
        
        // Fade in whisper text
        gsap.to(whisper, {
            opacity: 1,
            duration: 1.5,
            delay: 1,
            ease: "power2.out",
            onComplete: () => {
                // Complete intro after delay
                setTimeout(() => this.completeIntro(), 2000);
            }
        });
    }

    completeIntro() {
        const introElement = document.getElementById('cinematic-intro');
        introElement.classList.add('hidden');
        
        // Start main experience
        setTimeout(() => {
            playBootSound();
            initMainExperience();
        }, 500);
    }
}

// ============================================
// Audio System
// ============================================

function playBootSound() {
    const audio = document.getElementById('boot-sound');
    
    // Only play if audio source is available
    if (audio && audio.querySelector('source')) {
        audio.volume = 0.3; // Subtle volume
        audio.play().catch(err => {
            console.log('Audio autoplay prevented:', err);
            // Fallback: play on first user interaction
            document.addEventListener('click', () => {
                audio.play().catch(() => {});
            }, { once: true });
        });
    }
}

// ============================================
// Particle System - Interactive Stars
// REPLACED WITH PARTICLES.JS - See particlesjs-config.json
// ============================================

/* CUSTOM PARTICLE SYSTEM - COMMENTED OUT (Now using Particles.js)
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 180 };
        this.particleCount = 150;
        this.animateBound = this.animate.bind(this);
        this.breathePhase = 0; // For ambient breathing effect

        this.init();
        this.setupEventListeners();
        requestAnimationFrame(this.animateBound);
    }

    init() {
        // Force correct canvas sizing on initialization
        this.canvas.width = window.innerWidth;
        this.canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
        this.createParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
    }

    createParticles() {
        this.particles = Array.from({ length: this.particleCount }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 0.6,
            baseX: Math.random() * this.canvas.width,
            baseY: Math.random() * this.canvas.height,
            density: Math.random() * 20 + 10,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            glow: Math.random() * 0.5 + 0.2
        }));
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y + window.scrollY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const breathe = 1 + Math.sin(this.breathePhase) * 0.2; // slightly stronger pulse
        this.ctx.globalCompositeOperation = 'lighter'; // add bloom-like blending

        for (const p of this.particles) {
            this.ctx.beginPath();

            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 10);
            gradient.addColorStop(0, `rgba(150,180,255,${0.4 * breathe})`);
            gradient.addColorStop(0.5, `rgba(100,150,255,${0.15 * breathe})`);
            gradient.addColorStop(1, `rgba(100,150,255,0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.connectParticles();
    }

    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    const alpha = (1 - dist / 100) * 0.15;
                    this.ctx.strokeStyle = `rgba(200,200,255,${alpha})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    updateParticles() {
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Gentle parallax drift synced with breathing
            p.x += Math.sin(this.breathePhase / 2 + p.baseX) * 0.05;
            p.y += Math.cos(this.breathePhase / 2 + p.baseY) * 0.05;

            if (this.mouse.x && this.mouse.y) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const repel = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x += Math.cos(angle) * repel * 8;
                    p.y += Math.sin(angle) * repel * 8;
                }
            }

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        }
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        
        // Increment breathe phase (completes cycle every ~3 seconds at 60fps)
        this.breathePhase += 0.02;
        
        requestAnimationFrame(this.animateBound);
    }
}
END OF CUSTOM PARTICLE SYSTEM */

// ============================================
// Enhanced Glow - Responsive & Breathing (TARA Section)
// ============================================

function setupEnhancedGlow() {
    const heroGlow = document.querySelector('.hero-glow');
    const taraSection = document.getElementById('tara-reveal');
    
    if (!heroGlow || !taraSection) return;

    // Intensify on hover over TARA text/logo
    const taraElements = taraSection.querySelectorAll('.statement-text, h1, img');
    
    taraElements.forEach(element => {
        if (element) {
            element.addEventListener('mouseenter', () => {
                heroGlow.classList.add('intensified');
            });
            
            element.addEventListener('mouseleave', () => {
                heroGlow.classList.remove('intensified');
            });
        }
    });

    // Intensify when TARA section is in view
    window.addEventListener('scroll', () => {
        const rect = taraSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (inView) {
            heroGlow.classList.add('intensified');
        } else {
            heroGlow.classList.remove('intensified');
        }
    });
}

// ============================================
// Easter Egg - "jarvis" Keyboard Trigger
// ============================================

function setupEasterEgg() {
    let typedSequence = '';
    const targetSequence = 'jarvis';
    const easterEgg = document.getElementById('easter-egg');
    
    document.addEventListener('keydown', (e) => {
        typedSequence += e.key.toLowerCase();
        
        // Keep only last N characters
        if (typedSequence.length > targetSequence.length) {
            typedSequence = typedSequence.slice(-targetSequence.length);
        }
        
        // Check if sequence matches
        if (typedSequence === targetSequence) {
            easterEgg.classList.remove('tw-hidden');
            
            // Add extra glow effect
            const heroGlow = document.querySelector('.hero-glow');
            if (heroGlow) {
                heroGlow.style.background = 'radial-gradient(circle, rgba(255, 100, 255, 0.25) 0%, rgba(255, 100, 255, 0) 70%)';
                setTimeout(() => {
                    heroGlow.style.background = 'radial-gradient(circle, rgba(100, 100, 255, 0.15) 0%, rgba(100, 100, 255, 0) 70%)';
                }, 3000);
            }
            
            // Scroll to easter egg smoothly
            setTimeout(() => {
                easterEgg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
            
            // Reset sequence
            typedSequence = '';
            
            console.log('🎉 Easter egg activated! TARA is watching...');
        }
    });
}

// ============================================
// Click-to-Advance Navigation
// ============================================

function setupClickNavigation() {
    const statementSections = gsap.utils.toArray('.statement-section');
    let currentSection = 0;
    
    console.log('Found sections:', statementSections.length);
    
    // Position all sections in the same place (overlay)
    statementSections.forEach((section, index) => {
        section.style.position = 'fixed';
        section.style.top = '0';
        section.style.left = '0';
        section.style.width = '100%';
        section.style.height = '100vh';
    });
    
    // Hide all sections initially except the first one
    statementSections.forEach((section, index) => {
        if (index === 0) {
            gsap.set(section, { opacity: 1, display: 'flex', zIndex: 10 });
            const text = section.querySelector('.statement-text');
            if (text) {
                gsap.set(text, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", rotateX: 0 });
            }
            console.log('Showing first section:', section);
        } else {
            gsap.set(section, { opacity: 0, display: 'none', zIndex: 1 });
            const text = section.querySelector('.statement-text');
            if (text) {
                gsap.set(text, { opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)", rotateX: 15 });
            }
        }
    });

    // Hide CTA section initially
    const ctaSection = document.querySelector('#cta-section');
    if (ctaSection) {
        ctaSection.style.position = 'fixed';
        ctaSection.style.top = '0';
        ctaSection.style.left = '0';
        ctaSection.style.width = '100%';
        ctaSection.style.height = '100vh';
        gsap.set(ctaSection, { opacity: 0, display: 'none' });
    }
    gsap.set('.cta-headline', { opacity: 0, y: 50, scale: 0.6, filter: "blur(8px)", rotateX: 10 });
    gsap.set('.cta-subtext', { opacity: 0, y: 30, scale: 0.6, filter: "blur(6px)" });
    gsap.set('#waitlist-form', { opacity: 0, y: 30, scale: 0.6, filter: "blur(4px)" });

    let isTransitioning = false;
    
    function showPreviousSection() {
        if (isTransitioning) return;
        if (currentSection <= 0) return; // Already at first section
        
        isTransitioning = true;
        
        // Handle going back from CTA section
        if (currentSection >= statementSections.length) {
            const ctaSection = document.querySelector('#cta-section');
            if (ctaSection) {
                gsap.to(ctaSection, {
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(ctaSection, { display: 'none', zIndex: 1 });
                        currentSection = statementSections.length - 1;
                        showCurrentSection();
                        isTransitioning = false;
                    }
                });
            }
            return;
        }
        
        // Hide current section
        const currentEl = statementSections[currentSection];
        const currentText = currentEl.querySelector('.statement-text');
        
        console.log('Going back from section:', currentSection);
        
        if (currentText) {
            gsap.to(currentText, {
                opacity: 0,
                y: 50,
                scale: 0.8,
                filter: "blur(12px)",
                rotateX: 15,
                rotateY: -10,
                duration: 0.8,
                ease: "power2.in"
            });
        }
        
        gsap.to(currentEl, {
            opacity: 0,
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => {
                gsap.set(currentEl, { display: 'none', zIndex: 1 });
                currentSection--;
                showCurrentSection();
                isTransitioning = false;
            }
        });
    }
    
    function showNextSection() {
        if (isTransitioning) return; // Prevent multiple clicks during transition
        
        if (currentSection < statementSections.length - 1) {
            isTransitioning = true;
            
            // Hide current section
            const currentEl = statementSections[currentSection];
            const currentText = currentEl.querySelector('.statement-text');
            
            console.log('Hiding section:', currentSection);
            
            if (currentText) {
                gsap.to(currentText, {
                    opacity: 0,
                    y: -50,
                    scale: 1.3,
                    filter: "blur(12px)",
                    rotateX: -15,
                    rotateY: 10,
                    duration: 0.8,
                    ease: "power2.in"
                });
            }
            
            gsap.to(currentEl, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.in",
                onComplete: () => {
                    gsap.set(currentEl, { display: 'none', zIndex: 1 });
                    currentSection++;
                    showCurrentSection();
                    isTransitioning = false;
                }
            });
        } else if (currentSection === statementSections.length - 1) {
            isTransitioning = true;
            
            // Show CTA section
            const lastSection = statementSections[currentSection];
            gsap.to(lastSection, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.in",
                onComplete: () => {
                    gsap.set(lastSection, { display: 'none', zIndex: 1 });
                    
                    const ctaSection = document.querySelector('#cta-section');
                    if (ctaSection) {
                        gsap.set(ctaSection, { display: 'flex', zIndex: 20 });
                    }
                    
                    gsap.to('#cta-section', {
                        opacity: 1,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                    
                    gsap.to('.cta-headline', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        rotateX: 0,
                        duration: 0.9,
                        ease: "power2.out",
                        delay: 0.2
                    });
                    
                    gsap.to('.cta-subtext', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        duration: 0.8,
                        ease: "power2.out",
                        delay: 0.4
                    });
                    
                    gsap.to('#waitlist-form', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        duration: 0.7,
                        ease: "power2.out",
                        delay: 0.6,
                        onComplete: () => {
                            isTransitioning = false;
                        }
                    });
                    
                    currentSection++; // Mark as completed
                }
            });
        }
    }

    function showCurrentSection() {
        const currentEl = statementSections[currentSection];
        const currentText = currentEl.querySelector('.statement-text');
        
        console.log('Showing section:', currentSection, currentEl);
        
        // Ensure section is visible and on top
        gsap.set(currentEl, { 
            display: 'flex',
            visibility: 'visible',
            zIndex: 20,
            opacity: 0
        });
        
        gsap.to(currentEl, {
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        });
        
        if (currentText) {
            console.log('Animating text:', currentText);
            // Reset text position first
            gsap.set(currentText, {
                y: 50,
                scale: 0.9,
                filter: "blur(10px)",
                rotateX: 15,
                opacity: 0
            });
            
            // Then animate in
            gsap.to(currentText, {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                rotateX: 0,
                duration: 1.0,
                ease: "power2.out",
                delay: 0.3
            });
        } else {
            console.warn('No text found in section');
        }
    }

    // Add click listener to document with left/right navigation
    document.addEventListener('click', (e) => {
        // Don't advance if clicking on form elements
        if (e.target.closest('#waitlist-form')) return;
        
        const clickX = e.clientX;
        const screenWidth = window.innerWidth;
        
        console.log('Click detected at X:', clickX, 'current section:', currentSection);
        
        // Left half = go back, Right half = go forward
        if (clickX < screenWidth / 2) {
            console.log('Left click - going back');
            showPreviousSection();
        } else {
            console.log('Right click - going forward');
            showNextSection();
        }
    });

    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            showNextSection();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            showPreviousSection();
        }
    });

    // Show scroll indicator initially
    gsap.from(".scroll-indicator", {
        opacity: 0,
        y: 10,
        duration: 1.0,
        delay: 0.6,
        ease: "power2.out"
    });

    // Subtle left/right hints + cursor guidance
    const hintLeft  = document.getElementById('hint-left');
    const hintRight = document.getElementById('hint-right');
    let hintsSeen = false;
    let hideTimer;

    function setCursor(side) {
        document.body.style.cursor = side === 'left' ? 'w-resize' : 'e-resize';
    }
    function showHint(side) {
        if (!hintLeft || !hintRight) return;
        hintLeft.classList.toggle('visible', side === 'left');
        hintRight.classList.toggle('visible', side === 'right');
    }

    window.addEventListener('mousemove', (e) => {
        const side = e.clientX < window.innerWidth * 0.5 ? 'left' : 'right';
        setCursor(side);

        if (!hintsSeen) {
            showHint(side);
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                hintLeft?.classList.remove('visible');
                hintRight?.classList.remove('visible');
                hintsSeen = true;
                document.body.style.cursor = '';
            }, 1200);
        }
    }, { passive: true });

    // After first click, stop showing hints
    document.addEventListener('click', () => {
        hintsSeen = true;
        hintLeft?.classList.remove('visible');
        hintRight?.classList.remove('visible');
        document.body.style.cursor = '';
    }, { once: true });
}

// ============================================
// Waitlist Form Handler
// ============================================

function setupWaitlistForm() {
    const waitlistForm = document.getElementById('waitlist-form');
    const successMessage = document.getElementById('success-message');

    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = waitlistForm.querySelector('input[name="email"]').value;
        const button = waitlistForm.querySelector('button');
        
        button.textContent = 'Awakening...';
        button.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            waitlistForm.style.display = 'none';
            successMessage.classList.remove('tw-hidden');
            
            // Optional: Send to backend
            // await fetch('/api/waitlist', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email })
            // });
            
            console.log('Email submitted:', email);
            
        } catch (error) {
            console.error('Error:', error);
            button.textContent = 'Be Notified When She Awakens';
            button.disabled = false;
        }
    });
}

// ============================================
// Smooth Scroll Enhancement
// ============================================

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// Cursor Glow Effect
// ============================================

function setupCursorGlow() {
    const cursorGlow = document.createElement('div');
    cursorGlow.style.cssText = `
        position: fixed;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(100, 100, 255, 0.08) 0%, rgba(100, 100, 255, 0) 70%);
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 5;
        transition: opacity 0.3s;
        opacity: 0;
    `;
    document.body.appendChild(cursorGlow);

    let mouseTimeout;

    window.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        cursorGlow.style.opacity = '1';
        
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
            cursorGlow.style.opacity = '0';
        }, 100);
    });

    window.addEventListener('mouseout', () => {
        cursorGlow.style.opacity = '0';
    });
}

// ============================================
// Particles.js Initialization with fallback
// ============================================

async function initParticles() {
    if (typeof window.particlesJS === 'undefined') {
        console.error('Particles.js library failed to load.');
        return;
    }

    try {
        if (location.protocol !== 'file:') {
            const response = await fetch('particlesjs-config.json', { cache: 'no-store' });
            if (response.ok) {
                const cfg = await response.json();
                window.particlesJS('particles-js', cfg);
                console.log('✨ Particles.js loaded from particlesjs-config.json');
                return;
            }
        }
    } catch (err) {
        console.warn('Particles config fetch failed, using inline fallback.', err);
    }

    const cfg = {
        "particles": {
            "number": { "value": 100, "density": { "enable": true, "value_area": 1200 } },
            "color": { "value": "#ffffff" },
            "shape": { "type": "star", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 } },
            "opacity": { "value": 0.8, "random": true, "anim": { "enable": true, "speed": 0.6, "opacity_min": 0.15, "sync": false } },
            "size": { "value": 2.2, "random": true, "anim": { "enable": true, "speed": 4, "size_min": 0.4, "sync": false } },
            "line_linked": { "enable": true, "distance": 180, "color": "#a8b6ff", "opacity": 0.25, "width": 0.7 },
            "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } }
        },
        "interactivity": {
            "detect_on": "window",
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
            "modes": { "grab": { "distance": 120, "line_linked": { "opacity": 0.75 } }, "bubble": { "distance": 200, "size": 4, "duration": 2, "opacity": 0.2, "speed": 3 }, "repulse": { "distance": 120, "duration": 0.45 }, "push": { "particles_nb": 6 }, "remove": { "particles_nb": 2 } }
        },
        "retina_detect": true
    };

    window.particlesJS('particles-js', cfg);
    console.log('✨ Particles.js loaded from inline fallback config');
}

// ============================================
// Main Initialization
// ============================================

async function initMainExperience() {
    // Initialize Particles.js (with inline fallback when needed)
    await initParticles();
    
    // Setup all interactive features
    // setupEnhancedGlow(); // Removed: no glow element
    setupEasterEgg();
    setupClickNavigation(); // Changed from setupScrollAnimations
    setupWaitlistForm();
    setupSmoothScroll();
    setupCursorGlow();
    
    // Start shooting stars overlay
    initShootingStars();
    
    console.log('🌌 TARA AI - Main Experience Initialized');
}

// ============================================
// Start Application
// ============================================

// Canvas sizing no longer needed - Particles.js handles this automatically
/* 
window.addEventListener('load', () => {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
    }
});
*/

window.addEventListener('DOMContentLoaded', () => {
    console.log('🌌 TARA AI - Initializing...');
    console.log('Something intelligent is awakening...');
    
    // Start main experience immediately (no intro)
    initMainExperience();
});

// ============================================
// Shooting Stars Overlay (every ~10s)
// ============================================

function initShootingStars() {
    const canvas = document.getElementById('shooting-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const stars = [];

    function spawnStar() {
        const margin = 60;
        const speed = 6 + Math.random() * 4; // 6-10 px/frame

        // Randomize origin edge
        const edge = Math.floor(Math.random() * 4); // 0: left, 1: right, 2: top, 3: bottom
        let x, y, destX, destY;

        if (edge === 0) { // from left -> to right-ish
            x = -margin;
            y = Math.random() * canvas.height;
            destX = canvas.width + margin;
            destY = Math.random() * canvas.height;
        } else if (edge === 1) { // from right -> to left-ish
            x = canvas.width + margin;
            y = Math.random() * canvas.height;
            destX = -margin;
            destY = Math.random() * canvas.height;
        } else if (edge === 2) { // from top -> to bottom-ish
            x = Math.random() * canvas.width;
            y = -margin;
            destX = Math.random() * canvas.width;
            destY = canvas.height + margin;
        } else { // from bottom -> to top-ish
            x = Math.random() * canvas.width;
            y = canvas.height + margin;
            destX = Math.random() * canvas.width;
            destY = -margin;
        }

        // Compute velocity vector towards destination
        const dx = destX - x;
        const dy = destY - y;
        const len = Math.hypot(dx, dy) || 1;
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;

        // Life based on travel distance (clamped)
        const travelFrames = Math.min(160, Math.max(80, len / speed * 0.06));
        stars.push({ x, y, vx, vy, life: 0, maxLife: travelFrames });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life++;

            const t = s.life / s.maxLife; // 0..1
            const opacity = 1 - t;

            // star head
            ctx.fillStyle = `rgba(255,255,255,${opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // tail
            const tailLen = 80;
            const tx = s.x - s.vx * 4;
            const ty = s.y - s.vy * 4;
            const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
            grad.addColorStop(0, `rgba(168,182,255,0)`);
            grad.addColorStop(1, `rgba(255,255,255,${opacity})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();

            if (s.life > s.maxLife || s.x > canvas.width + 50 || s.y > canvas.height + 50) {
                stars.splice(i, 1);
            }
        }
        requestAnimationFrame(draw);
    }

    function scheduleNext() {
        spawnStar();
        if (Math.random() < 0.25) setTimeout(spawnStar, 120); // small burst 25% of the time
        const delay = 1800 + Math.random() * 2200; // 1.8–4.0s
        setTimeout(scheduleNext, delay);
      }
      scheduleNext();
      draw();
}
