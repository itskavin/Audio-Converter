const form = document.getElementById("convert-form");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const browseButton = document.getElementById("browse-button");
const fileList = document.getElementById("file-list");
const fileTemplate = document.getElementById("file-item-template");
const convertButton = document.getElementById("convert-button");
const clearButton = document.getElementById("clear-button");
const formatSelect = document.getElementById("format");
const customFormatField = document.getElementById("custom-format-field");
const customFormatInput = document.getElementById("custom-format");
const zipToggle = document.getElementById("zip-toggle");
const individualToggle = document.getElementById("individual-toggle");
const progressBlock = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");
const results = document.getElementById("results");

const acceptedExtensions = new Set([
  "3gp", "aac", "aif", "aiff", "alac", "amr", "ape", "au", "caf", "dss", "flac",
  "m4a", "m4b", "m4p", "mka", "mp2", "mp3", "mpa", "ogg", "opus", "pcm", "snd",
  "voc", "wav", "webm", "wma", "wv"
]);

const storage = new DataTransfer();
let skippedNotice = null;

const formatName = (file) => {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (file.type.startsWith("audio/")) {
    return `${file.type.split("/")[1].toUpperCase()} · ${ext || "unknown"}`;
  }
  return `${ext ? ext.toUpperCase() : "Unknown"} · detected`;
};

const isLikelyAudio = (file) => {
  if (file.type.startsWith("audio/")) return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return acceptedExtensions.has(ext);
};

const updateButtons = () => {
  const hasFiles = storage.files.length > 0;
  convertButton.disabled = !hasFiles || (formatSelect.value === "custom" && !customFormatInput.value.trim());
  clearButton.disabled = !hasFiles;
};

const renderFileList = () => {
  fileList.innerHTML = "";
  if (storage.files.length === 0) {
    fileList.setAttribute("data-empty", "");
    fileList.innerHTML = '<div class="file-list__empty" aria-live="polite">No files yet — drop or browse to start your batch.</div>';
    updateButtons();
    return;
  }
  fileList.removeAttribute("data-empty");

  Array.from(storage.files).forEach((file, index) => {
    const fragment = fileTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".file-item");
    item.dataset.index = index;
    fragment.querySelector(".file-item__name").textContent = file.name;
    fragment.querySelector(".file-item__format").textContent = formatName(file);
    fragment.querySelector(".file-item__remove").addEventListener("click", () => removeFile(index));
    fileList.appendChild(fragment);
  });

  updateButtons();
};

const removeFile = (index) => {
  const next = new DataTransfer();
  Array.from(storage.files).forEach((file, idx) => {
    if (idx !== index) {
      next.items.add(file);
    }
  });
  storage.items.clear();
  Array.from(next.files).forEach((file) => storage.items.add(file));
  fileInput.files = storage.files;
  renderFileList();
};

const addFiles = (files) => {
  let added = 0;
  let skipped = 0;
  Array.from(files).forEach((file) => {
    if (isLikelyAudio(file)) {
      storage.items.add(file);
      added += 1;
    } else {
      skipped += 1;
    }
  });

  if (skipped) {
    skippedNotice = `Skipped ${skipped} non-audio file${skipped > 1 ? "s" : ""}.`;
  }

  if (added > 0) {
    fileInput.files = storage.files;
    renderFileList();
  } else if (skipped && storage.files.length === 0) {
    renderFileList();
  }

  if (added === 0 && skipped === 0) {
    showNotice("No files detected in that drop.", "warn");
  }
};

const showNotice = (text, tone = "info") => {
  const card = document.createElement("article");
  card.className = "results__card";
  card.innerHTML = `
    <div class="results__header">
      <h3>${tone === "warn" ? "Heads up" : "Status"}</h3>
      <span class="badge" style="background:${tone === "warn" ? "rgba(248, 113, 113, 0.16)" : "rgba(34, 197, 94, 0.22)"};color:${tone === "warn" ? "#fca5a5" : "#86efac"}">${tone === "warn" ? "Warning" : "Info"}</span>
    </div>
    <p style="margin:0;color:var(--text-secondary);font-size:0.95rem;line-height:1.55;">${text}</p>
  `;
  results.hidden = false;
  results.innerHTML = "";
  results.appendChild(card);
};

const toggleLoading = (isLoading) => {
  if (isLoading) {
    convertButton.dataset.loading = "true";
    convertButton.disabled = true;
    progressBlock.hidden = false;
  } else {
    delete convertButton.dataset.loading;
    progressBlock.hidden = true;
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    progressLabel.textContent = "Preparing…";
    updateButtons();
  }
};

const updateProgress = (value, label = null) => {
  const clamped = Math.max(0, Math.min(100, value));
  progressBar.style.width = `${clamped}%`;
  progressPercent.textContent = `${Math.round(clamped)}%`;
  if (label) {
    progressLabel.textContent = label;
  }
};

const resetResults = () => {
  results.hidden = true;
  results.innerHTML = "";
};

const renderResults = (payload) => {
  results.hidden = false;
  results.innerHTML = "";

  const container = document.createElement("article");
  container.className = "results__card";

  const header = document.createElement("div");
  header.className = "results__header";
  header.innerHTML = `
    <h3 style="margin:0;font-size:1.15rem;">Conversion complete</h3>
    <span class="badge">Ready</span>
  `;
  container.appendChild(header);

  if (payload.message) {
    const message = document.createElement("p");
    message.textContent = payload.message;
    message.style.margin = "0";
    message.style.color = "var(--text-secondary)";
    container.appendChild(message);
  }

  const list = document.createElement("div");
  list.className = "results__list";

  if (payload.zip && payload.zip.url) {
    const zipItem = document.createElement("div");
    zipItem.className = "result-item";
    zipItem.innerHTML = `
      <div class="result-item__meta">
        <span class="result-item__name">Batch archive</span>
        <span class="result-item__subtitle">${payload.zip.filename}</span>
      </div>
      <a class="download-action" href="${payload.zip.url}" download>
        <span aria-hidden="true">⬇️</span>
        <span>Download ZIP</span>
      </a>
    `;
    list.appendChild(zipItem);
  }

  if (payload.files?.length && individualToggle.checked) {
    payload.files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "result-item";
      item.innerHTML = `
        <div class="result-item__meta">
          <span class="result-item__name">${file.converted_name || file.filename}</span>
          <span class="result-item__subtitle">Source: ${file.original_name}${file.size ? ` · ${file.size}` : ""}</span>
        </div>
        <a class="download-action" href="${file.url}" download>
          <span aria-hidden="true">🎧</span>
          <span>Download</span>
        </a>
      `;
      list.appendChild(item);
    });
  }

  if (skippedNotice) {
    const note = document.createElement("p");
    note.className = "field__hint";
    note.textContent = skippedNotice;
    list.appendChild(note);
    skippedNotice = null;
  }

  if (payload.warnings?.length) {
    payload.warnings.forEach((warning) => {
      const warn = document.createElement("p");
      warn.className = "field__hint";
      warn.style.color = "#fca5a5";
      warn.textContent = warning;
      list.appendChild(warn);
    });
  }

  if (!list.childElementCount) {
    const empty = document.createElement("p");
    empty.textContent = "No downloads were generated.";
    empty.style.color = "var(--text-secondary)";
    list.appendChild(empty);
  }

  container.appendChild(list);
  results.appendChild(container);
};

const handleResponse = (xhr) => {
  let payload = null;
  try {
    payload = JSON.parse(xhr.responseText);
  } catch (err) {
    showNotice("We couldn't parse the server response. Please try again.", "warn");
    return;
  }

  if (!payload || !payload.success) {
    const message = payload?.error || "Conversion failed. Please verify FFmpeg is installed and try again.";
    showNotice(message, "warn");
    return;
  }

  renderResults(payload);
};

const prepareFormData = () => {
  const formData = new FormData();
  Array.from(storage.files).forEach((file) => formData.append("audio_files", file));

  if (formatSelect.value === "custom") {
    formData.append("format", customFormatInput.value.trim().toLowerCase());
  } else {
    formData.append("format", formatSelect.value);
  }

  if (zipToggle.checked) {
    formData.append("bundle_zip", "1");
  }
  if (individualToggle.checked) {
    formData.append("individual_links", "1");
  }

  return formData;
};

const submitConversion = () => {
  resetResults();
  toggleLoading(true);
  updateProgress(5, "Uploading files…");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/convert", true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const uploaded = (event.loaded / event.total) * 50;
      updateProgress(Math.min(50, uploaded), "Uploading files…");
    }
  };

  xhr.onprogress = () => {
    updateProgress(75, "Converting audio…");
  };

  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
      updateProgress(60, "Processing…");
    }
  };

  xhr.onerror = () => {
    toggleLoading(false);
    showNotice("Network error. Please check your connection and try again.", "warn");
  };

  xhr.onload = () => {
    toggleLoading(false);
    if (xhr.status >= 200 && xhr.status < 300) {
      updateProgress(100, "Done");
      handleResponse(xhr);
    } else {
      showNotice("Conversion failed on the server. Please review your files and try again.", "warn");
    }
  };

  xhr.send(prepareFormData());
};

const clearFiles = () => {
  storage.items.clear();
  fileInput.value = "";
  renderFileList();
  resetResults();
};

const handleFormatChange = () => {
  const isCustom = formatSelect.value === "custom";
  customFormatField.classList.toggle("field--hidden", !isCustom);
  customFormatInput.required = isCustom;
  if (!isCustom) {
    customFormatInput.value = "";
  }
  updateButtons();
};

// Event listeners

browseButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files || []);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.dataset.active = "";
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.removeAttribute("data-active");
  });
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    showNotice("No files detected in that drop.", "warn");
    return;
  }
  addFiles(files);
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (storage.files.length === 0) {
    showNotice("Add at least one audio file to convert.", "warn");
    return;
  }
  if (formatSelect.value === "custom" && !customFormatInput.value.trim()) {
    showNotice("Enter a custom format extension (for example: aiff)", "warn");
    return;
  }
  submitConversion();
});

clearButton.addEventListener("click", clearFiles);
formatSelect.addEventListener("change", handleFormatChange);
customFormatInput.addEventListener("input", updateButtons);

renderFileList();
handleFormatChange();
