
// ==================================================
// CHANGE MAKER ACADEMY
// HOME PAGE JAVASCRIPT
// ==================================================

(function () {

 // ==================================================
 // MOBILE MENU
 // ==================================================

 const menuBtn = document.getElementById("menuBtn");
 const mobileMenu = document.getElementById("mobileMenu");

 if (menuBtn && mobileMenu) {

  menuBtn.addEventListener("click", () => {
   mobileMenu.classList.toggle("active");
   menuBtn.classList.toggle("active");
  });

  mobileMenu.querySelectorAll("a").forEach(link => {
   link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
    menuBtn.classList.remove("active");
   });
  });

 }


 // ==================================================
 // HOMEPAGE BANNER SLIDER
 // ==================================================

 const slides = document.querySelectorAll(".banner-slide");
 const dotsContainer = document.getElementById("bannerDots");

 const nextBtn = document.getElementById("nextBanner");
 const prevBtn = document.getElementById("prevBanner");
 const slider = document.getElementById("banner");

 if (slides.length > 0) {

  let currentSlide = 0;
  let sliderTimer = null;

  if (dotsContainer) {
   dotsContainer.innerHTML = "";

   slides.forEach((slide, index) => {
    const dot = document.createElement("button");

    dot.className = "slider-dot";
    dot.setAttribute("aria-label", "Go to slide " + (index + 1));

    dot.addEventListener("click", () => {
     showSlide(index);
     restartSlider();
    });

    dotsContainer.appendChild(dot);
   });
  }

  function showSlide(index) {

   currentSlide = (index + slides.length) % slides.length;

   slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
   });

   if (dotsContainer) {
    dotsContainer.querySelectorAll(".slider-dot").forEach((dot, i) => {
     dot.classList.toggle("active", i === currentSlide);
    });
   }
  }

  function nextSlide() {
   showSlide(currentSlide + 1);
  }

  function prevSlide() {
   showSlide(currentSlide - 1);
  }

  function restartSlider() {

   clearInterval(sliderTimer);

   if (slides.length > 1) {
    sliderTimer = setInterval(nextSlide, 5000);
   }
  }

  if (nextBtn) {
   nextBtn.addEventListener("click", () => {
    nextSlide();
    restartSlider();
   });
  }

  if (prevBtn) {
   prevBtn.addEventListener("click", () => {
    prevSlide();
    restartSlider();
   });
  }

  // MOBILE TOUCH SWIPE

  if (slider) {

   let touchStartX = 0;

   slider.addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].screenX;
   }, { passive: true });

   slider.addEventListener("touchend", event => {

    const touchEndX = event.changedTouches[0].screenX;
    const difference = touchStartX - touchEndX;

    if (Math.abs(difference) > 50) {

     if (difference > 0) {
      nextSlide();
     } else {
      prevSlide();
     }

     restartSlider();
    }

   }, { passive: true });
  }

  showSlide(0);
  restartSlider();

 }


 // ==================================================
 // EXAM PREPARATION FEATURED SLIDER
 // ==================================================

 const examTrack = document.getElementById("examFeaturedTrack");
 const examDots = document.getElementById("examSliderDots");
 const examCount = document.getElementById("examSliderCount");

 if (examTrack) {

  const examSlides = Array.from(examTrack.children);
  const totalSlides = examSlides.length;

  function updateExamSlider() {

   if (totalSlides === 0) return;

   const trackPosition = examTrack.scrollLeft;

   let activeIndex = 0;
   let smallestDistance = Infinity;

   examSlides.forEach((slide, index) => {

    const distance = Math.abs(
     (slide.offsetLeft - examTrack.offsetLeft) - trackPosition
    );

    if (distance < smallestDistance) {
     smallestDistance = distance;
     activeIndex = index;
    }

   });

   if (examDots) {
    examDots.querySelectorAll(".exam-slider-dot").forEach((dot, index) => {
     dot.classList.toggle("active", index === activeIndex);
    });
   }

   if (examCount) {
    examCount.textContent = (activeIndex + 1) + " / " + totalSlides;
   }

  }

  if (examDots && totalSlides > 0) {

   const existingDots = examDots.querySelectorAll(".exam-slider-dot");

   existingDots.forEach((dot, index) => {

    dot.addEventListener("click", () => {

     const slide = examSlides[index];

     if (slide) {
      examTrack.scrollTo({
       left: slide.offsetLeft - examTrack.offsetLeft,
       behavior: "smooth"
      });
     }

    });

   });

  }

  examTrack.addEventListener("scroll", updateExamSlider, {
   passive: true
  });

  window.addEventListener("resize", updateExamSlider);

  updateExamSlider();

 }

})();
 
