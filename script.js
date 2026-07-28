/* ── Scroll restoration ───────────────────────────────────── */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const shouldStartAtTop = !window.location.hash;
function resetScrollPosition() {
  if (!shouldStartAtTop) return;
  window.scrollTo(0, 0);
}

resetScrollPosition();
window.addEventListener("pageshow", resetScrollPosition);
window.addEventListener("load", () => {
  resetScrollPosition();
  window.setTimeout(resetScrollPosition, 0);
}, { once: true });

/* ── Canvas background ──────────────────────────────────── */
const canvas = document.getElementById("signal-canvas");
const ctx    = canvas.getContext("2d");
let W = 0, H = 0, nodes = [];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(60, Math.max(24, Math.floor(W / 22)));
  nodes = Array.from({ length: count }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.14,
    r:  Math.random() * 1.2 + 0.5,
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, W, H);

  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < -20) n.x = W + 20;
    if (n.x > W + 20) n.x = -20;
    if (n.y < -20) n.y = H + 20;
    if (n.y > H + 20) n.y = -20;
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.strokeStyle = `rgba(74,127,212,${(1 - dist / 120) * 0.07})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const n of nodes) {
    ctx.fillStyle = "rgba(74,127,212,0.14)";
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawCanvas);
}

resizeCanvas();
drawCanvas();
window.addEventListener("resize", resizeCanvas);

/* ── Finance counter — slot machine + live-data flash ────────── */
function animateCounter(el) {
  const final    = parseInt(el.dataset.final, 10);
  if (isNaN(final)) return;
  const duration = 1600;
  const start    = performance.now();

  // Brief flash effect at end
  function flashSettle() {
    el.style.transition = "color 120ms";
    el.style.color = "var(--accent-bright)";
    setTimeout(() => {
      el.style.color = "";
      el.style.transition = "";
    }, 220);
  }

  function step(now) {
    const t     = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    if (t < 1) {
      if (t < 0.55) {
        /* Volatile phase — simulates live market data scramble */
        el.textContent = Math.round(Math.random() * (final * 1.4));
      } else if (t < 0.85) {
        /* Converging phase */
        el.textContent = Math.round(final * eased + (Math.random() - 0.5) * final * 0.12);
      } else {
        /* Near final — smooth */
        el.textContent = Math.round(final * eased);
      }
      requestAnimationFrame(step);
    } else {
      el.textContent = final;
      flashSettle();
    }
  }
  requestAnimationFrame(step);
}

/* ── Product panel bar entrance animation ─────────────────────── */
function animateProductBars() {
  document.querySelectorAll(".pm-fill").forEach((bar, i) => {
    const target = bar.style.width;
    bar.style.width = "0";
    bar.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${1.0 + i * 0.18}s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`;
        bar.style.width = target;
      });
    });
  });
}

/* ── Section chart bars — animate on scroll into view ────────── */
function initBarAnimations() {
  const sections = document.querySelectorAll(".platform, .services, .method, .impact-lab");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const section = entry.target;
      const bars = section.querySelectorAll(".sv-fill, .cm-bar, .diag-fill, .scl-fill, .cmp-fill, .casc-bar");

      if (bars.length) {
        /* Stagger the bars-live class trigger */
        bars.forEach((bar, i) => {
          setTimeout(() => {
            bar.closest("article, .service-visual, .mini-visual, .step-visual")
               ?.classList.add("bars-live");
            bar.parentElement?.classList.add("bars-live");
            bar.classList.add("bars-live");
            /* Also mark the section itself */
            section.classList.add("bars-live");
          }, i * 55);
        });
      }

      observer.unobserve(section);
    });
  }, { threshold: 0.25 });

  sections.forEach(s => observer.observe(s));
}

/* ── Main motion setup ────────────────────────────────────── */
function initMotion() {
  document.body.classList.remove("loading");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap        = Boolean(window.gsap && window.ScrollTrigger);

  if (prefersReduced || !hasGsap) {
    document.querySelectorAll(".section-reveal").forEach(s => {
      s.style.opacity   = "1";
      s.style.transform = "none";
    });
    document.querySelectorAll(".hero-word").forEach(w => {
      w.style.transform = "none";
    });
    document.querySelectorAll(".stat-num").forEach(animateCounter);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll — init AFTER gsap.registerPlugin ── */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.0, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (shouldStartAtTop) lenis.scrollTo(0, { immediate: true, force: true });
  }

  /* ── Hero entrance ── */
  const heroTL = gsap.timeline({
    defaults: { ease: "power4.out" },
    delay: 0.05,
  });

  heroTL
    .from(".hero-word", {
      yPercent: 112,
      duration: 1.0,
      stagger:  0.065,
    })
    .from(
      ".hero-sub",
      { y: 20, opacity: 0, duration: 0.8 },
      "-=0.6"
    )
    .from(
      ".hero-product",
      { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" },
      "-=0.7"
    );

  /* ── Product panel bars animate right away ── */
  setTimeout(animateProductBars, 700);

  /* ── Stat counters on scroll ── */
  ScrollTrigger.create({
    trigger: ".hero-stats",
    start:   "top 90%",
    once:    true,
    onEnter: () => {
      document.querySelectorAll(".stat-num").forEach((el, i) => {
        setTimeout(() => animateCounter(el), 80 + i * 110);
      });
    },
  });

  /* ── Section scroll reveals ── */
  document.querySelectorAll(".section-reveal").forEach(section => {
    if (section.classList.contains("hero")) return;

    gsap.from(section, {
      scrollTrigger: {
        trigger: section,
        start:   "top 96%",
      },
      y:       50,
      duration: 0.8,
      ease:    "power3.out",
    });

    const staggerItems = section.querySelectorAll(
      ".proof-pill, .system-index span, .system-statement > *, " +
      ".system-points li, .system-board article, " +
      ".imr-card, .ba-panel-new, .timeline article, " +
      ".founder-stats div, .contact-card, .section-copy > *, .stat-item, " +
      ".outcome-grid article, .kpi-map-grid article, .sector-system-grid article, " +
      ".purpose-grid article, .leader-card, .alliance-grid article, " +
      ".portfolio-group, .ksa-proof-grid article, .lifecycle-step, .method-assurance span"
    );

    if (staggerItems.length) {
      gsap.from(staggerItems, {
        scrollTrigger: {
          trigger: section,
          start:   "top 90%",
        },
        y:       28,
        duration: 0.65,
        stagger:  0.055,
        ease:    "power3.out",
      });
    }
  });

  /* ── Horizontal logo scroll ── */
  const logoTrack = document.querySelector(".logo-track");
  const clients   = document.querySelector(".clients");

  if (logoTrack && clients && window.innerWidth > 560) {
    const distance = () =>
      Math.max(0, logoTrack.scrollWidth - window.innerWidth + 120);

    const setHeight = () => {
      clients.style.setProperty(
        "--clients-scroll-height",
        `${distance() + window.innerHeight * 1.3}px`
      );
    };

    setHeight();
    ScrollTrigger.addEventListener("refreshInit", setHeight);

    gsap.to(logoTrack, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger:             clients,
        start:               "top top",
        end:                 "bottom bottom",
        scrub:               0.8,
        invalidateOnRefresh: true,
      },
    });
  }

  /* ── Header darken on scroll — keep navy, not near-black ── */
  gsap.to(".site-header", {
    backgroundColor: "rgba(0,28,67,0.98)",
    scrollTrigger: {
      trigger:      "main",
      start:        "top -60",
      toggleActions: "play none none reverse",
    },
    duration: 0.2,
  });
}

/* ── Progressive contact form ─────────────────────────────── */
function initContactForm() {
  const pfForm  = document.getElementById("pf-form");
  const success = document.getElementById("cf-success");
  if (!pfForm || !success) return;

  const steps   = Array.from(pfForm.querySelectorAll(".pf-step"));
  const bar     = document.getElementById("pf-bar");
  const counter = document.getElementById("pf-counter");
  const nextBtn = document.getElementById("pf-next");
  const backBtn = document.getElementById("pf-back");
  const total   = steps.length;
  let   current = 0;
  let   goingBack = false;
  const answers = {};

  function refreshUI() {
    steps.forEach((s, i) => {
      const isActive = i === current;
      s.classList.toggle("active", isActive);
      if (isActive) s.classList.toggle("going-back", goingBack);
    });

    bar.style.width = ((current + 1) / total * 100) + "%";
    counter.textContent = "Step " + (current + 1) + " of " + total;
    backBtn.classList.toggle("hidden", current === 0);
    nextBtn.textContent = current === total - 1 ? "Send Request →" : "Continue →";
    checkNextState();

    /* Auto-focus first input on text-field steps */
    const firstInput = steps[current].querySelector("input");
    if (firstInput) setTimeout(() => firstInput.focus(), 60);
  }

  function checkNextState() {
    const step  = steps[current];
    const chips = step.querySelector(".pf-chips");
    const email = step.querySelector('input[type="email"]');

    if (chips) {
      nextBtn.disabled = !chips.querySelector(".pf-chip.selected");
    } else if (email) {
      nextBtn.disabled = !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    } else {
      nextBtn.disabled = false;
    }
  }

  /* Chip click: select + auto-advance */
  pfForm.addEventListener("click", e => {
    const chip = e.target.closest(".pf-chip");
    if (!chip) return;
    const chips = chip.closest(".pf-chips");
    chips.querySelectorAll(".pf-chip").forEach(c => c.classList.remove("selected"));
    chip.classList.add("selected");
    answers[chips.dataset.field] = chip.dataset.value;
    checkNextState();
    /* Keep the choice visible and let the visitor advance deliberately. */
  });

  pfForm.addEventListener("input", () => checkNextState());

  nextBtn.addEventListener("click", advance);
  backBtn.addEventListener("click", retreat);

  function advance() {
    if (nextBtn.disabled) return;

    /* Collect text fields on step 4 */
    const step = steps[current];
    ["pf-name", "pf-email", "pf-phone"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) answers[id.replace("pf-", "")] = el.value.trim();
    });

    if (current === total - 1) { submit(); return; }
    goingBack = false;
    current++;
    refreshUI();
  }

  function retreat() {
    if (current === 0) return;
    goingBack = true;
    current--;
    refreshUI();
  }

  function submit() {
    nextBtn.disabled = true;
    nextBtn.textContent = "Sending…";

    const name  = answers.name  || "";
    const mail  = answers.email || "";
    const phone = answers.phone || "";

    const body = [
      `Name: ${name}`,
      `Email: ${mail}`,
      phone                   ? `Phone: ${phone}`                         : "",
      answers.business_type   ? `Business type: ${answers.business_type}` : "",
      answers.main_problem    ? `Main problem: ${answers.main_problem}`   : "",
      answers.locations       ? `Locations: ${answers.locations}`         : "",
      answers.urgency         ? `Urgency: ${answers.urgency}`             : "",
    ].filter(Boolean).join("\n");

    const mailtoLink = `mailto:info@growxcel.com`
      + `?subject=${encodeURIComponent("[Growxcel] Audit request from " + name)}`
      + `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
      pfForm.style.display = "none";
      success.classList.add("visible");
    }, 500);
  }

  const privacyNote = document.createElement("p");
  privacyNote.className = "pf-privacy";
  privacyNote.innerHTML = 'By continuing, you agree that Growxcel may use these details to respond to your request. <a href="privacy.html">Privacy notice</a>.';
  pfForm.appendChild(privacyNote);

  refreshUI();
}

/* ── Custom cursor — single ring, direct follow, no lag ────── */
function initCursor() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const ring = document.getElementById("cursor-ring");
  if (!ring) return;

  /* Hide dot entirely — one element only */
  const dot = document.getElementById("cursor-dot");
  if (dot) dot.style.display = "none";

  let visible = false;

  document.addEventListener("mousemove", e => {
    ring.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
    if (!visible) {
      visible = true;
      ring.style.opacity = "1";
    }
  });

  /* Hover expand */
  const hoverTargets = "a, button, [role='button'], select, " +
    ".service-grid article, .system-board article, " +
    ".imr-card, .logo-track article, .proof-pill, " +
    ".ba-panel-new, .timeline article, .header-cta, .cf-submit, " +
    ".outcome-grid article, .kpi-map-grid article, .sector-system-grid article, " +
    ".leader-card, .alliance-grid article, .portfolio-logos img, .ksa-proof-grid article";

  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });

  document.addEventListener("mousedown", () => document.body.classList.add("cursor-clicking"));
  document.addEventListener("mouseup",   () => document.body.classList.remove("cursor-clicking"));
}

/* ── Active nav state — highlight current section ─────────── */
function initActiveNav() {
  const navLinks = document.querySelectorAll("nav a[href^='#']");
  if (!navLinks.length) return;

  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute("href").replace("#", "");
    return { link, section: document.getElementById(id) };
  }).filter(item => item.section);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove("nav-active"));
        const active = sections.find(s => s.section === entry.target);
        if (active) active.link.classList.add("nav-active");
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  sections.forEach(({ section }) => observer.observe(section));
}

/* ── HERO LOCAL WATERMARK — fades in, scrolls out with hero ─ */
function initHeroLocalWatermark() {
  const ring = document.getElementById("hlb-ring-hero");
  const hero = document.querySelector(".hero");
  if (!ring || !hero) return;

  let rot        = 0;
  let scrollPct  = 0;
  let smoothScroll = 0;
  let age        = 0;
  let lastTs     = null;

  window.addEventListener("scroll", () => {
    const heroH = hero.offsetHeight || window.innerHeight;
    scrollPct = Math.min(window.scrollY / (heroH * 0.7), 1);
  }, { passive: true });

  function tick(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(ts - lastTs, 50);
    lastTs = ts;
    age   += dt;

    rot += dt * 0.005; // ~72s CW

    smoothScroll += (scrollPct - smoothScroll) * 0.07;

    const fadeIn  = Math.min(age / 1200, 1);
    const fadeOut = Math.max(0, 1 - smoothScroll * 1.35);
    const scale   = (1 + smoothScroll * 0.3).toFixed(4);

    ring.style.transform = `translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${scale})`;
    ring.style.opacity   = (0.07 * fadeIn * fadeOut).toFixed(4);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(tick); });
}

/* ── GLOBAL LOGO WATERMARK — drops in on every section ───── */
function initGlobalLogoWatermark() {
  const ring = document.getElementById("hlb-ring-1");
  if (!ring) return;

  let rot        = 180;    // start at offset so it's not identical to hero ring
  let currentY   = -140;
  let targetY    = 0;
  let currentOp  = 0;
  let targetOp   = 0.07;
  let lastTs     = null;
  let dropping   = false;

  // Skip hero — it has its own dedicated local watermark
  const sections = document.querySelectorAll("section:not(.hero)");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentY = -140;
        targetY  = 0;
        targetOp = 0.07;
        dropping = true;
      }
    });
  }, { threshold: 0.25 });

  sections.forEach(s => observer.observe(s));

  function tick(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(ts - lastTs, 50);
    lastTs   = ts;

    rot += dt * 0.005;

    const easeY  = dropping ? 0.045 : 0.07;
    currentY  += (targetY  - currentY)  * easeY;
    currentOp += (targetOp - currentOp) * 0.055;

    if (dropping && Math.abs(currentY - targetY) < 0.5) dropping = false;

    ring.style.transform = `translate(-50%, calc(-50% + ${currentY.toFixed(2)}px)) rotate(${rot.toFixed(2)}deg)`;
    ring.style.opacity   = currentOp.toFixed(4);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(tick); });
}

/* ── Boot ─────────────────────────────────────────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMotion();
    initContactForm();
    initCursor();
    initBarAnimations();
    initActiveNav();
    initHeroLocalWatermark();
    initGlobalLogoWatermark();
    initCsCarousel();
    initClientOrbit();
    initMobileNav();
  });
} else {
  initMotion();
  initContactForm();
  initCursor();
  initBarAnimations();
  initActiveNav();
  initHeroLocalWatermark();
  initGlobalLogoWatermark();
  initCsCarousel();
  initClientOrbit();
  initMobileNav();
}

/* ── Mobile hamburger nav ────────────────────────────────── */
function initMobileNav() {
  const btn    = document.getElementById("ham-btn");
  const drawer = document.getElementById("mobile-drawer");
  if (!btn || !drawer) return;

  btn.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
    btn.setAttribute("aria-expanded", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  drawer.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      drawer.classList.remove("open");
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

/* ── Case Study Carousel ─────────────────────────────────── */
function initCsCarousel() {
  const track   = document.getElementById("csTrack");
  const prevBtn = document.getElementById("csPrev");
  const nextBtn = document.getElementById("csNext");
  const dots    = document.querySelectorAll(".cs-dot");
  if (!track || !prevBtn || !nextBtn) return;

  const slides = track.querySelectorAll(".cs-slide");
  let current = 0;
  const total = slides.length;

  function goTo(index) {
    current = Math.max(0, Math.min(index, total - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === current);
      d.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
  dots.forEach(d => d.addEventListener("click", () => goTo(+d.dataset.slide)));

  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  goTo(0);
}

/* ── Client Network Orbit ────────────────────────────────── */
function initClientOrbit() {
  const orbit = document.querySelector(".cn-orbit");
  if (!orbit) return;
  if (window.innerWidth <= 560) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    /* Static fallback: place nodes at their initial angles */
    placeOrbitNodes(getOrbitRadii());
    return;
  }

  const RINGS = [
    { selector: ".cn-ring-1", speed: 0.35,  dir:  1 },
    { selector: ".cn-ring-2", speed: 0.20,  dir: -1 },
    { selector: ".cn-ring-3", speed: 0.13,  dir:  1 },
  ];

  const ringState = RINGS.map(r => ({
    ...r,
    el:    orbit.querySelector(r.selector),
    angle: 0,
  }));

  function tick() {
    const radii = getOrbitRadii();
    ringState.forEach((ring, i) => {
      if (!ring.el) return;
      ring.angle += ring.speed * ring.dir;
      ring.el.querySelectorAll(".cn-node-wrap").forEach(wrap => {
        const base = parseFloat(wrap.dataset.angle || "0");
        const rad  = (base + ring.angle) * Math.PI / 180;
        const x    = radii[i] * Math.cos(rad);
        const y    = radii[i] * Math.sin(rad);
        wrap.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
    requestAnimationFrame(tick);
  }
  tick();
}

function getOrbitRadii() {
  if (window.innerWidth <= 560) return [50, 90, 132];
  return window.innerWidth <= 900 ? [60, 110, 175] : [80, 155, 240];
}

function placeOrbitNodes(radii) {
  const orbit = document.querySelector(".cn-orbit");
  if (!orbit) return;
  [".cn-ring-1", ".cn-ring-2", ".cn-ring-3"].forEach((sel, i) => {
    const ring = orbit.querySelector(sel);
    if (!ring) return;
    ring.querySelectorAll(".cn-node-wrap").forEach(wrap => {
      const rad = parseFloat(wrap.dataset.angle || "0") * Math.PI / 180;
      wrap.style.transform = `translate(${radii[i] * Math.cos(rad)}px, ${radii[i] * Math.sin(rad)}px)`;
    });
  });
}
