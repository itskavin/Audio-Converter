// Click to browse functionality
document.getElementById("drop-area").addEventListener("click", () => {
  document.getElementById("fileElem").click();
});

// File selection change handler
document.getElementById("fileElem").addEventListener("change", () => {
  document.getElementById("fileLabel").innerText = [...fileElem.files].map(f => f.name).join(", ");
});

// Drag and drop functionality
const dropArea = document.getElementById("drop-area");

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  dropArea.classList.add('drag-over');
}

function unhighlight(e) {
  dropArea.classList.remove('drag-over');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  // Update the file input element with dropped files
  document.getElementById("fileElem").files = files;
  document.getElementById("fileLabel").innerText = [...files].map(f => f.name).join(", ");
}

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const files = fileElem.files;
  const format = document.getElementById("format").value;

  if (files.length === 0) {
    alert("Please select at least one .aac file.");
    return;
  }

  const formData = new FormData();
  for (let file of files) {
    formData.append("audio_files", file);
  }
  formData.append("format", format);

  const progressBar = document.getElementById("progressBar");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/convert", true);

  // Upload progress
  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 80; // Upload is 80% of bar
      progressBar.value = percent;
    }
  });

  // Simulate conversion progress after upload
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 2) { // Headers received, conversion started
      let convProgress = 80;
      progressBar.value = convProgress;
      const interval = setInterval(() => {
        convProgress += 2;
        if (convProgress >= 99) convProgress = 99;
        progressBar.value = convProgress;
        if (xhr.readyState === 4) {
          clearInterval(interval);
          progressBar.value = 100;
        }
      }, 200);
    }
  };

  xhr.responseType = 'json';
  xhr.onload = () => {
    if (xhr.status === 200) {
      const response = xhr.response;
      if (response.success && response.files) {
        // Download each file individually with a small delay
        response.files.forEach((file, index) => {
          setTimeout(() => {
            const link = document.createElement("a");
            link.href = `/download/${file.filename}`;
            link.download = file.filename;
            link.click();
          }, index * 500); // 500ms delay between downloads
        });
        
        // Show success message
        document.getElementById("fileLabel").innerText = `Successfully converted ${response.files.length} file(s)!`;
        setTimeout(() => {
          document.getElementById("fileLabel").innerText = "Drop .aac files or click to browse";
        }, 3000);
      }
      progressBar.value = 0;
    } else {
      alert("Conversion failed.");
      progressBar.value = 0;
    }
  };
  xhr.send(formData);
});

// Dark mode toggle
const toggleBtn = document.getElementById("toggle-dark");
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "1" : "0");
});

// Persist dark mode
// Enable dark mode by default
document.body.classList.add("dark-mode");
if (localStorage.getItem("darkMode") === "0") {
  document.body.classList.remove("dark-mode");
}
