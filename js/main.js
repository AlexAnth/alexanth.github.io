$(function() {
  const d = new Date();
  const hours = d.getHours();
  const night = hours >= 19 || hours <= 7; // between 7pm and 7am
  const body = document.querySelector('body');
  const toggle = document.getElementById('toggle');
  const input = document.getElementById('switch');

  if (night) {
    input.checked = true;
    body.classList.add('night');
  }

  toggle.addEventListener('click', function() {
    const isChecked = input.checked;
    if (isChecked) {
      body.classList.remove('night');
    } else {
      body.classList.add('night');
    }
    syncParticlesToTheme();
  });

  const introHeight = document.querySelector('.intro').offsetHeight;
  const topButton = document.getElementById('top-button');
  const $topButton = $('#top-button');

  window.addEventListener(
    'scroll',
    function() {
      if (window.scrollY > introHeight) {
        $topButton.fadeIn();
      } else {
        $topButton.fadeOut();
      }
    },
    false
  );

  topButton.addEventListener('click', function() {
    $('html, body').animate({ scrollTop: 0 }, 500);
  });

  const hand = document.querySelector('.emoji.wave-hand');

  function waveOnLoad() {
    hand.classList.add('wave');
    setTimeout(function() {
      hand.classList.remove('wave');
    }, 2000);
  }

  setTimeout(function() {
    waveOnLoad();
  }, 1000);

  hand.addEventListener('mouseover', function() {
    hand.classList.add('wave');
  });

  hand.addEventListener('mouseout', function() {
    hand.classList.remove('wave');
  });

  window.sr = ScrollReveal({
    reset: false,
    duration: 600,
    easing: 'cubic-bezier(.694,0,.335,1)',
    scale: 1,
    viewFactor: 0.3,
  });

  sr.reveal('.background');
  sr.reveal('.skills');
  sr.reveal('.experience', { viewFactor: 0.1 });
  sr.reveal('.featured-projects', { viewFactor: 0.1 });
  sr.reveal('.other-projects', { viewFactor: 0.05 });

  // Ambient particle field, replicated from spirilio.gr's footer
  // (`.footer_top-area .wgl-container`), config pulled from their live particles.js instance.
  // Runs as a fixed full-page layer so it's visible everywhere, not just the footer;
  // particles.js scales particle count to the canvas area via `number.density`.
  // Only runs in dark mode — see syncParticlesToTheme, called on load and on toggle.
  const particlesReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particlesContainer = document.getElementById('particles-bg');
  let particlesActive = false;

  function startParticles() {
    if (!particlesContainer || particlesReduced || particlesActive) return;
    particlesActive = true;
    // destroypJS() (see stopParticles) nulls out the library's own global
    // pJSDom rather than emptying it, so it has to be reset before the next
    // particlesJS() call or the library throws trying to push onto null.
    window.pJSDom = [];
    particlesJS('particles-bg', {
      particles: {
        number: { value: 50, density: { enable: true, value_area: 800 } },
        color: { value: '#77a1bc' },
        shape: {
          type: 'circle',
          stroke: { width: 0, color: '#ff0000' },
          polygon: { nb_sides: 6 },
        },
        opacity: {
          value: 1,
          random: true,
          anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
        },
        size: {
          value: 10,
          random: true,
          anim: { enable: false, speed: 30, size_min: 1, sync: false },
        },
        line_linked: {
          enable: false,
          distance: 150,
          color: '#77a1bc',
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
          attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
          resize: true,
        },
        modes: {
          grab: { distance: 150, line_linked: { opacity: 1 } },
          bubble: { distance: 200, size: 16, duration: 20, opacity: 1, speed: 30 },
          repulse: { distance: 80, duration: 0.4 },
          push: { particles_nb: 4 },
          remove: { particles_nb: 2 },
        },
      },
      retina_detect: true,
    });
  }

  function stopParticles() {
    if (!particlesActive) return;
    particlesActive = false;
    const dom = window.pJSDom && window.pJSDom[0];
    if (dom && dom.pJS) {
      dom.pJS.fn.vendors.destroypJS();
    }
  }

  function syncParticlesToTheme() {
    if (body.classList.contains('night')) {
      startParticles();
    } else {
      stopParticles();
    }
  }

  syncParticlesToTheme();

  // Dim particles that drift behind text, without ever showing a single
  // bubble half-dimmed/half-bright. A CSS overlay can't do this: it dims a
  // region of space, so any circle crossing its edge is necessarily
  // split — blurring the edge only softens that split, it can't remove it.
  // Instead each particle's own opacity is driven directly here, uniformly
  // across its whole circle every frame, and eased toward a target so the
  // *whole bubble* fades in/out as one piece as it crosses in and out of
  // text. Images need no equivalent: they're already opaque and fully
  // occlude any particle behind them.
  const TEXT_SELECTOR =
    '.intro__hello, .intro__tagline, .intro__contact, .section__title, p, ' +
    '.job__company, .job__time, .job__position, .skillz__category__label, ' +
    '.skillz__category__item, .project__name, .footer__copyright, .footer__links a';
  const DIM_OPACITY = 0.06;
  const FADE_EASE = 0.08;

  let textRects = [];
  let textRectsQueued = false;

  function refreshTextRects() {
    textRectsQueued = false;
    textRects = Array.from(document.querySelectorAll(TEXT_SELECTOR))
      .map(function(el) {
        return el.getBoundingClientRect();
      })
      .filter(function(r) {
        return r.width > 0 && r.height > 0;
      });
  }

  function queueTextRectsRefresh() {
    if (textRectsQueued) return;
    textRectsQueued = true;
    requestAnimationFrame(refreshTextRects);
  }

  function isBehindText(x, y) {
    for (let i = 0; i < textRects.length; i++) {
      const r = textRects[i];
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return true;
      }
    }
    return false;
  }

  refreshTextRects();
  window.addEventListener('resize', queueTextRectsRefresh);
  window.addEventListener('scroll', queueTextRectsRefresh, { passive: true });

  (function fadeParticlesBehindText() {
    if (particlesActive) {
      const dom = window.pJSDom && window.pJSDom[0];
      const pJS = dom && dom.pJS;
      if (pJS && pJS.particles && pJS.particles.array) {
        const ratio = pJS.canvas.pxratio || 1;
        const particles = pJS.particles.array;
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i];
          if (particle.baseOpacity === undefined) {
            particle.baseOpacity = particle.opacity;
          }
          const x = particle.x / ratio;
          const y = particle.y / ratio;
          const target = isBehindText(x, y) ? DIM_OPACITY : particle.baseOpacity;
          particle.opacity += (target - particle.opacity) * FADE_EASE;
        }
      }
    }
    requestAnimationFrame(fadeParticlesBehindText);
  })();
});
