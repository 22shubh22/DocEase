import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { opdAPI, patientsAPI } from '../../services/api';

export default function OPDQueue() {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, waiting: 0, inProgress: 0, completed: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, statsRes, patientsRes] = await Promise.all([
        opdAPI.getQueue(),
        opdAPI.getStats(),
        patientsAPI.getAll({ limit: 100 })
      ]);
      setQueue(queueRes.data.queue || []);
      setStats(statsRes.data.stats || { total: 0, waiting: 0, inProgress: 0, completed: 0 });
      setPatients(patientsRes.data.patients || []);
    } catch (error) {
      console.error('Failed to fetch OPD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !appointmentTime || !chiefComplaint) return;

    try {
      await opdAPI.addToQueue({
        patient_id: selectedPatient,
        appointment_time: appointmentTime,
        chief_complaint: chiefComplaint,
      });
      fetchData();
      setShowAddForm(false);
      setSelectedPatient('');
      setAppointmentTime('');
      setChiefComplaint('');
    } catch (error) {
      console.error('Failed to add to queue:', error);
      alert('Failed to add patient to queue');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await opdAPI.updateStatus(id, newStatus);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'WAITING':
        return 'badge bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'badge bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'badge bg-green-100 text-green-800';
      default:
        return 'badge';
    }
  };

  const filteredQueue = filterStatus === 'ALL'
    ? queue
    : queue.filter(item => item.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">OPD Queue</h1>
          <p className="text-gray-600 mt-1">Manage today's patient queue</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add to Queue'}
        </button>
      </div>

      {/* Add to Queue Form */}
      {showAddForm && (
        <div className="card bg-blue-50 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Patient to Queue</h2>
          <form onSubmit={handleAddToQueue} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Select Patient *</label>
                <select
                  className="input"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_code} - {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Appointment Time *</label>
                <input
                  type="time"
                  className="input"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Chief Complaint *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Fever, headache, routine checkup"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                Add to Queue
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-4">
          <p className="text-sm text-gray-600">Total Today</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card !p-4">
          <p className="text-sm text-gray-600">Waiting</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
        </div>
        <div className="card !p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="card !p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card !p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('WAITING')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'WAITING'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Waiting ({stats.waiting})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'COMPLETED'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No patients in queue</p>
            <p className="text-sm mt-1">Add patients to get started</p>
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div
              key={item.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Queue Number */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {item.queue_number}
                    </span>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.patient_name || item.patient?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.patient_code || item.patient?.patient_code} • {item.patient?.age} yrs • {item.patient?.phone}
                      </p>
                    </div>
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Appointment:</span>
                      <span className="ml-1 font-medium">{item.appointment_time}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <span className="ml-1 font-medium">{item.check_in_time || new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {item.completed_at && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-1 font-medium">{new Date(item.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    )}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <span className="text-gray-600">Complaint:</span>
                      <span className="ml-1 font-medium">{item.chief_complaint}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-wrap gap-2">
                  {item.status === 'WAITING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                        className="btn btn-primary text-sm"
                      >
                        Start Consultation
                      </button>
                      <Link
                      to={`/patients/${item.patient_id}`}
                      className="btn btn-secondary text-sm"
                    >
                      View Patient
                    </Link>
                  </>
                )}
                {item.status === 'IN_PROGRESS' && (
                  <>
                    <Link
                      to={`/visits/new?patientId=${item.patient_id}`}
                      className="btn btn-primary text-sm"
                    >
                      Record Visit
                    </Link>
                    <button
                      onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                      className="btn btn-secondary text-sm"
                    >
                      Mark Complete
                    </button>
                  </>
                )}
                {item.status === 'COMPLETED' && (
                  <>
                    <Link
                      to={`/patients/${item.patient_id}`}
                      className="btn btn-secondary text-sm"
                    >
                      View Patient
                    </Link>
                    <button
                      onClick={() => handleStatusChange(item.id, 'WAITING')}
                      className="btn btn-secondary text-sm"
                    >
                      Reopen
                    </button>
                  </>
                )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      <div className="card bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Quick Guide:</strong> Click "Add to Queue" to register patients for today's OPD.
          Use "Start Consultation" to begin, then "Record Visit" to document the consultation.
          Mark as complete when done.
        </p>
      </div>
    </div>
  );
}
