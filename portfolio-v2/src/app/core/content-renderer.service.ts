import fallback from "./fallback.json";
import { Injectable, inject } from "@angular/core";
import DOMPurify from "dompurify";
import { CmsService } from "./cms.service";
@Injectable({ providedIn: "root" })
export class ContentRendererService {
  private readonly cms = inject(CmsService);
  apply() {
    const s = this.cms.snapshot(),
      p = s.profile,
      all = (selector: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector));
    const text = (selector: string, value: any) => {
      if (value !== undefined)
        all(selector).forEach((el) => {
          if (el.textContent?.trim() !== String(value).trim())
            el.textContent = String(value);
        });
    };
    const image = (selector: string, url: any) => {
      if (url && /^(https?:\/\/|assets\/)/.test(url))
        all(selector).forEach((el) => el.setAttribute("src", url));
    };
    const link = (selector: string, url: any) => {
      if (url && /^(https?:\/\/|mailto:|tel:|#|\/)/.test(url))
        all(selector).forEach((el) => el.setAttribute("href", url));
    };
    text(".brand-name", p["brand"] + (p["brand_suffix"] || ""));
    text(".about-photo .photo-bottom", p["name"]);
    text(".photo-bottom>span", String(p["name"] || "").toUpperCase());
    all(".hero h1").forEach((el) => {
      const words = String(p["hero_title"] || p["name"] || "")
        .toUpperCase()
        .split(" ");
      el.replaceChildren(
        document.createTextNode(words.shift() || ""),
        document.createElement("br"),
      );
      const span = document.createElement("span");
      span.className = "outlined-name";
      span.textContent = words.join(" ");
      const b = document.createElement("b");
      b.textContent = ".";
      el.append(span, b);
    });
    all(".loader-word").forEach((el) => {
      const parts = String(p["name"] || "")
        .toUpperCase()
        .split(" ");
      const last = parts.slice(1).join(" ");
      el.innerHTML =
        this.escape(parts[0]) +
        '<br><span class="outlined-name">' +
        this.escape(last) +
        '</span><b class="loader-dot">.</b>';
    });
    text(".hero-description", p["hero_description"]);
    image(".hero-art img,.about-photo img", p["imageSrc"]);
    text(
      ".hero-topline>span:first-child",
      "BASED IN " + String(p["location"] || "").toUpperCase(),
    );
    text(".contact-email", p["email"]);
    link(".contact-email", "mailto:" + p["email"]);
    text(".contact-details>a", p["phone"]);
    link(".contact-details>a", "tel:" + p["phone"]);
    text(".contact-details>span", p["location"]);
    const social = (title: string) =>
      (p["socials"] || []).find((v: any) => v.title.toLowerCase() === title)
        ?.url;
    link(".hero-social a:nth-child(1)", social("github"));
    link(".hero-social a:nth-child(2)", social("linkedin"));
    link(".hero-social a:nth-child(3)", "mailto:" + p["email"]);
    const jobs = s["jobs"] || [];
    all(".experience-card").forEach((card, i) => {
      const job = jobs[i];
      if (!job) return;
      const icon = card.querySelector(".company-icon");
      if (icon)
        icon.textContent = String(job.company || "")
          .split(" ")
          .map((v: string) => v[0])
          .join("")
          .slice(0, 2);
      const badge = card.querySelector(".vendor-badge");
      if (badge) badge.textContent = String(job.vendor || "");
      const contribution = card.querySelector(".contribution");
      if (contribution)
        contribution.textContent =
          job.contribution || (job.contributions || []).join(", ");
    });
    const current = jobs[0];
    if (current) {
      text(".current-role strong", current.company);
      text(".current-role p", current.vendor || current.title);
    }
    const education = all(".education-card")[0];
    if (education) {
      const entries = s["education"] || [];
      if (!entries.length) education.hidden = true;
      entries.forEach((e: any, i: number) => {
        const card =
          i === 0 ? education : (education.cloneNode(false) as HTMLElement);
        card.innerHTML = `<div class="degree-art" aria-hidden="true"><div class="degree-orbit"></div><i class="fa-solid fa-graduation-cap"></i><span>CLASS OF<br><b>${this.escape(e.year || (e.date || "").slice(-4))}</b></span></div><div class="degree-copy"><div class="eyebrow">${this.escape(e.date)}</div><h3>${this.escape(e.title || e.degree)}</h3><a href="${this.safeUrl(e.url || e.institutionUrl)}" target="_blank" rel="noopener">${this.escape(e.institution)} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a><p>${this.escape(e.location)}</p><div class="degree-tags"><span>${this.escape(e.subject || "COMPUTER SCIENCE")}</span><span>${this.escape(e.level || "UNDERGRADUATE DEGREE")}</span></div></div><div class="degree-score"><span>ACADEMIC RESULT</span><strong>${this.gpa(e.gpa || e.cgpa || "")}</strong><span class="score-label">CUMULATIVE GPA</span><div class="score-bars" aria-hidden="true">${"<i></i>".repeat(20)}</div></div>`;
        if (i > 0) {
          card.style.marginTop = "24px";
          education.parentElement?.append(card);
        }
      });
    }
    const services = all(".services")[0];
    if (services) {
      services.innerHTML = DOMPurify.sanitize(
        (s["focus_items"] || [])
          .map(
            (v: any) =>
              `<article class="service reveal visible"><i class="${this.escape(v.icon || "fa-solid fa-code")}"></i><h3>${this.escape(v.title).replace(/&lt;br\s*\/?&gt;/g, "<br>")}</h3><p>${this.escape(v.description)}</p><span>${this.escape((v.tags || []).join(" / "))}</span></article>`,
          )
          .join(""),
      );
    }
    for (const [selector, value] of Object.entries(p["site_copy"] || {})) {
      try {
        if (
          typeof value === "string" &&
          value !==
            (fallback.profile.site_copy as Record<string, string>)[selector]
        ) {
          all(selector).forEach((el) => {
            if (
              el.textContent?.replace(/\s+/g, " ").trim() !==
              value.replace(/\s+/g, " ").trim()
            )
              el.textContent = value;
          });
        } else if (value && typeof value === "object") {
          const v = value as any;
          if (v.text !== undefined) text(selector, v.text);
          if (v.href) link(selector, v.href);
          if (v.src) image(selector, v.src);
        }
      } catch {}
    }
    // Old links remain compatible; new links use canonical project slugs.
    all('a[href*="project.html?id="]').forEach((el) => {
      const id = new URL(
        el.getAttribute("href")!,
        location.href,
      ).searchParams.get("id");
      const project = (s["projects"] || []).find(
        (v: any) => (v.legacy_id || v.slug || v.id) === id,
      );
      if (project) el.setAttribute("href", "/projects/" + project.slug);
    });
  }
  private gpa(value:any){const [score,total]=String(value||'').split('/');return '<span class="gpa-value">'+this.escape(score.trim())+'</span>'+(total?'<span class="gpa-total">/ '+this.escape(total.trim())+'</span>':'');}
  private escape(value: any) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  }
  private safeUrl(url: any) {
    return /^https?:\/\//.test(url || "") ? this.escape(url) : "#";
  }
}
