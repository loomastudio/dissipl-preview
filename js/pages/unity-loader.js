<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DISSIPL</title>

    <!-- Bootstrap CSS -->
    <link
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
      rel="stylesheet"
    />

    <!-- Ton fichier CSS personnalisé -->
    <link rel="stylesheet" href="/dissipl-preview/css/styles.css" />

    <!-- Style pour la barre de chargement (directement dans le HTML) -->
    <style>
      /* Overlay de chargement */
      #loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
      }

      #loading-overlay.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .loading-text {
        color: #fff;
        font-size: 18px;
        margin-bottom: 20px;
        font-family: "MV Boli", sans-serif;
      }

      .loading-bar-container {
        width: 400px;
        max-width: 80vw;
        height: 30px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 15px;
        overflow: hidden;
        position: relative;
      }

      .loading-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        border-radius: 15px;
        transition: width 0.3s ease;
      }

      .loading-percentage {
        color: #fff;
        font-size: 24px;
        font-weight: bold;
        margin-top: 15px;
        font-family: "MV Boli", sans-serif;
      }
    </style>
  </head>
  <body class="d-flex flex-column min-vh-100">
    <!-- Overlay de chargement -->
    <div id="loading-overlay">
      <div class="loading-text">Chargement de l'outil en cours...</div>
      <div class="loading-bar-container">
        <div class="loading-bar" id="loading-bar"></div>
      </div>
      <div class="loading-percentage" id="loading-percentage">0%</div>
    </div>

    <!-- Header -->
    <div id="header-placeholder"></div>

    <!-- Main Content -->
    <main class="flex-fill">
      <div class="container">
        <!-- Unity WebGL Player -->
        <div class="row mt-4">
          <div class="col-12 d-flex justify-content-center align-items-center">
            <div id="unity-container" class="unity-desktop">
              <canvas id="unity-canvas" tabindex="-1"></canvas>
              <div id="unity-warning"></div>
              <div id="unity-footer">
                <div id="unity-webgl-logo"></div>
                <div id="unity-fullscreen-button"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <div id="footer-placeholder"></div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script type="module" src="/dissipl-preview/js/core/header.js"></script>

    <!-- Script pour charger Unity WebGL -->
    <script>
      // Références DOM
      const container = document.querySelector("#unity-container");
      const canvas = document.querySelector("#unity-canvas");
      const fullscreenButton = document.querySelector("#unity-fullscreen-button");
      const warningBanner = document.querySelector("#unity-warning");
      
      // Références de la barre de chargement
      const loadingOverlay = document.getElementById("loading-overlay");
      const loadingBar = document.getElementById("loading-bar");
      const loadingPercentage = document.getElementById("loading-percentage");

      // Fonction pour mettre à jour la progression
      function updateProgress(progress) {
        const percentage = Math.round(progress * 100);
        loadingBar.style.width = percentage + "%";
        loadingPercentage.textContent = percentage + "%";
        console.log("Progression:", percentage + "%");
      }

      // Fonction pour masquer l'overlay
      function hideLoadingOverlay() {
        console.log("✅ Masquage de l'overlay de chargement");
        loadingOverlay.classList.add("hidden");
        // Supprimer complètement après la transition
        setTimeout(() => {
          loadingOverlay.style.display = "none";
        }, 500);
      }

      // Fonction showBanner pour Unity
      function unityShowBanner(msg, type) {
        function updateBannerVisibility() {
          warningBanner.style.display = warningBanner.children.length ? "block" : "none";
        }
        const div = document.createElement("div");
        div.innerHTML = msg;
        warningBanner.appendChild(div);
        if (type == "error") div.style = "background: red; padding: 10px;";
        else if (type == "warning") div.style = "background: yellow; padding: 10px;";
        setTimeout(() => {
          warningBanner.removeChild(div);
          updateBannerVisibility();
        }, 5000);
        updateBannerVisibility();
      }

      // Configuration Unity
      const buildUrl = "/dissipl-preview/webgl/Abaccus_Free/Build";
      const loaderUrl = buildUrl + "/Abaccus_Free.loader.js";
      const config = {
        dataUrl: buildUrl + "/Abaccus_Free.data.gz",
        frameworkUrl: buildUrl + "/Abaccus_Free.framework.js.gz",
        codeUrl: buildUrl + "/Abaccus_Free.wasm.gz",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "Sylvain Héliou",
        productName: "Boulier",
        productVersion: "1.3",
        showBanner: unityShowBanner,
      };

      // Fonction de redimensionnement du canvas
      function resizeUnityCanvas() {
        const aspectRatio = 16 / 10;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let canvasWidth = windowWidth * 0.9;
        let canvasHeight = canvasWidth / aspectRatio;

        if (canvasHeight > windowHeight * 0.8) {
          canvasHeight = windowHeight * 0.8;
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
      }

      window.addEventListener("resize", resizeUnityCanvas);
      resizeUnityCanvas();

      // Chargement du script Unity
      const script = document.createElement("script");
      script.src = loaderUrl;

      script.onload = () => {
        console.log("🚀 Démarrage du chargement Unity");
        
        createUnityInstance(canvas, config, (progress) => {
          // Mise à jour de la barre de progression
          updateProgress(progress);
        })
        .then((unityInstance) => {
          console.log("✅ Unity chargé avec succès!");
          
          // Masquer immédiatement l'overlay
          hideLoadingOverlay();
          
          // Configuration du bouton plein écran
          fullscreenButton.onclick = () => {
            unityInstance.SetFullscreen(1);
          };
        })
        .catch((message) => {
          console.error("❌ Erreur de chargement Unity:", message);
          loadingPercentage.textContent = "Erreur de chargement";
          loadingPercentage.style.color = "#ff4444";
          alert("Erreur de chargement : " + message);
        });
      };

      script.onerror = () => {
        console.error("❌ Impossible de charger le script Unity");
        loadingPercentage.textContent = "Erreur de chargement";
        loadingPercentage.style.color = "#ff4444";
      };

      document.body.appendChild(script);

      // Sécurité : masquer l'overlay après 15 secondes max
      setTimeout(() => {
        if (!loadingOverlay.classList.contains("hidden")) {
          console.log("⏰ Timeout - masquage forcé de l'overlay");
          hideLoadingOverlay();
        }
      }, 15000);
    </script>

    <script src="/dissipl-preview/js/core/footer.js"></script>
  </body>
</html>
