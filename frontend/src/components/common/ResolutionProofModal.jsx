import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, MapPin, RefreshCw, X } from 'lucide-react';
import CameraModal from '../student/CameraModal';
import { getCurrentLocation, formatLocationCoordinates, parseLocationCoordinates } from '../../utils/location';

const haversineDistanceMeters = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const radius = 6371000;
  const deltaLatitude = ((latitudeB - latitudeA) * Math.PI) / 180;
  const deltaLongitude = ((longitudeB - longitudeA) * Math.PI) / 180;
  const startLatitude = (latitudeA * Math.PI) / 180;
  const endLatitude = (latitudeB * Math.PI) / 180;

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
};

const buildCaptureMetaLines = (issue, location) => {
  const lines = [
    `Issue ID: ${issue?.id || 'Unknown'}`,
    `Issue Title: ${issue?.title || 'Issue proof'}`,
  ];

  if (issue?.location) lines.push(`Issue Location: ${issue.location}`);
  if (issue?.blockNumber || issue?.floorNumber) {
    lines.push(`Block/Floor: ${issue?.blockNumber || 'N/A'} / ${issue?.floorNumber || 'N/A'}`);
  }
  if (issue?.latitude !== null && issue?.latitude !== undefined && issue?.longitude !== null && issue?.longitude !== undefined) {
    lines.push(`Issue Coordinates: ${formatLocationCoordinates(Number(issue.latitude), Number(issue.longitude))}`);
  }
  if (location) {
    lines.push(`Captured Coordinates: ${formatLocationCoordinates(location.latitude, location.longitude)}`);
    lines.push(`Captured Accuracy: ${Math.round(location.accuracy)}m`);
  }

  return lines;
};

export default function ResolutionProofModal({
  open,
  issue,
  user,
  onCancel,
  onSubmit,
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCapturedImage(null);
    setLocation(null);
    setSubmitError('');
    setSubmitting(false);

    let active = true;
    const detect = async () => {
      setLoadingLocation(true);
      try {
        const nextLocation = await getCurrentLocation();
        if (active) setLocation(nextLocation);
      } catch (error) {
        if (active) setSubmitError(error.message || 'Unable to detect location.');
      } finally {
        if (active) setLoadingLocation(false);
      }
    };

    detect();

    return () => {
      active = false;
    };
  }, [open]);

  const issueCoordinates = useMemo(() => {
    if (issue?.latitude !== null && issue?.latitude !== undefined && issue?.longitude !== null && issue?.longitude !== undefined) {
      return {
        latitude: Number(issue.latitude),
        longitude: Number(issue.longitude),
      };
    }

    return parseLocationCoordinates(issue?.location || '');
  }, [issue]);

  const distanceMeters = useMemo(() => {
    if (!issueCoordinates || !location) return null;
    return haversineDistanceMeters(issueCoordinates.latitude, issueCoordinates.longitude, location.latitude, location.longitude);
  }, [issueCoordinates, location]);

  const captureMetaLines = useMemo(() => buildCaptureMetaLines(issue, location), [issue, location]);

  const handleCapture = (frame) => {
    setCapturedImage(frame);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      setSubmitError('Capture a proof photo first.');
      return;
    }

    if (!location) {
      setSubmitError('Location is required to verify resolution.');
      return;
    }

    if (distanceMeters !== null && distanceMeters > 75) {
      setSubmitError(`You are too far from the issue location (${Math.round(distanceMeters)}m). Move closer and capture again.`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit({
        imageUrl: capturedImage.dataUrl,
        capturedAt: new Date().toISOString(),
        capturedByEmail: user?.email || '',
        capturedByName: user?.fullName || '',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        blockNumber: issue?.blockNumber || '',
        floorNumber: issue?.floorNumber || '',
        notes: `Resolved proof captured for ${issue?.id || 'issue'}`,
      });
      onCancel();
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit resolution proof.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation" onClick={onCancel}>
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Resolution proof capture">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resolution proof required</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Capture proof before marking resolved</h3>
            </div>
            <button type="button" onClick={onCancel} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10" aria-label="Close proof modal">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-blue-300" />
                <div>
                  <p className="font-semibold text-white">Verification rules</p>
                  <p className="mt-1 text-slate-300">
                    The photo must be captured on site, the GPS reading must be close to the issue coordinates, and block/floor details must match the issue record when present.
                  </p>
                  {distanceMeters !== null && (
                    <p className="mt-2 text-xs text-slate-400">
                      Current distance to issue: {Math.round(distanceMeters)}m. Allowed range: 75m or less.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
                {loadingLocation ? (
                  <p className="mt-2 text-sm text-slate-300">Detecting location...</p>
                ) : location ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    <p>{formatLocationCoordinates(location.latitude, location.longitude)}</p>
                    <p className="text-xs text-slate-400">Accuracy: {Math.round(location.accuracy)}m</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-rose-300">{submitError || 'Location unavailable.'}</p>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setSubmitError('');
                    setLoadingLocation(true);
                    try {
                      const nextLocation = await getCurrentLocation();
                      setLocation(nextLocation);
                    } catch (error) {
                      setSubmitError(error.message || 'Unable to detect location.');
                    } finally {
                      setLoadingLocation(false);
                    }
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <RefreshCw size={14} />
                  Re-detect location
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Proof photo</p>
                {capturedImage ? (
                  <div className="mt-2 space-y-3">
                    <img src={capturedImage.dataUrl} alt="Resolution proof" className="h-40 w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Retake photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Camera size={16} />
                    Capture proof photo
                  </button>
                )}
              </div>
            </div>

            {issueCoordinates && location && distanceMeters !== null ? (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${distanceMeters <= 75 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
                {distanceMeters <= 75 ? 'Location check passed.' : 'Location is outside the allowed range.'}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>{submitError}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !capturedImage || !location}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {submitting ? 'Submitting...' : 'Confirm resolved status'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={cameraOpen}
        captureMetaLines={captureMetaLines}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
}
