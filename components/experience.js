import { experienceData } from "./models/Data.js";

class MyExperience extends HTMLElement {
  connectedCallback() {
    // Build experience items HTML
    const experiencesHTML = experienceData
      .map((exp) => {
        // Build contributions list
        const contributionsList =
          exp.contributions
            ?.map(
              (item) => `
              <li class="mb-2 ps-4 position-relative">
                <span class="position-absolute text-primary fs-2 lh-20px start-0">•</span>
                ${item}
              </li>`,
            )
            .join("") || "";

        // Build responsibilities list
        const responsibilitiesList =
          exp.responsibilities
            ?.map(
              (item) => `
              <li class="mb-2 ps-4 position-relative">
                <span class="position-absolute text-primary fs-2 lh-20px start-0">•</span>
                ${item}
              </li>`,
            )
            .join("") || "";

        // Vendor subtitle (if any)
        const vendorHTML = exp.vendor
          ? `<h6 class="fs-3">${exp.vendor}</h6>`
          : "";

        return `
          <div class="row g-0 resume-lines__item animate-in-up">
            <div class="col-12 col-md-6">
              <h5 class="resume-lines__title animate-in-up">${exp.title}</h5>
              <p class="resume-lines__source animate-in-up">
                at
                <a href="${exp.companyUrl}" class="text-link-bold" target="_blank">${exp.company}</a>
              </p>
            </div>
            <div class="col-12 col-md-4 animate-in-up">
              <p class="small resume-lines__descranimate-in-up" style="font-style: italic;">${exp.date}</p>
              <p class="small resume-lines__descranimate-in-up" style="font-style: italic;">${exp.location}</p>
            </div>

            <div class="col-12 col-md-12 ms-5">
              <div class="col-10 ms-5">
                <div class="small resume-lines__descr animate-in-up">
                  ${vendorHTML}

                  ${
                    contributionsList
                      ? `
                    <div class="ms-5">
                      <h6 class="fs-4">Contributed in:</h6>
                      <ul class="ps-0">
                        ${contributionsList}
                      </ul>
                    </div>
                  `
                      : ""
                  }

                  <div class="animate-in-up ms-5">
                    <h6 class="fs-4">Responsibilities:</h6>
                    <ul class="ps-0">
                      ${responsibilitiesList}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Complete template – wrap in container
    this.outerHTML = `
        <!-- Experience Start -->
        <div class="content__block block-large">
            <!-- H3 Block Start -->
            <div class="section-h3">
                <h3 class="h3__title animate-in-up">Work experience</h3>
            </div>
            <!-- H3 Block End -->
            <div class="container-fluid p-0 resume-lines">
                ${experiencesHTML}
            </div>
        </div>
    `;
  }
}

customElements.define("my-experience", MyExperience);
