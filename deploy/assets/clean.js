document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  const logoTrack = document.querySelector(".logo-track");
  if (logoTrack && !logoTrack.dataset.cloned) {
    Array.from(logoTrack.children).forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      logoTrack.appendChild(clone);
    });
    logoTrack.dataset.cloned = "true";
  }

  document.querySelectorAll(".orbit-node").forEach((node) => {
    const angle = Number(node.dataset.angle || 0);
    node.style.setProperty("--angle", `${angle}deg`);
    node.style.setProperty("--counter-angle", `${-angle}deg`);
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      const lenis = new Lenis({ duration: 0.9, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    gsap.from(".hero-copy > *, .page-hero .hero-copy > *", {
      y: 28,
      opacity: 0.35,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: "transform,opacity"
    });

    document.querySelectorAll("[data-reveal]").forEach((section) => {
      const items = section.querySelectorAll("[data-item]");
      gsap.from(items.length ? items : section, {
        scrollTrigger: { trigger: section, start: "top 88%", once: true },
        y: 24,
        opacity: 0.45,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "transform,opacity"
      });
    });

    document.querySelectorAll(".data-grid").forEach((grid) => {
      gsap.to(grid, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: grid.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = `Growxcel enquiry - ${data.get("company") || "New business"}`;
      const body = [
        `Name: ${data.get("name") || ""}`,
        `Company: ${data.get("company") || ""}`,
        `Email: ${data.get("email") || ""}`,
        `Phone: ${data.get("phone") || ""}`,
        `Main challenge: ${data.get("challenge") || ""}`,
        "",
        data.get("message") || ""
      ].join("\n");
      window.location.href = `mailto:info@growxcel.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const status = form.querySelector(".form-status");
      if (status) {
        status.style.display = "block";
        status.textContent = "Your email application is ready with the enquiry details.";
      }
    });
  }
});
