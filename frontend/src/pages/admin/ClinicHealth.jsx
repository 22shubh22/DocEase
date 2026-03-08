import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  at_risk: { label: 'At Risk', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  inactive: { label: 'Inactive', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  churned: { label: 'Churned', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const TREND_CONFIG = {
  growing: { label: 'Growing', icon: '\u2191', color: 'text-green-600' },
  stable: { label: 'Stable', icon: '\u2192', color: 'text-gray-600' },
  declining: { label: 'Declining', icon: '\u2193', color: 'text-red-600' },
};

function formatDaysAgo(days) {
  if (days === null || days === undefined) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ClinicHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('days_since_active');
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, [statusFilter, sortBy]);

  const fetchHealth = async () => {
    try {
      const params = { sort_by: sortBy };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getClinicHealth(params);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch clinic health:', error);
      toast.error('Failed to load clinic health data');
    } finally {
      setLoading(false);
    }
  };

  const handleBackfill = async () => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    const fromStr = from.toISOString().split('T')[0];

    setBackfilling(true);
    try {
      await adminAPI.recomputeStats({ date_from: fromStr, date_to: to });
      toast.success('Recomputing stats… This may take a minute.');
      // Poll for completion every 3s, up to 60s
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          await fetchHealth();
        } catch (_) { /* ignore fetch errors during polling */ }
        if (attempts >= 20) {
          clearInterval(poll);
          setBackfilling(false);
          toast.success('Stats recomputed.');
        }
      }, 3000);
    } catch (error) {
      toast.error('Failed to start recompute');
      setBackfilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary = data?.summary || { total_clinics: 0, active: 0, at_risk: 0, inactive: 0, churned: 0 };
  const clinics = data?.clinics || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clinic Health</h1>
          <p className="text-sm text-gray-500 mt-1">Track which clinics are actively using DocEase</p>
        </div>
        <button
          onClick={handleBackfill}
          disabled={backfilling}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {backfilling ? 'Computing...' : 'Recompute Stats'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            className={`rounded-xl p-4 border transition-all ${
              statusFilter === key
                ? `${config.bgColor} ${config.borderColor} border-2 shadow-sm`
                : 'bg-white border-gray-100 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <div className="text-left">
                <p className="text-sm text-gray-500">{config.label}</p>
                <p className="text-2xl font-bold text-gray-800">{summary[key] || 0}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Sort by:</span>
        {[
          { value: 'days_since_active', label: 'Last Active' },
          { value: 'visits_last_7d', label: 'Visits (7d)' },
          { value: 'dau_avg_7d', label: 'DAU (7d)' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              sortBy === opt.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clinics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {clinics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {statusFilter ? (
              <p>No clinics with status "{STATUS_CONFIG[statusFilter]?.label}". <button onClick={() => setStatusFilter('')} className="text-blue-600 hover:underline">Clear filter</button></p>
            ) : (
              <div>
                <p className="mb-2">No health data available yet.</p>
                <p className="text-sm">Click "Recompute Stats" to generate analytics from your existing data.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">DAU (7d avg)</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Visits (7d)</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Patients (7d)</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clinics.map((clinic) => {
                  const statusConf = STATUS_CONFIG[clinic.status] || STATUS_CONFIG.churned;
                  const trendConf = TREND_CONFIG[clinic.trend] || TREND_CONFIG.stable;

                  return (
                    <tr key={clinic.clinic_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusConf.color}`} />
                          <span className={`text-xs font-medium ${statusConf.textColor}`}>{statusConf.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium text-gray-800">{clinic.clinic_name}</span>
                          {clinic.clinic_code && (
                            <span className="ml-2 text-xs text-gray-400 font-mono">{clinic.clinic_code}</span>
                          )}
                        </div>
                        {clinic.specialty && (
                          <span className="text-xs text-gray-400 capitalize">{clinic.specialty.replace('_', ' ')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDaysAgo(clinic.days_since_active)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 text-right font-medium">
                        {clinic.dau_avg_7d}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 text-right font-medium">
                        {clinic.visits_last_7d}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 text-right font-medium">
                        {clinic.patients_last_7d}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-medium ${trendConf.color}`}>
                          {trendConf.icon} {trendConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/clinics/${clinic.clinic_id}/analytics`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
