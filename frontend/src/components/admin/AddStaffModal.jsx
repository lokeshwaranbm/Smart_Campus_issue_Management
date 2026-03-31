import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import FormField from '../auth/FormField';
import PasswordField from '../auth/PasswordField';
import AlertMessage from '../auth/AlertMessage';

export default function AddStaffModal({ onClose, onAdd, categoryOptions = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    assignedCategories: [],
    password: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    'Agricultural Engineering',
    'Artificial Intelligence and Data Science',
    'Biomedical Engineering',
    'Chemical Engineering',
    'Chemistry',
    'Civil Engineering',
    'Computer Science and Engineering',
    'Cyber Security',
    'Electrical and Electronics Engineering',
    'Electronics and Communication Engineering',
    'English',
    'Information Technology',
    'Internet of Things',
    'Master of Business Administration',
    'Master of Computer Applications',
    'Maths',
    'Mechanical Engineering',
    'News Letter',
    'Physics',
  ];

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      assignedCategories: prev.assignedCategories.includes(categoryId)
        ? prev.assignedCategories.filter((id) => id !== categoryId)
        : [...prev.assignedCategories, categoryId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.department || !formData.password) {
      setMessage('Please fill all required fields');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      onAdd(formData);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Add New Staff Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AlertMessage message={message} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Full Name *"
                type="text"
                placeholder="John Maintenance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <FormField
                label="Email *"
                type="email"
                placeholder="john@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <FormField
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <FormField
                label="Employee ID"
                type="text"
                placeholder="EMP001"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <PasswordField
                id="password"
                label="Password *"
                placeholder="Create login password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                showPassword={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            </div>

            {/* Assign Categories */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Assign Categories
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {categoryOptions.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus size={16} />
                {loading ? 'Creating...' : 'Add Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
