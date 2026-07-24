import { menuItems, personalData } from "./models/Data.js";
class MyHeader extends HTMLElement {
  connectedCallback() {
    const path = window.location.pathname;
    // Determine anchor prefix: home → "" , others → "/"
    const base = path === "/" ? "" : "/";
    const email = personalData.email;

    // Build the <li> list dynamically
    const menuListHTML = menuItems
      .map(
        (item) => `
          <li class="menu__item">
            <a class="menu__link btn" href="${base}${item.anchor}">
              <span class="menu__caption">${item.label}</span>
              <i class="ph-bold ${item.icon}"></i>
            </a>
          </li>`,
      )
      .join("");

    // Full header HTML (controls remain static)
    this.outerHTML = `
    <header id="header" class="header d-flex justify-content-between">
      <!-- Navigation Menu Start -->
      <div class="header__navigation">
        <nav id="menu" class="menu">
          <ul class="menu__list d-flex justify-content-start">
            ${menuListHTML}
          </ul>
        </nav>
      </div>
      <!-- Navigation Menu End -->

      <!-- Header Controls Start -->
      <div class="header__controls d-flex justify-content-end">
         <button
          id="color-switcher"
          class="color-switcher header__switcher btn"
          type="button"
          role="switch"
          aria-label="light/dark mode"
          aria-checked="true"
        ></button>
        <a
          id="notify-trigger"
          class="header__trigger btn"
          href="mailto:${email}?subject=Message%20from%20Portfolio%20site"
        >
          <span class="trigger__caption">Let's Talk</span>
          <i class="ph-bold ph-chat-dots"></i>
        </a>
      </div>
      <!-- Header Controls End -->
    </header>`;
  }
}

customElements.define("my-header", MyHeader);



// --------------------------------------------- //
// Theme Toggle Start                            //
// --------------------------------------------- //
const root = document.documentElement;

const themeBtn = document.querySelector(".color-switcher");
function getCurrentTheme() {
  return (
    localStorage.getItem("template.theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
  );
}

function loadTheme(theme) {
  themeBtn.innerHTML =
    theme === "light"
      ? `<em></em><i class="ph-bold ph-moon-stars"></i>`
      : `<em></em><i class="ph-bold ph-sun"></i>`;

  root.setAttribute("color-scheme", theme);
  setIconsForTheme(theme);
}

themeBtn.addEventListener("click", () => {
  const theme = getCurrentTheme() === "dark" ? "light" : "dark";

  localStorage.setItem("template.theme", theme);
  loadTheme(theme);
});

window.addEventListener("DOMContentLoaded", () => {
  loadTheme(getCurrentTheme());
});
