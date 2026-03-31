 export const requestCameraAccess = async () => {
  try {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not supported in this browser. Please use a modern browser (Chrome, Firefox, Safari, Edge).');
    }

    // Request camera with fallback options
    let stream;
    try {
      // Try with rear camera first (mobile)
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch {
      // Fallback to any available camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    return stream;
  } catch (error) {
    let message = 'Camera access error';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'Camera permission denied. Please:\n1. Check browser camera permissions\n2. Clear browser cache\n3. Use HTTPS (if on web)\n4. Try incognito mode';
    } else if (error.name === 'NotFoundError') {
      message = 'No camera device found. Please connect a camera or check device permissions.';
    } else if (error.name === 'NotReadableError') {
      message = 'Camera is already in use by another application. Close it and try again.';
    } else if (error.name === 'SecurityError') {
      message = 'Camera access blocked by security policy. Try using HTTPS or a different browser.';
    } else {
      message = error.message || 'Failed to access camera. Please try again.';
    }
    
    throw new Error(message);
  }
};

export const captureFrame = (videoElement, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
        reject(new Error('Video stream not ready. Please wait a moment and try again.'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      context.drawImage(videoElement, 0, 0);

      const overlayLines = Array.isArray(options.overlayLines)
        ? options.overlayLines.map((line) => String(line || '').trim()).filter(Boolean)
        : [];

      if (overlayLines.length > 0) {
        const padding = Math.max(10, Math.round(canvas.width * 0.015));
        const fontSize = Math.max(12, Math.round(canvas.width * 0.022));
        const lineHeight = Math.round(fontSize * 1.35);
        const blockHeight = padding * 2 + overlayLines.length * lineHeight;

        context.fillStyle = 'rgba(15, 23, 42, 0.72)';
        context.fillRect(0, canvas.height - blockHeight, canvas.width, blockHeight);

        context.fillStyle = '#f8fafc';
        context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        context.textBaseline = 'top';

        overlayLines.forEach((line, index) => {
          const y = canvas.height - blockHeight + padding + index * lineHeight;
          context.fillText(line, padding, y);
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result,
              width: canvas.width,
              height: canvas.height,
            });
          };
          reader.onerror = () => {
            reject(new Error('Failed to read image data'));
          };
          reader.readAsDataURL(blob);
        } else {
          reject(new Error('Failed to capture image from canvas'));
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      reject(error);
    }
  });
};

export const stopMediaStream = (stream) => {
  if (!stream) return;
  
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (error) {
    console.error('Error stopping media stream:', error);
  }
};
