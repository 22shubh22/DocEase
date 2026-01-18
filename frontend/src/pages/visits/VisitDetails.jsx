import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { visitsAPI } from '../../services/api';

export default function VisitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVisitData();
  }, [id]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      const response = await visitsAPI.getById(id);
      setVisit(response.data.visit);
    } catch (err) {
      console.error('Failed to fetch visit data:', err);
      setError(err.response?.data?.detail || 'Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="card">
        <h1 className="text-2xl font-bold text-red-600">Visit Not Found</h1>
        <p className="text-gray-600 mt-2">{error || "The visit you're looking for doesn't exist."}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary mt-4"
        >
          Go Back
        </button>
      </div>
    );
  }

  const patient = visit.patient;
  const vitals = visit.vitals || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => patient ? navigate(`/patients/${patient.id}`) : navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Patient
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {patient?.full_name || 'Unknown Patient'}
          </h1>
          <p className="text-gray-600 mt-1">
            Visit #{visit.visit_number} - {formatDate(visit.visit_date)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/prescriptions/new?visitId=${visit.id}&patientId=${patient?.id}`}
            className="btn btn-primary"
          >
            + Add Prescription
          </Link>
        </div>
      </div>

      {/* Patient Info & Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Quick Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Patient Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Patient ID</span>
              <Link to={`/patients/${patient?.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                {patient?.patient_code || '-'}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age / Gender</span>
              <span className="font-medium">
                {patient?.age ? `${patient.age} years` : '-'} / {patient?.gender?.toLowerCase() || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blood Group</span>
              <span className="badge badge-info">{patient?.blood_group || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium">{patient?.phone || '-'}</span>
            </div>
            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-gray-600 block mb-2">Allergies</span>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, index) => (
                    <span key={index} className="badge badge-danger text-xs">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vitals */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Vitals</h2>
          {Object.keys(vitals).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Vitals not recorded</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {vitals.blood_pressure && (
                <div>
                  <span className="text-gray-600 text-sm block">Blood Pressure</span>
                  <span className="font-semibold">{vitals.blood_pressure} mmHg</span>
                </div>
              )}
              {vitals.temperature && (
                <div>
                  <span className="text-gray-600 text-sm block">Temperature</span>
                  <span className="font-semibold">{vitals.temperature} °F</span>
                </div>
              )}
              {vitals.pulse && (
                <div>
                  <span className="text-gray-600 text-sm block">Pulse</span>
                  <span className="font-semibold">{vitals.pulse} bpm</span>
                </div>
              )}
              {vitals.weight && (
                <div>
                  <span className="text-gray-600 text-sm block">Weight</span>
                  <span className="font-semibold">{vitals.weight} kg</span>
                </div>
              )}
              {vitals.height && (
                <div>
                  <span className="text-gray-600 text-sm block">Height</span>
                  <span className="font-semibold">{vitals.height} cm</span>
                </div>
              )}
              {vitals.spo2 && (
                <div>
                  <span className="text-gray-600 text-sm block">SpO2</span>
                  <span className="font-semibold">{vitals.spo2}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Consultation Details */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Consultation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-gray-600 block mb-1">Symptoms</span>
            <p className="text-gray-900">{visit.symptoms || 'Not recorded'}</p>
          </div>
          <div>
            <span className="text-gray-600 block mb-1">Diagnosis</span>
            <p className="text-gray-900 font-medium">{visit.diagnosis || 'Not recorded'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-600 block mb-1">Observations</span>
            <p className="text-gray-900">{visit.observations || 'No observations recorded'}</p>
          </div>
        </div>
      </div>

      {/* Recommended Tests & Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Recommended Tests</h2>
          {visit.recommended_tests && visit.recommended_tests.length > 0 ? (
            <ul className="space-y-2">
              {visit.recommended_tests.map((test, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                  <span>{test}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tests recommended</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Follow-up</h2>
          {visit.follow_up_date ? (
            <div>
              <span className="text-2xl font-semibold text-primary-600">
                {formatDate(visit.follow_up_date)}
              </span>
              <p className="text-gray-600 mt-1">
                {(() => {
                  const followUp = new Date(visit.follow_up_date);
                  const today = new Date();
                  const diffTime = followUp - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 0) return 'Today';
                  if (diffDays === 1) return 'Tomorrow';
                  if (diffDays > 0) return `In ${diffDays} days`;
                  return `${Math.abs(diffDays)} days ago`;
                })()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No follow-up scheduled</p>
          )}
        </div>
      </div>

      {/* Prescriptions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-lg font-semibold">Prescriptions</h2>
          <Link
            to={`/prescriptions/new?visitId=${visit.id}&patientId=${patient?.id}`}
            className="btn btn-secondary text-sm"
          >
            + Add
          </Link>
        </div>
        {visit.prescriptions && visit.prescriptions.length > 0 ? (
          <div className="space-y-4">
            {visit.prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm text-gray-600">
                      Prescription - {formatDate(prescription.prescription_date)}
                    </span>
                    {prescription.notes && (
                      <p className="text-sm text-gray-700 mt-1">{prescription.notes}</p>
                    )}
                  </div>
                  {prescription.pdf_url && (
                    <a
                      href={prescription.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
                {prescription.medicines && prescription.medicines.length > 0 && (
                  <div className="space-y-2">
                    {prescription.medicines.map((medicine, idx) => (
                      <div key={medicine.id || idx} className="flex flex-wrap gap-x-4 gap-y-1 text-sm bg-white p-2 rounded">
                        <span className="font-medium">{medicine.medicine_name}</span>
                        <span className="text-gray-600">{medicine.dosage}</span>
                        <span className="text-gray-600">{medicine.frequency}</span>
                        <span className="text-gray-600">{medicine.duration}</span>
                        {medicine.instructions && (
                          <span className="text-gray-500 italic w-full">{medicine.instructions}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No prescriptions for this visit</p>
            <Link
              to={`/prescriptions/new?visitId=${visit.id}&patientId=${patient?.id}`}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
            >
              Add a prescription
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
