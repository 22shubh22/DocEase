import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { onboardingAPI } from '../../services/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function OnboardingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Detail modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approve/Reject
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedResult, setApprovedResult] = useState(null);
  const [approveSpecialty, setApproveSpecialty] = useState('dental');

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await onboardingAPI.getRequests(params);
      setRequests(response.data.requests || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRequests();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setApprovedResult(null);
    try {
      const response = await onboardingAPI.getRequest(id);
      setSelectedRequest(response.data);
      setApproveSpecialty(response.data.clinic_specialty || 'dental');
    } catch (error) {
      toast.error('Failed to load request details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setApprovedResult(null);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const response = await onboardingAPI.approveRequest(selectedRequest.id, { clinic_specialty: approveSpecialty });
      setApprovedResult(response.data);
      toast.success('Request approved! Clinic and doctor account created.');
      fetchRequests();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to approve request';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await onboardingAPI.rejectRequest(selectedRequest.id, { admin_notes: rejectReason });
      toast.success('Request rejected.');
      closeDetail();
      fetchRequests();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to reject request';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Onboarding Requests</h1>
          <p className="text-gray-500">Review and manage clinic registration requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by doctor name, email, or clinic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No onboarding requests found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-medium">{req.doctor_name?.charAt(0) || 'D'}</span>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <p className="text-sm font-medium text-gray-900">{req.doctor_name}</p>
                            <p className="text-sm text-gray-500">{req.doctor_email}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{req.clinic_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{req.clinic_name}</p>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-700'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openDetail(req.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {(selectedRequest || detailLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : approvedResult ? (
              /* Approved success view */
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Clinic & Doctor Created</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Clinic Details</h4>
                    <p className="text-sm"><span className="font-medium">Name:</span> {approvedResult.clinic?.name}</p>
                    <p className="text-sm"><span className="font-medium">Code:</span> <span className="font-mono">{approvedResult.clinic?.clinic_code}</span></p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Doctor Account</h4>
                    <p className="text-sm"><span className="font-medium">Name:</span> {approvedResult.doctor?.full_name}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {approvedResult.doctor?.email}</p>
                    <p className="text-sm"><span className="font-medium">Code:</span> <span className="font-mono">{approvedResult.doctor?.doctor_code}</span></p>
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Initial Password (share with doctor):</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-white px-3 py-1 rounded border flex-1">
                          {approvedResult.doctor?.initial_password}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(approvedResult.doctor?.initial_password);
                            toast.success('Password copied!');
                          }}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={closeDetail} className="btn btn-primary">Done</button>
                </div>
              </div>
            ) : showRejectModal ? (
              /* Reject modal */
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Request</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Rejecting the request from <strong>{selectedRequest.doctor_name}</strong> for <strong>{selectedRequest.clinic_name}</strong>.
                </p>
                <div className="mb-4">
                  <label className="label">Reason for Rejection *</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                    placeholder="Please provide a reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              /* Detail view */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Request Details</h3>
                  <button onClick={closeDetail} className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${STATUS_STYLES[selectedRequest.status] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedRequest.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Submitted {new Date(selectedRequest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Contact Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailField label="Doctor Name" value={selectedRequest.doctor_name} />
                      <DetailField label="Email" value={selectedRequest.doctor_email} />
                      <DetailField label="Phone" value={selectedRequest.doctor_phone} />
                      <DetailField label="Clinic Name" value={selectedRequest.clinic_name} />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {selectedRequest.additional_notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Additional Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedRequest.additional_notes}</p>
                    </div>
                  )}

                  {/* Admin Notes (for already reviewed) */}
                  {selectedRequest.admin_notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Admin Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedRequest.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedRequest.status === 'PENDING' && (
                  <div className="mt-6 pt-4 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Specialty</label>
                      <select
                        value={approveSpecialty}
                        onChange={(e) => setApproveSpecialty(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="dental">Dental</option>
                        <option value="dermatology">Dermatology</option>
                        <option value="general_physician">General Physician</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="orthopedics">Orthopedics</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Approving...' : 'Approve & Create Clinic'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedRequest.status !== 'PENDING' && (
                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={closeDetail} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
    </div>
  );
}
