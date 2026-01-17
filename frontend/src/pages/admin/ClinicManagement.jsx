import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function ClinicManagement() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showViewDoctor, setShowViewDoctor] = useState(false);
  const [showEditDoctor, setShowEditDoctor] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'DOCTOR'
  });
  const [editDoctor, setEditDoctor] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [showEditClinic, setShowEditClinic] = useState(false);
  const [editClinic, setEditClinic] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    opd_start_time: '',
    opd_end_time: ''
  });

  useEffect(() => {
    fetchData();
  }, [clinicId]);

  const fetchData = async () => {
    try {
      const [clinicRes, doctorsRes] = await Promise.all([
        adminAPI.getClinic(clinicId),
        adminAPI.getClinicDoctors(clinicId)
      ]);
      setClinic(clinicRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      console.error('Failed to fetch clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addDoctor(clinicId, newDoctor);
      setNewDoctor({ email: '', password: '', full_name: '', phone: '', role: 'DOCTOR' });
      setShowAddDoctor(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add doctor:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to add doctor';
      alert(errorMessage);
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowViewDoctor(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setEditDoctor({
      email: doctor.email,
      password: '',
      full_name: doctor.full_name,
      phone: doctor.phone || ''
    });
    setShowEditDoctor(true);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        email: editDoctor.email,
        full_name: editDoctor.full_name,
        phone: editDoctor.phone
      };
      if (editDoctor.password) {
        updateData.password = editDoctor.password;
      }
      await adminAPI.updateDoctor(clinicId, selectedDoctor.id, updateData);
      setShowEditDoctor(false);
      setSelectedDoctor(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update doctor:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to update doctor';
      alert(errorMessage);
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) {
      return;
    }
    try {
      await adminAPI.removeDoctor(clinicId, doctorId);
      fetchData();
    } catch (error) {
      console.error('Failed to remove doctor:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to remove doctor';
      alert(errorMessage);
    }
  };

  const handleMakeOwner = async (doctor) => {
    if (!window.confirm(`Make ${doctor.full_name} the owner of this clinic? They will have full access to clinic settings.`)) {
      return;
    }
    try {
      await adminAPI.setClinicOwner(clinicId, doctor.doctor_id);
      fetchData();
    } catch (error) {
      console.error('Failed to set owner:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to set clinic owner';
      alert(errorMessage);
    }
  };

  const handleOpenEditClinic = () => {
    setEditClinic({
      name: clinic.name || '',
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      opd_start_time: clinic.opd_start_time || '09:00',
      opd_end_time: clinic.opd_end_time || '17:00'
    });
    setShowEditClinic(true);
  };

  const handleUpdateClinic = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateClinic(clinicId, editClinic);
      setShowEditClinic(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update clinic:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.detail || 'Failed to update clinic';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinic) {
    return <div className="p-6 text-center text-gray-500">Clinic not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{clinic.name}</h1>
          <p className="text-gray-500">{clinic.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">Clinic Details</h2>
              <button
                onClick={handleOpenEditClinic}
                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors text-sm"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{clinic.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{clinic.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">OPD Hours</p>
                <p className="font-medium">
                  {clinic.opd_start_time || '09:00'} - {clinic.opd_end_time || '17:00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Doctors ({doctors.length})</h2>
              <button
                onClick={() => setShowAddDoctor(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                + Add Doctor
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {doctors.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No doctors assigned to this clinic yet.
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {doctor.full_name?.charAt(0) || 'D'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{doctor.full_name}</p>
                          {doctor.is_owner && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{doctor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!doctor.is_owner && (
                        <button
                          onClick={() => handleMakeOwner(doctor)}
                          className="text-amber-600 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          Make Owner
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDoctor(doctor)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditDoctor(doctor)}
                        className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveDoctor(doctor.id)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Doctor</h2>
            <form onSubmit={handleAddDoctor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.full_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (visible to admin)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewDoctor && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Doctor Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-medium text-gray-800">{selectedDoctor.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg font-medium text-gray-800">{selectedDoctor.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Password</label>
                <p className="text-lg font-medium text-gray-800 font-mono bg-gray-100 px-3 py-2 rounded-lg">
                  {selectedDoctor.initial_password || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg font-medium text-gray-800">{selectedDoctor.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${selectedDoctor.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedDoctor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowViewDoctor(false);
                  setSelectedDoctor(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewDoctor(false);
                  handleEditDoctor(selectedDoctor);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditDoctor && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Doctor</h2>
            <form onSubmit={handleUpdateDoctor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editDoctor.full_name}
                    onChange={(e) => setEditDoctor({ ...editDoctor, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editDoctor.email}
                    onChange={(e) => setEditDoctor({ ...editDoctor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="text"
                    value={editDoctor.password}
                    onChange={(e) => setEditDoctor({ ...editDoctor, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty to keep current password"
                  />
                  {selectedDoctor.initial_password && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current password: <span className="font-mono">{selectedDoctor.initial_password}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editDoctor.phone}
                    onChange={(e) => setEditDoctor({ ...editDoctor, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDoctor(false);
                    setSelectedDoctor(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Clinic Details</h2>
            <form onSubmit={handleUpdateClinic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name *</label>
                  <input
                    type="text"
                    required
                    value={editClinic.name}
                    onChange={(e) => setEditClinic({ ...editClinic, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editClinic.address}
                    onChange={(e) => setEditClinic({ ...editClinic, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editClinic.phone}
                    onChange={(e) => setEditClinic({ ...editClinic, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editClinic.email}
                    onChange={(e) => setEditClinic({ ...editClinic, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OPD Start Time</label>
                    <input
                      type="time"
                      value={editClinic.opd_start_time}
                      onChange={(e) => setEditClinic({ ...editClinic, opd_start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OPD End Time</label>
                    <input
                      type="time"
                      value={editClinic.opd_end_time}
                      onChange={(e) => setEditClinic({ ...editClinic, opd_end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditClinic(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
