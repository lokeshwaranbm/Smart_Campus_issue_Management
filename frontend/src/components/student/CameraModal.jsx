import { useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { requestCameraAccess, captureFrame, stopMediaStream } from '../../utils/camera';

export default function CameraModal({ isOpen, onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initTimeout, setInitTimeout] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initCamera = async () => {
      setIsLoading(true);
      setError('');
      setInitTimeout(false);

      // Set a timeout to show message if camera takes too long
      const timeoutId = setTimeout(() => {
        setInitTimeout(true);
        setError('Camera is taking longer than expected. Please grant camera permission in your browser settings.');
      }, 8000);

      try {
        const videoStream = await requestCameraAccess();
        clearTimeout(timeoutId);
        
        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          
          // Wait for video to be ready to play
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch((err) => {
              setError('Failed to play video: ' + err.message);
            });
          };
        }

        setStream(videoStream);
        setIsLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stopMediaStream(stream);
      }
    };
  }, [isOpen]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError('');
    try {
      const frame = await captureFrame(videoRef.current);
      setCapturedImage(frame);
    } catch (err) {
      setError('Failed to capture image: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stopMediaStream(stream);
      setStream(null);
    }
    setCapturedImage(null);
    setError('');
    setInitTimeout(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-2xl bg-slate-900 sm:max-w-md sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-white">Capture Issue Photo</h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Camera Error</p>
                  <p>{error}</p>
                  {initTimeout && (
                    <p className="text-xs mt-2 text-red-300">
                      Try: 1) Refresh page, 2) Check browser camera permissions, 3) Use HTTPS
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!capturedImage ? (
            <>
              {/* Camera View */}
              <div className="relative overflow-hidden rounded-xl bg-black mb-4">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-white" />
                      <p className="text-sm text-slate-300">Initializing camera...</p>
                      <p className="text-xs text-slate-500 mt-2">Please grant camera permission</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-64 w-full object-cover sm:h-80 bg-black"
                />
              </div>

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                disabled={isLoading || !stream}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                {isLoading ? 'Initializing...' : 'Take Photo'}
              </button>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="mb-4 overflow-hidden rounded-xl">
                <img
                  src={capturedImage.dataUrl}
                  alt="Captured"
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRetake}
                  className="rounded-lg border border-slate-600 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="border-t border-slate-700 px-4 py-3 text-xs text-slate-400">
          Tip: Ensure good lighting and allow camera access when prompted.
        </div>
      </div>
    </div>
  );
}
