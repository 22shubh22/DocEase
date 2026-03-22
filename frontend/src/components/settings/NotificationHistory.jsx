import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { notificationAPI } from '../../services/api';

const STATUS_BADGES = {
  QUEUED: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

const TYPE_LABELS = {
  VACCINATION_DUE: 'Vaccination Due',
  VACCINATION_OVERDUE: 'Vaccination Overdue',
  FOLLOW_UP_REMINDER: 'Follow-up',
};

const CHANNEL_BADGES = {
  WHATSAPP: 'bg-green-100 text-green-700',
  SMS: 'bg-purple-100 text-purple-700',
};

export default function NotificationHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const limit = 15;

  useEffect(() => {
    loadHistory();
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.notification_type = filterType;
      const res = await notificationAPI.getHistory(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await notificationAPI.getStats();
      setStats(res.data);
    } catch (err) {
      // non-critical
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Message History</h2>
        <p className="text-sm text-gray-500 mt-1">
          View all sent notifications and their delivery status.
        </p>
      </div>

      {/* Today's Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_sent}</div>
            <div className="text-xs text-gray-500">Sent Today</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total_delivered}</div>
            <div className="text-xs text-gray-500">Delivered</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.total_failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="QUEUED">Queued</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Types</option>
          <option value="VACCINATION_DUE">Vaccination Due</option>
          <option value="VACCINATION_OVERDUE">Vaccination Overdue</option>
          <option value="FOLLOW_UP_REMINDER">Follow-up</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg">No notifications yet</p>
            <p className="text-sm mt-1">Messages will appear here once reminders are sent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.patient_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_BADGES[item.channel] || ''}`}>
                        {item.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {TYPE_LABELS[item.notification_type] || item.notification_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[item.status] || ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={item.message_body}>
                      {item.message_body}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
