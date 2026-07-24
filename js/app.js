// Table of Contents
// ------------------------------------------------
//  01. Loader & Loading Animation
//  02. Bootstrap Scroll Spy Plugin Settings
//  03. Lenis Scroll Plugin
//  04. Parallax
//  05. Scroll Animations
//  06. Smooth Scrolling
//  07. Swiper Slider
//  08. Contact Form
//  09. Modernizr SVG Fallback
//  10. Chrome Smooth Scroll
//  11. Images Moving Ban
//  12. Detecting Mobile/Desktop
//  13. PhotoSwipe Gallery Images Replace
//  14. Color Switch
//

$(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  // --------------------------------------------- //
  // Loader & Loading Animation Start
  // --------------------------------------------- //

  const loader = document.getElementById("loader");
  const loaderContent = document.getElementById("loaderContent");

  imagesLoaded(document.body).on("done", () => {
    loaderContent?.classList.add("fade-out");
    loader?.classList.add("loaded");

    const headlines = document.querySelectorAll(".animate-headline");

    if (headlines.length) {
      gsap.set(headlines, {
        y: 50,
        opacity: 0,
      });

      ScrollTrigger.batch(headlines, {
        interval: 0.1,
        batchMax: 4,

        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            ease: "sine",
            stagger: {
              each: 0.15,
              grid: [1, 4],
            },
            overwrite: true,
          }),

        onLeave: (batch) =>
          gsap.set(batch, {
            y: 0,
            opacity: 1,
            overwrite: true,
          }),

        onEnterBack: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            overwrite: true,
          }),

        onLeaveBack: (batch) =>
          gsap.set(batch, {
            y: 50,
            opacity: 0,
            overwrite: true,
          }),
      });
    }
  });

  // --------------------------------------------- //
  // Bootstrap Scroll Spy Plugin Settings Start
  // --------------------------------------------- //
window.addEventListener("load", () => {
  bootstrap.ScrollSpy.getOrCreateInstance(document.body, {
    target: "#menu",
    smoothScroll: true,
    rootMargin: "0px 0px 0px 0px",
    threshold: [0, 0.01, 0.05],
  }).refresh();
});
  // --------------------------------------------- //
  // Lenis Scroll Plugin Start
  // --------------------------------------------- //
  // const lenis = new Lenis();
  // function raf(time) {
  // lenis.raf(time);
  // requestAnimationFrame(raf);
  // }
  // requestAnimationFrame(raf);

  // ------------------------------------------------------------------------------ //
  // Parallax (Apply parallax effect to elements with data-speed)
  // ------------------------------------------------------------------------------ //

  const speedElements = document.querySelectorAll("[data-speed]");

  if (speedElements.length) {
    gsap.to(speedElements, {
      y: (_, element) =>
        (1 - Number(element.dataset.speed)) * ScrollTrigger.maxScroll(window),

      ease: "none",

      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }
  // --------------------------------------------- //
  // Scroll Animations Start
  // --------------------------------------------- //

  // Animation In Up
  document.querySelectorAll(".animate-in-up").forEach((element) => {
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
        ease: "sine",
      },
      {
        opacity: 1,
        y: 0,
        scrollTrigger: {
          trigger: element,
          toggleActions: "play none none reverse",
        },
      },
    );
  });

  // Animation Rotation
  document.querySelectorAll(".animate-rotation").forEach((element) => {
    gsap.fromTo(
      element,
      {
        rotate: 0,
        ease: "sine",
      },
      {
        rotate: Number(element.dataset.value) || 0,
        scrollTrigger: {
          trigger: element,
          scrub: true,
          toggleActions: "play none none reverse",
        },
      },
    );
  });

  // Reusable Card Animation
  function createCardAnimation(selector, y, batchMax, grid) {
    gsap.set(selector, {
      y,
      opacity: 0,
    });

    ScrollTrigger.batch(selector, {
      interval: 0.1,
      batchMax,

      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          ease: "sine",
          stagger: {
            each: 0.15,
            grid: [1, grid],
          },
          overwrite: true,
        }),

      onLeave: (batch) =>
        gsap.set(batch, {
          y: 0,
          opacity: 1,
          overwrite: true,
        }),

      onEnterBack: (batch) =>
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          overwrite: true,
        }),

      onLeaveBack: (batch) =>
        gsap.set(batch, {
          y,
          opacity: 0,
          overwrite: true,
        }),
    });

    ScrollTrigger.addEventListener("refreshInit", () => {
      gsap.set(selector, {
        y: 0,
        opacity: 1,
      });
    });
  }

  // Initialize
  if (document.querySelector(".animate-card-2")) {
    createCardAnimation(".animate-card-2", 100, 2, 2);
  }

  if (document.querySelector(".animate-card-3")) {
    createCardAnimation(".animate-card-3", 50, 3, 3);
  }

  if (document.querySelector(".animate-card-5")) {
    createCardAnimation(".animate-card-5", 50, 5, 5);
  }

  // --------------------------------------------- //
  // Smooth Scrolling Start
  // --------------------------------------------- //

  document
    .querySelectorAll('a[href*="#"]:not([href="#"]):not([href="#0"])')
    .forEach((link) => {
      link.addEventListener("click", function (event) {
        const { pathname, hostname, hash } = this;

        const isSamePage =
          window.location.pathname === pathname &&
          window.location.hostname === hostname;

        if (!isSamePage) return;

        let target = $(hash);

        if (!target.length) {
          target = document.querySelector(`[name="${hash.slice(1)}"]`);
        }

        if (!target.length) return;

        event.preventDefault();

        // URL update
        history.pushState(null, "", hash);

        $("html, body")
          .stop(true)
          .animate(
            {
              scrollTop: target.offset().top,
            },
            1000,
            () => {
              target.attr("tabindex", "-1").trigger("focus");
            },
          );
      });
    });

  // --------------------------------------------- //
  // Swiper Slider Start
  // --------------------------------------------- //

  const toolsSlider = document.querySelector(".swiper-tools");
  const testimonialsSlider = document.querySelector(".swiper-testimonials");
  if (toolsSlider) {
    new Swiper(toolsSlider, {
      spaceBetween: 20,
      autoplay: {
        delay: 1500,
        disableOnInteraction: false,
      },
      loop: true,
      grabCursor: true,
      breakpoints: {
        1600: { slidesPerView: 5 },
        1200: { slidesPerView: 4 },
        768: { slidesPerView: 3 },
        576: { slidesPerView: 2 },
        0: { slidesPerView: 2 },
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
  }

  if (testimonialsSlider) {
    new Swiper(testimonialsSlider, {
      slidesPerView: 1,
      spaceBetween: 20,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      speed: 1000,
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }

  // --------------------------------------------- //
  // Modernizr SVG Fallback Start
  // --------------------------------------------- //
  // if (!Modernizr.svg) {
  //   $("img[src*='svg']").attr("src", function () {
  //     return $(this).attr("src").replace(".svg", ".png");
  //   });
  // }

  // --------------------------------------------- //
  // Chrome Smooth Scroll Start
  // --------------------------------------------- //
  // try {
  //   $.browserSelector();
  //   if ($("html").hasClass("chrome")) {
  //     $.smoothScroll();
  //   }
  // } catch (err) {}

  // --------------------------------------------- //
  // Images Moving Ban Start
  // --------------------------------------------- //
  document.querySelectorAll("img, a").forEach((element) => {
    element.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
  });
  // --------------------------------------------- //
  // Detecting Mobile/Desktop Start
  // --------------------------------------------- //
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  document.documentElement.classList.add(isMobile ? "touch" : "no-touch");

  //IE, Edge
  const isIE = /MSIE|Trident|Edge\/\d+/.test(navigator.userAgent);

  // --------------------------------------------- //
  // PhotoSwipe Gallery Images Replace Start
  // --------------------------------------------- //
  document.querySelectorAll(".gallery__link").forEach((link) => {
    const picture = document.createElement("div");

    picture.className = "picture";
    picture.style.backgroundImage = `url(${link.dataset.image})`;

    link.appendChild(picture);
  });
});

// --------------------------------------------- //
// Set favicon icons for Theme Start             //
// --------------------------------------------- //
function setIconsForTheme(theme) {
  const path = `/img/favicon/${theme}`;

  document
    .querySelectorAll(
      `
    link[rel="icon"],
    link[rel="apple-touch-icon"]
  `,
    )
    .forEach((link) => link.remove());

  const icons = [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: `${path}/favicon-32x32.png`,
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: `${path}/favicon-16x16.png`,
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: `${path}/apple-touch-icon.png`,
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      href: `${path}/android-chrome-192x192.png`,
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
      href: `${path}/android-chrome-512x512.png`,
    },
    {
      rel: "icon",
      href: `${path}/favicon.ico`,
    },
  ];

  icons.forEach((iconData) => {
    const link = document.createElement("link");
    Object.entries(iconData).forEach(([key, value]) =>
      link.setAttribute(key, value),
    );
    document.head.appendChild(link);
  });
}
