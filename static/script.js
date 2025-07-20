document.getElementById("drop-area").addEventListener("click", () => {
  document.getElementById("fileElem").click();
});

document.getElementById("fileElem").addEventListener("change", () => {
  document.getElementById("fileLabel").innerText = [...fileElem.files].map(f => f.name).join(", ");
});

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

  xhr.responseType = 'blob';
  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = new Blob([xhr.response], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "converted_audio.zip";
      link.click();
      progressBar.value = 0;
    } else {
      alert("Conversion failed.");
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
