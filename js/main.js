$(function() {
  const d = new Date();
  const hours = d.getHours();
  const night = hours >= 19 || hours <= 7; // between 7pm and 7am
  const body = document.querySelector('body');
  const input = document.getElementById('switch');

  function applyBodyTheme() {
    if (input.checked) {
      body.classList.add('night');
    } else {
      body.classList.remove('night');
    }
  }

  if (night) {
    input.checked = true;
  }
  applyBodyTheme();

  input.addEventListener('change', function() {
    applyBodyTheme();
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
  // Color follows day/night — see syncParticlesToTheme, called on load and on toggle.
  const particlesReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particlesContainer = document.getElementById('particles-bg');
  const PARTICLE_COLOR_NIGHT = '#77a1bc';
  const PARTICLE_COLOR_DAY = '#d4d7da';
  let particlesActive = false;

  function particleColor() {
    return body.classList.contains('night') ? PARTICLE_COLOR_NIGHT : PARTICLE_COLOR_DAY;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function startParticles() {
    if (!particlesContainer || particlesReduced || particlesActive) return;
    particlesActive = true;
    window.pJSDom = [];
    const color = particleColor();
    particlesJS('particles-bg', {
      particles: {
        number: { value: 50, density: { enable: true, value_area: 800 } },
        color: { value: color },
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
          color: color,
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
    dimGrabLines(window.pJSDom[0].pJS);
  }

  function applyParticleTheme() {
    const color = particleColor();
    const rgb = hexToRgb(color);
    const pJS = window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS;
    if (!pJS || !pJS.particles) return;
    pJS.particles.color.value = color;
    pJS.particles.line_linked.color = color;
    pJS.particles.line_linked.color_rgb_line = rgb;
    const particles = pJS.particles.array;
    if (!particles) return;
    for (let i = 0; i < particles.length; i++) {
      particles[i].color.value = color;
      particles[i].color.rgb = rgb;
    }
  }

  function syncParticlesToTheme() {
    startParticles();
    applyParticleTheme();
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
    '.jobs, .skillz__category__label, .skillz__category__item, ' +
    '.project__name, .project__used, .footer__copyright, .footer__links a';
  const DIM_FACTOR = 0.06;
  const FADE_EASE = 0.08;
  // A grab line only exists while the cursor is near the particle, so it can
  // vanish and come back many times per hover. Easing from a stale value would
  // flash it in at the wrong opacity; anything older than a few frames snaps.
  const LINE_RESUME_MS = 100;

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

  // Liang–Barsky: clips the segment against the rect's four slabs and reports
  // whether anything survives. A line is dimmed as a whole the moment it enters
  // text — testing only its endpoints would leave a line strung across a
  // paragraph at full strength, and dimming only the covered span would put a
  // hard brightness step mid-line, the same split the per-particle fade avoids.
  function segmentHitsRect(x1, y1, x2, y2, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let enter = 0;
    let exit = 1;

    function clip(edge, offset) {
      if (edge === 0) return offset >= 0;
      const t = offset / edge;
      if (edge < 0) {
        if (t > exit) return false;
        if (t > enter) enter = t;
      } else {
        if (t < enter) return false;
        if (t < exit) exit = t;
      }
      return true;
    }

    return (
      clip(-dx, x1 - r.left) &&
      clip(dx, r.right - x1) &&
      clip(-dy, y1 - r.top) &&
      clip(dy, r.bottom - y1)
    );
  }

  function crossesText(x1, y1, x2, y2) {
    for (let i = 0; i < textRects.length; i++) {
      if (segmentHitsRect(x1, y1, x2, y2, textRects[i])) return true;
    }
    return false;
  }

  // particles.js strokes the grab lines itself, so the fade is applied by
  // scaling the canvas alpha around its own draw call.
  function dimGrabLines(pJS) {
    const drawGrabLine = pJS.fn.modes.grabParticle;

    pJS.fn.modes.grabParticle = function(particle) {
      const mouse = pJS.interactivity.mouse;
      if (mouse.pos_x == null) return drawGrabLine.call(this, particle);

      const ratio = pJS.canvas.pxratio || 1;
      const target = crossesText(
        particle.x / ratio,
        particle.y / ratio,
        mouse.pos_x / ratio,
        mouse.pos_y / ratio
      )
        ? DIM_FACTOR
        : 1;
      const now = performance.now();
      particle.lineDim =
        now - (particle.lineDimAt || 0) > LINE_RESUME_MS
          ? target
          : particle.lineDim + (target - particle.lineDim) * FADE_EASE;
      particle.lineDimAt = now;

      const ctx = pJS.canvas.ctx;
      const alpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha * particle.lineDim;
      drawGrabLine.call(this, particle);
      ctx.globalAlpha = alpha;
    };
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
            particle.dim = 1;
          }
          const x = particle.x / ratio;
          const y = particle.y / ratio;
          const target = isBehindText(x, y) ? DIM_FACTOR : 1;
          particle.dim += (target - particle.dim) * FADE_EASE;
          particle.opacity = particle.baseOpacity * particle.dim;
        }
      }
    }
    requestAnimationFrame(fadeParticlesBehindText);
  })();
});
