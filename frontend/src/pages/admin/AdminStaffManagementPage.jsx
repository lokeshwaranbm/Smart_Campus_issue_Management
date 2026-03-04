import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import AddStaffModal from '../../components/admin/AddStaffModal';
import EditStaffModal from '../../components/admin/EditStaffModal';
import { ISSUE_CATEGORIES } from '../../constants/issues';
import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
} from '../../utils/auth';
import { getIssues } from '../../utils/issues';

export default function AdminStaffManagementPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [usesPagination, setUsesPagination] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const categoryOptions = ISSUE_CATEGORIES.map((item) => ({ id: item.value, name: item.label }));

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery, departmentFilter, statusFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const accounts = getStaffAccounts();
      const allIssues = getIssues();
      
      const normalized = accounts.map((entry) => {
        const categories = (entry.assignedCategories || []).map((category) => {
          if (typeof category === 'string') {
            const matched = categoryOptions.find((item) => item.id === category);
            return matched || { id: category, name: category };
          }
          if (category?.id && category?.name) return category;
          if (category?._id && category?.name) return { id: category._id, name: category.name };
          return null;
        }).filter(Boolean);

        // Calculate real-time stats from issues
        const staffIssues = allIssues.filter(issue => issue.assignedTo === entry.email);
        const totalIssues = staffIssues.length;
        const pendingIssues = staffIssues.filter(issue => 
          issue.status === 'submitted' || issue.status === 'assigned'
        ).length;
        const activeIssues = staffIssues.filter(issue => 
          issue.status === 'in-progress'
        ).length;
        const completedIssues = staffIssues.filter(issue => 
          issue.status === 'resolved' || issue.status === 'closed'
        ).length;
        
        // Calculate SLA compliance (simplified)
        const slaCompliancePercent = totalIssues > 0 
          ? Math.round((completedIssues / totalIssues) * 100) 
          : 100;

        return {
          _id: entry.staffId || entry.email,
          name: entry.fullName || '',
          email: entry.email || '',
          password: entry.password || '',
          phone: entry.phoneNumber || '',
          department: entry.department || 'General',
          assignedCategories: categories,
          isActive: entry.status === 'active',
          isSuspended: entry.status === 'inactive' || entry.status === 'suspended',
          stats: {
            totalIssues,
            pendingIssues,
            activeIssues,
            completedIssues,
            slaCompliancePercent,
            overdueIssues: 0,
            averageResolutionHours: 0,
          },
        };
      });

      setStaff(normalized);
    } catch (error) {
      setMessageType('error');
      setMessage('Failed to load staff: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          (s.phone || '').includes(query)
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((s) => s.department === departmentFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((s) => s.isActive && !s.isSuspended);
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter((s) => s.isSuspended);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((s) => !s.isActive);
    }

    setFilteredStaff(filtered);
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete staff account for ${staffName}?`);
    if (!isConfirmed) return;

    try {
      const target = staff.find((s) => s._id === staffId);
      if (!target) {
        setMessageType('error');
        setMessage('Staff account not found.');
        return;
      }

      const result = deleteStaffAccount(target.email);
      if (!result.ok) {
        setMessageType('error');
        setMessage(result.message);
        return;
      }

      fetchStaff();
      setMessageType('success');
      setMessage(`Staff member ${staffName} deleted successfully`);
    } catch (error) {
      setMessageType('error');
      setMessage('Error: ' + error.message);
    }
  };

  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  const handleAddStaff = (newStaffData) => {
    const selectedCategories = (newStaffData.assignedCategories || []);

    const result = createStaffAccount({
      fullName: newStaffData.name,
      email: newStaffData.email,
      password: newStaffData.password,
      phoneNumber: newStaffData.phone,
      department: newStaffData.department,
      assignedCategories: selectedCategories,  // Already in correct format (array of strings)
    });

    if (!result.ok) {
      setMessageType('error');
      setMessage(result.message);
      return;
    }

    fetchStaff();
    setShowAddModal(false);
    setMessageType('success');
    setMessage(`Staff member ${newStaffData.name} added successfully`);
  };

  const handleUpdateStaff = (updatedStaffData) => {
    const original = selectedStaff;
    if (!original) return;

    // Extract just the category IDs as strings
    const selectedCategories = (updatedStaffData.assignedCategories || []);

    const status = updatedStaffData.isSuspended ? 'inactive' : 'active';

    const result = updateStaffAccount(original.email, {
      fullName: updatedStaffData.name,
      email: updatedStaffData.email,
      phoneNumber: updatedStaffData.phone,
      department: updatedStaffData.department,
      assignedCategories: selectedCategories,  // Keep as array of strings
      status,
      suspendedReason: updatedStaffData.suspendedReason || null,
      stats: updatedStaffData.stats || original.stats,
      ...(updatedStaffData.password ? { password: updatedStaffData.password } : {}),
    });

    if (!result.ok) {
      setMessageType('error');
      setMessage(result.message);
      return;
    }

    fetchStaff();
    setShowEditModal(false);
    setSelectedStaff(null);
    setMessageType('success');
    setMessage('Staff updated successfully');
  };

  const paginatedStaff = usesPagination
    ? filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredStaff;

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  return (
    <DashboardShell title="Staff Management" subtitle="Manage maintenance staff and assign categories" roleLabel="Admin">
      <>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard/admin')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="text-primary" />
            Back to Dashboard
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>

        <AlertMessage type={messageType} message={message} />

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="w-full xl:flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-56"
            >
              <option value="all">All Departments</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Network">Network</option>
              <option value="Facilities">Facilities</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-44"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => setUsesPagination(!usesPagination)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 sm:w-auto"
            >
              {usesPagination ? 'Show All' : 'Paginate'}
            </button>
          </div>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600">No staff members found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-center">Categories</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Pending</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 text-center">Done</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedStaff.map((staffMember) => (
                    <tr key={staffMember._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{staffMember.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{staffMember.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{staffMember.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{staffMember.department}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {staffMember.assignedCategories?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        {staffMember.stats?.totalIssues || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold text-yellow-600">
                          {staffMember.stats?.pendingIssues || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold text-blue-600">
                          {staffMember.stats?.activeIssues || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold text-green-600">
                          {staffMember.stats?.completedIssues || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {staffMember.isSuspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                            <XCircle size={12} />
                            Suspended
                          </span>
                        ) : staffMember.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditStaff(staffMember)}
                            className="rounded-lg border border-blue-300 p-2 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staffMember._id, staffMember.name)}
                            className="rounded-lg border border-red-300 p-2 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usesPagination && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddStaffModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddStaff}
            categoryOptions={categoryOptions}
          />
        )}

        {showEditModal && selectedStaff && (
          <EditStaffModal
            staff={selectedStaff}
            onClose={() => setShowEditModal(false)}
            onUpdate={handleUpdateStaff}
            categoryOptions={categoryOptions}
          />
        )}
      </>
    </DashboardShell>
  );
}
