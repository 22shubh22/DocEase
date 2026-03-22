import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vaccinationAPI } from '../../services/api';

export default function VaccinationDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await vaccinationAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to load vaccination dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { due_today, overdue, due_this_week, stats } = dashboard;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vaccination Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor vaccination status for all children</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.total_children}</p>
          <p className="text-sm text-gray-600 mt-1">Total Children</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{stats.fully_vaccinated}</p>
          <p className="text-sm text-gray-600 mt-1">Fully Vaccinated</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats.due_today_count}</p>
          <p className="text-sm text-gray-600 mt-1">Due Today</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{stats.overdue_count}</p>
          <p className="text-sm text-gray-600 mt-1">Overdue</p>
        </div>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Overdue Vaccinations ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((child) => (
              <div key={child.patient_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 rounded-lg gap-2">
                <div>
                  <Link to={`/patients/${child.patient_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                    {child.patient_name}
                  </Link>
                  <span className="text-sm text-gray-500 ml-2">({child.patient_code})</span>
                  <p className="text-sm text-gray-600">{child.age_label} old</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {child.overdue_vaccines.map((v) => (
                    <span key={v} className="badge badge-danger text-xs">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      {due_today.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Due Now ({due_today.length})
          </h2>
          <div className="space-y-3">
            {due_today.map((child) => (
              <div key={child.patient_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-yellow-50 rounded-lg gap-2">
                <div>
                  <Link to={`/patients/${child.patient_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                    {child.patient_name}
                  </Link>
                  <span className="text-sm text-gray-500 ml-2">({child.patient_code})</span>
                  <p className="text-sm text-gray-600">{child.age_label} old</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {child.due_vaccines.map((v) => (
                    <span key={v} className="badge badge-warning text-xs">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due This Week Section */}
      {due_this_week.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Due This Week ({due_this_week.length})
          </h2>
          <div className="space-y-3">
            {due_this_week.map((child) => (
              <div key={child.patient_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-blue-50 rounded-lg gap-2">
                <div>
                  <Link to={`/patients/${child.patient_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                    {child.patient_name}
                  </Link>
                  <span className="text-sm text-gray-500 ml-2">({child.patient_code})</span>
                  <p className="text-sm text-gray-600">{child.age_label} old</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {child.due_vaccines.map((v) => (
                    <span key={v} className="badge badge-info text-xs">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {overdue.length === 0 && due_today.length === 0 && due_this_week.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">All children are up to date with their vaccinations!</p>
          <p className="text-gray-400 mt-2">New due vaccines will appear here automatically based on patient age.</p>
        </div>
      )}
    </div>
  );
}
