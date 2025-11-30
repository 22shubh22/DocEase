import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

// Mock patients for selection
const mockPatients = [
  { id: '1', patientCode: 'PT-0001', fullName: 'Rajesh Kumar', age: 45, allergies: ['Penicillin'] },
  { id: '2', patientCode: 'PT-0002', fullName: 'Priya Sharma', age: 32, allergies: [] },
  { id: '3', patientCode: 'PT-0003', fullName: 'Amit Patel', age: 58, allergies: ['Aspirin', 'Sulfa drugs'] },
];

// In-memory visit storage
const visitsStore = {
  visits: [],
  nextId: 1,

  add(visit) {
    const newVisit = {
      ...visit,
      id: `visit-${this.nextId++}`,
      visitDate: new Date().toISOString(),
      visitNumber: this.nextId,
    };
    this.visits.push(newVisit);
    return newVisit;
  },

  getAll() {
    return this.visits;
  }
};

export default function VisitForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(
    patientIdFromUrl ? mockPatients.find(p => p.id === patientIdFromUrl) : null
  );

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      patientId: patientIdFromUrl || '',
    }
  });

  const watchedPatientId = watch('patientId');

  // Update selected patient when selection changes
  useState(() => {
    if (watchedPatientId) {
      const patient = mockPatients.find(p => p.id === watchedPatientId);
      setSelectedPatient(patient);
    }
  }, [watchedPatientId]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const visitData = {
        ...data,
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.fullName,
        doctorId: user?.id,
        doctorName: user?.fullName,
        vitals: {
          bp: data.bp,
          temperature: data.temperature,
          pulse: data.pulse,
          weight: data.weight,
          height: data.height,
          spo2: data.spo2,
        }
      };

      // Remove individual vitals from main data
      delete visitData.bp;
      delete visitData.temperature;
      delete visitData.pulse;
      delete visitData.weight;
      delete visitData.height;
      delete visitData.spo2;

      const newVisit = visitsStore.add(visitData);

      console.log('Visit recorded:', newVisit);
      console.log('All visits:', visitsStore.getAll());

      setSuccessMessage(`Visit recorded successfully! Visit #${newVisit.visitNumber}`);

      setTimeout(() => {
        navigate(`/patients/${selectedPatient.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error recording visit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Record Patient Visit</h1>
        <p className="text-gray-600 mt-1">Document patient consultation and vitals</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Patient Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Select Patient *</label>
              <select
                className="input"
                {...register('patientId', { required: 'Please select a patient' })}
                onChange={(e) => {
                  const patient = mockPatients.find(p => p.id === e.target.value);
                  setSelectedPatient(patient);
                }}
              >
                <option value="">Choose a patient...</option>
                {mockPatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientCode} - {patient.fullName} ({patient.age} yrs)
                  </option>
                ))}
              </select>
              {errors.patientId && (
                <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
              )}
            </div>

            {selectedPatient && selectedPatient.allergies?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Allergies Alert:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.allergies.map((allergy, index) => (
                    <span key={index} className="badge badge-danger">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Vital Signs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Blood Pressure (BP)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 120/80"
                {...register('bp')}
              />
            </div>
            <div>
              <label className="label">Temperature (°F)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 98.6"
                {...register('temperature')}
              />
            </div>
            <div>
              <label className="label">Pulse (bpm)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 72"
                {...register('pulse')}
              />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                placeholder="e.g., 70"
                {...register('weight')}
              />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 170"
                {...register('height')}
              />
            </div>
            <div>
              <label className="label">SpO2 (%)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 98"
                {...register('spo2')}
              />
            </div>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Consultation Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Chief Complaints / Symptoms *</label>
              <textarea
                className="input"
                rows="3"
                placeholder="e.g., Fever, headache, body ache for 3 days"
                {...register('symptoms', { required: 'Symptoms are required' })}
              />
              {errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">{errors.symptoms.message}</p>
              )}
            </div>

            <div>
              <label className="label">Diagnosis *</label>
              <textarea
                className="input"
                rows="3"
                placeholder="e.g., Viral fever, Upper respiratory tract infection"
                {...register('diagnosis', { required: 'Diagnosis is required' })}
              />
              {errors.diagnosis && (
                <p className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</p>
              )}
            </div>

            <div>
              <label className="label">Clinical Observations</label>
              <textarea
                className="input"
                rows="3"
                placeholder="e.g., Throat appears inflamed, mild congestion noted"
                {...register('observations')}
              />
            </div>

            <div>
              <label className="label">Recommended Tests</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., CBC, Blood Sugar (comma separated)"
                {...register('recommendedTests')}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple tests separated by commas
              </p>
            </div>

            <div>
              <label className="label">Follow-up Date</label>
              <input
                type="date"
                className="input"
                {...register('followUpDate')}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : '✓ Save Visit'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-secondary sm:ml-auto"
              disabled={isSubmitting}
            >
              Clear Form
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 After saving, you can add prescriptions for this visit
          </p>
        </div>
      </form>

      {/* Debug Info */}
      <div className="card mt-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Debug: Visits in Memory</h3>
        <p className="text-sm text-gray-600">
          Total visits recorded: {visitsStore.getAll().length}
        </p>
        {visitsStore.getAll().length > 0 && (
          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(visitsStore.getAll(), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
