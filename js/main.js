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

initShowreelVideoFit();
initShowreelVimeo();

function initShowreelVideoFit() {
  const stage = document.querySelector(".showreel-stage");
  const media = document.querySelector(".showreel-media");
  const videoWrap = document.querySelector(".showreel-video");
  const iframe = document.querySelector(".showreel-video iframe");
  if (!stage || !media || !videoWrap || !iframe) return;

  const videoRatio = 16 / 9;

  function fitShowreelVideo() {
    const width = stage.clientWidth;
    if (!width) return;

    const videoHeight = width / videoRatio;
    const containerHeight = Math.min(videoHeight, window.innerHeight);

    stage.style.height = `${containerHeight}px`;
    media.style.height = `${containerHeight}px`;
    videoWrap.style.height = `${containerHeight}px`;

    iframe.style.width = "100%";
    iframe.style.height = `${videoHeight}px`;
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.transform = "none";
  }

  fitShowreelVideo();
  iframe.addEventListener("load", fitShowreelVideo);

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(fitShowreelVideo);
    observer.observe(stage);
  }

  window.addEventListener("resize", fitShowreelVideo, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitShowreelVideo, { passive: true });
  }
  window.addEventListener("orientationchange", () => {
    requestAnimationFrame(fitShowreelVideo);
  });
}

function loadVimeoPlayerApi() {
  if (window.Vimeo?.Player) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-vimeo-player]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Vimeo API failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.defer = true;
    script.dataset.vimeoPlayer = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Vimeo API failed"));
    document.body.appendChild(script);
  });
}

function initShowreelVimeo() {
  const iframe = document.querySelector(".showreel-video iframe");
  const volumeWrap = document.querySelector(".showreel-volume");
  const button = volumeWrap?.querySelector(".showreel-sound");
  const panel = document.getElementById("showreel-volume-panel");
  const slider = document.getElementById("showreel-volume-slider");
  const valueOut = volumeWrap?.querySelector(".showreel-volume-value");
  if (!iframe || !button || !panel || !slider || button.dataset.soundReady === "1") return;

  const iconOff = button.querySelector(".showreel-sound-icon--off");
  const iconOn = button.querySelector(".showreel-sound-icon--on");
  let player = null;
  let volumePercent = 0;

  function updateVolumeUi() {
    const hasVolume = volumePercent > 0;
    slider.value = String(volumePercent);
    slider.setAttribute("aria-valuenow", String(volumePercent));
    if (valueOut) valueOut.textContent = `${volumePercent}%`;
    button.classList.toggle("has-volume", hasVolume);
    iconOff?.classList.toggle("is-active", !hasVolume);
    iconOn?.classList.toggle("is-active", hasVolume);
  }

  function setPanelOpen(open) {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  async function applyVolume(percent) {
    volumePercent = Math.max(0, Math.min(100, Math.round(percent)));
    updateVolumeUi();
    if (!player) return;
    try {
      const level = volumePercent / 100;
      await player.setVolume(level);
      await player.setMuted(volumePercent === 0);
      if (volumePercent > 0) await player.play();
    } catch (error) {
      console.warn("Vimeo volume failed", error);
    }
  }

  function bindPlayer() {
    if (!window.Vimeo?.Player || button.dataset.soundReady === "1") return;
    button.dataset.soundReady = "1";
    player = new Vimeo.Player(iframe);
    updateVolumeUi();

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setPanelOpen(panel.hidden);
    });

    slider.addEventListener("input", () => {
      void applyVolume(Number(slider.value));
    });

    panel.addEventListener("click", (event) => event.stopPropagation());

    document.addEventListener("click", (event) => {
      if (!volumeWrap.contains(event.target)) setPanelOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setPanelOpen(false);
    });
  }

  void loadVimeoPlayerApi()
    .then(bindPlayer)
    .catch((error) => console.warn(error.message));
}
