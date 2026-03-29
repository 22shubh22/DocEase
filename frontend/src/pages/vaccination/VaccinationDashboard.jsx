import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vaccinationAPI, notificationAPI } from '../../services/api';
import RecordDoseModal from '../../components/vaccination/RecordDoseModal';

export default function VaccinationDashboard() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Record dose modal
  const [recordDose, setRecordDose] = useState(null); // { dose, patientId }

  // Reminder modal
  const [reminderTarget, setReminderTarget] = useState(null); // item from the list
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sentReminders, setSentReminders] = useState(new Set());

  useEffect(() => {
    fetchSchedule();
  }, [statusFilter]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await vaccinationAPI.getDashboardSchedule(params);
      setItems(response.data.items);
      setStats(response.data.stats);
      setTotal(response.data.total);
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to load vaccination schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDose = (item) => {
    setRecordDose({
      dose: {
        vaccine_name: item.vaccine_name,
        dose_number: item.dose_number,
        dose_label: item.dose_label,
        schedule_entry_id: item.schedule_entry_id,
        age_label: item.age_label_vaccine,
        record: {
          route: item.route || '',
          injection_site: item.site || '',
        },
      },
      patientId: item.patient_id,
    });
  };

  const handleDoseRecorded = () => {
    setRecordDose(null);
    fetchSchedule();
  };

  const handleSendReminder = async () => {
    if (!reminderTarget) return;
    setSendingReminder(true);
    try {
      const response = await notificationAPI.sendPatientReminder(reminderTarget.patient_id);
      if (response.data.success) {
        toast.success(`Reminder sent via ${response.data.channel} for ${reminderTarget.patient_name}`);
        setSentReminders(prev => new Set([...prev, reminderTarget.patient_id]));
      } else {
        toast.error(response.data.error || 'Failed to send reminder');
      }
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
      setReminderTarget(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Client-side search filter
  const filteredItems = searchQuery
    ? items.filter(item =>
        item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.patient_code && item.patient_code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  if (loading && !items.length) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vaccination Schedule</h1>
        <p className="text-gray-600 mt-1">Track and manage upcoming vaccinations for all children</p>
      </div>

      {/* Stats Cards */}
      {stats && (
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
            <p className="text-3xl font-bold text-yellow-600">{stats.due_now_count}</p>
            <p className="text-sm text-gray-600 mt-1">Due Now</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-600">{stats.overdue_count}</p>
            <p className="text-sm text-gray-600 mt-1">Overdue</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Status Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { value: '', label: 'All' },
              { value: 'due', label: 'Due' },
              { value: 'overdue', label: 'Overdue' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by patient name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
            />
          </div>

          <div className="text-sm text-gray-500 whitespace-nowrap">
            {filteredItems.length} vaccination{filteredItems.length !== 1 ? 's' : ''} pending
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      {filteredItems.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Age</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vaccine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item, idx) => (
                  <tr key={`${item.patient_id}-${item.vaccine_name}-${item.dose_number}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/patients/${item.patient_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {item.patient_name}
                      </Link>
                      {item.patient_code && (
                        <span className="text-xs text-gray-500 ml-1">({item.patient_code})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.age_label}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{item.dose_label || item.vaccine_name}</span>
                      {item.age_label_vaccine && (
                        <span className="text-xs text-gray-500 ml-1">({item.age_label_vaccine})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${item.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {formatDate(item.due_date)}
                      </span>
                      {item.days_overdue > 0 && (
                        <span className="text-xs text-red-500 ml-1">({item.days_overdue}d overdue)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${item.status === 'overdue' ? 'badge-danger' : 'badge-warning'} text-xs`}>
                        {item.status === 'overdue' ? 'Overdue' : 'Due'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRecordDose(item)}
                          className="btn btn-primary text-xs px-3 py-1.5"
                          title="Mark as given"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Given
                        </button>
                        <button
                          onClick={() => setReminderTarget(item)}
                          disabled={!item.phone || sentReminders.has(item.patient_id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            sentReminders.has(item.patient_id)
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : item.phone
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            sentReminders.has(item.patient_id) ? 'Reminder sent' :
                            item.phone ? 'Send WhatsApp reminder' : 'No phone number'
                          }
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.694-1.358A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.329-.726-6.033-1.96a.5.5 0 00-.395-.085l-3.39.98.892-3.244a.5.5 0 00-.069-.421A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                          {sentReminders.has(item.patient_id) ? 'Sent' : 'Remind'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => (
              <div key={`${item.patient_id}-${item.vaccine_name}-${item.dose_number}-mobile`} className={`card ${item.status === 'overdue' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link to={`/patients/${item.patient_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {item.patient_name}
                    </Link>
                    {item.patient_code && (
                      <span className="text-xs text-gray-500 ml-1">({item.patient_code})</span>
                    )}
                    <p className="text-sm text-gray-600">{item.age_label} old</p>
                  </div>
                  <span className={`badge ${item.status === 'overdue' ? 'badge-danger' : 'badge-warning'} text-xs`}>
                    {item.status === 'overdue' ? 'Overdue' : 'Due'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm mb-3">
                  <div>
                    <span className="font-medium">{item.dose_label || item.vaccine_name}</span>
                    {item.age_label_vaccine && (
                      <span className="text-gray-500 ml-1">({item.age_label_vaccine})</span>
                    )}
                  </div>
                  <div className={`font-medium ${item.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {formatDate(item.due_date)}
                    {item.days_overdue > 0 && (
                      <span className="text-xs ml-1">({item.days_overdue}d late)</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecordDose(item)}
                    className="btn btn-primary text-xs px-3 py-1.5 flex-1"
                  >
                    Mark as Given
                  </button>
                  <button
                    onClick={() => setReminderTarget(item)}
                    disabled={!item.phone || sentReminders.has(item.patient_id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium flex-1 transition-colors ${
                      sentReminders.has(item.patient_id)
                        ? 'bg-green-100 text-green-700'
                        : item.phone
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {sentReminders.has(item.patient_id) ? 'Sent' : item.phone ? 'Send Reminder' : 'No Phone'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            {statusFilter ? `No ${statusFilter} vaccinations found.` : 'All children are up to date with their vaccinations!'}
          </p>
          <p className="text-gray-400 mt-2">New due vaccines will appear here automatically based on patient age.</p>
        </div>
      )}

      {/* Record Dose Modal */}
      {recordDose && (
        <RecordDoseModal
          dose={recordDose.dose}
          patientId={recordDose.patientId}
          onClose={() => setRecordDose(null)}
          onRecorded={handleDoseRecorded}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setReminderTarget(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Send Vaccination Reminder</h3>
              <p className="text-sm text-gray-600 mb-4">Send a WhatsApp/SMS reminder for pending vaccinations</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Patient</span>
                  <span className="text-sm font-medium">{reminderTarget.patient_name}</span>
                </div>
                {reminderTarget.guardian_name && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Guardian</span>
                    <span className="text-sm font-medium">{reminderTarget.guardian_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="text-sm font-medium">{reminderTarget.phone}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Pending Vaccines</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {/* Show all vaccines for this patient from the items list */}
                    {items
                      .filter(i => i.patient_id === reminderTarget.patient_id)
                      .map(i => (
                        <span key={`${i.vaccine_name}-${i.dose_number}`} className={`badge ${i.status === 'overdue' ? 'badge-danger' : 'badge-warning'} text-xs`}>
                          {i.dose_label || i.vaccine_name}
                        </span>
                      ))
                    }
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex-1"
                >
                  {sendingReminder ? 'Sending...' : 'Send Reminder'}
                </button>
                <button
                  onClick={() => setReminderTarget(null)}
                  className="btn btn-secondary"
                  disabled={sendingReminder}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
