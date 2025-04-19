const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const output = document.getElementById("output");
const resetBtn = document.getElementById("resetBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const downloadEachBtn = document.getElementById("downloadEachBtn");
const outputFormatSelect = document.getElementById("outputFormat"); // Get the dropdown
const targetSizeInput = document.getElementById("targetSize"); // Get the desired size input
const pageTitle = document.querySelector("title");
const mainHeading = document.getElementById("mainHeading");
const mainSubtext = document.getElementById("mainSubtext");

function updateContent(format) {
  let label = "";
  let extension = "";

  switch (format) {
    case "image/jpeg":
      label = "JPG/JPEG";
      extension = "JPG";
      break;
    case "image/webp":
      label = "WEBP";
      extension = "WEBP";
      break;
    case "image/png":
      label = "PNG";
      extension = "PNG";
      break;
    default:
      label = "JPG/JPEG";
      extension = "JPG";
  }

  // Update title, heading, subtext, footer
  const newTitle = `Image to ${label} Converter - Free & Fast Online Tool`;
  pageTitle.textContent = newTitle;
  mainHeading.textContent = `Image to ${label} Converter`;
  mainSubtext.textContent = `Free, lightweight, and browser-based 🌱. Convert your Images to ${label} locally.`;
}

outputFormatSelect.addEventListener("change", function () {
  updateContent(this.value);
});

// Initialize on page load
updateContent(outputFormatSelect.value);

let convertedImages = []; // Store {name, blob}

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFiles);
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("border-blue-400");
});
dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("border-blue-400");
});
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("border-blue-400");
  handleFiles({ target: { files: e.dataTransfer.files } });
});

resetBtn.addEventListener("click", () => {
  output.innerHTML = ""; // Clear the preview container
  convertedImages = []; // Clear the array of converted images
  fileInput.value = "";
});

// Function to disable all buttons except the delete buttons
function disableButtons() {
  const buttons = document.querySelectorAll("button:not(.text-red-500)");
  buttons.forEach((button) => {
    button.disabled = true; // Disable the button
    button.classList.add("bg-gray-400", "text-gray-700", "cursor-not-allowed"); // Apply disabled styles
  });
}

// Function to enable all buttons except the delete buttons
function enableButtons() {
  const buttons = document.querySelectorAll("button:not(.text-red-500)");
  buttons.forEach((button) => {
    button.disabled = false; // Enable the button
    button.classList.remove("bg-gray-400", "text-gray-700", "cursor-not-allowed"); // Remove disabled styles
  });
}


downloadAllBtn.addEventListener("click", async () => {
  const targetSize = parseInt(targetSizeInput.value, 10); // Get target size from input
  const outputFormat = outputFormatSelect.value; // Get the selected output format (e.g., 'image/webp')
  const zip = new JSZip();

  const imageElements = Array.from(output.querySelectorAll("img"));
  if (imageElements.length === 0) return;

  disableButtons();

  for (const imgEl of imageElements) {
    const src = imgEl.src;
    const name = imgEl.alt.replace(/\.\w+$/, `.${outputFormat.split("/")[1]}`); // Correct extension based on format

    const img = new Image();
    img.src = src;
    await new Promise((resolve) => (img.onload = resolve));

    const { blob } = await compressToTargetSize(img, targetSize);
    zip.file(name, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = "converted_images.zip";
  link.click();

  enableButtons();
});

downloadEachBtn.addEventListener("click", async () => {
  const targetSize = parseInt(targetSizeInput.value, 10); // Get target size from input
  const outputFormat = outputFormatSelect.value; // Get the selected output format (e.g., 'image/webp')
  const imageElements = Array.from(output.querySelectorAll("img"));
  if (imageElements.length === 0) return;

  disableButtons();

  for (const imgEl of imageElements) {
    const src = imgEl.src;
    const name = imgEl.alt.replace(/\.\w+$/, `.${outputFormat.split("/")[1]}`); // Correct extension based on format

    const img = new Image();
    img.src = src;
    await new Promise((resolve) => (img.onload = resolve));

    const { blob } = await compressToTargetSize(img, targetSize);

    // Create a download link with the compressed blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none"; // Hide the link during the process
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up after download
    URL.revokeObjectURL(url); // Revoke URL to release memory
  }

  enableButtons();
});

async function compressToTargetSize(img, targetSizeKB) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  let quality = 0.95;
  const step = 0.05;
  let blob;

  while (quality > 0) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob.size / 1024 <= targetSizeKB || quality <= step) break;
    quality -= step;
  }

  return { blob, quality };
}

function handleFiles(event) {
  const supportedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/bmp",
    "image/gif",
  ];
  const files = Array.from(event.target.files).filter((file) =>
    supportedTypes.includes(file.type)
  );

  files.forEach((file) => {
    const previewContainer = document.createElement("div");
    previewContainer.className =
      "flex flex-col items-center border border-gray-200 rounded-lg p-4 bg-gray-50 relative mt-4";

    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "absolute top-0 right-2 text-red-500 hover:text-red-700 text-4xl";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.addEventListener("click", () => {
      output.removeChild(previewContainer);
      convertedImages = convertedImages.filter(
        (img) => img.name !== file.name.replace(/\.\w+$/, ".jpg")
      );
    });

    const img = document.createElement("img");
    img.className = "max-w-full max-h-48 mb-4 rounded";
    img.alt = file.name;

    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    previewContainer.appendChild(deleteBtn);
    previewContainer.appendChild(img);
    output.appendChild(previewContainer);

    convertAndStore(file, previewContainer);
  });
}

function convertAndStore(file, container) {
  const outputFormat = outputFormatSelect.value; // Get the selected output format

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = async function () {
      const targetSize = parseInt(targetSizeInput.value, 10); // Get target size from input
      const { blob, quality } = await compressToTargetSize(img, targetSize);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.replace(
        /\.\w+$/,
        `.${outputFormat.split("/")[1]}` // Set the new extension
      );
      link.className =
        "inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700";
      link.textContent = `Download ${link.download} (Q: ${Math.round(
        quality * 100
      )}%)`;
      container.appendChild(link);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
