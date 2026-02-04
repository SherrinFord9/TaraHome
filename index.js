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
    let isTransitioning = false;
    const totalSections = statementSections.length;

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
                        updateFloatingCTAVisibility(currentSection, totalSections);
                        if (window.updateEdgeArrows) window.updateEdgeArrows();
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
                updateFloatingCTAVisibility(currentSection, totalSections);
                if (window.updateEdgeArrows) window.updateEdgeArrows();
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
                    updateFloatingCTAVisibility(currentSection, totalSections);
                    if (window.updateEdgeArrows) window.updateEdgeArrows();
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

                    // Hide floating CTA and edge arrows when at CTA section
                    const floatingCTA = document.getElementById('floating-cta');
                    if (floatingCTA) floatingCTA.classList.remove('visible');
                    if (window.updateEdgeArrows) window.updateEdgeArrows();
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
        // Don't advance if clicking on interactive elements
        if (e.target.closest('#waitlist-form')) return;
        if (e.target.closest('#floating-cta')) return;
        
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

    // Edge navigation arrows - always visible, context-aware
    const hintLeft = document.getElementById('hint-left');
    const hintRight = document.getElementById('hint-right');

    function updateEdgeArrows() {
        if (!hintLeft || !hintRight) return;

        // At CTA section - hide both arrows
        if (currentSection >= statementSections.length) {
            hintLeft.classList.add('hidden');
            hintRight.classList.add('hidden');
            return;
        }

        // At first section - hide left, show right
        if (currentSection === 0) {
            hintLeft.classList.add('hidden');
            hintRight.classList.remove('hidden');
        } else {
            // Middle sections - show both
            hintLeft.classList.remove('hidden');
            hintRight.classList.remove('hidden');
        }
    }

    // Initial arrow state
    updateEdgeArrows();

    // Update arrows after each navigation
    window.updateEdgeArrows = updateEdgeArrows;

    // Highlight arrow on hover (desktop only)
    window.addEventListener('mousemove', (e) => {
        if (!hintLeft || !hintRight) return;

        const side = e.clientX < window.innerWidth * 0.5 ? 'left' : 'right';

        // Update cursor
        document.body.style.cursor = side === 'left' ? 'w-resize' : 'e-resize';

        // Highlight the relevant arrow
        hintLeft.classList.toggle('active', side === 'left');
        hintRight.classList.toggle('active', side === 'right');
    }, { passive: true });

    // Reset cursor when mouse leaves
    window.addEventListener('mouseout', () => {
        document.body.style.cursor = '';
        hintLeft?.classList.remove('active');
        hintRight?.classList.remove('active');
    });

    // Expose jumpToCTA globally for floating CTA button
    window.jumpToCTA = function() {
        if (isTransitioning) return;
        if (currentSection >= statementSections.length) return; // Already at CTA

        isTransitioning = true;

        // Hide current statement section
        const currentEl = statementSections[currentSection];
        if (currentEl) {
            gsap.to(currentEl, {
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    gsap.set(currentEl, { display: 'none', zIndex: 1 });
                }
            });
        }

        // Hide all other statement sections too
        statementSections.forEach(section => {
            gsap.set(section, { opacity: 0, display: 'none', zIndex: 1 });
        });

        // Show CTA section
        const ctaSection = document.querySelector('#cta-section');
        if (ctaSection) {
            gsap.set(ctaSection, { display: 'flex', zIndex: 20 });
            gsap.to(ctaSection, { opacity: 1, duration: 0.6, ease: "power2.out" });
        }

        gsap.to('.cta-headline', {
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)", rotateX: 0,
            duration: 0.7, ease: "power2.out", delay: 0.15
        });
        gsap.to('.cta-subtext', {
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
            duration: 0.6, ease: "power2.out", delay: 0.3
        });
        gsap.to('#waitlist-form', {
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
            duration: 0.5, ease: "power2.out", delay: 0.45,
            onComplete: () => {
                isTransitioning = false;
            }
        });

        // Update current section to be at CTA (past all statement sections)
        currentSection = statementSections.length;

        // Hide floating CTA and edge arrows
        const floatingCTA = document.getElementById('floating-cta');
        if (floatingCTA) floatingCTA.classList.remove('visible');
        if (window.updateEdgeArrows) window.updateEdgeArrows();

        console.log('Jumped to CTA section, currentSection:', currentSection);
    };
}

// ============================================
// Waitlist Form Handler (Formspree Integration)
// ============================================

function setupWaitlistForm() {
    const waitlistForm = document.getElementById('waitlist-form');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('form-error');

    if (!waitlistForm) return;

    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = waitlistForm.querySelector('input[name="email"]');
        const email = emailInput.value.trim();
        const button = waitlistForm.querySelector('button');

        // Hide any previous error
        if (errorMessage) errorMessage.classList.add('tw-hidden');

        // Client-side validation
        if (!isValidEmail(email)) {
            showFormError('Please enter a valid email address');
            return;
        }

        button.textContent = 'Awakening...';
        button.disabled = true;

        try {
            const formData = new FormData(waitlistForm);

            const response = await fetch(waitlistForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                waitlistForm.style.display = 'none';
                successMessage.classList.remove('tw-hidden');

                // Track conversion in Google Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'waitlist_signup', {
                        'event_category': 'engagement',
                        'event_label': 'TARA Waitlist'
                    });
                }

                console.log('Waitlist signup successful:', email);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Submission error:', error);
            showFormError('Something went wrong. Please try again.');
            button.textContent = 'Be Notified When She Awakens';
            button.disabled = false;
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function showFormError(message) {
    let errorEl = document.getElementById('form-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('tw-hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorEl.classList.add('tw-hidden');
        }, 5000);
    }
}

// ============================================
// Floating CTA Button
// ============================================

function setupFloatingCTA() {
    const floatingCTA = document.getElementById('floating-cta');

    if (!floatingCTA) return;

    // Click handler - jump to CTA section using global function
    floatingCTA.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click navigation

        // Use the global jumpToCTA function exposed by setupClickNavigation
        if (typeof window.jumpToCTA === 'function') {
            window.jumpToCTA();

            // Focus the email input after animation
            setTimeout(() => {
                const emailInput = document.getElementById('waitlist-email');
                if (emailInput) emailInput.focus();
            }, 600);

            // Track in analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'floating_cta_click', {
                    'event_category': 'engagement',
                    'event_label': 'Floating CTA'
                });
            }
        }
    });
}

// Show/hide floating CTA based on current section
function updateFloatingCTAVisibility(currentSection, totalSections) {
    const floatingCTA = document.getElementById('floating-cta');
    if (!floatingCTA) return;

    // Show after first section (index > 0), hide when at CTA (last section)
    if (currentSection > 0 && currentSection < totalSections) {
        floatingCTA.classList.add('visible');
    } else {
        floatingCTA.classList.remove('visible');
    }
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
    setupFloatingCTA();
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

    // Color palette for shooting stars
    const starColors = [
        { head: [255, 255, 255], tail: [168, 182, 255] },  // White/blue
        { head: [255, 240, 255], tail: [200, 160, 255] },  // White/purple
        { head: [255, 255, 240], tail: [255, 200, 180] },  // White/warm
        { head: [240, 255, 255], tail: [150, 200, 255] },  // White/cyan
    ];

    function spawnStar() {
        const margin = 60;
        const speed = 8 + Math.random() * 6; // 8-14 px/frame (faster)
        const size = 2 + Math.random() * 1.5; // 2-3.5 size variation
        const color = starColors[Math.floor(Math.random() * starColors.length)];

        // Randomize origin edge (favor diagonal movement)
        const edge = Math.floor(Math.random() * 4);
        let x, y, destX, destY;

        if (edge === 0) { // from left -> to right-ish
            x = -margin;
            y = Math.random() * canvas.height * 0.6;
            destX = canvas.width + margin;
            destY = y + canvas.height * 0.4 + Math.random() * canvas.height * 0.3;
        } else if (edge === 1) { // from right -> to left-ish
            x = canvas.width + margin;
            y = Math.random() * canvas.height * 0.6;
            destX = -margin;
            destY = y + canvas.height * 0.4 + Math.random() * canvas.height * 0.3;
        } else if (edge === 2) { // from top -> to bottom-ish
            x = Math.random() * canvas.width;
            y = -margin;
            destX = x + (Math.random() - 0.3) * canvas.width * 0.5;
            destY = canvas.height + margin;
        } else { // from top-right corner -> diagonal
            x = canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
            y = -margin;
            destX = -margin;
            destY = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
        }

        // Compute velocity vector towards destination
        const dx = destX - x;
        const dy = destY - y;
        const len = Math.hypot(dx, dy) || 1;
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;

        // Life based on travel distance
        const travelFrames = Math.min(180, Math.max(100, len / speed * 0.08));
        stars.push({ x, y, vx, vy, life: 0, maxLife: travelFrames, size, color });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life++;

            const t = s.life / s.maxLife; // 0..1
            const opacity = Math.pow(1 - t, 0.7); // Slower fade
            const [hr, hg, hb] = s.color.head;
            const [tr, tg, tb] = s.color.tail;

            // Glowing star head
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${hr},${hg},${hb},${opacity * 0.5})`;
            ctx.fillStyle = `rgba(${hr},${hg},${hb},${opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Longer, brighter tail
            const tailMultiplier = 6; // Longer tail
            const tx = s.x - s.vx * tailMultiplier;
            const ty = s.y - s.vy * tailMultiplier;
            const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
            grad.addColorStop(0, `rgba(${tr},${tg},${tb},0)`);
            grad.addColorStop(0.5, `rgba(${tr},${tg},${tb},${opacity * 0.3})`);
            grad.addColorStop(1, `rgba(${hr},${hg},${hb},${opacity * 0.9})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.size * 0.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();

            if (s.life > s.maxLife || s.x < -100 || s.x > canvas.width + 100 || s.y < -100 || s.y > canvas.height + 100) {
                stars.splice(i, 1);
            }
        }
        requestAnimationFrame(draw);
    }

    function scheduleNext() {
        spawnStar();
        // 40% chance of burst (2-3 stars)
        if (Math.random() < 0.4) {
            setTimeout(spawnStar, 80 + Math.random() * 100);
            if (Math.random() < 0.3) setTimeout(spawnStar, 150 + Math.random() * 100);
        }
        const delay = 800 + Math.random() * 1500; // 0.8–2.3s (more frequent)
        setTimeout(scheduleNext, delay);
    }
    scheduleNext();
    draw();
}
