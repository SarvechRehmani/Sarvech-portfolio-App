import { achievementsData } from "./models/Data.js";
class MyAchievements extends HTMLElement {
  connectedCallback() {
    // Build achievement items HTML
    const itemsHTML = achievementsData
      .map((item) => `
        <div class="achievements__item d-flex flex-column grid-item animate-card-3">
          <div class="achievements__card">
            <p class="achievements__number">${item.number}</p>
            <p class="achievements__descr">${item.description}</p>
          </div>
        </div>
      `)
      .join('');

    // Complete template – wrap in container
    this.outerHTML = `
      <div class="content__block grid-block">
        <div class="achievements d-flex flex-column flex-md-row align-items-md-stretch">
          ${itemsHTML}
        </div>
      </div>
    `;
  }
}

customElements.define('my-achievements', MyAchievements);