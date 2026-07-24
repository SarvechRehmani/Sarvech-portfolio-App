import { favSkillsData } from "./models/Data.js";

class MyFavSkills extends HTMLElement {
  connectedCallback() {
    // Build skill card HTML
    const skillsHTML = favSkillsData
      .map(
        (skill) => `
        <div class="tools-cards__item d-flex grid-item-s animate-card-5">
          <div class="tools-cards__card">
            <img
              class="tools-cards__icon animate-in-up"
              src="${skill.icon}"
              alt="${skill.alt}"
            />
            <h6 class="tools-cards__caption animate-in-up">${skill.name}</h6>
          </div>
        </div>
      `,
      )
      .join("");

    // Complete template
    this.outerHTML = `
        <!-- Favourite  Skills Heading Start -->
          <div class="content__block">
            <div class="section-h3 section-h3-grid">
              <h3 class="h3__title animate-in-up">My favourite Skills</h3>
            </div>
          </div>
          <!-- Favourite  Skills Heaeding End -->
      <div class="content__block grid-block block-large">
        <!-- Tools List Start -->
        <div class="tools-cards d-flex justify-content-start flex-wrap">
          ${skillsHTML}
        </div>
        <!-- Tools List End -->
      </div>
    `;
  }
}

customElements.define("my-fav-skills", MyFavSkills);
