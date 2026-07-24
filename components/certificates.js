import { certificatesData } from "./models/Data.js";

// ================================================================
//  2.  WEB COMPONENT  –  renders certificates from data
// ================================================================
class MyCertificates extends HTMLElement {
  connectedCallback() {
    // Build certificate figure HTML
    const certificatesHTML = certificatesData
      .map((cert) => {
        return `
          <figure class="col-12 col-md-6 gallery__item grid-item animate-card-2"
                  style="position: relative"
                  itemprop="associatedMedia"
                  itemscope itemtype="http://schema.org/ImageObject">
            <a href="${cert.image}"
               data-image="${cert.image}"
               class="gallery__link position-relative"
               itemprop="contentUrl"
               data-size="1080x720">
              <img src="${cert.image}"
                   class="gallery__image"
                   itemprop="thumbnail"
                   alt="${cert.alt}" />
              <div class="certificate-overlay"></div>
            </a>
            <figcaption class="gallery__descr" itemprop="caption description">
              <h6>${cert.title}</h6>
              <div class="card__tags d-flex flex-wrap">
                <span class="rounded-tag">${cert.date}</span>
                <span class="rounded-tag">${cert.issuer}</span>
              </div>
              <p class="small">${cert.description}</p>
            </figcaption>
          </figure>
        `;
      })
      .join("");

    // Complete template
    this.outerHTML = `
      <!-- Certificates Heading Start -->
      <div class="content__block">
        <div class="section-h3 section-h3-grid">
          <h3 class="h3__title animate-in-up">Certificates</h3>
        </div>
      </div>
      <!-- Certificates Heaeding End -->
      <div
        class="content__block grid-block block-large"
        style="margin-bottom: 50px"
      >
        <div class="content__block grid-block block-large" style="margin-bottom: 50px">
          <!-- Certificates Start -->
          <div class="content__block grid-block">
            <div class="container-fluid px-0 inner__gallery">
              <div class="row gx-0 my-gallery-certificate"
                  itemscope itemtype="http://schema.org/ImageGallery">
                ${certificatesHTML}
              </div>
            </div>
          </div>
        </div>
      </div>

      
    `;
  }
}

customElements.define("my-certificates", MyCertificates);

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
initPhotoSwipeFromDOM(".my-gallery-certificate");



