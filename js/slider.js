document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  let currentSlide = 0;
  let isAnimating = false;

  function updateSlides(direction = "next") {
    if (isAnimating) return;
    isAnimating = true;

    // Remove active class from all slides first
    slides.forEach((slide) => {
      slide.classList.remove("active", "previous");
    });

    // Update dots
    dots.forEach((dot) => dot.classList.remove("active"));
    dots[currentSlide].classList.add("active");

    // Add active class to current slide
    slides[currentSlide].classList.add("active");

    setTimeout(() => {
      isAnimating = false;
    }, 1200);
  }

  function nextSlide() {
    if (isAnimating) return;
    const previousSlide = currentSlide;
    currentSlide = (currentSlide + 1) % slides.length;

    // Add previous class to the slide that's being transitioned out
    slides[previousSlide].classList.add("previous");
    updateSlides("next");
  }

  function prevSlide() {
    if (isAnimating) return;
    const previousSlide = currentSlide;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;

    // Add previous class to the slide that's being transitioned out
    slides[previousSlide].classList.add("previous");
    updateSlides("prev");
  }

  // Event listeners
  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", prevSlide);

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (isAnimating || currentSlide === index) return;
      const previousSlide = currentSlide;
      currentSlide = index;
      slides[previousSlide].classList.add("previous");
      updateSlides();
    });
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
  });

  // Auto-play with pause on hover
  let autoplayInterval;

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 4000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  document
    .querySelector(".carousel")
    .addEventListener("mouseenter", stopAutoplay);
  document
    .querySelector(".carousel")
    .addEventListener("mouseleave", startAutoplay);

  // Touch events for mobile with improved sensitivity
  let touchStartX = 0;
  let touchStartTime = 0;
  const carousel = document.querySelector(".carousel");

  carousel.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartTime = Date.now();
    stopAutoplay();
  });

  carousel.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    const touchDistance = touchStartX - touchEndX;

    // Calculate swipe velocity
    const velocity = Math.abs(touchDistance / touchDuration);

    // Adjust sensitivity based on velocity and distance
    if (velocity > 0.3 || Math.abs(touchDistance) > 50) {
      if (touchDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    startAutoplay();
  });

  // Initial setup
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
  startAutoplay();
});
