// --- Force les modales dans <body> ---
$(function () {
  $(".modal").appendTo("body");
});

// --- Toggle offres ---
document.getElementById("toggleOffers")?.addEventListener("click", function () {
  const offers = document.getElementById("offersSection");
  offers.classList.toggle("show");
});

// --- Lecture vidéo après clic sur l'image ---
document.addEventListener("DOMContentLoaded", function () {
  const poster = document.getElementById("index-video-poster");
  const video = document.getElementById("index-video");
  if (!poster || !video) return;
  const source = video.querySelector("source");

  function activateVideo() {
    if (video.dataset.activated === "1") return;

    const src = source.getAttribute("data-src");
    source.setAttribute("src", src);
    video.load();

    // Cache l'image
    poster.style.display = "none";

    // Montre la vidéo
    video.classList.remove("d-none");
    video.classList.add("rounded", "w-100");
    video.setAttribute("controls", "");
    video.dataset.activated = "1";

    // Lecture suite au clic utilisateur
    video.play().catch(() => {});
  }

  poster.addEventListener("click", activateVideo);
});
