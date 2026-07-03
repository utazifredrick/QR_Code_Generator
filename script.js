(() => {
  const STORAGE_KEY = "qr-generator-state";
  const HISTORY_KEY = "qr-generator-history";
  const storage = window.localStorage;
  const defaultState = {
    text: "",
    size: "250",
    foregroundColor: "#1d4ed8",
    backgroundColor: "#ffffff",
    theme: "dark",
  };

  let currentState = { ...defaultState };
  let qrGenerated = false;
  let jsQrPromise = null;

  const elements = {
    form: document.getElementById("generatorForm"),
    textInput: document.getElementById("textInput"),
    sizeSelect: document.getElementById("sizeSelect"),
    foregroundColor: document.getElementById("foregroundColor"),
    backgroundColor: document.getElementById("backgroundColor"),
    generateBtn: document.getElementById("generateBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    copyBtn: document.getElementById("copyBtn"),
    clearBtn: document.getElementById("clearBtn"),
    demoBtn: document.getElementById("demoBtn"),
    imageInput: document.getElementById("imageInput"),
    imageUploadBtn: document.getElementById("imageUploadBtn"),
    imageDropZone: document.getElementById("imageDropZone"),
    qrContainer: document.getElementById("qrContainer"),
    statusMessage: document.getElementById("statusMessage"),
    charCounter: document.getElementById("charCounter"),
    themeToggle: document.getElementById("themeToggle"),
    generateAnotherBtn: document.getElementById("generateAnotherBtn"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    historyList: document.getElementById("historyList"),
    toast: document.getElementById("toast"),
  };

  const demoUrls = [
    "https://www.example.com",
    "https://github.com",
    "https://developer.mozilla.org",
    "https://www.figma.com",
  ];

  const loadHistory = () => {
    try {
      const saved = storage.getItem ? storage.getItem(HISTORY_KEY) : null;
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn("Unable to load QR history", error);
      return [];
    }
  };

  const saveHistory = (history) => {
    if (storage.setItem) {
      storage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  };

  const addToHistory = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const history = loadHistory();
    const nextHistory = [
      trimmedValue,
      ...history.filter((item) => item !== trimmedValue),
    ].slice(0, 6);
    saveHistory(nextHistory);
    renderHistory(nextHistory);
  };

  const renderHistory = (history = loadHistory()) => {
    elements.historyList.innerHTML = "";

    if (!history.length) {
      elements.historyList.innerHTML =
        '<li class="history-item"><span>No recent items yet.</span></li>';
      return;
    }

    history.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className = "history-item";
      listItem.innerHTML = `
        <span>${item}</span>
        <button type="button">Use</button>
      `;
      listItem.querySelector("button").addEventListener("click", () => {
        elements.textInput.value = item;
        currentState.text = item;
        updateCharacterCounter();
        saveState();
        generateQrCode();
      });
      elements.historyList.appendChild(listItem);
    });
  };

  const loadState = () => {
    try {
      const saved = storage.getItem ? storage.getItem(STORAGE_KEY) : null;
      if (!saved) return;

      const parsed = JSON.parse(saved);
      currentState = { ...defaultState, ...parsed };
    } catch (error) {
      console.warn("Unable to load saved QR settings", error);
      currentState = { ...defaultState };
    }
  };

  const saveState = () => {
    if (storage.setItem) {
      storage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    }
  };

  const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    const icon = elements.themeToggle.querySelector(".icon");
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
  };

  const updateInputs = () => {
    elements.textInput.value = currentState.text;
    elements.sizeSelect.value = currentState.size;
    elements.foregroundColor.value = currentState.foregroundColor;
    elements.backgroundColor.value = currentState.backgroundColor;
    applyTheme(currentState.theme);
    updateCharacterCounter();
  };

  const updateCharacterCounter = () => {
    const length = elements.textInput.value.trim().length;
    elements.charCounter.textContent = `${length} character${length === 1 ? "" : "s"}`;
  };

  const setStatus = (message, type = "") => {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message${type ? ` ${type}` : ""}`;
  };

  const showToast = (message) => {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 1800);
  };

  const setLoading = (isLoading) => {
    elements.generateBtn.disabled = isLoading;
    elements.generateBtn.textContent = isLoading
      ? "Generating..."
      : "Generate QR Code";
  };

  const updateDownloadState = () => {
    elements.downloadBtn.disabled = !qrGenerated;
  };

  const clearQrDisplay = () => {
    elements.qrContainer.innerHTML = "";
    elements.qrContainer.className = "qr-placeholder";
    elements.qrContainer.textContent = "Your QR code will appear here.";
    qrGenerated = false;
    updateDownloadState();
    elements.generateAnotherBtn.classList.add("hidden");
  };

  const renderQrCode = () => {
    const text = currentState.text.trim();
    if (!text) {
      clearQrDisplay();
      setStatus("Enter a URL or some text to generate your QR code.", "error");
      return;
    }

    elements.qrContainer.innerHTML = "";
    elements.qrContainer.className = "qr-placeholder has-qr";

    const wrapper = document.createElement("div");
    wrapper.className = "qr-preview";
    elements.qrContainer.appendChild(wrapper);

    new QRCode(wrapper, {
      text,
      width: Number(currentState.size),
      height: Number(currentState.size),
      colorDark: currentState.foregroundColor,
      colorLight: currentState.backgroundColor,
      correctLevel: QRCode.CorrectLevel.M,
      render: "canvas",
    });

    qrGenerated = true;
    updateDownloadState();
    elements.generateAnotherBtn.classList.remove("hidden");
    setStatus("QR code generated successfully.", "success");
    addToHistory(currentState.text);
    saveState();
  };

  const generateQrCode = () => {
    if (!elements.textInput.value.trim()) {
      setStatus(
        "Please enter some content before generating a QR code.",
        "error",
      );
      return;
    }

    currentState.text = elements.textInput.value.trim();
    currentState.size = elements.sizeSelect.value;
    currentState.foregroundColor = elements.foregroundColor.value;
    currentState.backgroundColor = elements.backgroundColor.value;
    saveState();

    setLoading(true);
    setStatus("Generating your QR code...");

    window.setTimeout(() => {
      renderQrCode();
      setLoading(false);
    }, 250);
  };

  const handleInputChange = () => {
    currentState.text = elements.textInput.value;
    currentState.size = elements.sizeSelect.value;
    currentState.foregroundColor = elements.foregroundColor.value;
    currentState.backgroundColor = elements.backgroundColor.value;
    updateCharacterCounter();
    saveState();

    if (qrGenerated && elements.textInput.value.trim()) {
      generateQrCode();
    }
  };

  const copyCurrentText = async () => {
    const text = elements.textInput.value.trim();
    if (!text) {
      setStatus("There is no text available to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Text copied to clipboard");
      setStatus("Text copied to your clipboard.", "success");
    } catch (error) {
      console.warn("Clipboard access failed", error);
      setStatus("Copying failed. Please try again.", "error");
    }
  };

  const downloadQrCode = () => {
    if (!qrGenerated) {
      setStatus("Generate a QR code before downloading it.", "error");
      return;
    }

    const canvas = elements.qrContainer.querySelector("canvas");
    if (!canvas) {
      setStatus("The QR code is not available for download yet.", "error");
      return;
    }

    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("QR code downloaded");
    setStatus("QR code downloaded as PNG.", "success");
  };

  const clearForm = () => {
    elements.textInput.value = "";
    elements.sizeSelect.value = currentState.size;
    elements.foregroundColor.value = currentState.foregroundColor;
    elements.backgroundColor.value = currentState.backgroundColor;
    currentState.text = "";
    updateCharacterCounter();
    clearQrDisplay();
    saveState();
    setStatus("Input cleared. Start a new QR code whenever you are ready.");
  };

  const fillDemoUrl = () => {
    const randomUrl = demoUrls[Math.floor(Math.random() * demoUrls.length)];
    elements.textInput.value = randomUrl;
    currentState.text = randomUrl;
    updateCharacterCounter();
    saveState();
    generateQrCode();
  };

  const loadJsQr = async () => {
    if (window.jsQR) {
      return;
    }

    if (!jsQrPromise) {
      jsQrPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.1.0/jsQR.min.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load image scanner"));
        document.head.appendChild(script);
      });
    }

    await jsQrPromise;
  };

  const loadImageElement = (source) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("The selected image could not be loaded."));
      img.src = source;
    });

  const decodeQrFromImage = async (imageSource) => {
    await loadJsQr();

    const img = await loadImageElement(imageSource);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.floor(img.width * scale));
    canvas.height = Math.max(1, Math.floor(img.height * scale));

    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = window.jsQR(
      imageData.data,
      imageData.width,
      imageData.height,
    );

    if (!decoded) {
      const flippedCanvas = document.createElement("canvas");
      flippedCanvas.width = canvas.width;
      flippedCanvas.height = canvas.height;
      const flippedContext = flippedCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      flippedContext.translate(canvas.width, 0);
      flippedContext.scale(-1, 1);
      flippedContext.drawImage(canvas, 0, 0);
      const flippedImageData = flippedContext.getImageData(
        0,
        0,
        flippedCanvas.width,
        flippedCanvas.height,
      );
      return window.jsQR(
        flippedImageData.data,
        flippedImageData.width,
        flippedImageData.height,
      );
    }

    return decoded;
  };

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please choose a valid image file.", "error");
      return;
    }

    setStatus("Scanning your image for a QR code...");

    try {
      const reader = new FileReader();
      const imageSource = await new Promise((resolve, reject) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () =>
          reject(new Error("The image could not be read."));
        reader.readAsDataURL(file);
      });

      const decoded = await decodeQrFromImage(imageSource);

      if (decoded) {
        elements.textInput.value = decoded.data;
        currentState.text = decoded.data;
        updateCharacterCounter();
        saveState();
        showToast("QR content scanned from image");
        setStatus(
          "QR code scanned successfully. Generating preview.",
          "success",
        );
        generateQrCode();
      } else {
        setStatus(
          "We could not detect a QR code in that image. Try a sharper screenshot or a larger image.",
          "error",
        );
      }
    } catch (error) {
      console.warn("QR image processing failed", error);
      setStatus(error.message || "The image could not be processed.", "error");
    }
  };

  const handleImageSelection = (event) => {
    const [file] = event.target.files || [];
    if (file) {
      void processImageFile(file);
    }
    event.target.value = "";
  };

  const handlePaste = (event) => {
    const items = event.clipboardData?.items || [];
    const imageItem = Array.from(items).find((item) =>
      item.type.startsWith("image/"),
    );

    if (!imageItem) {
      return;
    }

    event.preventDefault();
    void processImageFile(imageItem.getAsFile());
  };

  const handleDrop = (event) => {
    event.preventDefault();
    elements.imageDropZone.classList.remove("drag-active");
    const [file] = Array.from(event.dataTransfer?.files || []);
    if (file) {
      void processImageFile(file);
    }
  };

  const init = () => {
    loadState();
    updateInputs();
    clearQrDisplay();
    updateDownloadState();
    renderHistory();

    elements.form.addEventListener("submit", (event) => event.preventDefault());
    elements.generateBtn.addEventListener("click", generateQrCode);
    elements.downloadBtn.addEventListener("click", downloadQrCode);
    elements.copyBtn.addEventListener("click", copyCurrentText);
    elements.clearBtn.addEventListener("click", clearForm);
    elements.demoBtn.addEventListener("click", fillDemoUrl);
    elements.clearHistoryBtn.addEventListener("click", () => {
      saveHistory([]);
      renderHistory([]);
    });
    elements.imageUploadBtn.addEventListener("click", () =>
      elements.imageInput.click(),
    );
    elements.imageDropZone.addEventListener("click", () =>
      elements.imageInput.click(),
    );
    elements.imageDropZone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        elements.imageInput.click();
      }
    });
    elements.imageDropZone.addEventListener("dragenter", (event) => {
      event.preventDefault();
      elements.imageDropZone.classList.add("drag-active");
    });
    elements.imageDropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      elements.imageDropZone.classList.add("drag-active");
    });
    elements.imageDropZone.addEventListener("dragleave", () => {
      elements.imageDropZone.classList.remove("drag-active");
    });
    elements.imageDropZone.addEventListener("drop", handleDrop);
    elements.imageInput.addEventListener("change", handleImageSelection);
    elements.generateAnotherBtn.addEventListener("click", generateQrCode);
    elements.textInput.addEventListener("input", () => {
      updateCharacterCounter();
      currentState.text = elements.textInput.value;
      saveState();
    });
    elements.textInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        generateQrCode();
      }
    });
    elements.sizeSelect.addEventListener("change", handleInputChange);
    elements.foregroundColor.addEventListener("change", handleInputChange);
    elements.backgroundColor.addEventListener("change", handleInputChange);
    window.addEventListener("paste", handlePaste);
    elements.themeToggle.addEventListener("click", () => {
      const nextTheme = currentState.theme === "dark" ? "light" : "dark";
      currentState.theme = nextTheme;
      applyTheme(nextTheme);
      saveState();
    });

    if (currentState.text.trim()) {
      generateQrCode();
    }
  };

  init();
})();
