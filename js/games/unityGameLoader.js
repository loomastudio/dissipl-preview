// js/games/unityGameLoader.js

export function initUnityGame(opts) {
  const cfg = normalizeOptions(opts);

  const mainEl = document.getElementById(cfg.mainId);
  const container = document.getElementById(cfg.containerId);
  const canvas = document.getElementById(cfg.canvasId);

  const loadingWrap = document.getElementById(cfg.loadingId);
  const progressBarFull = document.getElementById(cfg.progressBarId);
  const progressLabel = document.getElementById(cfg.progressLabelId);
  const warningBanner = document.getElementById(cfg.warningId);

  if (!container || !canvas) {
    console.error("[unityGameLoader] Container/canvas introuvable", {
      containerId: cfg.containerId,
      canvasId: cfg.canvasId,
    });
    return;
  }

  const setPct = (p) => {
    const v = Math.max(0, Math.min(100, Math.round(p)));
    if (progressBarFull) progressBarFull.style.width = v + "%";
    if (progressLabel) progressLabel.textContent = v + "%";
  };

  const showBanner = (msg, type) => {
    if (type === "warning") return;
    if (!warningBanner) return;

    const div = document.createElement("div");
    div.textContent = msg;
    div.className = type || "";
    warningBanner.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  };

  const getHeaderFooterHeights = () => {
    const headerPH = document.getElementById(cfg.headerPlaceholderId);
    const footerPH = document.getElementById(cfg.footerPlaceholderId);

    const headerEl = headerPH ? (headerPH.querySelector("header") || headerPH) : null;
    const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;

    let footerH = 0;
    if (cfg.reserveFooterSpace) {
      footerH = footerPH ? Math.ceil(footerPH.getBoundingClientRect().height) : 0;
    }

    return { headerH, footerH };
  };

  const applyHeaderPush = (headerH) => {
    if (!cfg.pushContentBelowHeader) return;
    if (!mainEl) return;

    const px = Math.max(0, headerH + cfg.headerGapPx);
    mainEl.style.paddingTop = px + "px";
  };

  const sizeUnityToAvailableSpace = () => {
    const { headerH, footerH } = getHeaderFooterHeights();

    // 1) Pousse le contenu sous le header fixed (sinon ça se superpose)
    applyHeaderPush(headerH);

    // 2) Calcule la place dispo pour le conteneur
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // On retire le header + son gap (car visuellement on le réserve)
    const effectiveHeader = cfg.pushContentBelowHeader ? (headerH + cfg.headerGapPx) : headerH;

    const availableH = Math.max(0, vh - effectiveHeader - footerH - cfg.padding);
    const availableW = Math.max(0, vw - cfg.padding);

    if (availableW <= 0 || availableH <= 0) return;

    let w = availableW;
    let h = Math.floor(w / cfg.aspect);

    if (h > availableH) {
      h = availableH;
      w = Math.floor(h * cfg.aspect);
    }

    const targetMinW = Math.min(cfg.minWidth, availableW);
    const targetMinH = Math.min(cfg.minHeight, availableH);

    w = Math.max(w, targetMinW);
    h = Math.floor(w / cfg.aspect);

    if (h < targetMinH) {
      h = targetMinH;
      w = Math.floor(h * cfg.aspect);
    }

    if (cfg.maxWidth && w > cfg.maxWidth) {
      w = cfg.maxWidth;
      h = Math.floor(w / cfg.aspect);
      if (h > availableH) {
        h = availableH;
        w = Math.floor(h * cfg.aspect);
      }
    }

    container.style.width = w + "px";
    container.style.height = h + "px";
  };

  window.addEventListener("resize", sizeUnityToAvailableSpace, { passive: true });

  const ro = new ResizeObserver(() => sizeUnityToAvailableSpace());
  const headerPH = document.getElementById(cfg.headerPlaceholderId);
  const footerPH = document.getElementById(cfg.footerPlaceholderId);
  if (headerPH) ro.observe(headerPH);
  if (footerPH) ro.observe(footerPH);

  sizeUnityToAvailableSpace();

  if (loadingWrap) loadingWrap.style.display = "";
  setPct(0);

  const timeline = [
    [0, 0],
    [400, 4],
    [900, 8],
    [1800, 24],
    [3200, 42],
    [4600, 57],
    [6000, 62],
    [7400, 74],
    [8800, 89],
    [9800, 95],
  ];

  let unityReady = false;
  let gotRealProgress = false;
  let fakeTimers = [];

  const startFakeProgress = () => {
    gotRealProgress = false;
    fakeTimers = timeline.map(([ms, pct]) =>
      setTimeout(() => {
        if (!unityReady && !gotRealProgress) setPct(pct);
      }, ms)
    );
  };

  const stopFakeProgress = () => {
    fakeTimers.forEach((id) => clearTimeout(id));
    fakeTimers = [];
  };

  startFakeProgress();

  const buildRoot = (cfg.buildRoot || "").replace(/\/$/, "");
  const loaderUrl = `${buildRoot}/${cfg.buildName}.loader.js`;

  // .unityweb = Unity decompression fallback (decompressed in-browser, no server header needed)
  const buildExt = cfg.unityweb ? ".unityweb" : cfg.useBr ? ".br" : cfg.useGz ? ".gz" : "";
  const unityConfig = {
    dataUrl: `${buildRoot}/${cfg.buildName}.data${buildExt}`,
    frameworkUrl: `${buildRoot}/${cfg.buildName}.framework.js${buildExt}`,
    codeUrl: `${buildRoot}/${cfg.buildName}.wasm${buildExt}`,
    streamingAssetsUrl: cfg.streamingAssetsUrl || "StreamingAssets",
    companyName: cfg.companyName,
    productName: cfg.productName,
    productVersion: cfg.productVersion,
    showBanner,
  };

  const script = document.createElement("script");
  script.src = loaderUrl;

  script.onload = () => {
    if (typeof window.createUnityInstance !== "function") {
      stopFakeProgress();
      showBanner("Loader Unity introuvable.", "error");
      return;
    }

    window
      .createUnityInstance(canvas, unityConfig, (progress) => {
        gotRealProgress = true;
        const pct = Math.max(0, Math.min(1, progress)) * 100;
        setPct(Math.min(99, pct));
      })
      .then(() => {
        unityReady = true;
        stopFakeProgress();
        setPct(100);

        if (loadingWrap) {
          loadingWrap.classList.add("unity-overlay--hide");
          setTimeout(() => {
            loadingWrap.style.display = "none";
          }, 220);
        }

        sizeUnityToAvailableSpace();
      })
      .catch((err) => {
        unityReady = false;
        stopFakeProgress();
        console.error("[unityGameLoader] Erreur Unity:", err);
        showBanner("Erreur de chargement. Réessayez (Ctrl+F5).", "error");
      });
  };

  script.onerror = () => {
    unityReady = false;
    stopFakeProgress();
    showBanner("Échec de chargement du loader Unity.", "error");
  };

  document.body.appendChild(script);
}

function normalizeOptions(opts) {
  const o = opts || {};
  return {
    // DOM
    headerPlaceholderId: o.headerPlaceholderId || "header-placeholder",
    footerPlaceholderId: o.footerPlaceholderId || "footer-placeholder",
    mainId: o.mainId || "unity-page-main",
    containerId: o.containerId || "unity-container",
    canvasId: o.canvasId || "unity-canvas",
    loadingId: o.loadingId || "unity-loading",
    progressBarId: o.progressBarId || "unity-progress-bar-full",
    progressLabelId: o.progressLabelId || "unity-progress-label",
    warningId: o.warningId || "unity-warning",

    // Sizing
    aspect: typeof o.aspect === "number" && o.aspect > 0 ? o.aspect : 16 / 9,
    padding: Number.isFinite(o.padding) ? o.padding : 24,
    minHeight: Number.isFinite(o.minHeight) ? o.minHeight : 560,
    minWidth: Number.isFinite(o.minWidth) ? o.minWidth : 980,
    maxWidth: Number.isFinite(o.maxWidth) ? o.maxWidth : 1500,

    // Header fixed handling
    pushContentBelowHeader: typeof o.pushContentBelowHeader === "boolean" ? o.pushContentBelowHeader : true,
    headerGapPx: Number.isFinite(o.headerGapPx) ? o.headerGapPx : 12,

    // Footer reservation
    reserveFooterSpace: typeof o.reserveFooterSpace === "boolean" ? o.reserveFooterSpace : false,

    // Unity
    buildRoot: o.buildRoot,
    buildName: o.buildName,
    streamingAssetsUrl: o.streamingAssetsUrl || "StreamingAssets",
    companyName: o.companyName || "",
    productName: o.productName || "",
    productVersion: o.productVersion || "",

    // Gzip compression for build files
    useGz: typeof o.useGz === "boolean" ? o.useGz : true,

    // Brotli compression for build files
    useBr: typeof o.useBr === "boolean" ? o.useBr : false,

    // .unityweb files (Unity decompression fallback — decompressed in-browser)
    unityweb: typeof o.unityweb === "boolean" ? o.unityweb : false,
  };
}
