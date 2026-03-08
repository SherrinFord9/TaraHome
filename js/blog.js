(function () {
    window.addEventListener('DOMContentLoaded', function () {
        if (typeof window.particlesJS === 'undefined') return;

        var isMobile = window.innerWidth < 768;

        var fallbackConfig = {
            particles: {
                number: { value: isMobile ? 40 : 100, density: { enable: true, value_area: 1200 } },
                color: { value: '#ffffff' },
                shape: { type: 'star' },
                opacity: { value: 0.8, random: true, anim: { enable: true, speed: 0.6, opacity_min: 0.15 } },
                size: { value: 2.2, random: true, anim: { enable: true, speed: 4, size_min: 0.4 } },
                line_linked: { enable: true, distance: isMobile ? 100 : 180, color: '#a8b6ff', opacity: 0.25, width: 0.7 },
                move: { enable: true, speed: 2, direction: 'none', random: true, out_mode: 'out' }
            },
            interactivity: {
                detect_on: 'window',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { repulse: { distance: 120, duration: 0.45 }, push: { particles_nb: 6 } }
            },
            retina_detect: true
        };

        // Waitlist form handler
        var ctaForm = document.querySelector('.article-cta-form');
        if (ctaForm) {
            ctaForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var form = e.target;
                var btn = form.querySelector('button[type="submit"]');
                var success = form.parentElement.querySelector('.article-cta-success');
                btn.disabled = true;
                btn.textContent = 'Joining...';
                fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                })
                    .then(function (r) {
                        if (r.ok) {
                            form.style.display = 'none';
                            if (success) success.style.display = 'block';
                        } else {
                            btn.disabled = false;
                            btn.textContent = 'Join the Waitlist';
                        }
                    })
                    .catch(function () {
                        btn.disabled = false;
                        btn.textContent = 'Join the Waitlist';
                    });
            });
        }

        fetch('/particlesjs-config.json')
            .then(function (r) {
                if (!r.ok) throw new Error('config not found');
                return r.json();
            })
            .then(function (cfg) {
                if (isMobile) {
                    cfg.particles.number.value = 40;
                    cfg.particles.line_linked.distance = 100;
                }
                window.particlesJS('particles-js', cfg);
            })
            .catch(function () {
                window.particlesJS('particles-js', fallbackConfig);
            });
    });
}());
