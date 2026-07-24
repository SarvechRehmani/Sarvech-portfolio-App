import { servicesData } from "./models/Data.js";
class MyServices extends HTMLElement {
  connectedCallback() {
    // Build service cards HTML
    const servicesHTML = servicesData
      .map((service) => {
        // Build tags
        const tagsHTML = service.tags
          .map((tag) => `<span class="rounded-tag tag-outline">${tag}</span>`)
          .join('');

        return `
          <div class="col-12 col-md-6 cards__item grid-item animate-card-2">
            <div class="cards__card d-flex flex-column">
              <div class="cards__descr">
                <h4 class="cards__title animate-in-up">${service.title}</h4>
                <div class="cards__tags d-flex flex-wrap animate-in-up">
                  ${tagsHTML}
                </div>
                <p class="small cards__text animate-in-up">${service.description}</p>
              </div>
              <div class="cards__image d-flex animate-in-up">
                <img src="${service.image}" alt="${service.imageAlt}" />
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Complete template – wrap in container
    this.outerHTML = `
      <div class="content__block grid-block">
        <div class="container-fluid p-0">
          <div class="row g-0 align-items-stretch cards">
            ${servicesHTML}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('my-services', MyServices);