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

export const captureFrame = (videoElement) => {
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
