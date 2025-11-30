import { useState } from 'react';
import { Link } from 'react-router-dom';

// Mock patients for selection
const mockPatients = [
  { id: '1', patientCode: 'PT-0001', fullName: 'Rajesh Kumar', age: 45, phone: '+91 9876543210' },
  { id: '2', patientCode: 'PT-0002', fullName: 'Priya Sharma', age: 32, phone: '+91 9876543211' },
  { id: '3', patientCode: 'PT-0003', fullName: 'Amit Patel', age: 58, phone: '+91 9876543212' },
];

// In-memory OPD queue storage
const opdQueueStore = {
  queue: [
    {
      id: 'opd-1',
      queueNumber: 1,
      patientId: '1',
      patientCode: 'PT-0001',
      patientName: 'Rajesh Kumar',
      age: 45,
      phone: '+91 9876543210',
      status: 'COMPLETED',
      appointmentTime: '09:00 AM',
      checkInTime: '09:05 AM',
      completedTime: '09:30 AM',
      chiefComplaint: 'Regular checkup',
    },
    {
      id: 'opd-2',
      queueNumber: 2,
      patientId: '2',
      patientCode: 'PT-0002',
      patientName: 'Priya Sharma',
      age: 32,
      phone: '+91 9876543211',
      status: 'IN_PROGRESS',
      appointmentTime: '09:30 AM',
      checkInTime: '09:28 AM',
      chiefComplaint: 'Fever and headache',
    },
    {
      id: 'opd-3',
      queueNumber: 3,
      patientId: '3',
      patientCode: 'PT-0003',
      patientName: 'Amit Patel',
      age: 58,
      phone: '+91 9876543212',
      status: 'WAITING',
      appointmentTime: '10:00 AM',
      checkInTime: '09:45 AM',
      chiefComplaint: 'Follow-up visit',
    },
  ],
  nextQueueNumber: 4,

  add(appointmentData) {
    const patient = mockPatients.find(p => p.id === appointmentData.patientId);
    const newAppointment = {
      id: `opd-${Date.now()}`,
      queueNumber: this.nextQueueNumber++,
      patientId: patient.id,
      patientCode: patient.patientCode,
      patientName: patient.fullName,
      age: patient.age,
      phone: patient.phone,
      status: 'WAITING',
      appointmentTime: appointmentData.appointmentTime,
      checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      chiefComplaint: appointmentData.chiefComplaint,
    };
    this.queue.push(newAppointment);
    return newAppointment;
  },

  updateStatus(id, status) {
    const appointment = this.queue.find(a => a.id === id);
    if (appointment) {
      appointment.status = status;
      if (status === 'COMPLETED') {
        appointment.completedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    }
  },

  getStats() {
    return {
      total: this.queue.length,
      waiting: this.queue.filter(a => a.status === 'WAITING').length,
      inProgress: this.queue.filter(a => a.status === 'IN_PROGRESS').length,
      completed: this.queue.filter(a => a.status === 'COMPLETED').length,
    };
  }
};

export default function OPDQueue() {
  const [queue, setQueue] = useState(opdQueueStore.queue);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const stats = opdQueueStore.getStats();

  const handleAddToQueue = (e) => {
    e.preventDefault();

    if (!selectedPatient || !appointmentTime || !chiefComplaint) {
      alert('Please fill all fields');
      return;
    }

    opdQueueStore.add({
      patientId: selectedPatient,
      appointmentTime,
      chiefComplaint,
    });

    setQueue([...opdQueueStore.queue]);
    setShowAddForm(false);
    setSelectedPatient('');
    setAppointmentTime('');
    setChiefComplaint('');
  };

  const handleStatusChange = (id, newStatus) => {
    opdQueueStore.updateStatus(id, newStatus);
    setQueue([...opdQueueStore.queue]);
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
                  {mockPatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patientCode} - {patient.fullName}
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
                      {item.queueNumber}
                    </span>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.patientName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.patientCode} • {item.age} yrs • {item.phone}
                      </p>
                    </div>
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Appointment:</span>
                      <span className="ml-1 font-medium">{item.appointmentTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <span className="ml-1 font-medium">{item.checkInTime}</span>
                    </div>
                    {item.completedTime && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-1 font-medium">{item.completedTime}</span>
                      </div>
                    )}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <span className="text-gray-600">Complaint:</span>
                      <span className="ml-1 font-medium">{item.chiefComplaint}</span>
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
                        to={`/patients/${item.patientId}`}
                        className="btn btn-secondary text-sm"
                      >
                        View Patient
                      </Link>
                    </>
                  )}
                  {item.status === 'IN_PROGRESS' && (
                    <>
                      <Link
                        to={`/visits/new?patientId=${item.patientId}`}
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
                        to={`/patients/${item.patientId}`}
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
          Mark as complete when done. Queue data is stored in memory and resets on page refresh.
        </p>
      </div>

      {/* Debug Info */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Debug: Queue in Memory</h3>
        <p className="text-sm text-gray-600">
          Total in queue: {opdQueueStore.queue.length}
        </p>
        {opdQueueStore.queue.length > 0 && (
          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(opdQueueStore.queue, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
