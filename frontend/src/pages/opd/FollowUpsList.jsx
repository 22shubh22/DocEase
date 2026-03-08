import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { opdAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function FollowUpsList() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ overdue: 0, today: 0, upcoming: 0 });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    patientSearch: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.patientSearch]);

  useEffect(() => {
    fetchFollowUps();
  }, [pagination.page, filters.status, filters.startDate, filters.endDate, debouncedSearch]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
      };

      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (debouncedSearch) params.patient_search = debouncedSearch;

      const response = await opdAPI.getFollowUps(params);
      setFollowUps(response.data.follow_ups || []);
      setSummary(response.data.summary || { overdue: 0, today: 0, upcoming: 0 });
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
      setError(err.errorMessage || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', startDate: '', endDate: '', patientSearch: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAddToQueue = async (followUp) => {
    try {
      const complaints = (followUp.diagnosis || []).map((d) => `Follow-up: ${d}`);
      if (complaints.length === 0) {
        complaints.push('Follow-up visit');
      }

      const response = await opdAPI.addToQueue({
        patient_id: followUp.patient_id,
        chief_complaints: complaints,
      });
      const queueNumber = response.data?.appointment?.queue_number;
      toast.success(
        queueNumber
          ? `${followUp.patient_name} added as #${queueNumber}`
          : 'Patient added to queue'
      );
    } catch (error) {
      console.error('Failed to add follow-up to queue:', error);
      toast.error(error.errorMessage || 'Failed to add patient to queue');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const statusBadge = (status) => {
    const styles = {
      overdue: 'bg-red-100 text-red-800',
      today: 'bg-amber-100 text-amber-800',
      upcoming: 'bg-blue-100 text-blue-800',
    };
    const labels = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const hasActiveFilters = filters.status !== 'all' || filters.startDate || filters.endDate || filters.patientSearch;

  const statusButtons = [
    { key: 'all', label: 'All', count: summary.overdue + summary.today + summary.upcoming },
    { key: 'overdue', label: 'Overdue', count: summary.overdue },
    { key: 'today', label: 'Today', count: summary.today },
    { key: 'upcoming', label: 'Upcoming', count: summary.upcoming },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-gray-600 mt-1">Track and manage all scheduled follow-up visits</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleFilterChange('status', 'overdue')}
          className={`card !p-4 text-left border-2 transition-colors ${
            filters.status === 'overdue' ? 'border-red-400 bg-red-50' : 'border-transparent hover:border-red-200'
          }`}
        >
          <p className="text-sm font-medium text-red-600">Overdue</p>
          <p className="text-2xl font-bold text-red-700">{summary.overdue}</p>
        </button>
        <button
          onClick={() => handleFilterChange('status', 'today')}
          className={`card !p-4 text-left border-2 transition-colors ${
            filters.status === 'today' ? 'border-amber-400 bg-amber-50' : 'border-transparent hover:border-amber-200'
          }`}
        >
          <p className="text-sm font-medium text-amber-600">Today</p>
          <p className="text-2xl font-bold text-amber-700">{summary.today}</p>
        </button>
        <button
          onClick={() => handleFilterChange('status', 'upcoming')}
          className={`card !p-4 text-left border-2 transition-colors ${
            filters.status === 'upcoming' ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:border-blue-200'
          }`}
        >
          <p className="text-sm font-medium text-blue-600">Upcoming</p>
          <p className="text-2xl font-bold text-blue-700">{summary.upcoming}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Patient Search */}
          <div className="flex-1">
            <label className="label">Search Patient</label>
            <input
              type="text"
              placeholder="Search by patient name or code..."
              className="input"
              value={filters.patientSearch}
              onChange={(e) => handleFilterChange('patientSearch', e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 flex-wrap mt-4">
          {statusButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleFilterChange('status', btn.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === btn.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && followUps.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Table */}
      {!loading && followUps.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            {hasActiveFilters
              ? 'No follow-ups found matching your filters'
              : 'No follow-ups scheduled'}
          </p>
        </div>
      ) : followUps.length > 0 && (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-up Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {followUps.map((fu) => (
                  <tr key={fu.visit_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(fu.follow_up_date)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {fu.patient_name}
                      </div>
                      <div className="text-xs text-gray-500">{fu.patient_code}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(fu.last_visit_date)}
                      </div>
                      {fu.doctor_name && (
                        <div className="text-xs text-gray-500">{fu.doctor_name}</div>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                        {fu.diagnosis && fu.diagnosis.length > 0
                          ? fu.diagnosis.join(', ')
                          : '-'}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      {statusBadge(fu.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {fu.status !== 'upcoming' && (
                          <button
                            onClick={() => handleAddToQueue(fu)}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            Add to Queue
                          </button>
                        )}
                        <Link
                          to={`/patients/${fu.patient_id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Patient
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} follow-ups
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
        </div>
      )}
    </div>
  );
}
