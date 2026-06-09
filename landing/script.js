/* PairWise landing — Lenis + GSAP ScrollTrigger scroll animations */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HEADER_OFFSET = 78;
  var lenis = null;
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---- Lenis smooth scroll ---- */
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.15,
    });

    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      a.addEventListener("click", function (e) {
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.35 });
      });
    });
  }

  /* ---- header frost ---- */
  var header = document.getElementById("header");
  function onScrollHeader() {
    var y = lenis ? lenis.scroll : window.scrollY;
    header.classList.toggle("scrolled", y > 12);
  }

  if (hasGsap && !reduce) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: onScrollHeader,
    });
  } else {
    onScrollHeader();
    if (lenis) {
      lenis.on("scroll", onScrollHeader);
    } else {
      window.addEventListener("scroll", onScrollHeader, { passive: true });
    }
  }

  if (!hasGsap || reduce) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  gsap.defaults({ ease: "power3.out" });

  /* ============================================================
     HERO — load sequence + word scatter on scroll
     ============================================================ */
  var heroWords = gsap.utils.toArray(".hero-word");
  var line1Words = gsap.utils.toArray(".hero-line--1 .hero-word");
  var line2Words = gsap.utils.toArray(".hero-line--2 .hero-word");

  function assignWordScatter(words, baseLift, liftSpread, driftMax, rotMax) {
    words.forEach(function (word) {
      word._scatter = {
        lift: baseLift + Math.random() * liftSpread,
        drift: (Math.random() - 0.5) * driftMax * 2,
        rot: (Math.random() - 0.5) * rotMax * 2,
      };
    });
  }

  /* Line 1 — faster overall; line 2 — a bit slower but still lively */
  assignWordScatter(line1Words, 108, 88, 14, 11);
  assignWordScatter(line2Words, 78, 62, 11, 9);

  gsap.set(".hero-word.t-sage", { scale: 0.5, transformOrigin: "50% 80%" });
  gsap.set(".hero-word.script", { scale: 0.85, rotation: -5, transformOrigin: "50% 80%" });

  var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  heroTl
    .fromTo(
      ".hero-word",
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.65,
        stagger: { amount: 0.38, from: "random" },
      },
      0,
    )
    .fromTo(
      ".hero-word.t-sage",
      { autoAlpha: 0, scale: 0.5 },
      { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(2)" },
      0.28,
    )
    .fromTo(
      ".hero-word.script",
      { autoAlpha: 0, scale: 0.85, rotation: -5 },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.6)" },
      0.35,
    )
    .fromTo(
      ".hero .sub",
      { autoAlpha: 0, y: 32 },
      { autoAlpha: 1, y: 0, duration: 0.65 },
      0.2,
    )
    .fromTo(
      ".hero .badge",
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07 },
      0.38,
    )
    .fromTo(
      ".hero .cta-row > *",
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 },
      0.48,
    )
    .fromTo(
      ".hero .blob",
      { scale: 0.85, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.1, stagger: 0.12, ease: "power2.out" },
      0,
    )
    .fromTo(
      ".hero-starburst",
      { scale: 0, rotation: -40, autoAlpha: 0 },
      { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.85, ease: "back.out(1.7)" },
      0.25,
    )
    .fromTo(
      ".hero-art .phone",
      { y: 70, autoAlpha: 0, rotation: -8 },
      { y: 0, autoAlpha: 1, rotation: -4, duration: 0.95, ease: "power3.out" },
      0.18,
    )
    .fromTo(
      ".hero .keypad .k",
      { scale: 0.55, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.35,
        stagger: { amount: 0.4, from: "random" },
        ease: "back.out(1.8)",
      },
      0.55,
    );

  /* Words drift up randomly while scrolling down; return on scroll up */
  gsap.fromTo(
    heroWords,
    { y: 0, x: 0, rotation: 0 },
    {
      y: function (i, el) {
        return -el._scatter.lift;
      },
      x: function (i, el) {
        return el._scatter.drift;
      },
      rotation: function (i, el) {
        return el._scatter.rot;
      },
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "45% top",
        scrub: 0.45,
      },
    },
  );

  gsap.fromTo(
    ".hero-starburst",
    { rotation: 0 },
    {
      rotation: 140,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.85,
      },
    },
  );

  gsap.to(".hero-art .phone", {
    y: "-=14",
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 1.2,
  });

  /* Hero scroll parallax — explicit start/end so copy stays visible at top */
  gsap.fromTo(
    ".hero-copy",
    { y: 0, autoAlpha: 1 },
    {
      y: 90,
      autoAlpha: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
      },
    },
  );

  gsap.fromTo(
    ".hero-art",
    { y: 0, scale: 1 },
    {
      y: -60,
      scale: 0.94,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
      },
    },
  );

  gsap.utils.toArray(".hero .blob").forEach(function (blob, i) {
    gsap.to(blob, {
      y: i === 0 ? 120 : -90,
      x: i === 0 ? 40 : -30,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
    });
  });

  /* ============================================================
     PARALLAX — phones & mockups
     ============================================================ */
  gsap.utils.toArray("[data-parallax]").forEach(function (el) {
    var amt = parseFloat(el.getAttribute("data-parallax")) || 0.04;
    var rot = el.classList.contains("tilt")
      ? -4
      : el.classList.contains("tilt-r")
        ? 3.5
        : 0;
    var section = el.closest("section") || el.closest(".bcard") || el;

    gsap.to(el, {
      y: function () {
        return -amt * window.innerHeight * 0.55;
      },
      rotation: rot,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.4,
      },
    });
  });

  /* ============================================================
     SCROLL REVEALS — batch for generic .reveal blocks
     ============================================================ */
  gsap.set(".reveal", { autoAlpha: 0, y: 50 });

  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power3.out",
        overwrite: true,
      });
    },
  });

  /* ============================================================
     HOW IT WORKS — pinned scroll storyboard (scrub timeline)
     ============================================================ */
  var howChips = gsap.utils.toArray(".how-chip");

  gsap.set(".how-split", { transformPerspective: 900 });
  gsap.set(".how-chip", { autoAlpha: 0, y: 28, scale: 0.88 });
  gsap.set(".how-phone", { autoAlpha: 0, y: 60, rotate: 8, scale: 0.92 });
  gsap.set(".how-sync-ring", { scale: 0.5, autoAlpha: 0 });
  gsap.set(".how-toast", { autoAlpha: 0, y: -16, scale: 0.85 });
  gsap.set(".how-bar-fill", { width: "4%" });
  gsap.set(".how-rem-amt", { textContent: "₹27,000" });
  gsap.set(".how-entry-amt", { textContent: "0" });
  gsap.set(".how-burst", { scale: 0, rotation: -30, autoAlpha: 0 });

  var howTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".how-pin",
      start: "top 10%",
      end: "+=52%",
      pin: true,
      scrub: 0.35,
      anticipatePin: 1,
    },
  });

  var chipDim = {
    autoAlpha: 0.5,
    scale: 0.94,
    backgroundColor: "rgba(255, 252, 249, 0.55)",
    color: "#6B6E68",
    borderColor: "rgba(224, 219, 211, 0.9)",
    duration: 0.08,
  };
  var chipLit = {
    autoAlpha: 1,
    scale: 1,
    backgroundColor: "#5C6B58",
    color: "#ffffff",
    borderColor: "#5C6B58",
    duration: 0.08,
  };

  howTl
    .fromTo(".how-eyebrow", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0)
    .fromTo(
      ".how-split",
      { rotateX: -78, y: 50, autoAlpha: 0 },
      { rotateX: 0, y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.12, ease: "back.out(1.6)" },
      0.02,
    )
    .fromTo(
      ".how-chip",
      { autoAlpha: 0, y: 28, scale: 0.88 },
      { autoAlpha: 0.5, y: 0, scale: 0.94, stagger: 0.03, duration: 0.1, ease: "back.out(1.8)" },
      0.08,
    )
    .fromTo(
      ".how-phone",
      { autoAlpha: 0, y: 60, rotate: 8, scale: 0.92 },
      { autoAlpha: 1, y: 0, rotate: 3.5, scale: 1, duration: 0.14, ease: "power3.out" },
      0.06,
    )
    .fromTo(
      ".how-burst",
      { scale: 0, rotation: -30, autoAlpha: 0 },
      { scale: 1, rotation: 0, autoAlpha: 0.7, duration: 0.12, ease: "back.out(2)" },
      0.1,
    )
    /* Step 1 — Tap */
    .to(howChips[0], chipLit, 0.14)
    .to(howChips[1], chipDim, 0.14)
    .to(howChips[2], chipDim, 0.14)
    .fromTo(
      ".how-entry-amt",
      { textContent: "0" },
      { textContent: "240", snap: { textContent: 1 }, duration: 0.12, ease: "none" },
      0.16,
    )
    .to(".how-key-ok", { scale: 1.14, duration: 0.06, yoyo: true, repeat: 1, ease: "back.out(2)" }, 0.22)
    /* Step 2 — Sync */
    .to(howChips[0], chipDim, 0.28)
    .to(howChips[1], chipLit, 0.28)
    .to(howChips[2], chipDim, 0.28)
    .fromTo(".how-bar-fill", { width: "4%" }, { width: "16%", duration: 0.12, ease: "power2.inOut" }, 0.3)
    .to(".how-sync-ring--a", { scale: 2.4, autoAlpha: 0, duration: 0.1, ease: "power2.out" }, 0.33)
    .to(".how-sync-ring--b", { scale: 3, autoAlpha: 0, duration: 0.1, ease: "power2.out" }, 0.35)
    .to(".how-toast", { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, ease: "back.out(2)" }, 0.34)
    /* Step 3 — Share */
    .to(howChips[0], chipDim, 0.42)
    .to(howChips[1], chipDim, 0.42)
    .to(howChips[2], chipLit, 0.42)
    .to(".how-pair .av", { y: -5, duration: 0.05, stagger: 0.03, yoyo: true, repeat: 1, ease: "back.out(2)" }, 0.46)
    .to(".how-phone", { rotate: 0, scale: 1.03, duration: 0.1, ease: "power2.inOut" }, 0.44)
    .to(".how-burst", { rotation: 90, duration: 0.14, ease: "none" }, 0.4);

  /* ============================================================
     BENTO — section head + per-card scroll storyboards
     ============================================================ */
  gsap.set(".bento-split", { transformPerspective: 900 });

  gsap.fromTo(
    ".bento-eyebrow",
    { y: 22, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: ".bento-head", start: "top 82%", toggleActions: "play none none reverse" },
    },
  );

  gsap.fromTo(
    ".bento-split",
    { y: 48, rotateX: -52, autoAlpha: 0 },
    {
      y: 0,
      rotateX: 0,
      autoAlpha: 1,
      stagger: 0.12,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: { trigger: ".bento-head", start: "top 80%", toggleActions: "play none none reverse" },
    },
  );

  function bentoEnter(card, from, delay) {
    gsap.fromTo(
      card,
      Object.assign({ autoAlpha: 0 }, from),
      {
        autoAlpha: 1,
        y: 0,
        x: 0,
        scale: 1,
        rotation: 0,
        duration: 0.95,
        delay: delay || 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      },
    );
  }

  bentoEnter(".b-track", { y: 70, scale: 0.94 });
  bentoEnter(".b-free", { x: -55, rotation: -2 }, 0.04);
  bentoEnter(".b-sync", { y: 65, scale: 0.95 }, 0.02);
  bentoEnter(".b-history", { x: 55, scale: 0.95 }, 0.04);
  bentoEnter(".b-analyze", { y: 75, scale: 0.96 }, 0.06);

  /* Track — copy + phone + cycle bar scrub */
  gsap.timeline({
    scrollTrigger: { trigger: ".b-track", start: "top 72%", end: "top 38%", scrub: 0.55 },
  })
    .fromTo(".b-track .copy h3", { x: -36, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out" }, 0)
    .fromTo(".b-track .copy .body", { x: -28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0.08)
    .fromTo(".b-track .bento-phone", { x: 70, y: 30, rotate: 5, autoAlpha: 0, scale: 0.92 }, { x: 0, y: 0, rotate: 0, autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.05)
    .fromTo(".b-track .stat .v", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.25, ease: "back.out(1.6)" }, 0.22)
    .fromTo(".b-track .b-cycle-fill", { width: "0%" }, { width: "13%", duration: 0.35, ease: "power2.inOut" }, 0.28);

  /* Free — pills pop + hand-drawn underline draw */
  gsap.utils.toArray(".b-free .hl path").forEach(function (path) {
    var len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    path._len = len;
  });

  gsap.timeline({
    scrollTrigger: { trigger: ".b-free", start: "top 72%", end: "top 42%", scrub: 0.5 },
  })
    .fromTo(".b-free .eyebrow", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.2 }, 0)
    .fromTo(".free-pill", { y: 36, scale: 0.88, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, stagger: 0.12, duration: 0.35, ease: "back.out(1.7)" }, 0.1)
    .fromTo(".b-free .hl path", { strokeDashoffset: function (i, el) { return el._len || el.getTotalLength(); } }, { strokeDashoffset: 0, stagger: 0.1, duration: 0.4, ease: "power2.inOut" }, 0.25)
    .fromTo(".b-free .free-note", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 }, 0.35);

  /* Sync — cascade toasts on scrub */
  gsap.timeline({
    scrollTrigger: { trigger: ".b-sync", start: "top 72%", end: "top 40%", scrub: 0.5 },
  })
    .fromTo(".b-sync h3", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 }, 0)
    .fromTo(".b-sync .body", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22 }, 0.06)
    .fromTo(".sync-toast:first-child", { x: -40, autoAlpha: 0, scale: 0.94 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(1.6)" }, 0.15)
    .fromTo(".sync-arrow", { scale: 0, autoAlpha: 0, rotation: -90 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.25, ease: "back.out(2.2)" }, 0.28)
    .fromTo(".sync-toast.right", { x: 40, autoAlpha: 0, scale: 0.94 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(1.6)" }, 0.38);

  /* History — phone lift + transaction clip-in */
  gsap.set(".b-history .bento-tx", { autoAlpha: 0, x: 32, clipPath: "inset(0 100% 0 0)" });

  gsap.timeline({
    scrollTrigger: { trigger: ".b-history", start: "top 72%", end: "top 38%", scrub: 0.55 },
  })
    .fromTo(".b-history .copy h3", { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.28 }, 0)
    .fromTo(".b-history .copy .body", { x: -24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.24 }, 0.08)
    .fromTo(".b-history .bento-phone", { y: 50, rotate: 4, autoAlpha: 0, scale: 0.94 }, { y: 0, rotate: 0, autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" }, 0.05)
    .to(".b-history .bento-tx", {
      autoAlpha: 1,
      x: 0,
      clipPath: "inset(0 0% 0 0)",
      stagger: 0.08,
      duration: 0.28,
      ease: "power2.out",
    }, 0.22);

  /* Analyze — donut spin + legend + pills */
  gsap.timeline({
    scrollTrigger: { trigger: ".b-analyze", start: "top 72%", end: "top 35%", scrub: 0.55 },
  })
    .fromTo(".b-analyze .a-grid > div:first-child > *", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.28, ease: "power2.out" }, 0)
    .fromTo(".donut", { scale: 0.5, rotation: -140, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(1.4)" }, 0.1)
    .fromTo(".donut-legend .leg", { x: 22, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.06, duration: 0.22, ease: "power2.out" }, 0.28)
    .fromTo(".cat-breakdown .cat", { y: 16, scale: 0.86, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, stagger: 0.05, duration: 0.2, ease: "back.out(1.8)" }, 0.4);

  /* ============================================================
     DOWNLOAD + FOOTER
     ============================================================ */
  var downloadTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".download-grid",
      start: "top 88%",
      once: true,
    },
    defaults: { ease: "power3.out" },
  });

  downloadTl
    .fromTo(".dl-card", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.85 })
    .fromTo(".dl-promo", { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85 }, "-=0.55");

  gsap.to(".footer-burst", {
    rotation: 35,
    scale: 1.12,
    ease: "none",
    scrollTrigger: {
      trigger: ".footer-card",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.5,
    },
  });

  gsap.fromTo(
    ".footer-card",
    { y: 56, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.95,
      ease: "power3.out",
      scrollTrigger: { trigger: ".footer-card", start: "top 88%", once: true },
    },
  );

  /* Refresh after fonts / images settle */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
