document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".carousel");
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dot")];
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");

  if (!carousel || !slides.length) return;

  let currentSlide = 0;
  let isAnimating = false;
  let autoplayInterval = null;
  let touchStartX = 0;
  let touchStartTime = 0;

  const ANIMATION_DURATION = 0;
  const AUTOPLAY_DELAY = 4000;
  const SWIPE_DISTANCE = 50;
  const SWIPE_VELOCITY = 0;

  function updateSlides() {
    if (isAnimating) return;

    isAnimating = true;

    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
      slide.classList.toggle("previous", false);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentSlide);
    });

    setTimeout(() => {
      isAnimating = false;
    }, ANIMATION_DURATION);
  }

  function goToSlide(index) {
    if (isAnimating || index === currentSlide) return;

    slides[currentSlide].classList.add("previous");
    currentSlide = (index + slides.length) % slides.length;

    updateSlides();
  }

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  nextBtn?.addEventListener("click", nextSlide);
  prevBtn?.addEventListener("click", prevSlide);

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goToSlide(index));
  });

  document.addEventListener("keydown", ({ key }) => {
    if (key === "ArrowRight") nextSlide();
    else if (key === "ArrowLeft") prevSlide();
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  carousel.addEventListener(
    "touchstart",
    ({ changedTouches }) => {
      touchStartX = changedTouches[0].screenX;
      touchStartTime = performance.now();
      stopAutoplay();
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchend",
    ({ changedTouches }) => {
      const distance = touchStartX - changedTouches[0].screenX;
      const duration = performance.now() - touchStartTime;
      const velocity = Math.abs(distance / duration);

      if (
        Math.abs(distance) > SWIPE_DISTANCE ||
        velocity > SWIPE_VELOCITY
      ) {
        distance > 0 ? nextSlide() : prevSlide();
      }

      startAutoplay();
    },
    { passive: true }
  );

  slides[0].classList.add("active");
  dots[0]?.classList.add("active");
  startAutoplay();
});