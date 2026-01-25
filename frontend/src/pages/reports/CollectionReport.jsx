import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { visitsAPI, clinicAPI } from '../../services/api';

export default function CollectionReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState('today');
  const [groupBy, setGroupBy] = useState('day');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await clinicAPI.getDoctors();
        setDoctors(response.data.doctors || []);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const getDateRange = () => {
    const today = new Date();
    let start, end;

    switch (dateRange) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'custom':
        start = customStart;
        end = customEnd;
        break;
      default:
        start = end = today.toISOString().split('T')[0];
    }

    return { start, end };
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getDateRange();

      if (!start || !end) {
        setLoading(false);
        return;
      }

      const params = {
        start_date: start,
        end_date: end,
        group_by: groupBy
      };

      if (selectedDoctor) {
        params.doctor_id = selectedDoctor;
      }

      const response = await visitsAPI.getCollections(params);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError(err.response?.data?.detail || 'Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [dateRange, groupBy, customStart, customEnd, selectedDoctor]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (groupBy === 'month') {
      const [year, month] = dateString.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long'
      });
    }
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const averagePerVisit = data && data.visit_count > 0
    ? data.total_collection / data.visit_count
    : 0;

  const selectedDoctorName = selectedDoctor
    ? doctors.find(d => d.id === selectedDoctor)?.name
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Collection Report</h1>
          <p className="text-gray-600 mt-1">
            View daily and monthly collection summaries
            {selectedDoctorName && <span className="text-primary-600"> - {selectedDoctorName}</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Row 1: Date Range and Group By */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Group By and Doctor Filter */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Doctor Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Doctor:</span>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="input py-2 px-3 text-sm min-w-[150px]"
                >
                  <option value="">All Doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group By Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="input py-2 px-3 text-sm"
                >
                  <option value="day">Day-wise</option>
                  <option value="month">Month-wise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="pt-4 border-t flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input py-2 px-3 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input py-2 px-3 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-sm text-green-700 font-medium">Total Collection</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-800 mt-1">
              {formatCurrency(data.total_collection)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-sm text-blue-700 font-medium">Total Visits</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">
              {data.visit_count}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-sm text-purple-700 font-medium">Average per Visit</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-800 mt-1">
              {formatCurrency(averagePerVisit)}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchCollections}
            className="btn btn-secondary mt-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Collection Breakdown */}
      {!loading && !error && data && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
            {groupBy === 'day' ? 'Day-wise' : 'Month-wise'} Breakdown
            {selectedDoctorName && <span className="text-gray-500 font-normal"> - {selectedDoctorName}</span>}
          </h2>

          {data.breakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No collections found for this period</p>
              <p className="text-sm mt-2">Try selecting a different date range or doctor</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.breakdown.map((group) => (
                <div key={group.date} className="border rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{formatDate(group.date)}</span>
                      <span className="text-sm text-gray-500 ml-2">({group.visit_count} visits)</span>
                    </div>
                    <span className="font-semibold text-green-600">{formatCurrency(group.total)}</span>
                  </div>

                  {/* Visits Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-t">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.visits.map((visit) => (
                          <tr key={visit.visit_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{visit.visit_time}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{visit.patient_name}</div>
                              <div className="text-xs text-gray-500">{visit.patient_code}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{visit.doctor_name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(visit.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                to={`/visits/${visit.visit_id}`}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
