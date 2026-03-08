import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
];

function getDateParams(range) {
  if (range === 'all') return {};
  const now = new Date();
  const from = new Date();
  if (range === '3m') from.setMonth(now.getMonth() - 3);
  else if (range === '6m') from.setMonth(now.getMonth() - 6);
  else if (range === '1y') from.setFullYear(now.getFullYear() - 1);
  return { date_from: from.toISOString().split('T')[0], date_to: now.toISOString().split('T')[0] };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function BarChart({ data, labelKey = 'month', valueKey = 'count', color = 'bg-blue-500', formatValue }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 py-4">No data yet</p>;
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const height = Math.max((val / maxVal) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center min-w-0 h-full">
            <span className="text-xs text-gray-500 truncate w-full text-center">
              {formatValue ? formatValue(val) : val.toLocaleString()}
            </span>
            <div className="flex-1 w-full flex items-end">
              <div className={`${color} rounded-t w-full`} style={{ height: `${height}%` }} title={`${d[labelKey]}: ${formatValue ? formatValue(val) : val}`} />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">
              {d[labelKey]?.slice(5) || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = getDateParams(range);
      const res = await adminAPI.getAnalyticsOverview(params);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Clinics', value: data.total_clinics, color: 'bg-blue-100 text-blue-600' },
    { label: 'Patients', value: data.total_patients?.toLocaleString(), color: 'bg-purple-100 text-purple-600' },
    { label: 'Visits', value: data.total_visits?.toLocaleString(), color: 'bg-green-100 text-green-600' },
    { label: 'Prescriptions', value: data.total_prescriptions?.toLocaleString(), color: 'bg-orange-100 text-orange-600' },
    { label: 'Collections', value: formatCurrency(data.total_collections || 0), color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Platform Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Usage metrics for case studies and marketing</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {DATE_RANGES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Patients Over Time</h3>
          <BarChart data={data.patients_by_month} color="bg-purple-500" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Visits Over Time</h3>
          <BarChart data={data.visits_by_month} color="bg-green-500" />
        </div>
      </div>

      {/* Top Clinics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Top Clinics by Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Clinic</th>
                <th className="px-6 py-3 font-medium">Patients</th>
                <th className="px-6 py-3 font-medium">Visits</th>
                <th className="px-6 py-3 font-medium">Prescriptions</th>
                <th className="px-6 py-3 font-medium">Doctors</th>
                <th className="px-6 py-3 font-medium">Collections</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data.top_clinics || []).map((clinic, i) => (
                <tr
                  key={clinic.clinic_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/clinics/${clinic.clinic_id}/analytics`)}
                >
                  <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{clinic.clinic_name}</div>
                    <div className="text-xs text-gray-400">{clinic.clinic_code} {clinic.specialty && `· ${clinic.specialty}`}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{clinic.total_patients.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-700">{clinic.total_visits.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{clinic.total_prescriptions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{clinic.active_doctors}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(clinic.total_collections)}</td>
                  <td className="px-6 py-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.top_clinics || data.top_clinics.length === 0) && (
            <p className="text-center text-gray-400 py-8">No clinic data available</p>
          )}
        </div>
      </div>

      {/* Plugin Adoption */}
      {data.plugin_adoption && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Feature Adoption</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${(data.plugin_adoption.opd_queue / Math.max(data.plugin_adoption.total_clinics, 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                OPD Queue: {data.plugin_adoption.opd_queue}/{data.plugin_adoption.total_clinics}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full"
                  style={{ width: `${(data.plugin_adoption.collections / Math.max(data.plugin_adoption.total_clinics, 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Collections: {data.plugin_adoption.collections}/{data.plugin_adoption.total_clinics}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
