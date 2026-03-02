import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera as CameraIcon, Loader, AlertCircle, CheckCircle, ArrowLeft, Lightbulb } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import FormField from '../../components/auth/FormField';
import SelectField from '../../components/auth/SelectField';
import AlertMessage from '../../components/auth/AlertMessage';
import CameraModal from '../../components/student/CameraModal';
import { getAuthSession } from '../../utils/auth';
import { createIssue } from '../../utils/issues';
import { getCurrentLocation, formatLocationCoordinates } from '../../utils/location';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, generateIssueId, CATEGORY_TO_DEPARTMENT } from '../../constants/issues';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const session = getAuthSession();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'medium',
    latitude: null,
    longitude: null,
    imageUrl: null,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Auto-detect location on page load
  useEffect(() => {
    const detectLocation = async () => {
      setLocationLoading(true);
      try {
        const loc = await getCurrentLocation();
        setFormData((prev) => ({
          ...prev,
          latitude: loc.latitude,
          longitude: loc.longitude,
          location: `${formatLocationCoordinates(loc.latitude, loc.longitude)}`,
        }));
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLocationLoading(false);
      }
    };

    detectLocation();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const handleCameraCapture = (frame) => {
    setCapturedImage(frame);
    setFormData((prev) => ({
      ...prev,
      imageUrl: frame.dataUrl,
    }));
  };

  const handleRemoveImage = () => {
    setCapturedImage(null);
    setFormData((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = 'Issue title is required.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';
    if (!formData.category) nextErrors.category = 'Category is required.';
    if (!formData.location.trim()) nextErrors.location = 'Location is required.';
    if (!formData.imageUrl) nextErrors.imageUrl = 'Photo is required (capture from camera).';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const issuePayload = {
      id: generateIssueId(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      imageUrl: formData.imageUrl,
      priority: formData.priority,
      status: 'submitted',
      studentEmail: session?.email,
      studentName: session?.fullName,
      assignedDepartment: CATEGORY_TO_DEPARTMENT[formData.category],
      remarks: [],
      supports: 0,
      supportedBy: [],
      comments: [],
    };

    try {
      const issue = createIssue(issuePayload);
      setLoading(false);
      
      // Create appropriate success message based on assignment status
      const statusMessage = issue.status === 'assigned' 
        ? `Issue ${issue.id} reported and automatically assigned to ${issue.assignedToName || 'staff'}. Status: Assigned`
        : `Issue ${issue.id} reported successfully. Status: Pending Assignment`;
      
      navigate('/dashboard/student', {
        state: { message: statusMessage },
      });
    } catch (error) {
      setLoading(false);
      setMessage('Failed to report issue. Please try again.');
    }
  };

  return (
    <DashboardShell
      title="Report New Issue"
      subtitle="Submit a detailed campus infrastructure issue with live photo and location"
      roleLabel="Student"
    >
      <button
        onClick={() => navigate('/dashboard/student')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Issue Details</h2>

          <AlertMessage message={message} />

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Location Section */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} className="text-blue-600" />
                <h3 className="font-semibold text-blue-900">Auto-Detected Location</h3>
              </div>
              {locationLoading ? (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader size={16} className="animate-spin" />
                  <span>Detecting GPS location...</span>
                </div>
              ) : formData.latitude ? (
                <div>
                  <p className="text-sm text-blue-800 font-mono">
                    {formatLocationCoordinates(formData.latitude, formData.longitude)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <a
                      href={`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      View on Map
                    </a>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-700">Location detection failed. Please enable location access.</p>
              )}
            </div>

            <FormField
              id="title"
              label="Issue Title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief summary of the issue"
              error={errors.title}
            />

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed description of the problem..."
                rows={4}
                className="input-field"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <SelectField
              id="category"
              label="Issue Category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              options={ISSUE_CATEGORIES}
              placeholder="Select category"
            />

            {/* Camera Capture Section */}
            <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CameraIcon size={18} className="text-amber-600" />
                <h3 className="font-semibold text-amber-900">Live Camera Photo</h3>
              </div>

              {capturedImage ? (
                <div>
                  <img
                    src={capturedImage.dataUrl}
                    alt="Captured issue"
                    className="mb-3 h-40 w-full rounded-lg object-cover"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="flex-1 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200 transition"
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle size={14} /> Photo captured
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 transition flex items-center justify-center gap-2"
                >
                  <CameraIcon size={18} />
                  Take Photo Now
                </button>
              )}
              {errors.imageUrl && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.imageUrl}
                </p>
              )}
            </div>

            <SelectField
              id="priority"
              label="Priority Level"
              value={formData.priority}
              onChange={handleChange}
              options={ISSUE_PRIORITIES}
            />

            <button
              type="submit"
              disabled={loading || locationLoading}
              className="primary-button flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Issue Report'
              )}
            </button>
          </form>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card h-fit">
          <h3 className="mb-3 font-semibold text-slate-900">Guidelines</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Location auto-detected via GPS</li>
            <li>• Take clear, well-lit photos</li>
            <li>• Be specific about the issue</li>
            <li>• Set appropriate priority level</li>
            <li>• Track status in dashboard</li>
          </ul>

          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Camera Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use good lighting</li>
              <li>• Focus on the issue area</li>
              <li>• Include reference objects for scale</li>
              <li>• Avoid blurry images</li>
            </ul>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={cameraOpen}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />
    </DashboardShell>
  );
}
