import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock patients data
const mockPatients = [
  {
    id: '1',
    patientCode: 'PT-0001',
    fullName: 'Rajesh Kumar',
    age: 45,
    gender: 'MALE',
    phone: '+91 9876543210',
    bloodGroup: 'O+',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    patientCode: 'PT-0002',
    fullName: 'Priya Sharma',
    age: 32,
    gender: 'FEMALE',
    phone: '+91 9876543211',
    bloodGroup: 'A+',
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    patientCode: 'PT-0003',
    fullName: 'Amit Patel',
    age: 58,
    gender: 'MALE',
    phone: '+91 9876543212',
    bloodGroup: 'B+',
    createdAt: '2024-01-17',
  },
];

export default function PatientsList() {
  const [patients, setPatients] = useState(mockPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(mockPatients);

  useEffect(() => {
    // Filter patients based on search query
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient =>
        patient.fullName.toLowerCase().includes(query) ||
        patient.patientCode.toLowerCase().includes(query) ||
        patient.phone.includes(query)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records</p>
        </div>
        <Link to="/patients/new" className="btn btn-primary">
          ➕ Add New Patient
        </Link>
      </div>

      {/* Search and Stats */}
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
          <p className="text-2xl font-bold text-primary-600">{patients.length}</p>
        </div>
      </div>

      {/* Patients Table */}
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
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No patients found matching your search' : 'No patients yet. Add your first patient!'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{patient.patientCode}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
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
                      <span className="badge badge-info">{patient.bloodGroup || 'N/A'}</span>
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

      {/* Help Text */}
      <div className="card bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Mock Mode:</strong> Patient data is stored in memory. Newly added patients will appear here.
          Refresh the page to reset to default demo data.
        </p>
      </div>
    </div>
  );
}
