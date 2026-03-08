import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { auditAPI } from '../../services/api';

const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-700',
  READ: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-indigo-100 text-indigo-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  PASSWORD_CHANGE: 'bg-purple-100 text-purple-700',
  DATA_EXPORT: 'bg-cyan-100 text-cyan-700',
  DATA_ERASURE: 'bg-orange-100 text-orange-700',
  CONSENT_GIVEN: 'bg-emerald-100 text-emerald-700',
  CONSENT_REVOKED: 'bg-rose-100 text-rose-700',
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [filters, setFilters] = useState({ action: '', resource_type: '', start_date: '', end_date: '' });
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await auditAPI.getLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({ action: '', resource_type: '', start_date: '', end_date: '' });
    setTimeout(() => fetchLogs(1), 0);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track all data access and modifications across your clinic
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="input text-sm"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="READ">Read</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGIN_FAILED">Login Failed</option>
          <option value="LOGOUT">Logout</option>
          <option value="PASSWORD_CHANGE">Password Change</option>
          <option value="DATA_EXPORT">Data Export</option>
          <option value="DATA_ERASURE">Data Erasure</option>
        </select>
        <select
          value={filters.resource_type}
          onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
          className="input text-sm"
        >
          <option value="">All Resources</option>
          <option value="auth">Auth</option>
          <option value="patients">Patients</option>
          <option value="visits">Visits</option>
          <option value="appointments">Appointments</option>
          <option value="patient_consents">Consents</option>
        </select>
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          className="input text-sm"
          placeholder="Start date"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="input text-sm flex-1"
            placeholder="End date"
          />
          <button type="submit" className="btn btn-primary text-sm px-3">Filter</button>
          <button type="button" onClick={handleClearFilters} className="btn btn-secondary text-sm px-3">Clear</button>
        </div>
      </form>

      {/* Logs Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No audit logs found</p>
          <p className="text-sm mt-1">Logs will appear here as actions are performed</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Resource</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{log.user_email || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{log.resource_type}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{log.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded detail */}
          {expandedLog && (() => {
            const log = logs.find((l) => l.id === expandedLog);
            if (!log) return null;
            return (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border text-sm">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><span className="text-gray-500">IP Address:</span> {log.ip_address || '-'}</div>
                  <div><span className="text-gray-500">Resource ID:</span> <span className="font-mono text-xs">{log.resource_id || '-'}</span></div>
                </div>
                {log.old_values && (
                  <div className="mb-2">
                    <span className="text-gray-500 font-medium">Previous values:</span>
                    <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-x-auto">{JSON.stringify(log.old_values, null, 2)}</pre>
                  </div>
                )}
                {log.new_values && (
                  <div>
                    <span className="text-gray-500 font-medium">New values:</span>
                    <pre className="mt-1 text-xs bg-green-50 p-2 rounded overflow-x-auto">{JSON.stringify(log.new_values, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
