import { useMemo, useState } from 'react';
import { X, Download, FileDown, Copy } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const deriveFileName = (url, fallbackName = 'issue-image') => {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
    return lastSegment || fallbackName;
  } catch {
    return fallbackName;
  }
};

const triggerDownload = async ({ url, fileName }) => {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('Failed to fetch image for download.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const triggerTextDownload = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const summarizeImageSource = (url) => {
  if (!url) return 'Unknown';
  if (url.startsWith('data:image/')) return 'Embedded image data (base64 omitted)';

  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
};

const buildDetailsText = (details) => {
  return [
    'Issue Image Details',
    '====================',
    `Issue ID: ${details?.issueId || 'Unknown'}`,
    `Issue Title: ${details?.issueTitle || 'Issue image'}`,
    `Uploaded By: ${details?.uploadedBy || 'Unknown'}`,
    `Uploaded At: ${details?.uploadedAt || 'Unknown'}`,
    `File Name: ${details?.fileName || 'issue-image'}`,
    `Storage: ${details?.storageProvider || 'legacy-image-url'}`,
    `Image Source: ${summarizeImageSource(details?.imageUrl)}`,
    '',
    'Note: the full image content is not embedded in this details file.',
  ].join('\n');
};

export default function ImageViewerModal({
  open,
  imageUrl,
  title,
  issueId,
  issueTitle,
  reporterName,
  reporterEmail,
  reportedAt,
  attachment,
  onClose,
}) {
  const [downloadState, setDownloadState] = useState('idle');
  const [notice, setNotice] = useState('');

  const details = useMemo(() => {
    if (!attachment && !imageUrl) return null;

    return {
      issueId: issueId || attachment?.issueId?.id || 'Unknown',
      issueTitle: issueTitle || attachment?.issueId?.title || title || 'Issue image',
      fileName: attachment?.fileName || deriveFileName(imageUrl),
      uploadedBy: attachment?.uploadedByEmail || reporterEmail || reporterName || 'Unknown',
      uploadedAt: formatDateTime(attachment?.uploadedAt || reportedAt),
      sizeBytes: attachment?.sizeBytes ?? null,
      storageProvider: attachment?.storageProvider || 'legacy-image-url',
      imageUrl,
    };
  }, [attachment, imageUrl, issueId, issueTitle, title, reporterEmail, reporterName, reportedAt]);

  if (!open || !imageUrl) return null;

  const handleDownloadImage = async () => {
    try {
      setNotice('');
      setDownloadState('downloading-image');
      await triggerDownload({
        url: imageUrl,
        fileName: details?.fileName || 'issue-image',
      });
      setNotice('Image download started.');
    } catch (error) {
      console.error('Image download error:', error);
      setNotice('Unable to download image right now.');
    } finally {
      setDownloadState('idle');
    }
  };

  const handleDownloadDetails = () => {
    const fileName = `${details?.issueId || 'issue'}-image-details.txt`;
    triggerTextDownload(buildDetailsText(details), fileName);
    setNotice('Details file downloaded.');
  };

  const handleCopyDetails = async () => {
    try {
      const payload = [
        `Issue ID: ${details?.issueId || 'Unknown'}`,
        `Issue Title: ${details?.issueTitle || 'Issue image'}`,
        `Uploaded By: ${details?.uploadedBy || 'Unknown'}`,
        `Uploaded At: ${details?.uploadedAt || 'Unknown'}`,
        `File Name: ${details?.fileName || 'issue-image'}`,
        `Storage: ${details?.storageProvider || 'legacy-image-url'}`,
        `Image Source: ${summarizeImageSource(imageUrl)}`,
      ].join('\n');

      await navigator.clipboard.writeText(payload);
      setNotice('Details copied to clipboard.');
    } catch (error) {
      console.error('Copy details error:', error);
      setNotice('Unable to copy details right now.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Image viewer'}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-slate-900">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <h3 className="text-sm font-semibold text-white">{title || 'Uploaded image'}</h3>
              <p className="mt-1 text-xs text-slate-300">View, download, or save the evidence without leaving the page.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
              aria-label="Close image viewer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-black px-3 py-4 sm:px-6">
            <img
              src={imageUrl}
              alt={title || 'Uploaded issue evidence'}
              className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>

        <aside className="w-full max-w-[22rem] border-l border-white/10 bg-slate-950 px-4 py-5 text-slate-100 sm:px-5">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Image Details</p>
              <h4 className="mt-1 text-lg font-semibold text-white">{details?.issueTitle || title || 'Issue image'}</h4>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Issue ID</p>
                  <p className="mt-1 font-medium text-white">{details?.issueId || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Uploaded by</p>
                  <p className="mt-1 break-words font-medium text-white">{details?.uploadedBy || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Uploaded at</p>
                  <p className="mt-1 font-medium text-white">{details?.uploadedAt || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">File name</p>
                  <p className="mt-1 break-words font-medium text-white">{details?.fileName || 'issue-image'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Storage</p>
                  <p className="mt-1 font-medium text-white">{details?.storageProvider || 'legacy-image-url'}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={downloadState !== 'idle'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                Download image
              </button>
              <button
                type="button"
                onClick={handleDownloadDetails}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FileDown size={16} />
                Save details
              </button>
              <button
                type="button"
                onClick={handleCopyDetails}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Copy size={16} />
                Copy details
              </button>
            </div>

            {notice ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                {notice}
              </p>
            ) : null}

            <p className="text-xs leading-5 text-slate-400">
              The details file includes who uploaded the image, when it was uploaded, the issue ID, and the storage source.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}