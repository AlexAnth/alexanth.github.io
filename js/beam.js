/**
 * border-beam-line.js
 * Vanilla JS recreation of the "line" border beam (bottom-edge traveling rainbow glow).
 *
 * Usage:
 *   <div class="my-search">…</div>
 *   Load this file, then:
 *     const beam = BorderBeamLine(document.querySelector('.my-search'), { radius: 20 });
 *     // beam.stop(); beam.start(); beam.pause(); beam.resume(); beam.destroy();
 *
 * Options: radius (px, default 20), duration (s, default 3.1), strength (0–1+, default 1),
 *          hue (deg offset, default 0), hover (default true: glow only while hovered/focused),
 *          active (default false when hover is on)
 */
(function (global) {
    const STYLE_ID = 'bbl-styles';
  
    const CSS = `
  @property --bbl-x { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --bbl-w { syntax: "<number>"; inherits: true; initial-value: 1; }
  @property --bbl-h { syntax: "<number>"; inherits: true; initial-value: 1; }
  @property --bbl-spike { syntax: "<number>"; inherits: true; initial-value: 1; }
  @property --bbl-spike2 { syntax: "<number>"; inherits: true; initial-value: 1; }
  @property --bbl-edge { syntax: "<number>"; inherits: true; initial-value: 1; }
  @property --bbl-opacity { syntax: "<number>"; inherits: true; initial-value: 0; }
  
  @keyframes bbl-travel {
    0%   { --bbl-x: 0.06; --bbl-w: 0.5; }
    10%  { --bbl-x: 0.15; --bbl-w: 0.8; }
    20%  { --bbl-x: 0.25; --bbl-w: 1.1; }
    30%  { --bbl-x: 0.35; --bbl-w: 1.3; }
    40%  { --bbl-x: 0.44; --bbl-w: 1.45; }
    50%  { --bbl-x: 0.5;  --bbl-w: 1.5; }
    60%  { --bbl-x: 0.56; --bbl-w: 1.45; }
    70%  { --bbl-x: 0.65; --bbl-w: 1.3; }
    80%  { --bbl-x: 0.75; --bbl-w: 1.1; }
    90%  { --bbl-x: 0.85; --bbl-w: 0.8; }
    100% { --bbl-x: 0.94; --bbl-w: 0.5; }
  }
  @keyframes bbl-edge-fade {
    0%, 12.5% { --bbl-edge: 0; }
    32.5%, 67.5% { --bbl-edge: 1; }
    87.5%, 100% { --bbl-edge: 0; }
  }
  @keyframes bbl-breathe {
    0%, 100% { --bbl-h: 0.8; }
    25% { --bbl-h: 1.25; }
    55% { --bbl-h: 0.85; }
    80% { --bbl-h: 1.3; }
  }
  @keyframes bbl-spike {
    0% { --bbl-spike: 0.8; } 25% { --bbl-spike: 1.3; } 50% { --bbl-spike: 0.9; }
    75% { --bbl-spike: 1.4; } 100% { --bbl-spike: 0.8; }
  }
  @keyframes bbl-spike2 {
    0% { --bbl-spike2: 1.2; } 25% { --bbl-spike2: 0.7; } 50% { --bbl-spike2: 1.4; }
    75% { --bbl-spike2: 0.8; } 100% { --bbl-spike2: 1.2; }
  }
  @keyframes bbl-fade-in  { 100% { --bbl-opacity: 1; } }
  @keyframes bbl-fade-out { 0% { --bbl-opacity: 1; } 100% { --bbl-opacity: 0; } }
  @keyframes bbl-hue {
    0%, 100% { filter: hue-rotate(calc(var(--bbl-hue, 0deg) - 6deg)) brightness(1.3) saturate(1.1); }
    50%      { filter: hue-rotate(calc(var(--bbl-hue, 0deg) + 6deg)) brightness(1.3) saturate(1.1); }
  }
  @keyframes bbl-hue-bloom {
    0%, 100% { filter: blur(8px) hue-rotate(calc(var(--bbl-hue, 0deg) - 8deg)) brightness(1.3) saturate(1.1); }
    50%      { filter: blur(8px) hue-rotate(calc(var(--bbl-hue, 0deg) + 8deg)) brightness(1.3) saturate(1.1); }
  }
  
  .bbl-host {
    position: relative;
    overflow: hidden;
    border-radius: var(--bbl-radius, 20px);
    --bbl-dur: 3.1s;
  }
  .bbl-host.bbl-active, .bbl-host.bbl-fading {
    animation:
      bbl-travel var(--bbl-dur) linear infinite,
      bbl-edge-fade var(--bbl-dur) linear infinite,
      bbl-breathe 4s ease-in-out infinite,
      bbl-spike 4.1s ease-in-out infinite,
      bbl-spike2 5.3s ease-in-out infinite,
      bbl-fade-in 0.6s ease forwards;
  }
  .bbl-host.bbl-fading {
    animation:
      bbl-travel var(--bbl-dur) linear infinite,
      bbl-edge-fade var(--bbl-dur) linear infinite,
      bbl-breathe 4s ease-in-out infinite,
      bbl-spike 4.1s ease-in-out infinite,
      bbl-spike2 5.3s ease-in-out infinite,
      bbl-fade-out 0.5s ease forwards;
  }
  
  /* Inner glow */
  .bbl-host.bbl-active::before, .bbl-host.bbl-fading::before {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
    border-radius: var(--bbl-radius, 20px);
    clip-path: inset(0 round var(--bbl-radius, 20px));
    background:
      radial-gradient(ellipse calc(33px * var(--bbl-w)) calc(30px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, rgba(125,211,252,.48), transparent),
      radial-gradient(ellipse calc(24px * var(--bbl-w)) calc(26px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 39px) calc(100% - 3px), rgba(56,189,248,.42), transparent),
      radial-gradient(ellipse calc(27px * var(--bbl-w)) calc(24px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 36px) 100%, rgba(147,197,253,.48), transparent),
      radial-gradient(ellipse calc(23px * var(--bbl-w)) calc(28px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 54px) calc(100% - 2px), rgba(96,165,250,.42), transparent),
      radial-gradient(ellipse calc(24px * var(--bbl-w)) calc(24px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 51px) calc(100% - 1px), rgba(186,230,253,.5), transparent),
      radial-gradient(ellipse calc(30px * var(--bbl-w)) calc(20px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 21px) 100%, rgba(103,183,255,.45), transparent),
      radial-gradient(ellipse calc(25px * var(--bbl-w)) calc(18px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 21px) calc(100% - 2px), rgba(59,160,255,.4), transparent),
      radial-gradient(ellipse calc(21px * var(--bbl-w)) calc(24px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 66px) 100%, rgba(165,215,255,.45), transparent),
      radial-gradient(ellipse calc(18px * var(--bbl-w)) calc(26px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 66px) calc(100% - 1px), rgba(103,232,249,.52), transparent);
    box-shadow: inset 0 0 9px 1px rgba(255,255,255,.1);
    -webkit-mask-image:
      radial-gradient(ellipse calc(78px * var(--bbl-w)) calc(60px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 45%, transparent 100%),
      linear-gradient(#fff, transparent 28px, transparent calc(100% - 28px), #fff),
      linear-gradient(to right, #fff, transparent 28px, transparent calc(100% - 28px), #fff);
    mask-image:
      radial-gradient(ellipse calc(78px * var(--bbl-w)) calc(60px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 45%, transparent 100%),
      linear-gradient(#fff, transparent 28px, transparent calc(100% - 28px), #fff),
      linear-gradient(to right, #fff, transparent 28px, transparent calc(100% - 28px), #fff);
    mask-composite: intersect, add;
    opacity: calc(var(--bbl-opacity) * var(--bbl-edge) * 0.7 * var(--bbl-strength, 1));
    animation: bbl-hue 12s ease-in-out infinite;
  }
  
  /* 1px border stroke */
  .bbl-host.bbl-active::after, .bbl-host.bbl-fading::after {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 2;
    padding: 1px;
    border-radius: calc(var(--bbl-radius, 20px) - 1px);
    clip-path: inset(0 round var(--bbl-radius, 20px));
    background:
      radial-gradient(ellipse calc(24px * var(--bbl-w)) calc(28px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) calc(100% + 2px), rgba(255,255,255,.38) 0%, rgba(255,255,255,.12) 30%, transparent 65%),
      radial-gradient(ellipse calc(36px * var(--bbl-w)) calc(36px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) calc(100% + 2px), rgb(125,211,252), transparent),
      radial-gradient(ellipse calc(30px * var(--bbl-w)) calc(32px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 39px) 100%, rgb(56,189,248), transparent),
      radial-gradient(ellipse calc(33px * var(--bbl-w)) calc(28px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 36px) calc(100% + 2px), rgb(147,197,253), transparent),
      radial-gradient(ellipse calc(29px * var(--bbl-w)) calc(34px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 54px) 100%, rgb(96,165,250), transparent),
      radial-gradient(ellipse calc(27px * var(--bbl-w)) calc(30px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 51px) calc(100% - 1px), rgb(186,230,253), transparent),
      radial-gradient(ellipse calc(36px * var(--bbl-w)) calc(24px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 21px) calc(100% + 1px), rgb(103,183,255), transparent),
      radial-gradient(ellipse calc(30px * var(--bbl-w)) calc(22px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 21px) 100%, rgb(59,160,255), transparent),
      radial-gradient(ellipse calc(25px * var(--bbl-w)) calc(28px * var(--bbl-h)) at calc(var(--bbl-x) * 100% + 66px) calc(100% + 1px), rgb(165,215,255), transparent),
      radial-gradient(ellipse calc(23px * var(--bbl-w)) calc(30px * var(--bbl-h)) at calc(var(--bbl-x) * 100% - 66px) calc(100% - 1px), rgb(103,232,249), transparent);
    /* spotlight ∩ (border ring = border-box minus content-box) */
    -webkit-mask-image:
      radial-gradient(ellipse calc(78px * var(--bbl-w)) calc(60px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 45%, transparent 100%),
      linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
    -webkit-mask-clip: border-box, content-box, border-box;
    -webkit-mask-composite: source-in, xor;
    mask-image:
      radial-gradient(ellipse calc(78px * var(--bbl-w)) calc(60px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 45%, transparent 100%),
      linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
    mask-clip: border-box, content-box, border-box;
    mask-composite: intersect, exclude;
    opacity: calc(var(--bbl-opacity) * var(--bbl-edge) * 1.14 * var(--bbl-strength, 1));
    animation: bbl-hue 12s ease-in-out infinite;
  }
  
  /* Blurred bloom with light "spikes" */
  .bbl-host .bbl-bloom {
    display: none; position: absolute; inset: 0; pointer-events: none; z-index: 3;
    border-radius: calc(var(--bbl-radius, 20px) - 1px);
    clip-path: inset(0 round var(--bbl-radius, 20px));
    background:
      radial-gradient(ellipse calc(.8px * var(--bbl-spike)) calc(92px * var(--bbl-h)) at 8% calc(100% - 2px), rgb(125,211,252), rgb(125,211,252) 30%, transparent 88%),
      radial-gradient(ellipse calc(10px * var(--bbl-spike2)) calc(35px * var(--bbl-h)) at 22% calc(100% - 4px), rgba(103,232,249,.98), rgba(103,232,249,.49) 50%, transparent 95%),
      radial-gradient(ellipse calc(2px * (2 - var(--bbl-spike))) calc(72px * var(--bbl-h)) at 36% calc(100% - 3px), rgb(103,183,255), rgb(103,183,255) 40%, transparent 90%),
      radial-gradient(ellipse calc(14px * var(--bbl-spike2)) calc(28px * var(--bbl-h)) at 50% calc(100% - 2px), rgba(186,230,253,.59), rgba(186,230,253,.29) 55%, transparent 96%),
      radial-gradient(ellipse calc(1.2px * (2 - var(--bbl-spike2))) calc(85px * var(--bbl-h)) at 64% calc(100% - 4px), rgb(147,197,253), rgb(147,197,253) 35%, transparent 89%),
      radial-gradient(ellipse calc(7px * var(--bbl-spike)) calc(45px * var(--bbl-h)) at 78% calc(100% - 2px), rgba(96,165,250,.91), rgba(96,165,250,.45) 48%, transparent 94%),
      radial-gradient(ellipse calc(.6px * (2 - var(--bbl-spike))) calc(60px * var(--bbl-h)) at 92% calc(100% - 3px), rgb(59,160,255), rgb(59,160,255) 42%, transparent 91%),
      radial-gradient(ellipse calc(21px * var(--bbl-spike)) calc(15px * var(--bbl-spike2)) at calc(var(--bbl-x) * 100%) calc(100% + 1px), #fff 0%, rgba(255,255,255,.9) 20%, rgba(255,255,255,.5) 50%, transparent 100%),
      radial-gradient(ellipse calc(42px * var(--bbl-w)) calc(40px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, rgba(255,255,255,.3) 0%, rgba(255,255,255,.12) 25%, rgba(255,255,255,.03) 55%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse calc(84px * var(--bbl-w)) calc(110px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 35%, transparent 100%);
    mask-image: radial-gradient(ellipse calc(84px * var(--bbl-w)) calc(110px * var(--bbl-h)) at calc(var(--bbl-x) * 100%) 100%, #fff 0%, rgba(255,255,255,.5) 35%, transparent 100%);
    opacity: 0;
  }
  .bbl-host.bbl-active .bbl-bloom, .bbl-host.bbl-fading .bbl-bloom {
    display: block;
    opacity: calc(var(--bbl-opacity) * var(--bbl-edge) * 0.8 * var(--bbl-strength, 1));
    animation: bbl-hue-bloom 8s ease-in-out infinite;
  }
  
  .bbl-host.bbl-paused, .bbl-host.bbl-paused::before, .bbl-host.bbl-paused::after,
  .bbl-host.bbl-paused .bbl-bloom { animation-play-state: paused !important; }
  
  @media (prefers-reduced-motion: reduce) {
    .bbl-host, .bbl-host::before, .bbl-host::after, .bbl-host .bbl-bloom { animation-play-state: paused !important; }
  }
  `;
  
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  
    function BorderBeamLine(el, opts = {}) {
      if (!el) throw new Error('BorderBeamLine: element not found');
      const { radius = 20, duration = 3.1, strength = 1, hue = 0, hover = true } = opts;
      const active = opts.active ?? !hover;
      injectStyles();
  
      el.classList.add('bbl-host');
      el.style.setProperty('--bbl-radius', radius + 'px');
      el.style.setProperty('--bbl-dur', duration + 's');
      el.style.setProperty('--bbl-strength', strength);
      el.style.setProperty('--bbl-hue', hue + 'deg');
  
      const bloom = document.createElement('div');
      bloom.className = 'bbl-bloom';
      bloom.setAttribute('aria-hidden', 'true');
      el.appendChild(bloom);
  
      let fadeTimer;
      const api = {
        start() {
          clearTimeout(fadeTimer);
          el.classList.remove('bbl-fading');
          el.classList.add('bbl-active');
        },
        stop() {
          if (!el.classList.contains('bbl-active')) return;
          el.classList.remove('bbl-active');
          el.classList.add('bbl-fading');
          fadeTimer = setTimeout(() => el.classList.remove('bbl-fading'), 500);
        },
        pause() { el.classList.add('bbl-paused'); },
        resume() { el.classList.remove('bbl-paused'); },
        destroy() {
          clearTimeout(fadeTimer);
          bloom.remove();
          el.classList.remove('bbl-host', 'bbl-active', 'bbl-fading', 'bbl-paused');
          ['--bbl-radius', '--bbl-dur', '--bbl-strength', '--bbl-hue'].forEach(p => el.style.removeProperty(p));
        },
      };
      const onEnter = () => api.start();
      const onLeave = () => { if (!el.matches(':hover') && !el.contains(document.activeElement)) api.stop(); };
      if (hover) {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        el.addEventListener('focusin', onEnter);
        el.addEventListener('focusout', () => setTimeout(onLeave));
      }
      const baseDestroy = api.destroy;
      api.destroy = () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        baseDestroy();
      };
  
      if (active) api.start();
      return api;
    }
  
    global.BorderBeamLine = BorderBeamLine;
  })(typeof window !== 'undefined' ? window : this);