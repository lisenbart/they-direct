const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("[data-year]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

const animatedElements = document.querySelectorAll(
  ".section-header, .audience-grid, .model-grid, .about-grid, .format-grid, .process-track, .trust-grid, .contact-form, .site-footer"
);

if (animatedElements.length) {
  document.body.classList.add("motion-ready");

  animatedElements.forEach((element, index) => {
    element.classList.add("animate-in");
    element.style.setProperty("--motion-delay", `${Math.min(index * 70, 280)}ms`);
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    animatedElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -12%",
        threshold: 0.12,
      }
    );

    animatedElements.forEach((element) => revealObserver.observe(element));
  }
}

if (!reduceMotion.matches) {
  let latestScrollY = window.scrollY;
  let ticking = false;

  const updateBackgroundMotion = () => {
    const y = Math.max(-18, Math.min(18, latestScrollY * -0.018));
    document.documentElement.style.setProperty("--motion-y", `${y}px`);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      latestScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(updateBackgroundMotion);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * -10;
      document.documentElement.style.setProperty("--motion-x", `${x.toFixed(2)}px`);
    },
    { passive: true }
  );
}
