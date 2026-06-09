gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHeader() {
  const header = document.querySelector('.site-header');
  ScrollTrigger.create({
    start: 'top -10',
    onUpdate: (self) => {
      header.classList.toggle('is-scrolled', self.scroll() > 8);
    },
  });
}

function initHero() {
  if (prefersReducedMotion) {
    gsap.set('.word, .reveal', { opacity: 1, y: 0 });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.word', {
    y: 48,
    opacity: 0,
    duration: 0.9,
    stagger: 0.045,
  })
    .from(
      '.reveal',
      {
        y: 28,
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
      },
      '-=0.35',
    )
    .from(
      '.hero__phone',
      {
        y: 60,
        opacity: 0,
        rotateX: 8,
        rotateY: -10,
        duration: 1.1,
        ease: 'power3.out',
      },
      '-=0.5',
    );

  gsap.to('.hero__phone .phone', {
    y: -10,
    duration: 3.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

function initFeatures() {
  document.querySelectorAll('.feature').forEach((section) => {
    const title = section.querySelector('.feature__title');
    const body = section.querySelector('.feature__body');
    const phone = section.querySelector('.phone');

    if (prefersReducedMotion) {
      gsap.set([title, body, phone], { opacity: 1, x: 0, y: 0 });
      return;
    }

    gsap.from(title, {
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
      },
      y: 36,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
    });

    gsap.from(body, {
      scrollTrigger: {
        trigger: section,
        start: 'top 72%',
      },
      y: 28,
      opacity: 0,
      duration: 0.85,
      delay: 0.08,
      ease: 'power3.out',
    });

    gsap.from(phone, {
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
      },
      y: 50,
      opacity: 0,
      rotate: section.dataset.feature === '1' ? -4 : 4,
      duration: 1,
      ease: 'power3.out',
    });
  });
}

function initCta() {
  if (prefersReducedMotion) return;

  gsap.from('.cta__inner > *', {
    scrollTrigger: {
      trigger: '.cta__inner',
      start: 'top 82%',
    },
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
  });
}

function initParallax() {
  if (prefersReducedMotion) return;

  gsap.to('.hero__content', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    y: 80,
    opacity: 0.35,
  });

  gsap.to('.hero__phone', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    y: -40,
    scale: 0.96,
  });
}

initHeader();
initHero();
initFeatures();
initCta();
initParallax();
