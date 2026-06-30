let webcamStream = null;

async function startCamera(videoEl) {
  webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 } });
  videoEl.srcObject = webcamStream;
  await videoEl.play();
}

function stopCamera() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
}

function capturePhotoAsDataUrl(videoEl, canvasEl) {
  const size = Math.min(videoEl.videoWidth, videoEl.videoHeight);
  canvasEl.width = size;
  canvasEl.height = size;
  const ctx = canvasEl.getContext('2d');
  const offsetX = (videoEl.videoWidth - size) / 2;
  const offsetY = (videoEl.videoHeight - size) / 2;
  ctx.drawImage(videoEl, offsetX, offsetY, size, size, 0, 0, size, size);
  return canvasEl.toDataURL('image/jpeg', 0.92);
}
