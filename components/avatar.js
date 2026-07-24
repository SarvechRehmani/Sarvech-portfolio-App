import { personalData } from "./models/Data.js";
const avatarData = personalData;
class MyAvatar extends HTMLElement {
  connectedCallback() {
    // ---- build social icons ----
    const socialsHTML = avatarData.socials
      .map(
        (s) => `
            <li class="socials-square__item">
              <a class="socials-square__link btn" href="${s.url}" target="_blank" title="${s.title}">
                <i class="${s.icon}"></i>
              </a>
            </li>`,
      )
      .join("");

    // ---- render the complete template ----
    this.outerHTML = `
      <div id="avatar" class="avatar">
          <div class="avatar__container d-flex flex-column justify-content-lg-between">
            <!-- image + logo -->
            <div class="avatar__block">
              <div class="avatar__logo d-flex align-items-center">
                <div class="logo__image">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="85" height="85"
                    viewBox="0 0 85 85">
                      <defs>
                        <linearGradient
                          id="gradientFill"
                          x1="10"
                          y1="75"
                          x2="75"
                          y2="10"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0" stop-color="var(--accent)" />
                          <stop offset="1" stop-color="var(--secondary)" />
                          </linearGradient>
                          <mask id="text-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <text
                              x="50%" y="50%"
                              font-size="50"
                              text-anchor="middle"
                              fill="black"
                              dy=".35em"
                              font-family="cursive, Brush Script MT, Comic Sans MS, sans-serif"
                            >
                              ${avatarData.initial}
                            </text>
                          </mask>
                      </defs>
                      <path
                        d="M51,0H34C15.2,0,0,15.2,0,34v17c0,14.3,8.9,26.6,21.4,31.6C25.3,84.1,29.5,85,34,85h17
                        c6,0,11.7-1.6,16.6-4.3C78.1,74.6,85,63.6,85,51V34C85,15.2,69.8,0,51,0z"
                        fill="url(#gradientFill)"
                        mask="url(#text-mask)"
                      />
                  </svg>
                </div>
                <div class="logo__caption">
                  <p>${avatarData.nameWithBreak}</p>
                </div>
              </div>
              <div class="avatar__image">
                <img id="avatar-image" src="${avatarData.imageSrc}" alt="${avatarData.imageAlt}" />
              </div>
            </div>
            <!-- specialization -->
            <div class="avatar__block">
              <h6>
                  <small class="top">Specialization:</small>
                  ${avatarData.specialization}
              </h6>
            </div>
            <!-- based in -->
            <div class="avatar__block">
              <h6>
                <small class="top">Based in:</small>
                ${avatarData.location}
              </h6>
            </div>
            <!-- socials + CTA -->
              <div class="avatar__block">
                  <div class="avatar__socials">
                    <ul class="socials-square d-flex justify-content-between">
                      ${socialsHTML}
                    </ul>
                  </div>
              <div class="avatar__btnholder">
                <a 
                  class="btn btn-default btn-fullwidth btn-hover btn-hover-accent" 
                  href="${avatarData.cta.href}"
                  target="${avatarData.cta.target}"
                >
                  <span class="btn-caption">${avatarData.cta.text}</span>
                </a>
              </div>
            </div>
        </div>
    </div>`;
  }
}

customElements.define("my-avatar", MyAvatar);
