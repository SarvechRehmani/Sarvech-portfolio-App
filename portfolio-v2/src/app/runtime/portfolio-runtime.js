import {revealTheme} from '../core/theme-motion.js';
import DOMPurify from 'dompurify';
import {projectNames as catalogNames,projectOrder as catalogOrder} from '../core/catalog.js';
import {
  personalData,
  achievementsData,
  menuItems,
  servicesData,
  educationData,
  experienceData,
  projectsData,
  certificatesData,
  favSkillsData,
} from "./portfolio-data.js";
export function mountPortfolio(scope) {
  function renderFeatureItems(features) {
    const groups = [];
    for (const feature of features) {
      const value = feature.trim();
      if (/<hr\b/i.test(value)) continue;
      if (/^<(ul|ol)\b/i.test(value) && groups.length) {
        groups[groups.length - 1] += formatContent(value);
      } else groups.push(formatContent(value));
    }
    return groups.map((content) => `<li>${content}</li>`).join("");
  }
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  // Keep only the simple formatting used in the imported portfolio descriptions.
  function formatContent(value) { return DOMPurify.sanitize(value||''); }
  const projectNames=catalogNames,projectOrder=catalogOrder;
  for (const [key, p] of Object.entries(projectsData)) {
    if (!projectOrder.includes(key)) projectOrder.push(key);
    if (!projectNames[key])
      projectNames[key] = [
        p.title,
        p.subtitle || p.client,
        p.category || "web",
      ];
  }
  const themeButton = $(".theme-toggle");
  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme !== "light";
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${dark ? "light" : "dark"} theme`,
    );
    themeButton.innerHTML = dark
      ? '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
      : '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 15A9 9 0 019 4a9 9 0 1011 11Z"/></svg>';
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  }
  updateThemeButton();
  let themeTransitionActive = false;
  scope.listen(themeButton, "click", async () => {
    if (themeTransitionActive) return;
    const root = document.documentElement;
    const applyTheme = () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("sarvech-theme", root.dataset.theme);
      } catch {}
      updateThemeButton();
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme();
      return;
    }
    const effect=document.documentElement.dataset.themeTransition||'none';
    if(effect==='none'){applyTheme();return;}
    if(document.startViewTransition){themeTransitionActive=true;try{await revealTheme(themeButton,effect,applyTheme);}finally{themeTransitionActive=false;}return;}
    themeTransitionActive = true;
    // Animate a viewport-sized veil, never rasterize/blur the entire long page.
    const veil=document.createElement('div');
    veil.className='theme-switch-veil';veil.setAttribute('aria-hidden','true');document.body.append(veil);
    const targets = [veil];
    const animations = [];
    try {
      const out = targets.map((el) =>
        el.animate(
          [
            { opacity: 0 },
            { opacity: 1 },
          ],
          {
            duration: 120,
            easing: "cubic-bezier(.4,0,.2,1)",
            fill: "forwards",
          },
        ),
      );
      animations.push(...out);
      await Promise.all(out.map((animation) => animation.finished));
      applyTheme();
      const incoming = targets.map((el) =>
        el.animate(
          [
            { opacity: 1 },
            { opacity: 0 },
          ],
          {
            duration: 220,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "forwards",
          },
        ),
      );
      animations.push(...incoming);
      out.forEach((animation) => animation.cancel());
      await Promise.all(incoming.map((animation) => animation.finished));
    } finally {
      animations.forEach((animation) => animation.cancel());
      veil.remove();
      themeTransitionActive = false;
    }
  });
  const menu = $(".menu-toggle");
  if (menu) {
    menu.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path class="menu-line menu-line-top" d="M4 7h16"/><path class="menu-line menu-line-middle" d="M4 12h16"/><path class="menu-line menu-line-bottom" d="M4 17h16"/></svg>';
    let menuAnimation=null,menuVersion=0;
    function setMenu(open){
      const nav=$("#navigation"),version=++menuVersion;
      menuAnimation?.cancel();
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){nav.classList.toggle('open',open);return;}
      if(open){
        nav.classList.add('open');
        menuAnimation=nav.animate([{opacity:0,transform:'translateY(-12px) scale(.97)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
        nav.querySelectorAll('a').forEach((link,i)=>link.animate([{opacity:0,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,delay:25+i*20,fill:'backwards'}));
      }else if(nav.classList.contains('open')){
        menuAnimation=nav.animate([{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'},{opacity:0,transform:'translateY(-9px) scale(.98)',filter:'blur(4px)'}],{duration:190,easing:'cubic-bezier(.4,0,1,1)'});
        menuAnimation.finished.then(()=>{if(version===menuVersion)nav.classList.remove('open');}).catch(()=>{});
      }
    }
    scope.listen(menu, "click", () => setMenu(menu.getAttribute('aria-expanded')!=='true'));
    $$("#navigation a").forEach((a) =>
      scope.listen(a, "click", () => {
        setMenu(false);
      }),
    );
    scope.listen(document, "keydown", (event) => {
      if (event.key === "Escape") {
        setMenu(false);
      }
    });
  }
  $("#year").textContent = new Date().getFullYear();
  const dialog = $("#image-dialog");
  let viewerItems = [],
    viewerIndex = 0,
    viewerOpener = null,
    closingViewer = false;
  function animateMedia(element, direction = 1) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.getAnimations().forEach((a) => a.cancel());
    element.animate(
      [
        { opacity: 0, transform: `translateX(${direction * 35}px) scale(.98)` },
        { opacity: 1, transform: "translateX(0) scale(1)" },
      ],
      { duration: 440, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }
  function renderViewer(direction = 1) {
    const item = viewerItems[viewerIndex];
    $("#dialog-image").src = item.src;
    $("#dialog-image").alt = item.caption;
    $("#dialog-caption").textContent = item.caption;
    $("#viewer-position").textContent =
      `${String(viewerIndex + 1).padStart(2, "0")} / ${String(viewerItems.length).padStart(2, "0")}`;
    $("#viewer-prev").disabled = $("#viewer-next").disabled =
      viewerItems.length < 2;
    animateMedia($("#dialog-image"), direction);
  }
  function showImage(src, caption, items = [{ src, caption }], index = 0) {
    viewerItems = items;
    viewerIndex = index;
    viewerOpener = document.activeElement;
    closingViewer = false;
    dialog.classList.remove("closing");
    renderViewer();
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  function closeViewer() {
    if (closingViewer) return;
    closingViewer = true;
    dialog.classList.add("closing");
    scope.setTimeout(
      () => {
        dialog.close();
        dialog.classList.remove("closing");
        closingViewer = false;
        viewerOpener?.focus({ preventScroll: true });
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200,
    );
  }
  dialog.insertAdjacentHTML(
    "afterbegin",
    '<div class="viewer-top"><span>IMAGE EXPLORER</span><span id="viewer-position" aria-live="polite"></span></div><button class="icon-button viewer-prev" id="viewer-prev" aria-label="Previous image"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button><button class="icon-button viewer-next" id="viewer-next" aria-label="Next image"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>',
  );
  dialog.setAttribute("aria-labelledby", "dialog-caption");
  function moveViewer(direction) {
    viewerIndex =
      (viewerIndex + direction + viewerItems.length) % viewerItems.length;
    renderViewer(direction);
  }
  scope.listen($("#viewer-prev"), "click", () => moveViewer(-1));
  scope.listen($("#viewer-next"), "click", () => moveViewer(1));
  scope.listen($(".dialog-close"), "click", closeViewer);
  scope.listen(dialog, "cancel", (e) => {
    e.preventDefault();
    closeViewer();
  });
  scope.listen(dialog, "keydown", (e) => {
    if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      moveViewer(e.key === "ArrowRight" ? 1 : -1);
    }
  });
  let viewerTouch = null;
  scope.listen(
    dialog,
    "touchstart",
    (e) => {
      viewerTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true },
  );
  scope.listen(
    dialog,
    "touchend",
    (e) => {
      if (!viewerTouch) return;
      const dx = viewerTouch.x - e.changedTouches[0].clientX,
        dy = viewerTouch.y - e.changedTouches[0].clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
        moveViewer(dx > 0 ? 1 : -1);
      viewerTouch = null;
    },
    { passive: true },
  );
  scope.listen(dialog, "close", () => {
    document.body.style.overflow = "";
  });
  scope.listen(dialog, "click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        closeViewer();
    }
  });
  function observeReveals() {
    if (!("IntersectionObserver" in window)) return;
    document.body.classList.add("motion-ready");
    const observer = scope.observe(
      new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              observer.unobserve(e.target);
            }
          }),
        { threshold: 0.06 },
      ),
    );
    $$(".reveal:not(.visible)").forEach((e) => observer.observe(e));
  }
  function cardHTML(key, index) {
    const p = projectsData[key],
      n = projectNames[key];
    return `<a class="project-card reveal" href="project.html?id=${key}" aria-label="View ${escapeHTML(p.title)}"><div class="project-image"><span class="project-number">PROJECT / ${String(index + 1).padStart(2, "0")}</span><img src="${p.images[0]}" alt="${escapeHTML(p.title)} screenshot" loading="lazy" width="800" height="500"><span class="project-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></div><div class="project-meta"><h3>${n[0]}</h3><span>${escapeHTML(p.date)}</span></div><p class="project-caption">${n[1]}</p><div class="tags">${p.tags.map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div></a>`;
  }
  if ($("#about-content")) {
    $('[data-filter="all"] span').textContent = String(
      projectOrder.length,
    ).padStart(2, "0");
    $("#about-content").innerHTML = personalData.description
      .map((p) => `<p>${escapeHTML(p)}</p>`)
      .join("");
    $("#stats").innerHTML = achievementsData
      .map(
        (a) =>
          `<div class="stat"><strong>${escapeHTML(a.number).replace("+", "<span>+</span>")}</strong><small>${escapeHTML(a.description)}</small></div>`,
      )
      .join("");
    $("#experience-list").innerHTML = experienceData
      .map(
        (e, i) =>
          `<article class="experience-card reveal"><div class="experience-head"><div class="company-icon">${i === 0 ? "AG" : "MT"}</div><div class="experience-title"><h3>${escapeHTML(e.title)}</h3><a href="${e.companyUrl}" target="_blank" rel="noopener">${escapeHTML(e.company)} ↗</a></div><div class="experience-date">${i === 0 ? '<span class="current-badge">CURRENT ROLE</span>' : ""}<time>${escapeHTML(e.date)}</time><span>Karachi, Pakistan</span></div></div><div class="experience-body">${e.vendor ? '<div class="vendor-badge"><span class="status-dot"></span> Currently a vendor at EFU Life Assurance</div>' : ""}<p class="contribution">${i === 0 ? "Contributing to the New Business and Group Benefits departments." : "Contributed to the admin panel for Engro Corp."}</p><ul>${e.responsibilities
            .slice(0, 3)
            .map((r) => `<li>${escapeHTML(r)}</li>`)
            .join(
              "",
            )}</ul><details><summary>More about this role <span>+</span></summary><ul>${e.responsibilities
            .slice(3)
            .map((r) => `<li>${escapeHTML(r)}</li>`)
            .join(
              "",
            )}</ul></details><div class="tags">${(i === 0 ? ["Java", "Spring Boot", "REST & SOAP APIs", "GitHub"] : ["Angular", "Spring Boot", "MySQL", "REST APIs"]).map((t) => `<span class="tag">${t}</span>`).join("")}</div></div></article>`,
      )
      .join("");
    $("#certificate-track").innerHTML = certificatesData
      .map(
        (c, i) =>
          `<button class="certificate-card" data-certificate="${i}" aria-label="View certificate: ${escapeHTML(c.title)}"><img src="${c.image}" alt="${escapeHTML(c.alt)}" loading="lazy" width="600" height="360"><span class="certificate-info"><small>${escapeHTML(c.issuer)}<span>${escapeHTML(c.date)}</span></small><strong>${escapeHTML(c.title)}</strong><span>View certificate <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span></span></button>`,
      )
      .join("");
    $$("[data-certificate]").forEach((b) =>
      scope.listen(b, "click", () => {
        const c = certificatesData[+b.dataset.certificate];
        showImage(
          c.image,
          c.title,
          certificatesData.map((item) => ({
            src: item.image,
            caption: item.title,
          })),
          +b.dataset.certificate,
        );
      }),
    );
    const track = $("#certificate-track"),
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function scrollCertificates(direction) {
      track.scrollBy({
        left:
          direction *
          ($(".certificate-card").getBoundingClientRect().width +
            (parseFloat(getComputedStyle(track).columnGap) || 0)),
        behavior: reduced ? "instant" : "smooth",
      });
    }
    scope.listen($("#cert-prev"), "click", () => scrollCertificates(-1));
    scope.listen($("#cert-next"), "click", () => scrollCertificates(1));
    function updateCertControls() {
      $("#cert-prev").disabled = track.scrollLeft < 2;
      $("#cert-next").disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 3;
    }
    scope.listen(track, "scroll", updateCertControls, { passive: true });
    scope.listen(window, "resize", updateCertControls);
    updateCertControls();
    scope.listen(track, "keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollCertificates(e.key === "ArrowRight" ? 1 : -1);
      }
    });
    const socialIcons = [
      "fa-brands fa-github",
      "fa-brands fa-threads",
      "fa-brands fa-instagram",
      "fa-brands fa-facebook-f",
      "fa-brands fa-linkedin-in",
    ];
    $("#socials").innerHTML = personalData.socials
      .map(
        (s, i) =>
          `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.title}"><i class="${socialIcons[i]}" aria-hidden="true"></i></a>`,
      )
      .join("");
    if ("IntersectionObserver" in window) {
      const navObserver = scope.observe(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                $$("#navigation a").forEach((a) =>
                  a.classList.toggle("active", a.hash === "#" + e.target.id),
                );
              }
            }),
          { rootMargin: "-20% 0px -60% 0px" },
        ),
      );
      $$("main>section[id]")
        .filter((s) =>
          [
            "home",
            "about",
            "experience",
            "projects",
            "skills",
            "contact",
          ].includes(s.id),
        )
        .forEach((s) => navObserver.observe(s));
    }
  }
  if ($("#project-detail")) {
    const key = (new URLSearchParams(location.search).get("id")||Object.keys(projectsData).find(k=>projectsData[k].slug===decodeURIComponent(location.pathname.split('/').pop()))),
      p = Object.hasOwn(projectsData, key) ? projectsData[key] : null;
    if (!p) {
      document.title = "Project not found · Sarvech Rehmani";
      $("#project-detail").innerHTML =
        '<div class="empty-state section-wrap"><p class="eyebrow">PROJECT NOT FOUND</p><h1>Let’s find your next inspiration.</h1><p>This project link is missing or no longer available.</p><a class="button" href="index.html#projects">Explore all projects →</a></div>';
    } else {
      document.title = `${projectNames[key][0]} · ${personalData.name}`;
      $('meta[name="description"]').content = p.overview;
      const next =
        projectOrder[(projectOrder.indexOf(key) + 1) % projectOrder.length];
      $("#project-detail").innerHTML =
        `<div class="section-wrap"><section class="detail-header"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="index.html#projects">Selected work</a><span>/</span><span>${projectNames[key][0]}</span></div><p class="eyebrow">PROJECT CASE STUDY / ${projectNames[key][2].toUpperCase()}</p><h1>${escapeHTML(p.title)}</h1><p class="detail-intro">${escapeHTML(p.overview)}</p><div class="detail-meta"><div><small>DATE</small><span>${escapeHTML(p.date)}</span></div><div><small>TYPE</small><span>${escapeHTML(p.client)}</span></div><div><small>STATUS</small><span style="color:var(--success)">● ${escapeHTML(p.status)}</span></div></div></section><section class="gallery glass" aria-label="Project screenshot carousel" aria-roledescription="carousel" tabindex="0"><button class="gallery-stage" aria-label="Enlarge current project screenshot"><img id="gallery-image" src="${p.images[0]}" alt="${escapeHTML(p.title)} — screenshot 1"></button><div class="gallery-controls"><span class="gallery-status" id="gallery-status" aria-live="polite">01 / ${String(p.images.length).padStart(2, "0")}</span><span class="muted" style="font-size:10px">Click image to enlarge</span><div class="carousel-buttons"><button class="icon-button" id="gallery-prev" aria-label="Previous screenshot"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button><button class="icon-button" id="gallery-next" aria-label="Next screenshot"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div></div><div class="gallery-thumbs" role="group" aria-label="Choose project screenshot">${p.images.map((image, i) => `<button class="${i === 0 ? "active" : ""}" data-slide="${i}" aria-label="Show screenshot ${i + 1}" aria-pressed="${i === 0}"><span aria-hidden="true"></span></button>`).join("")}</div></section><div class="detail-layout"><article class="detail-body"><h2>Behind the <span class="serif">build.</span></h2><p>${formatContent(p.summary)}</p><h2>What it does</h2><ul>${renderFeatureItems(p.features)}</ul>${p.extraFeatures ? `<h2>A closer look</h2><ul>${renderFeatureItems(p.extraFeatures)}</ul>` : ""}</article><aside class="detail-aside glass"><h3>The tech stack</h3><div class="tags">${p.technologies.map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div><h3>Explore the code</h3>${Object.entries(
          p.links,
        )
          .filter(([, v]) => v && /^https:\/\//.test(v))
          .map(
            ([name, url]) =>
              `<a class="button" href="${escapeHTML(url)}" target="_blank" rel="noopener"><i class="${name === "live" ? "fa-solid fa-globe" : "fa-brands fa-github"}" aria-hidden="true"></i>${name === "live" ? "Live website" : name === "github2" ? "Frontend repository" : p.links.github2 ? "Backend repository" : "GitHub repository"} ↗</a>`,
          )
          .join(
            "",
          )}</aside></div><div class="detail-next"><div><small>UP NEXT / KEEP EXPLORING</small><h3>${projectNames[next][0]}</h3></div><a class="button" href="project.html?id=${next}">Next project <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div>`;
      let index = 0;
      function slide(i) {
        const direction = i >= index ? 1 : -1;
        index = (i + p.images.length) % p.images.length;
        $("#gallery-image").src = p.images[index];
        animateMedia($("#gallery-image"), direction);
        $("#gallery-image").alt = `${p.title} — screenshot ${index + 1}`;
        $("#gallery-status").textContent =
          `${String(index + 1).padStart(2, "0")} / ${String(p.images.length).padStart(2, "0")}`;
        $$("[data-slide]").forEach((b) => {
          const active = +b.dataset.slide === index;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });
      }
      scope.listen($("#gallery-prev"), "click", () => slide(index - 1));
      scope.listen($("#gallery-next"), "click", () => slide(index + 1));
      $$("[data-slide]").forEach((b) =>
        scope.listen(b, "click", () => slide(+b.dataset.slide)),
      );
      if (p.images.length === 1) {
        $("#gallery-prev").disabled = true;
        $("#gallery-next").disabled = true;
      }
      let suppressGalleryClickUntil = 0;
      scope.listen($(".gallery-stage"), "click", () => {
        if (Date.now() < suppressGalleryClickUntil) return;
        showImage(
          p.images[index],
          p.title,
          p.images.map((src, i) => ({
            src,
            caption: `${p.title} — screenshot ${i + 1}`,
          })),
          index,
        );
      });
      scope.listen($(".gallery"), "keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          slide(index + (e.key === "ArrowRight" ? 1 : -1));
        }
      });
      let touchStart = null;
      scope.listen(
        $(".gallery-stage"),
        "touchstart",
        (e) => {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        },
        { passive: true },
      );
      scope.listen(
        $(".gallery-stage"),
        "touchend",
        (e) => {
          if (touchStart !== null) {
            const diff = touchStart.x - e.changedTouches[0].clientX,
              vertical = touchStart.y - e.changedTouches[0].clientY;
            if (Math.abs(diff) > 45 && Math.abs(diff) > Math.abs(vertical)) {
              slide(index + (diff > 0 ? 1 : -1));
              suppressGalleryClickUntil = Date.now() + 500;
            }
            touchStart = null;
          }
        },
        { passive: true },
      );
    }
  }
  let ticking = false;
  scope.listen(
    window,
    "scroll",
    () => {
      if (!ticking) {
        scope.requestAnimationFrame(() => {
          const range = document.documentElement.scrollHeight - innerHeight;
          $(".reading-progress").style.width =
            `${range > 0 ? (scrollY / range) * 100 : 0}%`;
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
  observeReveals();
  /* Layout composition and motion. All content remains driven by data.js. */
  (() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const loader = document.createElement("div");
    loader.className = "site-loader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML =
      '<div class="loader-content"><span class="loader-kicker">JAVA / FULL-STACK / CREATIVE THINKING</span><div class="loader-word">SARVECH<br><span class="outlined-name">REHMANI</span><b class="loader-dot">.</b></div><div class="loader-track"><i></i></div><div class="loader-footer"><span>BRINGING IDEAS TO LIFE</span><span class="loader-spinner">✳</span></div></div>';
    const internalNavigation =
      document.documentElement.classList.contains("page-arriving");
    const showLoader=document.documentElement.dataset.loaderEnabled!=='false';
    if (!internalNavigation&&showLoader) document.body.prepend(loader);
    let didEnter = false;
    function enter() {
      if (didEnter) return;
      didEnter = true;
      document.documentElement.classList.remove("booting");
      document.body.classList.add("page-entered");
      loader.classList.add("loaded");
      scope.setTimeout(() => loader.remove(), reduceMotion.matches ? 0 : 850);
      observeReveals();
    }
    // A short branded intro; the progress line is decorative, never a fake download percentage.
    // Let the entrance finish and wait for page resources before sliding away.
    const introReady = new Promise((resolve) =>
      scope.setTimeout(
        resolve,
        internalNavigation || !showLoader || reduceMotion.matches ? 0 : 1600,
      ),
    );
    const pageReady =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) =>
            scope.listen(window, "load", resolve, { once: true }),
          );
    if (internalNavigation||!showLoader) {
      enter();
      scope.setTimeout(
        () => document.documentElement.classList.remove("page-arriving"),
        600,
      );
    } else Promise.all([introReady, pageReady]).then(enter);
    scope.listen(window, "pageshow", (e) => {
      if (e.persisted) enter();
    });
    // Navigation labels and a compact, framed tech identity.
    // SR brand mark is defined in the page markup.
    const role = $(".hero-role");
    if (role) {
      role.setAttribute(
        "aria-label",
        "Java Developer, Spring Boot Developer, Angular Developer",
      );
      role.innerHTML =
        '<span class="role-line" aria-hidden="true"></span><span class="typed-role" aria-hidden="true">Java Developer</span><span class="typing-caret" aria-hidden="true"></span>';
      const output = $(".typed-role", role),
        roles = personalData.roles?.length?personalData.roles:[personalData.specialization||personalData.name];
      let word = 0,
        letter = roles[0].length,
        deleting = true,
        timer;
      function type() {
        if (reduceMotion.matches) {
          output.textContent = roles[0];
          return;
        }
        if (document.hidden) {
          timer = scope.setTimeout(type, 500);
          return;
        }
        const text = roles[word];
        letter += deleting ? -1 : 1;
        output.textContent = text.slice(0, letter);
        let delay = deleting ? 42 : 85;
        if (!deleting && letter === text.length) {
          deleting = true;
          delay = 1800;
        } else if (deleting && letter === 0) {
          deleting = false;
          word = (word + 1) % roles.length;
          delay = 350;
        }
        timer = scope.setTimeout(type, delay);
      }
      timer = scope.setTimeout(type, 2800);
      scope.listen(window, "pagehide", () => clearTimeout(timer));
    }
    const art = $(".hero-art");
    if (art) {
      art.insertAdjacentHTML(
        "afterbegin",
        '<div class="tech-orbit orbit-a" aria-hidden="true"></div><div class="tech-orbit orbit-b" aria-hidden="true"></div><span class="floating-code" aria-hidden="true">{ build: "with purpose" }</span>',
      );
    }
    const ribbon = $(".tech-ribbon");
    if (ribbon) {
      const toolkit = [
        ["fa-brands fa-java", "Java"],
        ["fa-solid fa-leaf", "Spring Boot"],
        ["fa-brands fa-angular", "Angular"],
        ["fa-solid fa-database", "MySQL"],
        ["fa-solid fa-code", "TypeScript"],
        ["fa-solid fa-code-branch", "Git / GitHub"],
        ["fa-solid fa-link", "REST APIs"],
        ["fa-solid fa-wind", "Tailwind CSS"],
      ];
      const group = () =>
        toolkit
          .map(
            ([icon, name]) =>
              `<span class="ribbon-item"><i class="${icon}" aria-hidden="true"></i>${name}<b aria-hidden="true">✳</b></span>`,
          )
          .join("");
      ribbon.innerHTML = `<div class="ribbon-label"><span class="status-dot"></span> MY EVERYDAY TOOLKIT</div><div class="ribbon-window"><div class="ribbon-flow"><div class="ribbon-group">${group()}</div><div class="ribbon-group" aria-hidden="true">${group()}</div></div></div><button class="ribbon-pause icon-button" aria-label="Pause toolkit animation"><i class="fa-solid fa-pause" aria-hidden="true"></i></button>`;
      let ribbonPaused = reduceMotion.matches;
      const pause = $(".ribbon-pause");
      function setRibbon() {
        ribbon.classList.toggle("paused", ribbonPaused);
        pause.setAttribute(
          "aria-label",
          ribbonPaused ? "Play toolkit animation" : "Pause toolkit animation",
        );
        pause.innerHTML = `<i class="fa-solid fa-${ribbonPaused ? "play" : "pause"}" aria-hidden="true"></i>`;
      }
      setRibbon();
      scope.listen(pause, "click", () => {
        ribbonPaused = !ribbonPaused;
        setRibbon();
      });
    }
    const about = $(".about-grid");
    if (about) {
      const photo = document.createElement("div");
      photo.className = "about-portrait reveal";
      photo.innerHTML =
        '<div class="panel-top"><span><i></i><i></i><i></i></span><span>THE HUMAN BEHIND THE CODE</span></div><div class="about-photo"><img src="https://frvajnaukzkhcwzmarel.supabase.co/storage/v1/object/public/portfolio/site/d4a79a9f80918cd4-profile.avif" alt="Sarvech Rehmani, Java and full-stack developer" loading="lazy"><div class="photo-caption"><span>KARACHI, PK</span><strong>Curious mind.<br>Builder’s mindset.</strong><span class="photo-cross">+</span></div></div><div class="photo-bottom"><span>SARVECH REHMANI</span><i class="fa-solid fa-fingerprint" aria-hidden="true"></i></div>';
      about.prepend(photo);
      $(".about-copy h3").innerHTML =
        "I connect the dots<br>between <span>ideas and execution.</span>";
      $(".about-copy").insertAdjacentHTML(
        "afterbegin",
        '<span class="file-label"><i class="fa-regular fa-file-code" aria-hidden="true"></i> About me</span>',
      );
      $(".about-copy").insertAdjacentHTML(
        "beforeend",
        '<div class="about-principles"><span><i class="fa-solid fa-check" aria-hidden="true"></i> Clear intent</span><span><i class="fa-solid fa-check" aria-hidden="true"></i> Reliable systems</span><span><i class="fa-solid fa-check" aria-hidden="true"></i> Continuous learning</span></div>',
      );
    }
    $$(".experience-card").forEach((card, i) => {
      const date = $(".experience-date", card);
      date.classList.add("career-date");
      card.prepend(date);
      $(".current-badge", date)?.remove();
      date.insertAdjacentHTML(
        "afterbegin",
        `<span class="chapter-index">0${experienceData.length - i}</span>`,
      );
      date.insertAdjacentHTML(
        "beforeend",
        `<span class="chapter-status">${i === 0 ? "CURRENT CHAPTER" : "PREVIOUS CHAPTER"}</span>`,
      );
      const title = $(".experience-title", card);
      title.innerHTML = `<h3><a href="${experienceData[i].companyUrl}" target="_blank" rel="noopener">${escapeHTML(experienceData[i].company)}</a></h3><p>${escapeHTML(experienceData[i].title)}</p>`;
    });
    const scrollLink = $(".hero-bottom a");
    if (scrollLink)
      scrollLink.innerHTML =
        '<span class="scroll-mouse" aria-hidden="true"><span></span></span> SCROLL TO EXPLORE';
    const education = $(".education-card");
    if (education) {
      const section = document.createElement("section");
      section.id = "education";
      section.className = "section-wrap section-space";
      section.innerHTML =
        '<div class="section-heading reveal"><div><p class="eyebrow">05 / THE FOUNDATION</p><h2>Learning never stops.<br><span class="serif">This is where it started.</span></h2></div><p class="section-aside">A strong foundation.<br>A lifelong curiosity.</p></div>';
      $("#experience").after(section);
      section.append(education);
      education.innerHTML =
        '<div class="degree-art" aria-hidden="true"><div class="degree-orbit"></div><i class="fa-solid fa-graduation-cap"></i><span>CLASS OF<br><b>2023</b></span></div><div class="degree-copy"><div class="eyebrow">JANUARY 2020 — DECEMBER 2023</div><h3>Bachelor of Science <br>in Computer Science</h3><a href="https://www.usindh.edu.pk/" target="_blank" rel="noopener">University of Sindh <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a><p>Jamshoro, Sindh, Pakistan</p><div class="degree-tags"><span>COMPUTER SCIENCE</span><span>UNDERGRADUATE DEGREE</span></div></div><div class="degree-score"><span>ACADEMIC RESULT</span><strong>3.7<span>/4.00</span></strong><span class="score-label">CUMULATIVE GPA</span><div class="score-bars" aria-hidden="true">' +
        "<i></i>".repeat(20) +
        "</div></div>";
      $("#education .section-heading .eyebrow").textContent =
        "03 / THE FOUNDATION";
      $("#skills .eyebrow").textContent = "04 / TECHNICAL SKILLS";
      $("#projects .eyebrow").textContent = "05 / SELECTED WORK";
      $("#certificates .eyebrow").textContent = "06 / ALWAYS EVOLVING";
    }
    function enhanceProjects() {
      $$(".project-card").forEach((card, i) => {
        if (card.dataset.enhanced) return;
        card.dataset.enhanced = "true";
        const id = new URL(card.href).searchParams.get("id"),
          project = projectsData[id];
        const image = $(".project-image", card);
        image.insertAdjacentHTML(
          "afterbegin",
          '<span class="project-browser"><i></i><i></i><i></i><span>PROJECT SHOWCASE</span></span>',
        );
        const body = document.createElement("div");
        body.className = "project-content";
        body.insertAdjacentHTML(
          "beforeend",
          `<div class="project-category">${escapeHTML(projectNames[id][2])} / ${escapeHTML(project.date)}</div>`,
        );
        [...card.children]
          .filter((el) => el !== image)
          .forEach((el) => body.append(el));
        card.append(body);
        $(".project-caption", card).textContent = project.overview
          .replace(project.title, "")
          .trim()
          .replace(/^SyncBox is arobust/, "SyncBox is a robust");
        body.insertAdjacentHTML(
          "beforeend",
          '<div class="project-open"><span>Explore the project</span><span class="open-circle"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span></div>',
        );
        card.style.setProperty("--stagger", `${(i % 2) * 100}ms`);
      });
      observeReveals();
    }
    enhanceProjects();
    scope.listen(document, "projects-rendered", enhanceProjects);
    const track = $("#certificate-track");
    if (track) {
      $$(".certificate-card").forEach((card, i) => {
        card.insertAdjacentHTML(
          "afterbegin",
          `<span class="cert-top"><i class="fa-solid fa-award" aria-hidden="true"></i><span>CERTIFICATE</span><b>${String(i + 1).padStart(2, "0")}</b></span>`,
        );
        const img = $("img", card);
        const frame = document.createElement("span");
        frame.className = "cert-image-frame";
        img.before(frame);
        frame.append(img);
      });
      const controls = document.createElement("div");
      controls.className = "cert-navigation";
      controls.innerHTML =
        '<div class="cert-position" aria-live="polite">01 <span>/ 10</span></div><div class="cert-dots" role="group" aria-label="Choose a certificate">' +
        certificatesData
          .map(
            (c, i) =>
              `<button aria-label="Go to certificate ${i + 1}" aria-pressed="${i === 0}" data-cert-dot="${i}" class="${i === 0 ? "active" : ""}"></button>`,
          )
          .join("") +
        '</div><button class="icon-button" id="cert-play" aria-label="Pause certificate autoplay"><i class="fa-solid fa-pause" aria-hidden="true"></i></button>';
      track.after(controls);
      let playing = !reduceMotion.matches,
        interacting = false,
        last = performance.now(),
        rafId;
      const autoplay = $("#cert-play");
      function playLabel() {
        autoplay.setAttribute(
          "aria-label",
          playing ? "Pause certificate autoplay" : "Play certificate autoplay",
        );
        autoplay.innerHTML = `<i class="fa-solid fa-${playing ? "pause" : "play"}" aria-hidden="true"></i>`;
      }
      playLabel();
      scope.listen(autoplay, "click", () => {
        playing = !playing;
        last = performance.now();
        playLabel();
      });
      const step = () =>
        $(".certificate-card", track).getBoundingClientRect().width +
        (parseFloat(getComputedStyle(track).columnGap) || 0);
      // Repeat the opening cards so the end flows directly into the beginning.
      const originals = $$(".certificate-card", track);
      originals.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.classList.add("certificate-loop-copy");
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        scope.listen(clone, "click", () => card.click());
        track.append(clone);
      });
      let settleTimer;
      function normalizeLoop() {
        const cycle = step() * certificatesData.length;
        if (track.scrollLeft >= cycle - 1)
          track.scrollTo({
            left: Math.max(0, track.scrollLeft - cycle),
            behavior: "instant",
          });
      }
      scope.listen(
        track,
        "scroll",
        () => {
          clearTimeout(settleTimer);
          settleTimer = scope.setTimeout(normalizeLoop, 160);
        },
        { passive: true },
      );
      scope.listen(track, "scrollend", normalizeLoop);
      function go(i) {
        track.scrollTo({
          left: i * step(),
          behavior: reduceMotion.matches ? "instant" : "smooth",
        });
        last = performance.now();
      }
      $$("[data-cert-dot]").forEach((b) =>
        scope.listen(b, "click", () => go(+b.dataset.certDot)),
      );
      scope.listen(
        track,
        "scroll",
        () => {
          const current =
            Math.max(0, Math.round(track.scrollLeft / step())) %
            certificatesData.length;
          $(".cert-position").innerHTML =
            `${String(current + 1).padStart(2, "0")} <span>/ ${String(certificatesData.length).padStart(2, "0")}</span>`;
          $$("[data-cert-dot]").forEach((b, i) => {
            b.classList.toggle("active", i === current);
            b.setAttribute("aria-pressed", String(i === current));
          });
        },
        { passive: true },
      );
      // Hover and retained button focus must not stall autoplay indefinitely.
      const region = $("#certificates");
      scope.listen(region, "click", () => {
        last = performance.now();
      });
      scope.listen(track, "pointerdown", () => {
        interacting = true;
        last = performance.now();
      });
      const release = () => {
        if (interacting) {
          interacting = false;
          last = performance.now();
        }
      };
      scope.listen(window, "pointerup", release);
      scope.listen(window, "pointercancel", release);
      scope.listen(
        track,
        "wheel",
        () => {
          last = performance.now();
        },
        { passive: true },
      );
      scope.listen(track, "keydown", () => {
        last = performance.now();
      });
      function tick(now) {
        const bounds = track.getBoundingClientRect(),
          onscreen = bounds.bottom > 0 && bounds.top < innerHeight;
        if (
          playing &&
          !interacting &&
          !dialog.open &&
          !document.hidden &&
          onscreen
        ) {
          if (now - last >= 4500) {
            const current = Math.round(track.scrollLeft / step());
            go(current + 1);
          }
        } else last = now;
        rafId = scope.requestAnimationFrame(tick);
      }
      rafId = scope.requestAnimationFrame(tick);
      scope.listen(window, "pagehide", () => cancelAnimationFrame(rafId));
      scope.listen(window, "pageshow", (event) => {
        if (event.persisted) {
          last = performance.now();
          cancelAnimationFrame(rafId);
          rafId = scope.requestAnimationFrame(tick);
        }
      });
    }
    const form = $("#contact-form");
    if (form) {
      $(".contact-copy .eyebrow").innerHTML =
        '<span class="status-dot"></span> 07 / LET’S CONNECT';
      $(".contact-copy h2").innerHTML =
        'Have an idea? <br>Let’s <span class="serif">build it.</span>';
      $(".contact-copy").insertAdjacentHTML(
        "afterbegin",
        '<span class="contact-glyph" aria-hidden="true">↗</span>',
      );
      $(".contact-copy>p:not(.eyebrow)").textContent =
        "A new project, a fresh challenge, or a simple hello. Let’s make something awesome together.";
      const heading = $("h3", form);
      heading.innerHTML =
        '<span class="form-step">01 — START SOMETHING</span>Let\'s make something <span class="accent-word">awesome</span> together!';
      for (const input of $$("input,select,textarea", form)) {
        const label = $(`label[for="${input.id}"]`, form),
          field = document.createElement("div");
        field.className = "form-field field-" + input.id;
        label.before(field);
        field.append(label, input);
      }
      form.insertAdjacentHTML(
        "afterbegin",
        '<div class="form-status-bar"><span class="status-dot"></span> INBOX OPEN <span>LET’S TALK / SR.</span></div>',
      );
      const copy = document.createElement("button");
      copy.className = "copy-email";
      copy.type = "button";
      copy.innerHTML =
        '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copy email';
      $(".contact-details").after(copy);
      scope.listen(copy, "click", async () => {
        try {
          await navigator.clipboard.writeText(personalData.email);
          copy.textContent = "Email copied ✓";
          scope.setTimeout(
            () =>
              (copy.innerHTML =
                '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copy email'),
            2200,
          );
        } catch {
          copy.textContent = personalData.email;
        }
      });
    }
    const detail = $("#project-detail");
    if (detail && $(".detail-header")) {
      const id = (new URLSearchParams(location.search).get("id")||Object.keys(projectsData).find(k=>projectsData[k].slug===decodeURIComponent(location.pathname.split('/').pop()))),
        project = projectsData[id];
      $(".detail-header h1").innerHTML =
        escapeHTML(projectNames[id][0]) + '<span class="title-dot">.</span>';
      $(".detail-header h1").insertAdjacentHTML(
        "afterend",
        `<p class="detail-subtitle">${escapeHTML(projectNames[id][1])}</p>`,
      );
      $(".detail-header .eyebrow").innerHTML =
        '<span class="status-dot"></span> CASE STUDY / ' +
        escapeHTML(projectNames[id][2].toUpperCase());
      const gallery = $(".gallery");
      gallery.insertAdjacentHTML(
        "afterbegin",
        '<div class="gallery-browser"><span><i></i><i></i><i></i></span><span>' +
          escapeHTML(projectNames[id][0]) +
          '.preview</span><span><i class="fa-solid fa-expand" aria-hidden="true"></i> INTERFACE GALLERY</span></div>',
      );
      $(".detail-layout").insertAdjacentHTML(
        "beforebegin",
        '<div class="case-divider"><span>THE THINKING. THE STACK. THE DETAILS.</span><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></div>',
      );
      $$(".detail-body>h2").forEach((h, i) =>
        h.insertAdjacentHTML(
          "beforebegin",
          `<div class="case-label">0${i + 1} / ${["OVERVIEW", "FEATURES", "DETAILS"][i] || "DETAILS"}</div>`,
        ),
      );
      const body = $(".detail-body");
      const featureList = $$(".detail-body>ul")[0];
      if (featureList) {
        featureList.classList.add("feature-list");
      }
      $(".detail-aside").insertAdjacentHTML(
        "afterbegin",
        '<div class="aside-heading"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> BUILD NOTES</div>',
      );
      $$(
        ".detail-header,.gallery,.detail-body,.detail-aside,.detail-next",
      ).forEach((el) => el.classList.add("reveal"));
      // Main carousel can be played or paused; manual interactions reset its cadence.
      if (project.images.length > 1) {
        let active = !reduceMotion.matches,
          lastSlide = performance.now();
        const play = document.createElement("button");
        play.className = "icon-button";
        play.setAttribute(
          "aria-label",
          active ? "Pause project slideshow" : "Play project slideshow",
        );
        play.innerHTML = `<i class="fa-solid fa-${active ? "pause" : "play"}" aria-hidden="true"></i>`;
        $(".gallery-controls .carousel-buttons").prepend(play);
        scope.listen(play, "click", () => {
          active = !active;
          lastSlide = performance.now();
          play.setAttribute(
            "aria-label",
            active ? "Pause project slideshow" : "Play project slideshow",
          );
          play.innerHTML = `<i class="fa-solid fa-${active ? "pause" : "play"}" aria-hidden="true"></i>`;
        });
        scope.listen(gallery, "pointerdown", () => {
          lastSlide = performance.now();
        });
        const slideshow = scope.setInterval(() => {
          if (
            active &&
            !reduceMotion.matches &&
            !document.hidden &&
            !dialog.open &&
            performance.now() - lastSlide > 4200
          ) {
            $("#gallery-next").click();
            lastSlide = performance.now();
          }
        }, 500);
        scope.listen(window, "pagehide", () => clearInterval(slideshow));
      }
    }
    const technologyIcons = {
      Java: "fa-brands fa-java",
      Spring: "fa-solid fa-leaf",
      "Spring Boot": "fa-solid fa-power-off",
      Angular: "fa-brands fa-angular",
      TypeScript: "fa-solid fa-code",
      JavaScript: "fa-brands fa-js",
      HTML5: "fa-brands fa-html5",
      CSS3: "fa-brands fa-css3-alt",
      "Tailwind CSS": "fa-solid fa-wind",
      Bootstrap: "fa-brands fa-bootstrap",
      MySQL: "fa-solid fa-database",
      "Git / GitHub": "fa-brands fa-github",
      "VS Code": "fa-solid fa-code",
      Photoshop: "fa-solid fa-pen-nib",
    };
    $$(".skill-category .tag").forEach((tag) => {
      const name = tag.textContent;
      tag.innerHTML = `<i class="${technologyIcons[name] || "fa-solid fa-cube"}" aria-hidden="true"></i><span>${escapeHTML(name)}</span>`;
    });
    // Animate career statistics once when they enter the viewport.
    if ("IntersectionObserver" in window) {
      const counters = scope.observe(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              counters.unobserve(entry.target);
              if (reduceMotion.matches) return;
              const target = Number(entry.target.dataset.value),
                start = performance.now(),
                decimal = String(target).includes(".");
              function count(now) {
                const progress = Math.min(1, (now - start) / 1200),
                  value = target * (1 - Math.pow(1 - progress, 3));
                entry.target.innerHTML = `${decimal ? value.toFixed(1) : Math.round(value)}<span>+</span>`;
                if (progress < 1) scope.requestAnimationFrame(count);
              }
              scope.requestAnimationFrame(count);
            }),
          { threshold: 0.5 },
        ),
      );
      $$(".stat strong").forEach((el) => {
        el.dataset.value = parseFloat(el.textContent);
        counters.observe(el);
      });
    }
    observeReveals();
  })();
}

