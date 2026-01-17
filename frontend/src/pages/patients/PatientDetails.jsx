import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { patientsAPI } from '../../services/api';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, visitsRes, prescriptionsRes] = await Promise.all([
        patientsAPI.getById(id),
        patientsAPI.getVisits(id),
        patientsAPI.getPrescriptions(id)
      ]);
      setPatient(patientRes.data.patient);
      setVisits(visitsRes.data.visits || []);
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="card">
        <h1 className="text-2xl font-bold text-red-600">Patient Not Found</h1>
        <p className="text-gray-600 mt-2">{error || "The patient you're looking for doesn't exist."}</p>
        <Link to="/patients" className="btn btn-primary mt-4">
          Back to Patients List
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'visits', label: 'Visit History', icon: '📋' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/patients')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{patient.full_name}</h1>
          <p className="text-gray-600 mt-1">Patient ID: {patient.patient_code}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/visits/new?patientId=${patient.id}`}
            className="btn btn-primary"
          >
            📝 New Visit
          </Link>
          <Link
            to={`/patients/${patient.id}/edit`}
            className="btn btn-secondary"
          >
            ✏️ Edit
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Personal Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name</span>
                <span className="font-medium">{patient.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Age</span>
                <span className="font-medium">{patient.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender</span>
                <span className="font-medium capitalize">{patient.gender?.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blood Group</span>
                <span className="badge badge-info">{patient.blood_group || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-gray-50 mt-2">
                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Created By</span>
                  <span className="font-medium">{patient.created_by_name || 'System'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-gray-600 text-sm">Patient Since</span>
                  <span className="font-medium">{new Date(patient.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 block mb-1">Phone Number</span>
                <span className="font-medium">{patient.phone}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Emergency Contact</span>
                <span className="font-medium">{patient.emergency_contact || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Address</span>
                <span className="font-medium">{patient.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Medical Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600 block mb-2">Known Allergies</span>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <span key={index} className="badge badge-danger">
                        ⚠️ {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">No known allergies</span>
                )}
              </div>
              <div>
                <span className="text-gray-600 block mb-2">Medical History</span>
                <p className="text-gray-900">{patient.medical_history ? JSON.stringify(patient.medical_history) : 'No medical history recorded'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Visit History</h2>
            <Link
              to={`/visits/new?patientId=${patient.id}`}
              className="btn btn-primary"
            >
              Add Visit
            </Link>
          </div>
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No visits recorded yet</p>
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{visit.diagnosis || 'No diagnosis'}</h3>
                      <p className="text-sm text-gray-600">{visit.symptoms || 'No symptoms recorded'}</p>
                    </div>
                    <span className="text-sm text-gray-500">{visit.visit_date}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">Visit #{visit.visit_number}</span>
                    <Link to={`/visits/${visit.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                      View Details →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Prescriptions</h2>
            <Link
              to={`/prescriptions/new?patientId=${patient.id}`}
              className="btn btn-primary"
            >
              New Prescription
            </Link>
          </div>
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">💊</div>
              <p>No prescriptions yet</p>
              <p className="text-sm mt-1">Create a visit first to add prescriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Prescription #{prescription.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{prescription.notes || 'No notes'}</p>
                    </div>
                    <span className="text-sm text-gray-500">{prescription.prescription_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to={`/visits/new?patientId=${patient.id}`} className="btn btn-secondary">
            📝 Record Visit
          </Link>
          <Link to={`/prescriptions/new?patientId=${patient.id}`} className="btn btn-secondary">
            💊 Add Prescription
          </Link>
          <Link to={`/billing/new?patientId=${patient.id}`} className="btn btn-secondary">
            💰 Create Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
