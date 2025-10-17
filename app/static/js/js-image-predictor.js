// Elements
const fileInput = document.getElementById("fileInput");
const uploadZone = document.getElementById("uploadZone");
const browseLink = document.getElementById("browseLink");
const previewSection = document.getElementById("previewSection");
const previewImage = document.getElementById("previewImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultSection = document.getElementById("resultSection");
const resultPose = document.getElementById("resultPose");

// Browse link click
browseLink.addEventListener("click", (e) => {
  e.preventDefault();
  fileInput.click();
});

// Upload zone click
uploadZone.addEventListener("click", () => {
  fileInput.click();
});

// File selection
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Drag and drop
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragover");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");

  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// Handle file
function handleFile(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();

    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewSection.classList.add("visible");
      analyzeBtn.classList.add("visible");
      resultSection.classList.remove("visible");
    };

    reader.readAsDataURL(file);
  }
}

// Analyze button
analyzeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Show loading state
  analyzeBtn.classList.add("loading");
  analyzeBtn.disabled = true;
  resultSection.classList.remove("visible");

  try {
    // Create FormData
    const formData = new FormData();
    formData.append("file", file);

    // Send to backend using the correct /predict endpoint
    const response = await fetch("/predict", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Display result with Sanskrit name prominent and English name smaller
      const sanskritName = data.sanskrit_name || data.pose || "Unknown Pose";
      const englishName = data.english_name || "";
      const confidence = data.confidence
        ? (data.confidence * 100).toFixed(1)
        : 0;

      resultPose.innerHTML = `
                  <div class="sanskrit-name">${sanskritName}</div>
                  ${
                    englishName
                      ? `<div class="english-name">${englishName}</div>`
                      : ""
                  }
                  <div class="confidence-badge">Confidence: ${confidence}%</div>
              `;
      resultSection.classList.add("visible");

      // Scroll to result
      setTimeout(() => {
        resultSection.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || "Prediction failed");
    }
  } catch (error) {
    console.error("Error:", error);

    // Show user-friendly error message
    const errorMessage = error.message.toLowerCase();
    let displayMessage = "";

    if (
      errorMessage.includes("no pose detected") ||
      errorMessage.includes("pose") ||
      errorMessage.includes("body") ||
      errorMessage.includes("landmark")
    ) {
      // Pose detection error - show friendly message
      displayMessage = `
        <div class="error-message">
          <div class="error-icon">🧘‍♀️</div>
          <div class="error-title">Unable to Detect Pose</div>
          <div class="error-text">Please ensure all body parts are clearly visible in the image</div>
          <div class="error-tips">
            <strong>Tips for better results:</strong>
            <ul>
              <li>Make sure your full body is visible in the frame</li>
              <li>Use good lighting conditions</li>
              <li>Avoid cluttered backgrounds</li>
              <li>Stand at an appropriate distance from the camera</li>
              <li>Ensure the pose is clearly defined</li>
            </ul>
          </div>
        </div>
      `;
    } else if (
      errorMessage.includes("file") ||
      errorMessage.includes("image")
    ) {
      // File/image error
      displayMessage = `
        <div class="error-message">
          <div class="error-icon">📷</div>
          <div class="error-title">Image Upload Issue</div>
          <div class="error-text">Please try uploading a different image file</div>
          <div class="error-tips">
            <strong>Supported formats:</strong> JPG, JPEG, PNG, BMP
          </div>
        </div>
      `;
    } else {
      // Generic error
      displayMessage = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Something Went Wrong</div>
          <div class="error-text">Please try again with a clear yoga pose image</div>
        </div>
      `;
    }

    resultPose.innerHTML = displayMessage;
    resultSection.classList.add("visible");

    // Scroll to result
    setTimeout(() => {
      resultSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  } finally {
    // Remove loading state
    analyzeBtn.classList.remove("loading");
    analyzeBtn.disabled = false;
  }
});
