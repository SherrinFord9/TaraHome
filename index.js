// ============================================
// TARA AI - Landing Page
// ============================================

// ============================================
// Easter Egg - "jarvis" Keyboard Trigger
// ============================================

function setupEasterEgg() {
    let typedSequence = '';
    const targetSequence = 'jarvis';
    const easterEgg = document.getElementById('easter-egg');

    document.addEventListener('keydown', (e) => {
        typedSequence += e.key.toLowerCase();

        if (typedSequence.length > targetSequence.length) {
            typedSequence = typedSequence.slice(-targetSequence.length);
        }

        if (typedSequence === targetSequence) {
            easterEgg.classList.remove('tw-hidden');

            const heroGlow = document.querySelector('.hero-glow');
            if (heroGlow) {
                heroGlow.style.background = 'radial-gradient(circle, rgba(255, 100, 255, 0.25) 0%, rgba(255, 100, 255, 0) 70%)';
                setTimeout(() => {
                    heroGlow.style.background = 'radial-gradient(circle, rgba(100, 100, 255, 0.15) 0%, rgba(100, 100, 255, 0) 70%)';
                }, 3000);
            }

            setTimeout(() => {
                easterEgg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);

            typedSequence = '';
        }
    });
}

// ============================================
// Section Progress Dots
// ============================================

function setupDotNav(totalDots) {
    const nav = document.getElementById('section-dots');
    if (!nav) return;
    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('span');
        dot.className = 'section-dot';
        dot.setAttribute('aria-label', `Section ${i + 1} of ${totalDots}`);
        nav.appendChild(dot);
    }
    updateDotNav(0);
}

function updateDotNav(index) {
    document.querySelectorAll('.section-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function showDots() {
    const nav = document.getElementById('section-dots');
    if (nav) nav.classList.remove('dots-hidden');
}

function hideDots() {
    const nav = document.getElementById('section-dots');
    if (nav) nav.classList.add('dots-hidden');
}

// ============================================
// Click-to-Advance Navigation
// ============================================

function setupClickNavigation() {
    const statementSections = gsap.utils.toArray('.statement-section');
    let currentSection = 0;
    let isTransitioning = false;
    const totalSections = statementSections.length;

    // Position all sections in the same place (overlay)
    statementSections.forEach((section) => {
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
                gsap.set(text, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', rotateX: 0 });
            }
        } else {
            gsap.set(section, { opacity: 0, display: 'none', zIndex: 1 });
            const text = section.querySelector('.statement-text');
            if (text) {
                gsap.set(text, { opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)', rotateX: 15 });
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
    gsap.set('.cta-headline', { opacity: 0, y: 50, scale: 0.6, filter: 'blur(8px)', rotateX: 10 });
    gsap.set('.cta-subtext', { opacity: 0, y: 30, scale: 0.6, filter: 'blur(6px)' });
    gsap.set('#waitlist-form', { opacity: 0, y: 30, scale: 0.6, filter: 'blur(4px)' });

    function showPreviousSection() {
        if (isTransitioning) return;
        if (currentSection <= 0) return;

        isTransitioning = true;

        if (currentSection >= statementSections.length) {
            const cta = document.querySelector('#cta-section');
            if (cta) {
                gsap.to(cta, {
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.in',
                    onComplete: () => {
                        gsap.set(cta, { display: 'none', zIndex: 1 });
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

        const currentEl = statementSections[currentSection];
        const currentText = currentEl.querySelector('.statement-text');

        if (currentText) {
            gsap.to(currentText, {
                opacity: 0,
                y: 50,
                scale: 0.8,
                filter: 'blur(12px)',
                rotateX: 15,
                rotateY: -10,
                duration: 0.8,
                ease: 'power2.in'
            });
        }

        gsap.to(currentEl, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.in',
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
        if (isTransitioning) return;

        if (currentSection < statementSections.length - 1) {
            isTransitioning = true;

            const currentEl = statementSections[currentSection];
            const currentText = currentEl.querySelector('.statement-text');

            if (currentText) {
                gsap.to(currentText, {
                    opacity: 0,
                    y: -50,
                    scale: 1.3,
                    filter: 'blur(12px)',
                    rotateX: -15,
                    rotateY: 10,
                    duration: 0.8,
                    ease: 'power2.in'
                });
            }

            gsap.to(currentEl, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.in',
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

            const lastSection = statementSections[currentSection];
            gsap.to(lastSection, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set(lastSection, { display: 'none', zIndex: 1 });

                    const cta = document.querySelector('#cta-section');
                    if (cta) {
                        gsap.set(cta, { display: 'flex', zIndex: 20 });
                    }

                    gsap.to('#cta-section', {
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power2.out'
                    });

                    gsap.to('.cta-headline', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        rotateX: 0,
                        duration: 0.9,
                        ease: 'power2.out',
                        delay: 0.2
                    });

                    gsap.to('.cta-subtext', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        duration: 0.8,
                        ease: 'power2.out',
                        delay: 0.4
                    });

                    gsap.to('#waitlist-form', {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        duration: 0.7,
                        ease: 'power2.out',
                        delay: 0.6,
                        onComplete: () => {
                            isTransitioning = false;
                        }
                    });

                    currentSection++;
                    updateDotNav(currentSection);
                    hideDots();

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

        gsap.set(currentEl, {
            display: 'flex',
            visibility: 'visible',
            zIndex: 20,
            opacity: 0
        });

        gsap.to(currentEl, {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out'
        });

        if (currentText) {
            gsap.set(currentText, {
                y: 50,
                scale: 0.9,
                filter: 'blur(10px)',
                rotateX: 15,
                opacity: 0
            });

            gsap.to(currentText, {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                rotateX: 0,
                duration: 1.0,
                ease: 'power2.out',
                delay: 0.3
            });
        }

        updateDotNav(currentSection);
        showDots();
    }

    // Left 15% of screen goes back, rest goes forward
    document.addEventListener('click', (e) => {
        if (e.target.closest('#waitlist-form')) return;
        if (e.target.closest('#floating-cta')) return;
        if (e.target.closest('#hint-left')) return;
        if (e.clientX < window.innerWidth * 0.15 && currentSection > 0) {
            showPreviousSection();
        } else {
            showNextSection();
        }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            showNextSection();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            showPreviousSection();
        }
    });

    // Swipe navigation for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx < 0) showNextSection();
            else showPreviousSection();
        }
    }, { passive: true });

    // Show scroll indicator initially
    gsap.from('.scroll-indicator', {
        opacity: 0,
        y: 10,
        duration: 1.0,
        delay: 0.6,
        ease: 'power2.out'
    });

    // Edge navigation arrows
    const hintLeft = document.getElementById('hint-left');
    const hintRight = document.getElementById('hint-right');

    function updateEdgeArrows() {
        if (!hintLeft || !hintRight) return;

        if (currentSection >= statementSections.length) {
            hintLeft.classList.add('hidden');
            hintLeft.classList.remove('idle-revealed');
            hintRight.classList.add('hidden');
            hintRight.classList.remove('idle-revealed');
            return;
        }

        if (currentSection === 0) {
            hintLeft.classList.add('hidden');
            hintLeft.classList.remove('idle-revealed');
            hintRight.classList.remove('hidden');
        } else {
            hintLeft.classList.remove('hidden');
            hintRight.classList.remove('hidden');
        }
    }

    updateEdgeArrows();
    window.updateEdgeArrows = updateEdgeArrows;

    // Make left hint clickable for going back
    if (hintLeft) {
        hintLeft.style.pointerEvents = 'auto';
        hintLeft.style.cursor = 'pointer';
        hintLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousSection();
        });
    }

    // Cursor feedback: w-resize near left edge, e-resize near right edge
    window.addEventListener('mousemove', (e) => {
        if (!hintLeft || !hintRight) return;
        const nearLeft = e.clientX < 80;
        const nearRight = e.clientX > window.innerWidth - 80;
        document.body.style.cursor = nearLeft ? 'w-resize' : 'e-resize';
        hintLeft.classList.toggle('active', nearLeft);
        hintRight.classList.toggle('active', nearRight);
    }, { passive: true });

    window.addEventListener('mouseout', () => {
        document.body.style.cursor = '';
        hintLeft?.classList.remove('active');
        hintRight?.classList.remove('active');
    });

    // ── Idle-reveal system ────────────────────────────────────────────────────
    // Hints are invisible by default. After the user has been still for a few
    // seconds they fade in at low opacity — revealed only when attention is free.
    const isFirstVisit = !localStorage.getItem('tara_visited');
    if (isFirstVisit) localStorage.setItem('tara_visited', '1');
    const IDLE_DELAY = isFirstVisit ? 2000 : 3500;

    const clickLabel = document.querySelector('.click-anywhere');
    let idleTimer = null;

    function revealIdleHints() {
        if (hintLeft && !hintLeft.classList.contains('hidden')) {
            hintLeft.classList.add('idle-revealed');
        }
        if (hintRight && !hintRight.classList.contains('hidden')) {
            hintRight.classList.add('idle-revealed');
        }
        if (clickLabel && currentSection < statementSections.length) {
            clickLabel.classList.add('idle-revealed');
        }
    }

    function hideIdleHints() {
        hintLeft?.classList.remove('idle-revealed');
        hintRight?.classList.remove('idle-revealed');
        clickLabel?.classList.remove('idle-revealed');
    }

    function resetIdleTimer() {
        hideIdleHints();
        clearTimeout(idleTimer);
        idleTimer = setTimeout(revealIdleHints, IDLE_DELAY);
    }

    ['mousemove', 'click', 'touchstart', 'keydown'].forEach(evt =>
        document.addEventListener(evt, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();
    // ─────────────────────────────────────────────────────────────────────────

    // Expose jumpToCTA for floating CTA button
    window.jumpToCTA = function () {
        if (isTransitioning) return;
        if (currentSection >= statementSections.length) return;

        isTransitioning = true;

        const currentEl = statementSections[currentSection];
        if (currentEl) {
            gsap.to(currentEl, {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    gsap.set(currentEl, { display: 'none', zIndex: 1 });
                }
            });
        }

        statementSections.forEach(section => {
            gsap.set(section, { opacity: 0, display: 'none', zIndex: 1 });
        });

        const cta = document.querySelector('#cta-section');
        if (cta) {
            gsap.set(cta, { display: 'flex', zIndex: 20 });
            gsap.to(cta, { opacity: 1, duration: 0.6, ease: 'power2.out' });
        }

        gsap.to('.cta-headline', {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', rotateX: 0,
            duration: 0.7, ease: 'power2.out', delay: 0.15
        });
        gsap.to('.cta-subtext', {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 0.6, ease: 'power2.out', delay: 0.3
        });
        gsap.to('#waitlist-form', {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 0.5, ease: 'power2.out', delay: 0.45,
            onComplete: () => {
                isTransitioning = false;
            }
        });

        currentSection = statementSections.length;
        updateDotNav(currentSection);
        hideDots();

        const floatingCTA = document.getElementById('floating-cta');
        if (floatingCTA) floatingCTA.classList.remove('visible');
        if (window.updateEdgeArrows) window.updateEdgeArrows();
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

        if (errorMessage) errorMessage.classList.add('tw-hidden');

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

                if (typeof gtag !== 'undefined') {
                    gtag('event', 'waitlist_signup', {
                        'event_category': 'engagement',
                        'event_label': 'TARA Waitlist'
                    });
                }
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Submission failed');
            }

        } catch (_error) {
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
    const errorEl = document.getElementById('form-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('tw-hidden');
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

    floatingCTA.addEventListener('click', (e) => {
        e.stopPropagation();

        if (typeof window.jumpToCTA === 'function') {
            window.jumpToCTA();

            setTimeout(() => {
                const emailInput = document.getElementById('waitlist-email');
                if (emailInput) emailInput.focus();
            }, 600);

            if (typeof gtag !== 'undefined') {
                gtag('event', 'floating_cta_click', {
                    'event_category': 'engagement',
                    'event_label': 'Floating CTA'
                });
            }
        }
    });
}

function updateFloatingCTAVisibility(currentSection, totalSections) {
    const floatingCTA = document.getElementById('floating-cta');
    if (!floatingCTA) return;

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
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (typeof window.particlesJS === 'undefined') return;

    // Reduce particle count on lower-end / mobile devices
    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
    const particleCount = (isMobile || isLowEnd) ? 80 : 220;
    const linkDistance = (isMobile || isLowEnd) ? 120 : 160;

    try {
        if (location.protocol !== 'file:') {
            const response = await fetch('particlesjs-config.json');
            if (response.ok) {
                const cfg = await response.json();
                cfg.particles.number.value = particleCount;
                cfg.particles.line_linked.distance = linkDistance;
                window.particlesJS('particles-js', cfg);
                return;
            }
        }
    } catch (_err) {
        // fall through to inline config
    }

    window.particlesJS('particles-js', {
        particles: {
            number: { value: particleCount, density: { enable: true, value_area: 1200 } },
            color: { value: '#ffffff' },
            shape: { type: 'star', stroke: { width: 0, color: '#000000' }, polygon: { nb_sides: 5 } },
            opacity: { value: 0.8, random: true, anim: { enable: true, speed: 0.6, opacity_min: 0.15, sync: false } },
            size: { value: 2.2, random: true, anim: { enable: true, speed: 4, size_min: 0.4, sync: false } },
            line_linked: { enable: true, distance: linkDistance, color: '#a8b6ff', opacity: 0.25, width: 0.7 },
            move: { enable: true, speed: 2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'window',
            events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: {
                repulse: { distance: 120, duration: 0.45 },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });
}

// ============================================
// Main Initialization
// ============================================

async function initMainExperience() {
    await initParticles();

    setupDotNav(document.querySelectorAll('.statement-section').length + 1);
    setupEasterEgg();
    setupClickNavigation();
    setupWaitlistForm();
    setupFloatingCTA();
    setupSmoothScroll();
    setupCursorGlow();

    initShootingStars();
}

// ============================================
// Start Application
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    initMainExperience();
});

// ============================================
// Shooting Stars Overlay (every ~1–2s)
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

    const starColors = [
        { head: [255, 255, 255], tail: [168, 182, 255] },
        { head: [255, 240, 255], tail: [200, 160, 255] },
        { head: [255, 255, 240], tail: [255, 200, 180] },
        { head: [240, 255, 255], tail: [150, 200, 255] },
    ];

    function spawnStar() {
        const margin = 60;
        const speed = 8 + Math.random() * 6;
        const size = 2 + Math.random() * 1.5;
        const color = starColors[Math.floor(Math.random() * starColors.length)];

        const edge = Math.floor(Math.random() * 4);
        let x, y, destX, destY;

        if (edge === 0) {
            x = -margin;
            y = Math.random() * canvas.height * 0.6;
            destX = canvas.width + margin;
            destY = y + canvas.height * 0.4 + Math.random() * canvas.height * 0.3;
        } else if (edge === 1) {
            x = canvas.width + margin;
            y = Math.random() * canvas.height * 0.6;
            destX = -margin;
            destY = y + canvas.height * 0.4 + Math.random() * canvas.height * 0.3;
        } else if (edge === 2) {
            x = Math.random() * canvas.width;
            y = -margin;
            destX = x + (Math.random() - 0.3) * canvas.width * 0.5;
            destY = canvas.height + margin;
        } else {
            x = canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
            y = -margin;
            destX = -margin;
            destY = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
        }

        const dx = destX - x;
        const dy = destY - y;
        const len = Math.hypot(dx, dy) || 1;
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;

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

            const t = s.life / s.maxLife;
            const opacity = Math.pow(1 - t, 0.7);
            const [hr, hg, hb] = s.color.head;
            const [tr, tg, tb] = s.color.tail;

            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${hr},${hg},${hb},${opacity * 0.5})`;
            ctx.fillStyle = `rgba(${hr},${hg},${hb},${opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            const tailMultiplier = 6;
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
        if (Math.random() < 0.4) {
            setTimeout(spawnStar, 80 + Math.random() * 100);
            if (Math.random() < 0.3) setTimeout(spawnStar, 150 + Math.random() * 100);
        }
        const delay = 800 + Math.random() * 1500;
        setTimeout(scheduleNext, delay);
    }
    scheduleNext();
    draw();
}
