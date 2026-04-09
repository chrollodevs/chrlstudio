/**
 * CHRL STDIO — script.js
 *
 * 1. Intro: letter animation via CSS → exit after hold
 * 2. Canvas reveals with staggered CSS animations
 * 3. Wordmark hover: STDIO slides in below CHRL
 * 4. Nav: slide-up text effect (CSS + data-text attr sync)
 */

(function () {
  'use strict';

  const intro = document.getElementById('intro');
  const canvas = document.getElementById('canvas');
  const topLeft = document.getElementById('top-left');

  /* ── INTRO TIMING ────────────────────────────────────────
     10 letters × 78ms + 140ms base + 500ms anim ≈ 1.42s
     Hold until 2.5s so text reads cleanly.
  ──────────────────────────────────────────────────────── */
  const HOLD = 2500;
  const EXIT_MS = 900;   // matches CSS

  function runExit() {
    intro.classList.add('exit');

    // Overlap: canvas fades in during intro exit
    setTimeout(
      () => canvas.classList.add('visible'),
      Math.round(EXIT_MS * 0.42)
    );

    // Cleanup
    setTimeout(() => {
      intro.remove();
      document.body.style.overflow = ''; // clears inline style to allow native sticky scroll
    }, EXIT_MS + 250);
  }

  if (!sessionStorage.getItem('introPlayed')) {
    setTimeout(runExit, HOLD);
    sessionStorage.setItem('introPlayed', 'true');
  } else {
    // Skip intro
    intro.style.display = 'none';
    canvas.classList.add('visible');
    document.body.style.overflow = '';
  }

  /* ── DOM INJECTION (Cursor & Ambient) ── */
  if (!document.getElementById('ambient-noise')) {
    const ambient = document.createElement('div');
    ambient.id = 'ambient-noise';
    document.body.appendChild(ambient);
  }

  if (!document.getElementById('custom-cursor')) {
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    document.body.appendChild(cursor);
  }

  const cursor = document.getElementById('custom-cursor');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth lerp function
  function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }

  function renderCursor() {
    cursorX = lerp(cursorX, mouseX, 0.08); /* heavy lag to create a floating lens */
    cursorY = lerp(cursorY, mouseY, 0.08);
    if (cursor) {
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    }
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Set global interactive lens mode
  const interactives = document.querySelectorAll('a, button, #orb, #cta-container');
  interactives.forEach(el => {
    // Avoid double mapping if it's already a view-card
    if (!el.classList.contains('hub-card') && !el.classList.contains('project-item')) {
      el.addEventListener('mouseenter', () => cursor.classList.add('lens-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('lens-hover'));
    }
  });

  // Unique Project 'View' mode constraint
  const projects = document.querySelectorAll('.hub-card, .project-item');
  projects.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('lens-view'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('lens-view'));
  });

  /* ── MAGNETIC ELEMENTS ── */
  const magnetics = document.querySelectorAll('#orb, .nav-item, #cta-container, #hero-about, #giant-btn');
  magnetics.forEach(el => {
    el.classList.add('magnetic');

    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Pull strength factor
      const pullX = x * 0.25;
      const pullY = y * 0.25;

      el.style.setProperty('--mx', `${pullX}px`);
      el.style.setProperty('--my', `${pullY}px`);
      el.style.transition = 'none'; // precise mapping
    });

    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--mx', `0px`);
      el.style.setProperty('--my', `0px`);
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // bounce back
    });
  });

  /* ── HUB PANEL PARALLAX ── */
  document.querySelectorAll('.hub-panel').forEach(panel => {
    const title = panel.querySelector('.hub-panel__title');
    panel.addEventListener('mousemove', e => {
      const rect = panel.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (title) {
        title.style.setProperty('--px', `${x * 14}px`);
        title.style.setProperty('--py', `${y * 8}px`);
      }
    });
    panel.addEventListener('mouseleave', () => {
      if (title) {
        title.style.setProperty('--px', '0px');
        title.style.setProperty('--py', '0px');
      }
    });
  });

  /* ── SCROLL REVEAL OBSERVER ── */
  const revealTargets = document.querySelectorAll(
    '.project-item, .contact-links a, .about-text, .about-hero, .about-card'
  );
  revealTargets.forEach(el => el.classList.add('scroll-reveal'));

  // Hub panels: reveal with cascading stagger for editorial feel
  const hubPanels = document.querySelectorAll('.hub-panel');
  hubPanels.forEach((el, i) => {
    el.classList.add('scroll-reveal');
    el.style.setProperty('--rd', `${i * 90}ms`);
  });

  // Giant CTA button: reveal with slight delay
  const giantBtn = document.getElementById('giant-btn');
  if (giantBtn) {
    giantBtn.classList.add('scroll-reveal');
    giantBtn.style.setProperty('--rd', '60ms');
  }

  const allRevealTargets = [
    ...revealTargets,
    ...hubPanels,
    ...(giantBtn ? [giantBtn] : []),
  ];

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.05
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  allRevealTargets.forEach(el => observer.observe(el));

  /* ── DARK THEME TOGGLE ── */
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
  }

  /* ── SCROLL SEQUENCER with dust orchestration ── */
  const sequenceSection = document.getElementById('scroll-sequence');
  if (sequenceSection) {
    const seq1 = document.getElementById('seq-1');
    const seq2 = document.getElementById('seq-2');
    const seq3 = document.getElementById('seq-3');

    // Dust particle state (set by renderSeq calls)
    let dustProgress = 0;
    let dustTargetOpacity = 0;

    window.addEventListener('scroll', () => {
      const rect = sequenceSection.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      let progress = -rect.top / scrollHeight;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      dustProgress = progress;

      function renderSeq(el, center, cur) {
        let offset = cur - center;
        let t = offset / 0.25;

        if (t <= -1 || t >= 1) {
          el.style.opacity = 0;
          el.style.visibility = 'hidden';
          el.style.transform = `translate3d(0, ${offset * -320}px, 0)`;
          return;
        }

        el.style.visibility = 'visible';

        // Quadratic fade
        let opacity = 1 - (t * t);

        // Parallax Y — more range for cinematic feel
        let y = offset * -320;

        // Slight X parallax for depth
        let x = t * 18;

        // Cinematic blur
        let blur = (t * t) * 14;

        // Track which phrase is dominant
        if (opacity > dustTargetOpacity) dustTargetOpacity = opacity;

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
      }

      dustTargetOpacity = 0;
      renderSeq(seq1, 0.15, progress);
      renderSeq(seq2, 0.50, progress);
      renderSeq(seq3, 0.85, progress);

      // Drive dust intensity via CSS var
      const dustCanvas = document.getElementById('dust-canvas');
      if (dustCanvas) {
        dustCanvas.style.opacity = (dustTargetOpacity * 0.65).toFixed(3);
      }
    });
  }

  /* ── DUST PARTICLE ENGINE ── */
  (function initDust() {
    const canvas = document.getElementById('dust-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    const PARTICLE_COUNT = 80;
    const particles = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    new ResizeObserver(resize).observe(canvas);

    // Spawn a particle
    function spawn() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.22 - 0.08,  // slight upward drift
        r: Math.random() * 1.6 + 0.4,
        // life: 0–1
        life: Math.random(),
        decay: Math.random() * 0.0018 + 0.0006,
        // spawn near horizontal thirds
        zone: Math.random() * H,
      };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn());

    let scrollProgress = 0;

    // Listen globally to scroll to update progress
    const seqSection = document.getElementById('scroll-sequence');
    window.addEventListener('scroll', () => {
      if (!seqSection) return;
      const rect = seqSection.getBoundingClientRect();
      const sh = rect.height - window.innerHeight;
      scrollProgress = Math.max(0, Math.min(1, -rect.top / sh));
    }, { passive: true });

    function isDarkMode() {
      return document.documentElement.classList.contains('dark');
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Current focus Y band (center of screen + small text-zone drift)
      const focusY = H * 0.5 + Math.sin(scrollProgress * Math.PI * 2) * H * 0.12;

      const dark = isDarkMode();
      const baseAlpha = dark ? 0.55 : 0.38;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Proximity to focus band — amplifies opacity
        const distToFocus = Math.abs(p.y - focusY);
        const bandFactor = Math.max(0, 1 - distToFocus / (H * 0.38));

        // Wind: slight horizontal curl near center
        const windX = Math.sin((p.y / H) * Math.PI + scrollProgress * 4) * 0.12;

        p.x += p.vx + windX;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
          // respawn
          const np = spawn();
          np.x = Math.random() * W;
          np.y = focusY + (Math.random() - 0.5) * H * 0.5;
          particles[i] = np;
          continue;
        }

        const alpha = p.life * bandFactor * baseAlpha;
        const color = dark ? `255,255,255` : `0,0,0`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    draw();
  })();

  /* ── PAGE TRANSITIONS ── */
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      // Skip anchor links (smooth scroll handled elsewhere)
      if (href && href.startsWith('#')) return;
      // Intercept purely internal routing (not external, not mailto)
      if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
        e.preventDefault();
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });


  /* ── SMOOTH SCROLL FOR WORK NAV ───────────────────────── */
  document.querySelectorAll('[data-nav-scroll]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('data-nav-scroll');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── TOP-LEFT HOVER ──────────────────────────────────── */
  if (topLeft) {
    topLeft.addEventListener('mouseenter', () => topLeft.classList.add('hovered'));
    topLeft.addEventListener('mouseleave', () => topLeft.classList.remove('hovered'));
    // Touch: tap to toggle
    topLeft.addEventListener('click', () => topLeft.classList.toggle('hovered'));
  }

  /* ── HERO TYPEWRITER ─────────────────────────────────── */
  (function initTypewriter() {
    const typerEl = document.getElementById('hero-typewriter-text');
    const cursorEl = document.getElementById('hero-cursor');
    const sentenceRow = document.getElementById('hero-sentence-row');
    const finalEl = document.getElementById('hero-final');
    const knowMore = document.getElementById('hero-know-more');

    if (!typerEl || !cursorEl || !finalEl) return;

    const WORDS = [
      ' Islam Mihoub',
      ' CHRL',
      ' CS Student',
      ' Front-end Developer',
      ' Designer',
      ' Creative Thinker',
    ];

    const TYPE_SPEED_MIN = 48;   // ms per character (min)
    const TYPE_SPEED_MAX = 92;   // ms per character (max)
    const ERASE_SPEED = 34;   // ms per character (erase is faster)
    const PAUSE_AFTER_TYPE = 1050; // ms to hold the full word
    const PAUSE_BETWEEN = 260;  // ms gap before typing next word

    let wordIndex = 0;
    let charIndex = 0;
    let isErasing = false;
    let started = false;   // waits for canvas.visible before kicking off

    function rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function tick() {
      const currentWord = WORDS[wordIndex];

      if (!isErasing) {
        // — Typing phase —
        charIndex++;
        typerEl.textContent = currentWord.slice(0, charIndex);

        if (charIndex < currentWord.length) {
          // Still typing
          setTimeout(tick, rand(TYPE_SPEED_MIN, TYPE_SPEED_MAX));
        } else {
          // Word complete — pause then decide
          const isLast = wordIndex === WORDS.length - 1;
          if (isLast) {
            // Final word typed — transition to the "know more" state
            setTimeout(transitionToFinal, PAUSE_AFTER_TYPE);
          } else {
            // More words — erase after pause
            setTimeout(() => { isErasing = true; tick(); }, PAUSE_AFTER_TYPE);
          }
        }
      } else {
        // — Erasing phase —
        charIndex--;
        typerEl.textContent = currentWord.slice(0, charIndex);

        if (charIndex > 0) {
          setTimeout(tick, ERASE_SPEED);
        } else {
          // Fully erased — move to next word
          isErasing = false;
          wordIndex++;
          setTimeout(tick, PAUSE_BETWEEN);
        }
      }
    }

    function transitionToFinal() {
      // Fade out the whole sentence row as one unit
      if (sentenceRow) {
        sentenceRow.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)';
        sentenceRow.style.opacity = '0';
        sentenceRow.style.transform = 'translateY(-6px)';
        sentenceRow.style.pointerEvents = 'none';
      }

      // After fade-out, show the final state
      setTimeout(() => {
        if (sentenceRow) sentenceRow.style.display = 'none';
        finalEl.setAttribute('aria-hidden', 'false');
        finalEl.classList.add('active');
      }, 460);
    }

    function startWhenReady() {
      if (started) return;
      // Only start once the canvas becomes visible (intro done)
      if (!document.getElementById('canvas').classList.contains('visible')) {
        requestAnimationFrame(startWhenReady);
        return;
      }
      started = true;
      // Small delay after canvas reveal so the label's own animation completes
      setTimeout(tick, 820);
    }

    requestAnimationFrame(startWhenReady);

    /* ── Smooth-scroll for "know more" link ── */
    if (knowMore) {
      knowMore.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById('about-me');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      // Cursor hover states
      knowMore.addEventListener('mouseenter', () => cursorEl && cursor.classList.add('lens-hover'));
      knowMore.addEventListener('mouseleave', () => cursorEl && cursor.classList.remove('lens-hover'));
    }
  })();

  /* \u2500\u2500 HERO STUDIO TEXT PARALLAX \u2500\u2500
     The two large brand words at the bottom of the hero drift at different rates
     as the user scrolls — left faster than right — creating subtle depth layering. */
  (function initHeroParallax() {
    const left    = document.getElementById('studio-left');
    const right   = document.getElementById('studio-right');
    const canvas  = document.getElementById('canvas');
    if (!left && !right) return;

    window.addEventListener('scroll', () => {
      // Only run after the intro has finished
      if (!canvas || !canvas.classList.contains('visible')) return;

      // Cap at hero height so parallax stops once hero is fully scrolled past
      const sy = Math.min(window.scrollY, window.innerHeight);

      // Left text drifts upward slightly faster — foreground feel
      if (left)  left.style.transform  = `translateY(${(sy * -0.14).toFixed(2)}px)`;
      // Right text drifts a touch slower — background feel, creates layered depth
      if (right) right.style.transform = `translateY(${(sy * -0.09).toFixed(2)}px)`;
    }, { passive: true });
  })();

  /* \u2500\u2500 AURA SYSTEM \u2014 mouse parallax + section-based intensity \u2500\u2500 */
  (function initAura() {
    const root = document.documentElement;

    // Lerp targets for mouse position (normalised -1 \u2026 1)
    let ax = 0, ay = 0, tax = 0, tay = 0;

    window.addEventListener('mousemove', e => {
      tax = (e.clientX / window.innerWidth  - 0.5) * 2;
      tay = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Heavy-lag lerp loop \u2014 slow easing creates the "floating lens" parallax
    (function tickAura() {
      ax += (tax - ax) * 0.036;
      ay += (tay - ay) * 0.036;
      root.style.setProperty('--ax', ax.toFixed(3));
      root.style.setProperty('--ay', ay.toFixed(3));
      requestAnimationFrame(tickAura);
    })();

    // Scroll progress (used by dust engine + could drive future effects)
    window.addEventListener('scroll', () => {
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      root.style.setProperty('--scroll-p', p.toFixed(3));
    }, { passive: true });

    // Section observer: only scroll-sequence needs the aura class
    // (about-me aura was removed to keep that section clean and minimal)
    const seqEl = document.getElementById('scroll-sequence');

    const sectionIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        root.classList.toggle('in-seq', e.isIntersecting);
      });
    }, { threshold: 0.12 });

    if (seqEl) sectionIO.observe(seqEl);
  })();

})();