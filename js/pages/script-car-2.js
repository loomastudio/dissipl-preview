document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".carousel-track");
  const nextButton = document.querySelector(".carousel-button--right");
  const prevButton = document.querySelector(".carousel-button--left");
  const dotsNav = document.querySelector(".carousel-pagination");

  // Éléments de la modale
  const modal = document.getElementById("reviewModal");
  const modalContent = document.querySelector(".modal-content-details");
  const closeButton = document.querySelector(".modal .close-button");

  let cards = [];
  let dots = [];
  let currentCardIndex = 0;
  let autoSlideInterval;
  const autoSlideDelay = 5000; // Délai en millisecondes (ici, 5 secondes)
  const MAX_COMMENT_LENGTH = 150; // Nombre maximum de caractères avant troncature

  const pastelColors = [
    "#FFD1DC",
    "#A7D9A0",
    "#AEC6CF",
    "#FDFD96",
    "#B0E0E6",
    "#F0E68C",
    "#E6E6FA",
    "#FFC0CB",
    "#C0D9C0",
    "#ADD8E6",
    "#FFE4E1",
    "#F0FFF0",
    "#F5F5DC",
    "#FAFAD2",
    "#FFFACD",
    "#E0FFFF",
    "#D8BFD8",
    "#DDA0DD",
    "#FFB6C1",
    "#FFEBCD",
    "#AFEEEE",
    "#98FB98",
    "#BDB76B",
    "#F5DEB3",
    "#FFDEAD",
    "#FFE4B5",
  ];

  // Fonction pour échapper les caractères spéciaux dans les attributs HTML
  function escapeHtml(unsafe) {
    if (typeof unsafe !== "string") return unsafe; // Assurez-vous que c'est une chaîne
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function moveToNextCard() {
    currentCardIndex++;
    if (currentCardIndex >= cards.length) {
      currentCardIndex = 0;
    }
    updateCarouselDisplay();
  }
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  function initializeCarousel(allReviews) {
    const numberOfReviewsToShow = 10;

    if (!allReviews || allReviews.length === 0) {
      console.warn("Aucun avis à afficher ou erreur de chargement.");
      track.innerHTML =
        '<li class="carousel-card is-visible is-active"><p class="card-comment">Aucun témoignage disponible pour le moment.</p></li>';
      dotsNav.innerHTML =
        '<div class="pagination-dot active" data-index="0"></div>';
      cards = Array.from(track.children);
      dots = Array.from(dotsNav.children);
      updateCarouselDisplay();
      return;
    }

    const selectedReviews = shuffleArray([...allReviews]).slice(
      0,
      numberOfReviewsToShow
    );

    track.innerHTML = "";
    dotsNav.innerHTML = "";

    selectedReviews.forEach((review, index) => {
      const card = document.createElement("li");
      card.classList.add("carousel-card");
      card.dataset.index = index;

      const randomColor =
        pastelColors[Math.floor(Math.random() * pastelColors.length)];
      card.style.backgroundColor = randomColor;

      let fullCommentText = review.commentaires || "Pas de commentaire.";
      let fullCommentHtml = fullCommentText.replace(/\\n/g, "<br>"); // Pour affichage dans la modale
      let displayedCommentText = fullCommentText; // Pour la troncature sur la carte
      let readMoreLinkHtml = "";

      // Logique pour combiner fonction et remarques
      const displayedFunction = review.fonction || "";
      const autresRemarques = review["autres/remarques"] || "";
      let combinedFunctionText = displayedFunction;

      if (autresRemarques) {
        const formattedRemarques = autresRemarques.replace(/\\n/g, "<br>");
        if (displayedFunction) {
          combinedFunctionText += `, <span class="card-remarque-details">${formattedRemarques}</span>`;
        } else {
          combinedFunctionText = `<span class="card-remarque-details">${formattedRemarques}</span>`;
        }
      }

      // CORRECTION PRINCIPALE ICI
      if (fullCommentText.length > MAX_COMMENT_LENGTH) {
        displayedCommentText =
          fullCommentText.substring(0, MAX_COMMENT_LENGTH) + "...";
        // Échappe les données avant de les mettre dans les attributs data-
        readMoreLinkHtml = `<span class="read-more"
                                          data-prénom="${escapeHtml(
                                            review.prénom || "Anonyme"
                                          )}"
                                          data-fonction-complete="${escapeHtml(
                                            combinedFunctionText
                                          )}"
                                          data-commentaires="${escapeHtml(
                                            fullCommentHtml
                                          )}">Lire la suite...</span>`;
      }

      card.innerHTML = `
                <div class="card-details">
                    <p class="card-name">${escapeHtml(
                      review.prénom || "Anonyme"
                    )}</p>
                    <p class="card-function-combined">${combinedFunctionText}</p>
                </div>
                <p class="card-comment">${displayedCommentText} ${readMoreLinkHtml}</p>
            `;
      track.appendChild(card);

      const dot = document.createElement("div");
      dot.classList.add("pagination-dot");
      dot.dataset.index = index;
      dotsNav.appendChild(dot);
    });

    cards = Array.from(track.children);
    dots = Array.from(dotsNav.children);

    startAutoSlide();
    updateCarouselDisplay();
  }

  function updateCarouselDisplay() {
    if (cards.length === 0) return;

    cards.forEach((card, index) => {
      if (index === currentCardIndex) {
        card.classList.add("is-visible", "is-active");
      } else {
        card.classList.remove("is-visible", "is-active");
      }
    });

    dots.forEach((dot, index) => {
      if (index === currentCardIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(moveToNextCard, autoSlideDelay);
  }

  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  fetch("/dissipl-preview/assets/data/avis.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      initializeCarousel(data);
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des avis :", error);
      track.innerHTML =
        '<li class="carousel-card is-visible is-active"><p class="card-comment">Désolé, nous n\'avons pas pu charger les témoignages. Veuillez vérifier le fichier JSON et votre connexion.</p></li>';
      dotsNav.innerHTML =
        '<div class="pagination-dot active" data-index="0"></div>';
      cards = Array.from(track.children);
      dots = Array.from(dotsNav.children);
      updateCarouselDisplay();
      stopAutoSlide();
    });

  // Gestionnaires d'événements existants
  nextButton.addEventListener("click", () => {
    if (cards.length === 0) return;
    stopAutoSlide();
    moveToNextCard();
    startAutoSlide();
  });

  prevButton.addEventListener("click", () => {
    if (cards.length === 0) return;
    stopAutoSlide();
    currentCardIndex--;
    if (currentCardIndex < 0) {
      currentCardIndex = cards.length - 1;
    }
    updateCarouselDisplay();
    startAutoSlide();
  });

  dotsNav.addEventListener("click", (e) => {
    if (cards.length === 0) return;
    const targetDot = e.target.closest(".pagination-dot");
    if (!targetDot) return;

    stopAutoSlide();
    const targetIndex = parseInt(targetDot.dataset.index);
    currentCardIndex = targetIndex;
    updateCarouselDisplay();
    startAutoSlide();
  });

  track.addEventListener("mouseenter", stopAutoSlide);
  track.addEventListener("mouseleave", startAutoSlide);

  // Gestion de l'ouverture de la modale
  track.addEventListener("click", (e) => {
    const readMoreBtn = e.target.closest(".read-more");
    if (readMoreBtn) {
      // Utilise les valeurs échappées et les décode
      const prénom = readMoreBtn.dataset.prénom; // Pas besoin de décoder ici, dataset le fait
      const fonctionComplete = readMoreBtn.dataset.fonctionComplete;
      const commentaires = readMoreBtn.dataset.commentaires;

      modalContent.innerHTML = `
                <h3>${prénom}</h3>
                <p class="modal-function-combined">${fonctionComplete}</p>
                <p class="modal-comment">${commentaires}</p>
            `;
      modal.style.display = "flex";
      setTimeout(() => {
        modal.classList.add("show");
      }, 10);

      stopAutoSlide();
    }
  });

  // Gestion de la fermeture de la modale (bouton de fermeture)
  closeButton.addEventListener("click", () => {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
      startAutoSlide();
    }, 300);
  });

  // Fermer la modale si l'utilisateur clique en dehors de son contenu
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        startAutoSlide();
      }, 300);
    }
  });
});
