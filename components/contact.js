import {personalData} from "./models/Data.js";
// const personalData = personalDatas;
class MyContact extends HTMLElement {
  connectedCallback() {
    // Build social cards HTML
    const socialsHTML = personalData.socials
      .map(
        (s) => `
        <div class="socials-cards__item d-flex grid-item-s">
            <div class="socials-cards__card">
                <i class="${s.icon}"></i>
                <a class="socials-cards__link" href="${s.url}" target="_blank" title="${s.title}"></a>
            </div>
        </div>`,
      )
      .join("");

    // Contact lines (location, phone, email)
    const linesHTML = `
                    <div class="col-12 col-md-4 contact-lines__data">
                        <p class="contact-lines__title">Location</p>
                        <p class="contact-lines__text">
                            <a class="text-link-bold" href="${personalData.locationMap}" target="_blank">${personalData.location}</a>
                        </p>
                    </div>
                    <div class="col-12 col-md-4 contact-lines__data">
                        <p class="contact-lines__title">Phone</p>
                        <p class="contact-lines__text">
                            <a class="text-link-bold" href="tel:${personalData.phone.replace(/\s/g, "")}">${personalData.phone}</a>
                        </p>
                    </div>
                    <div class="col-12 col-md-4 contact-lines__data">
                        <p class="contact-lines__title">Email</p>
                        <p class="contact-lines__text">
                            <a class="text-link-bold" href="mailto:${personalData.email}?subject=Message%20from%20Portfolio">${personalData.email}</a>
                        </p>
                    </div>
                `;

    // Teaser with mailto link
    const teaserHTML = `
                    <p class="teaser__text">
                        ${personalData.teaser}
                        <a class="text-link-bold" href="mailto:${personalData.email}?subject=Message%20from%20Portfolio">Drop me a line</a>
                        and I'll get back as soon as possible.
                    </p>
                `;

    this.outerHTML = `
                    <section id="contact" class="inner contact">
                        <!-- heading -->
                        <div class="content__block section-title">
                            <p class="h2__subtitle">
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="13px" height="13px" viewBox="0 0 13 13" fill="currentColor">
                                    <path fill="currentColor" d="M5.6,12.6c-0.5-0.8-0.7-2.4-1.7-3.5c-1-1-2.7-1.2-3.5-1.7C-0.1,7-0.1,6,0.4,5.6c0.8-0.5,2.3-0.6,3.5-1.8
                                    C5,2.8,5.1,1.2,5.6,0.4C6-0.1,7-0.1,7.4,0.4c0.5,0.8,0.7,2.4,1.8,3.5c1.2,1.2,2.6,1.2,3.5,1.7c0.6,0.4,0.6,1.4,0,1.7
                                    C11.8,7.9,10.2,8,9.1,9.1c-1,1-1.2,2.7-1.7,3.5C7,13.1,6,13.1,5.6,12.6z"/>
                                </svg>
                                <span>Contact</span>
                            </p>
                            <h2 class="h2__title">Let's make something awesome together!</h2>
                        </div>

                        <!-- contact form -->
                        <div class="content__block grid-block block-grid-large">
                            <div class="form-container">
                                <form class="form contact-form" id="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
                                    <div class="container-fluid p-0">
                                        <div class="row gx-0">
                                            <div class="col-12 col-md-6 form__item">
                                                <input type="text" name="Name" placeholder="Your Name*" required />
                                            </div>
                                            <div class="col-12 col-md-6 form__item">
                                                <input type="text" name="Company" placeholder="Company Name" />
                                            </div>
                                            <div class="col-12 col-md-6 form__item">
                                                <input type="email" name="E-mail" placeholder="Email Adress*" required />
                                            </div>
                                            <div class="col-12 col-md-6 form__item">
                                                <input type="tel" name="Phone" placeholder="Phone Number*" required />
                                            </div>
                                            <div class="col-12 form__item">
                                                <textarea name="Message" placeholder="A Few Words*" required></textarea>
                                            </div>
                                            <div class="col-12 form__item">
                                               <button
                        class="btn btn-default btn-hover btn-hover-accent"
                        type="submit"
                      >
                        <span class="btn-caption">Send Message</span>
                        <i class="ph-bold ph-paper-plane-tilt"></i>
                      </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- socials cards -->
                        <div class="content__block grid-block">
                            <div class="socials-cards d-flex justify-content-start flex-wrap">
                                ${socialsHTML}
                            </div>
                        </div>

                        <!-- teaser -->
                        <div class="content__block">
                            <div class="teaser">
                                ${teaserHTML}
                            </div>
                        </div>

                        <!-- contact data -->
                        <div class="content__block">
                            <div class="container-fluid p-0 contact-lines">
                                <div class="row g-0 contact-lines__item">
                                    ${linesHTML}
                                </div>
                            </div>
                        </div>
                    </section>
                `;
  }
}

customElements.define("my-contact", MyContact);


 // --------------------------------------------- //
  // Contact Form Start
  // --------------------------------------------- //

  const form = document.getElementById("contact-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(formData).toString(),
    });
    document.querySelector(".contact .form").classList.add("is-hidden");
    document.querySelector(".contact .form__reply").classList.add("is-visible");
    setTimeout(() => {
      document
        .querySelector(".contact .form__reply")
        .classList.remove("is-visible");
      document.querySelector(".contact .form").classList.remove("is-hidden");
      form.reset();
    }, 5000);
  });

