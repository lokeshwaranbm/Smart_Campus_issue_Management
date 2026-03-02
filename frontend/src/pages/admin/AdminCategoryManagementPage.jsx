import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Trash2, Edit2, Users, Clock, ArrowLeft } from 'lucide-react';
import AlertMessage from '../../components/auth/AlertMessage';
import FormField from '../../components/auth/FormField';
import SelectField from '../../components/auth/SelectField';

export default function AdminCategoryManagementPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slaHours: 24,
    assignedStaff: [],
  });

  const CATEGORY_OPTIONS = [
    'Electrical',
    'Plumbing',
    'Network',
    'Cleanliness',
    'Hostel',
    'Transport',
    'Maintenance',
    'Other',
  ];

  useEffect(() => {
    fetchCategories();
    fetchStaffList();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.ok) {
        setCategories(result.data);
      }
    } catch (error) {
      setMessage('Failed to load categories: ' + error.message);
    }
  };

  const fetchStaffList = async () => {
    try {
      // TODO: Replace with actual API call
      setStaffList([
        { id: 1, name: 'John Maintenance', role: 'maintenance' },
        { id: 2, name: 'Jane Electrician', role: 'maintenance' },
        { id: 3, name: 'Bob Plumber', role: 'maintenance' },
      ]);
    } catch (error) {
      setMessage('Failed to load staff: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.slaHours) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isEditing ? `/api/categories/${editingId}` : '/api/categories';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.ok) {
        setMessage(result.message);
        setFormData({ name: '', description: '', slaHours: 24, assignedStaff: [] });
        setIsEditing(false);
        setEditingId(null);
        fetchCategories();
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (error) {
      setMessage('Failed to save category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description,
      slaHours: category.slaHours,
      assignedStaff: category.assignedStaff.map((s) => s.id),
    });
    setEditingId(category._id);
    setIsEditing(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.ok) {
        setMessage(result.message);
        fetchCategories();
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (error) {
      setMessage('Failed to delete category: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Category Management</h1>
          <p className="mt-2 text-slate-600">Create and manage issue categories with automated staff assignment</p>
        </div>

        <AlertMessage message={message} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <SelectField
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  options={CATEGORY_OPTIONS}
                  required
                  disabled={isEditing}
                />

                <FormField
                  label="Description"
                  type="text"
                  placeholder="e.g., Electrical issues in buildings"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <FormField
                  label="SLA Hours (Response Time)"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.slaHours}
                  onChange={(e) => setFormData({ ...formData, slaHours: parseInt(e.target.value) })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign Staff Members
                  </label>
                  <div className="space-y-2">
                    {staffList.map((staff) => (
                      <label key={staff.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.assignedStaff.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assignedStaff: [...formData.assignedStaff, staff.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assignedStaff: formData.assignedStaff.filter((id) => id !== staff.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-700">{staff.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setFormData({ name: '', description: '', slaHours: 24, assignedStaff: [] });
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white shadow-md overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Active Categories</h2>
              </div>

              {categories.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600">No categories created yet. Create one to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {categories.map((category) => (
                    <div key={category._id} className="p-6 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                          {category.description && (
                            <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock size={16} />
                              <span>SLA: {category.slaHours}h</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users size={16} />
                              <span>{category.assignedStaff?.length || 0} staff assigned</span>
                            </div>
                          </div>

                          {category.assignedStaff?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-slate-500 uppercase">Assigned Staff:</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {category.assignedStaff.map((staff) => (
                                  <span
                                    key={staff._id}
                                    className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                                  >
                                    {staff.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                            title="Edit"
                          >
                            <Edit2 size={18} className="text-slate-600" />
                          </button>

                          <button
                            onClick={() => handleDelete(category._id)}
                            className="rounded-lg border border-red-300 p-2 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
