import { personalData } from "./models/Data.js";
class MyAbout extends HTMLElement {
  connectedCallback() {
    // Build description paragraphs
    const descHTML = personalData.description
      .map((text) => `<p class="about-descr__text animate-in-up">${text}</p>`)
      .join('');

    // Build info items
    const infoHTML = `
      <div class="about-info__item animate-in-up">
        <h6>
          <small class="top">Name</small>
          ${personalData.name}
        </h6>
      </div>
      <div class="about-info__item animate-in-up">
        <h6>
          <small class="top">Phone</small>
          <a class="text-link-bold" href="tel:${personalData.phone}">${personalData.phone}</a>
        </h6>
      </div>
      <div class="about-info__item animate-in-up">
        <h6>
          <small class="top">Email</small>
          <a class="text-link-bold" href="mailto:${personalData.email}?subject=Message%20from%20Portfolio%20site">${personalData.email}</a>
        </h6>
      </div>
      <div class="about-info__item animate-in-up">
        <h6>
          <small class="top">Location</small>
          <a class="text-link-bold" href="${personalData.locationMap}" target="_blank">${personalData.location}</a>
        </h6>
      </div>
    `;

    // Complete template
    this.outerHTML = `
      <div class="content__block grid-block block-large">
        <div class="container-fluid p-0">
          <div class="row g-0 justify-content-between">
            <!-- About Me Description Start -->
            <div class="col-12 col-xl-8 grid-item about-descr">
              ${descHTML}
              <div class="btn-group about-descr__btnholder animate-in-up">
                <a class="btn mobile-vertical btn-default btn-hover btn-hover-accent"
                   href="${personalData.resumeLink}"
                   target="_blank">
                  <span class="btn-caption">Download CV</span>
                  <i class="ph-bold ph-download-simple"></i>
                </a>
              </div>
            </div>
            <!-- About Me Description End -->

            <!-- About Me Information Start -->
            <div class="col-12 col-xl-4 grid-item about-info">
              ${infoHTML}
            </div>
            <!-- About Me Information End -->
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('my-about', MyAbout);