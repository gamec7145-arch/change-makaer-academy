
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

 const slides = document.querySelectorAll(".slide");
 const dotsContainer = document.getElementById("sliderDots");

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

  const nextBtn = document.getElementById("nextSlide");
  const prevBtn = document.getElementById("prevSlide");

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

  // Mobile touch swipe

  const slider = document.querySelector(".hero-slider");

  if (slider) {
   let touchStartX = 0;
   let touchEndX = 0;

   slider.addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].screenX;
   }, { passive: true });

   slider.addEventListener("touchend", event => {
    touchEndX = event.changedTouches[0].screenX;

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

 const examTrack = document.getElementById("examTrack");
 const examDots = document.getElementById("examDots");

 if (examTrack) {

  const examSlides = Array.from(examTrack.children);
  const examCount = examSlides.length;

  if (examDots) {
   examDots.innerHTML = "";

   examSlides.forEach((slide, index) => {
    const dot = document.createElement("button");

    dot.className = "exam-dot";
    dot.setAttribute("aria-label", "Go to exam item " + (index + 1));

    dot.addEventListener("click", () => {
     examTrack.scrollTo({
      left: slide.offsetLeft - examTrack.offsetLeft,
      behavior: "smooth"
     });
    });

    examDots.appendChild(dot);
   });
  }

  function updateExamSlider() {

   if (examCount === 0) return;

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
    examDots.querySelectorAll(".exam-dot").forEach((dot, index) => {
     dot.classList.toggle("active", index === activeIndex);
    });
   }
  }

  examTrack.addEventListener("scroll", updateExamSlider, {
   passive: true
  });

  window.addEventListener("resize", updateExamSlider);

  updateExamSlider();

 }

})();
