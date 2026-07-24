import { educationData } from "./models/Data.js";
class MyEducation extends HTMLElement {
  connectedCallback() {
    // Build education items HTML
    const educationHTML = educationData
      .map((edu) => {
        // Build title with CGPA if provided
        const titleWithCgpa = edu.cgpa
          ? `${edu.degree} <span>(CGPA: ${edu.cgpa})</span>`
          : edu.degree;

        return `
          <div class="row g-0 resume-lines__item animate-in-up">
            <div class="col-12 col-md-8">
              <h5 class="resume-lines__title animate-in-up">
                ${titleWithCgpa}
              </h5>
              <p class="resume-lines__source animate-in-up">
                From :
                <a href="${edu.institutionUrl}" class="text-link-bold" target="_blank">
                  ${edu.institution}
                </a>
              </p>
            </div>

            <div class="col-12 col-md-4">
              <p class="small resume-lines__descr animate-in-up" style="font-style: italic;">
                ${edu.date}
              </p>
              <p class="small resume-lines__descr animate-in-up" style="font-style: italic;">
                ${edu.location}
              </p>
            </div>
          </div>
        `;
      })
      .join('');

    // Complete template – wrap in container
    this.outerHTML = `
    <div class="content__block block-large" style="margin-bottom: 50px">
        <!-- H3 Block Start -->
        <div class="section-h3">
            <h3 class="h3__title animate-in-up">My education</h3>
        </div>
        <div class="container-fluid p-0 resume-lines">
            ${educationHTML}
        </div>
    </div>
    `;
  }
}

customElements.define('my-education', MyEducation);