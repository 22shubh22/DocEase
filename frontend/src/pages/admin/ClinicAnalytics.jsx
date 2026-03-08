import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const height = Math.max((val / maxVal) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center min-w-0 h-full">
            <span className="text-xs text-gray-500 truncate w-full text-center">
              {formatValue ? formatValue(val) : val.toLocaleString()}
            </span>
            <div className="flex-1 w-full flex items-end">
              <div className={`${color} rounded-t w-full`} style={{ height: `${height}%` }} />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">{d[labelKey]?.slice(5) || ''}</span>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_COLORS = {
  WAITING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function generateCaseStudy(data, range) {
  const rangeLabelMap = { all: 'since launch', '3m': 'in the last 3 months', '6m': 'in the last 6 months', '1y': 'in the last year' };
  const period = rangeLabelMap[range] || 'since launch';
  const specialty = data.specialty ? ` (${data.specialty.replace('_', ' ')})` : '';
  const memberSince = data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
  const memberLine = memberSince ? ` A DocEase member since ${memberSince},` : '';

  return `${data.clinic_name}${specialty} has processed ${data.total_visits.toLocaleString()} patient visits across ${data.total_patients.toLocaleString()} unique patients ${period}, with ${data.total_prescriptions.toLocaleString()} prescriptions issued.${memberLine} the clinic operates with ${data.active_doctors} active doctor${data.active_doctors !== 1 ? 's' : ''}${data.total_collections > 0 ? ` and has recorded ${formatCurrency(data.total_collections)} in collections` : ''}.`;
}

export default function ClinicAnalytics() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    fetchData();
  }, [clinicId, range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = getDateParams(range);
      const res = await adminAPI.getClinicAnalytics(clinicId, params);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch clinic analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateCaseStudy(data, range));
    toast.success('Case study snippet copied!');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Patients', value: data.total_patients?.toLocaleString() },
    { label: 'Visits', value: data.total_visits?.toLocaleString() },
    { label: 'Prescriptions', value: data.total_prescriptions?.toLocaleString() },
    { label: 'Doctors', value: data.active_doctors },
    { label: 'Collections', value: formatCurrency(data.total_collections || 0) },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analytics
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{data.clinic_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {data.clinic_code && <span className="text-sm text-gray-500 font-mono">{data.clinic_code}</span>}
            {data.specialty && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded capitalize">{data.specialty.replace('_', ' ')}</span>}
            {data.created_at && <span className="text-sm text-gray-400">Member since {new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
          </div>
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

      {/* Monthly Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Patients by Month</h3>
          <BarChart data={data.patients_by_month} color="bg-purple-500" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Visits by Month</h3>
          <BarChart data={data.visits_by_month} color="bg-green-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Collections by Month */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Collections by Month</h3>
          <BarChart data={data.collections_by_month} valueKey="amount" color="bg-emerald-500" formatValue={formatCurrency} />
        </div>

        {/* Appointments by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Appointments by Status</h3>
          {data.appointments_by_status && Object.keys(data.appointments_by_status).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.appointments_by_status).map(([status, count]) => {
                const total = Object.values(data.appointments_by_status).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                      <span className="text-gray-600">{count.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No appointment data</p>
          )}
        </div>
      </div>

      {/* Doctor Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Doctor Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Doctor</th>
                <th className="px-6 py-3 font-medium">Last Login</th>
                <th className="px-6 py-3 font-medium">Visits Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data.doctors || []).map((doc, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{doc.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.last_login ? new Date(doc.last_login).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-700">{doc.visit_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.doctors || data.doctors.length === 0) && (
            <p className="text-center text-gray-400 py-6">No doctors found</p>
          )}
        </div>
      </div>

      {/* Case Study Snippet */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-800">Case Study Snippet</h3>
          <button
            onClick={copySnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
        <p className="text-gray-700 leading-relaxed">{generateCaseStudy(data, range)}</p>
      </div>
    </div>
  );
}
