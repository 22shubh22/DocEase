import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { patientsAPI, visitsAPI, diagnosisOptionsAPI, observationOptionsAPI, opdAPI } from '../../services/api';

export default function VisitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const complaintFromUrl = searchParams.get('complaint');
  const appointmentIdFromUrl = searchParams.get('appointmentId');

  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [observationOptions, setObservationOptions] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [selectedObservation, setSelectedObservation] = useState('');
  const [customObservation, setCustomObservation] = useState('');
  const [existingVisit, setExistingVisit] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      patientId: '',
      symptoms: complaintFromUrl || '',
    }
  });

  const watchedPatientId = watch('patientId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingPatients(true);
        const [patientsRes, diagnosisRes, observationsRes] = await Promise.all([
          patientsAPI.getAll({ limit: 100 }),
          diagnosisOptionsAPI.getAll(true),
          observationOptionsAPI.getAll(true)
        ]);

        const patientsList = patientsRes.data.patients || [];
        setPatients(patientsList);
        setDiagnosisOptions(diagnosisRes.data || []);
        setObservationOptions(observationsRes.data || []);

        if (patientIdFromUrl) {
          const patient = patientsList.find(p => p.id === patientIdFromUrl);
          if (patient) {
            setSelectedPatient(patient);
            setValue('patientId', patient.id);
          }
        }

        // Check if appointment already has a visit (OPD reopen case)
        if (appointmentIdFromUrl) {
          try {
            const visitRes = await opdAPI.getVisitByAppointment(appointmentIdFromUrl);
            if (visitRes.data.visit) {
              const visit = visitRes.data.visit;
              setExistingVisit(visit);

              // Pre-fill form with existing visit data
              setValue('symptoms', visit.symptoms || '');

              // Handle diagnosis - check if it's a preset option or custom
              const diagnosisList = diagnosisRes.data || [];
              const diagnosisMatch = diagnosisList.find(d => d.name === visit.diagnosis);
              if (diagnosisMatch) {
                setSelectedDiagnosis(visit.diagnosis);
              } else if (visit.diagnosis) {
                setSelectedDiagnosis('OTHER');
                setCustomDiagnosis(visit.diagnosis);
              }

              // Handle observation - check if it's a preset option or custom
              const observationList = observationsRes.data || [];
              const observationMatch = observationList.find(o => o.name === visit.observations);
              if (observationMatch) {
                setSelectedObservation(visit.observations);
              } else if (visit.observations) {
                setSelectedObservation('OTHER');
                setCustomObservation(visit.observations);
              }

              setValue('recommendedTests', (visit.recommended_tests || []).join(', '));
              setValue('followUpDate', visit.follow_up_date || '');

              // Pre-fill vitals
              if (visit.vitals) {
                setValue('bp', visit.vitals.blood_pressure || '');
                setValue('temperature', visit.vitals.temperature || '');
                setValue('pulse', visit.vitals.pulse || '');
                setValue('weight', visit.vitals.weight || '');
                setValue('height', visit.vitals.height || '');
                setValue('spo2', visit.vitals.spo2 || '');
              }
            }
          } catch (visitError) {
            console.error('Failed to fetch existing visit:', visitError);
            // Not an error - appointment may not have a visit yet
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data.');
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchData();
  }, [patientIdFromUrl, appointmentIdFromUrl, setValue]);

  useEffect(() => {
    if (watchedPatientId) {
      const patient = patients.find(p => p.id === watchedPatientId);
      setSelectedPatient(patient);
    }
  }, [watchedPatientId, patients]);

  const onSubmit = async (data) => {
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }

    const diagnosisValue = selectedDiagnosis === 'OTHER' ? customDiagnosis : (selectedDiagnosis || data.diagnosis);
    const observationsValue = selectedObservation === 'OTHER' ? customObservation : (selectedObservation || data.observations);

    if (diagnosisOptions.length > 0 && !diagnosisValue) {
      toast.error('Please select a diagnosis or choose "Other" and enter a custom diagnosis.');
      return;
    }

    setIsSubmitting(true);

    try {
      await visitsAPI.create({
        patient_id: selectedPatient.id,
        appointment_id: appointmentIdFromUrl || null,
        symptoms: data.symptoms,
        diagnosis: diagnosisValue,
        observations: observationsValue,
        recommended_tests: data.recommendedTests ? data.recommendedTests.split(',').map(t => t.trim()) : [],
        follow_up_date: data.followUpDate || null,
        vitals: {
          blood_pressure: data.bp,
          temperature: data.temperature,
          pulse: data.pulse,
          weight: data.weight,
          height: data.height,
          spo2: data.spo2,
        }
      });

      if (appointmentIdFromUrl) {
        toast.success(existingVisit ? 'Visit updated and OPD completed!' : 'Visit recorded and OPD completed!');
        setTimeout(() => {
          navigate('/opd');
        }, 1500);
      } else {
        toast.success('Visit recorded successfully!');
        setTimeout(() => {
          navigate(`/patients/${selectedPatient.id}`);
        }, 1500);
      }

    } catch (error) {
      console.error('Error recording visit:', error);
      toast.error(error.response?.data?.detail || 'Failed to record visit. Please try again.');
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {existingVisit ? 'Update Patient Visit' : 'Record Patient Visit'}
        </h1>
        <p className="text-gray-600 mt-1">
          {existingVisit
            ? `Updating Visit #${existingVisit.visit_number} from ${existingVisit.visit_date}`
            : 'Document patient consultation and vitals'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Patient Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Select Patient *</label>
              {loadingPatients ? (
                <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
              ) : (
                <select
                  className="input"
                  {...register('patientId', { required: 'Please select a patient' })}
                  disabled={!!patientIdFromUrl}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_code} - {patient.full_name} ({patient.age} yrs)
                    </option>
                  ))}
                </select>
              )}
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
              {diagnosisOptions.length > 0 ? (
                <>
                  <select
                    className="input"
                    value={selectedDiagnosis}
                    onChange={(e) => setSelectedDiagnosis(e.target.value)}
                  >
                    <option value="">Select a diagnosis...</option>
                    {diagnosisOptions.map(option => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                    <option value="OTHER">Other (specify below)</option>
                  </select>
                  {selectedDiagnosis === 'OTHER' && (
                    <textarea
                      className="input mt-2"
                      rows="2"
                      placeholder="Enter custom diagnosis..."
                      value={customDiagnosis}
                      onChange={(e) => setCustomDiagnosis(e.target.value)}
                    />
                  )}
                </>
              ) : (
                <textarea
                  className="input"
                  rows="3"
                  placeholder="e.g., Viral fever, Upper respiratory tract infection"
                  {...register('diagnosis', { required: 'Diagnosis is required' })}
                />
              )}
              {errors.diagnosis && !diagnosisOptions.length && (
                <p className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</p>
              )}
            </div>

            <div>
              <label className="label">Clinical Observations</label>
              {observationOptions.length > 0 ? (
                <>
                  <select
                    className="input"
                    value={selectedObservation}
                    onChange={(e) => setSelectedObservation(e.target.value)}
                  >
                    <option value="">Select an observation...</option>
                    {observationOptions.map(option => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                    <option value="OTHER">Other (specify below)</option>
                  </select>
                  {selectedObservation === 'OTHER' && (
                    <textarea
                      className="input mt-2"
                      rows="2"
                      placeholder="Enter custom observation..."
                      value={customObservation}
                      onChange={(e) => setCustomObservation(e.target.value)}
                    />
                  )}
                </>
              ) : (
                <textarea
                  className="input"
                  rows="3"
                  placeholder="e.g., Throat appears inflamed, mild congestion noted"
                  {...register('observations')}
                />
              )}
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
              {isSubmitting ? 'Saving...' : (existingVisit ? '✓ Update & Complete OPD' : (appointmentIdFromUrl ? '✓ Save & Complete OPD' : '✓ Save Visit'))}
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
            {existingVisit
              ? '💡 This will update the existing visit and mark the patient as done in OPD'
              : appointmentIdFromUrl
                ? '💡 This will record the visit and mark the patient as done in OPD'
                : '💡 After saving, you can add prescriptions for this visit'}
          </p>
        </div>
      </form>
    </div>
  );
}
