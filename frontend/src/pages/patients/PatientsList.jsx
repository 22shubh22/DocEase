import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { patientsAPI, opdAPI, chiefComplaintsAPI } from '../../services/api';

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // OPD Modal state
  const [showOPDModal, setShowOPDModal] = useState(false);
  const [selectedPatientForOPD, setSelectedPatientForOPD] = useState(null);
  const [chiefComplaints, setChiefComplaints] = useState([]);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [customComplaint, setCustomComplaint] = useState('');
  const [addingToOPD, setAddingToOPD] = useState(false);
  const [nextQueueNumber, setNextQueueNumber] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch chief complaints for OPD modal
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await chiefComplaintsAPI.getAll(true);
        setChiefComplaints(response.data || []);
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
      }
    };
    fetchComplaints();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPatients(searchQuery);
    } else {
      fetchPatients();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  // Check if patient is already in today's queue
  const isPatientInQueue = (patientId) => {
    return todayQueue.some(item =>
      item.patient_id === patientId &&
      ['WAITING', 'IN_PROGRESS'].includes(item.status)
    );
  };

  // OPD Modal handlers
  const openOPDModal = async (patient) => {
    setSelectedPatientForOPD(patient);
    setSelectedComplaints([]);
    setCustomComplaint('');
    setNextQueueNumber(null);
    setTodayQueue([]);
    setShowOPDModal(true);

    // Fetch current queue stats and queue data
    try {
      const [statsResponse, queueResponse] = await Promise.all([
        opdAPI.getStats({}),
        opdAPI.getQueue({})
      ]);
      setNextQueueNumber((statsResponse.data.stats?.total || 0) + 1);
      setTodayQueue(queueResponse.data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue data:', error);
    }
  };

  const closeOPDModal = () => {
    setShowOPDModal(false);
    setSelectedPatientForOPD(null);
    setSelectedComplaints([]);
    setCustomComplaint('');
  };

  const handleAddToOPD = async () => {
    const allComplaints = [...selectedComplaints];
    if (customComplaint.trim()) {
      const customs = customComplaint.split(',').map(c => c.trim()).filter(c => c);
      allComplaints.push(...customs);
    }

    if (allComplaints.length === 0) {
      toast.error('Please select at least one complaint');
      return;
    }

    setAddingToOPD(true);
    try {
      await opdAPI.addToQueue({
        patient_id: selectedPatientForOPD.id,
        chief_complaints: allComplaints,
      });
      toast.success(`${selectedPatientForOPD.full_name} added to OPD queue`);
      closeOPDModal();
    } catch (error) {
      console.error('Failed to add to OPD:', error);
      toast.error(error.errorMessage || 'Failed to add patient to OPD queue');
    } finally {
      setAddingToOPD(false);
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, patient code, phone, or address..."
              className="input flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary px-4"
              disabled={loading}
            >
              Search
            </button>
          </div>
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
                  Address
                </th>
                <th className="hidden 2xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="hidden xl:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-xs">{patient.address || 'N/A'}</div>
                    </td>
                    <td className="hidden 2xl:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.created_by_name || 'System'}</div>
                      <div className="text-xs text-gray-500">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openOPDModal(patient)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Add to OPD
                        </button>
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

      {/* Add to OPD Modal */}
      {showOPDModal && selectedPatientForOPD && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Add to OPD Queue
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Adding to queue for: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              {nextQueueNumber && <span className="ml-2">• Queue #<strong>{nextQueueNumber}</strong></span>}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Patient: <strong>{selectedPatientForOPD.full_name}</strong> ({selectedPatientForOPD.patient_code})
            </p>

            {isPatientInQueue(selectedPatientForOPD.id) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm font-medium">
                  This patient already has an appointment today
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  You can still add another appointment if needed.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Chief Complaints *</label>

                {/* Selected complaints as chips */}
                {selectedComplaints.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedComplaints.map((complaint, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {complaint}
                        <button
                          type="button"
                          onClick={() => setSelectedComplaints(selectedComplaints.filter((_, i) => i !== index))}
                          className="hover:text-red-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown to add complaints */}
                {chiefComplaints.length > 0 && (
                  <select
                    className="input mb-2"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedComplaints.includes(value)) {
                        setSelectedComplaints([...selectedComplaints, value]);
                      }
                    }}
                  >
                    <option value="">Select a complaint...</option>
                    {chiefComplaints
                      .filter(c => !selectedComplaints.includes(c.name))
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                )}

                {/* Custom complaint input */}
                <input
                  type="text"
                  className="input"
                  placeholder="Custom complaints (comma separated)"
                  value={customComplaint}
                  onChange={(e) => setCustomComplaint(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeOPDModal}
                className="btn btn-secondary"
                disabled={addingToOPD}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToOPD}
                className="btn btn-primary"
                disabled={addingToOPD}
              >
                {addingToOPD ? 'Adding...' : 'Add to Queue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
