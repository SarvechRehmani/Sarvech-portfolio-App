import { projectsData } from "./models/Data.js";
class MyPortfolio extends HTMLElement {
  connectedCallback() {
    const projectsHTML = Object.entries(projectsData)
      .map(([key, p]) => {
        // Build tags – all use "rounded-tag opposite"
        const tagsHTML = p.tags
          .map((tag) => `<span class="rounded-tag">${tag}</span>`)
          .join("");
        return `
                            <figure class="col-12 col-md-6 gallery__item grid-item animate-card-2"
                                    itemprop="associatedMedia"
                                    itemscope itemtype="http://schema.org/ImageObject">
                                <a href="${p.images[0]}"
                                   data-image="${p.images[0]}"
                                   class="gallery__link"
                                   itemprop="contentUrl"
                                   data-size="1080x720">
                                    <img src="${p.images[0]}"
                                         class="gallery__image"
                                         itemprop="thumbnail"
                                         alt="${p.title}" />
                                </a>
                                <figcaption class="gallery__descr" itemprop="caption description">
                                    <a href="/project.html?id=${key}" aria-label="View details for ${p.title}">
                                        <h5>${p.title}</h5>
                                    </a>
                                    <div class="card__tags d-flex flex-wrap">
                                        ${tagsHTML}
                                    </div>
                                    <p class="small">${p.overview}</p>
                                </figcaption>
                            </figure>
                        `;
      })
      .join("");

    // Complete template
    this.outerHTML = `
                    <section id="portfolio" class="inner inner-first portfolio">
                        <!-- heading -->
                        <div class="content__block section-grid-title">
                            <p class="h2__subtitle animate-in-up">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     x="0px" y="0px"
                                     width="13px" height="13px"
                                     viewBox="0 0 13 13"
                                     fill="currentColor">
                                    <path fill="currentColor"
                                          d="M5.6,12.6c-0.5-0.8-0.7-2.4-1.7-3.5c-1-1-2.7-1.2-3.5-1.7C-0.1,7-0.1,6,0.4,5.6c0.8-0.5,2.3-0.6,3.5-1.8
                                          C5,2.8,5.1,1.2,5.6,0.4C6-0.1,7-0.1,7.4,0.4c0.5,0.8,0.7,2.4,1.8,3.5c1.2,1.2,2.6,1.2,3.5,1.7c0.6,0.4,0.6,1.4,0,1.7
                                          C11.8,7.9,10.2,8,9.1,9.1c-1,1-1.2,2.7-1.7,3.5C7,13.1,6,13.1,5.6,12.6z"/>
                                </svg>
                                <span>Portfolio</span>
                            </p>
                            <h2 class="h2__title animate-in-up">Check out my featured projects</h2>
                        </div>

                        <!-- projects grid -->
                        <div class="content__block grid-block">
                            <div class="container-fluid px-0 inner__gallery">
                                <div class="row gx-0 my-gallery"
                                     itemscope itemtype="http://schema.org/ImageGallery">
                                    ${projectsHTML}
                                </div>
                            </div>
                        </div>
                    </section>
                    
                `;
  }
}

customElements.define("my-portfolio", MyPortfolio);

// ------------------------------------------------
// PhotoSwipe Gallery Init
// ------------------------------------------------

const initPhotoSwipeFromDOM = (gallerySelector) => {
  const parseThumbnailElements = (gallery) => {
    return [...gallery.children].map((figure) => {
      const link = figure.querySelector("a");
      const [width, height] = link.dataset.size.split("x");

      const item = {
        src: link.href,
        w: Number(width),
        h: Number(height),
        el: figure,
      };

      const caption = figure.querySelector("figcaption");
      if (caption) {
        item.title = caption.innerHTML;
      }

      const img = link.querySelector("img");
      if (img) {
        item.msrc = img.src;
      }

      return item;
    });
  };

  const closest = (element, selector) => {
    return element.closest(selector);
  };

  const photoswipeParseHash = () => {
    const hash = window.location.hash.substring(1);
    const params = {};

    if (hash.length < 5) return params;

    hash.split("&").forEach((item) => {
      const [key, value] = item.split("=");

      if (key && value) {
        params[key] = value;
      }
    });

    if (params.gid) {
      params.gid = Number(params.gid);
    }

    return params;
  };

  const openPhotoSwipe = (
    index,
    galleryElement,
    disableAnimation = false,
    fromURL = false,
  ) => {
    const pswpElement = document.querySelector(".pswp");

    const items = parseThumbnailElements(galleryElement);

    const options = {
      showHideOpacity: true,

      galleryUID: galleryElement.dataset.pswpUid,

      getThumbBoundsFn(index) {
        const thumbnail = items[index].el.querySelector("img");

        const rect = thumbnail.getBoundingClientRect();

        return {
          x: rect.left,
          y: rect.top + window.scrollY,
          w: rect.width,
        };
      },
    };

    options.index = fromURL ? Number(index) - 1 : Number(index);

    if (isNaN(options.index)) return;

    if (disableAnimation) {
      options.showAnimationDuration = 0;
      options.hideAnimationDuration = 0;
    }

    const gallery = new PhotoSwipe(
      pswpElement,
      PhotoSwipeUI_Default,
      items,
      options,
    );

    gallery.init();
  };

  const onThumbnailsClick = (event) => {
    event.preventDefault();

    const clickedFigure = closest(event.target, "figure");

    if (!clickedFigure) return;

    const gallery = clickedFigure.parentNode;

    const index = [...gallery.children].indexOf(clickedFigure);

    openPhotoSwipe(index, gallery);
  };

  const galleryElements = document.querySelectorAll(gallerySelector);

  galleryElements.forEach((gallery, index) => {
    gallery.dataset.pswpUid = index + 1;

    gallery.addEventListener("click", onThumbnailsClick);
  });

  const hashData = photoswipeParseHash();

  if (hashData.pid && hashData.gid) {
    openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
  }
};

// Initialize
initPhotoSwipeFromDOM(".my-gallery");
