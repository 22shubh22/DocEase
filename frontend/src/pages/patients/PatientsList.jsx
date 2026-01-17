import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientsAPI } from '../../services/api';

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPatients(searchQuery);
    } else {
      fetchPatients();
    }
  }, [searchQuery]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll({ page: 1, limit: 50 });
      setPatients(response.data.patients || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query) => {
    try {
      setLoading(true);
      const response = await patientsAPI.search(query);
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records</p>
        </div>
        <Link to="/patients/new" className="btn btn-primary">
          + Add New Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search by name, patient code, or phone..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="card !p-4">
          <p className="text-sm text-gray-600">Total Patients</p>
          <p className="text-2xl font-bold text-primary-600">{pagination.total}</p>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Code
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age / Gender
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No patients found matching your search' : 'No patients yet. Add your first patient!'}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{patient.patient_code}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                      <div className="text-sm text-gray-500 sm:hidden">
                        {patient.age} / {patient.gender}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {patient.age} / {patient.gender}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{patient.phone}</span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="badge badge-info">{patient.blood_group || 'N/A'}</span>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.created_by_name || 'System'}</div>
                      <div className="text-xs text-gray-500">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <Link
                          to={`/patients/${patient.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
