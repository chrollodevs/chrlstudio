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
  const revealTargets = document.querySelectorAll('.project-item, .contact-links a, .about-text, .about-hero, .about-card');
  revealTargets.forEach(el => el.classList.add('scroll-reveal'));

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',  /* fires 60px before bottom edge */
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

  revealTargets.forEach(el => observer.observe(el));

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

  /* ── SCROLL SEQUENCER ── */
  const sequenceSection = document.getElementById('scroll-sequence');
  if (sequenceSection) {
    const seq1 = document.getElementById('seq-1');
    const seq2 = document.getElementById('seq-2');
    const seq3 = document.getElementById('seq-3');

    window.addEventListener('scroll', () => {
      const rect = sequenceSection.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      let progress = -rect.top / scrollHeight;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      // Apple-tier Cinematic Sequencing Math
      function renderSeq(el, center, cur) {
        let offset = cur - center;
        let t = offset / 0.25; // Visible window is exactly +/- 0.25 of progress

        if (t <= -1 || t >= 1) {
          el.style.opacity = 0;
          el.style.visibility = 'hidden';
          return;
        }

        el.style.visibility = 'visible';

        // Quadratic Fade — peaks seamlessly at 1.0, easing cleanly to 0
        let opacity = 1 - (t * t);

        // Smooth translation block — bounds mapped from +80px to -80px
        let y = offset * -320;

        // Cinematic depth-of-field (blurs cleanly away from the center phase)
        let blur = (t * t) * 16;

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
      }

      // Exact rhythmic centers across the 450vh container
      renderSeq(seq1, 0.15, progress);
      renderSeq(seq2, 0.50, progress);
      renderSeq(seq3, 0.85, progress);
    });
  }

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

})();