import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { patientsAPI, visitsAPI, diagnosisOptionsAPI, observationOptionsAPI, testOptionsAPI, chiefComplaintsAPI, opdAPI, clinicAPI } from '../../services/api';
import PrescriptionEditor from '../../components/prescriptions/PrescriptionEditor';
import MultiSelectComboBox from '../../components/common/MultiSelectComboBox';
import PatientHistoryPanel from '../../components/patients/PatientHistoryPanel';
import VisitPreviewModal from '../../components/visits/VisitPreviewModal';
import { validateBP, validateTemperature, validatePulse, validateWeight, validateHeight, validateSpO2 } from '../../utils/vitalsValidation';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ', ' + date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function VisitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const complaintsFromUrl = searchParams.get('complaints');
  const appointmentIdFromUrl = searchParams.get('appointmentId');

  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingVisit, setLoadingVisit] = useState(!!id);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [symptomOptions, setSymptomOptions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [observationOptions, setObservationOptions] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [testOptions, setTestOptions] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [existingVisit, setExistingVisit] = useState(null);

  // Patient history state
  const [oldPrescriptions, setOldPrescriptions] = useState([]);
  const [oldVisits, setOldVisits] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [showPrescriptionSection, setShowPrescriptionSection] = useState(true);
  const [medicines, setMedicines] = useState([{ id: Date.now(), medicine_name: '', dosage: '', duration: '' }]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [amount, setAmount] = useState('');

  // Print preview state (for OPD flow)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedVisitData, setSavedVisitData] = useState(null);
  const [clinicData, setClinicData] = useState(null);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = useForm({
    mode: 'onBlur',
    defaultValues: {
      patientId: '',
    }
  });

  // Initialize symptoms from URL complaints if provided
  useEffect(() => {
    if (complaintsFromUrl && selectedSymptoms.length === 0) {
      try {
        const complaints = JSON.parse(decodeURIComponent(complaintsFromUrl));
        if (Array.isArray(complaints) && complaints.length > 0) {
          setSelectedSymptoms(complaints);
        }
      } catch (e) {
        // Fallback for old single complaint format
        const decoded = decodeURIComponent(complaintsFromUrl);
        if (decoded) {
          setSelectedSymptoms([decoded]);
        }
      }
    }
  }, [complaintsFromUrl]);

  const watchedPatientId = watch('patientId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingPatients(true);
        const [patientsRes, chiefComplaintsRes, diagnosisRes, observationsRes, testsRes, clinicRes] = await Promise.all([
          patientsAPI.getAll({ limit: 100 }),
          chiefComplaintsAPI.getAll(true),
          diagnosisOptionsAPI.getAll(true),
          observationOptionsAPI.getAll(true),
          testOptionsAPI.getAll(true),
          clinicAPI.getInfo().catch(() => null),
        ]);

        const patientsList = patientsRes.data.patients || [];
        setPatients(patientsList);
        setSymptomOptions(chiefComplaintsRes.data || []);
        setDiagnosisOptions(diagnosisRes.data || []);
        setObservationOptions(observationsRes.data || []);
        setTestOptions(testsRes.data || []);
        if (clinicRes?.data) setClinicData(clinicRes.data.clinic || clinicRes.data);

        if (patientIdFromUrl) {
          const patient = patientsList.find(p => p.id === patientIdFromUrl);
          if (patient) {
            setSelectedPatient(patient);
            setValue('patientId', patient.id);
          }
        }

        // Load existing visit for editing (direct edit via /visits/:id/edit)
        if (id) {
          try {
            const visitRes = await visitsAPI.getById(id);
            if (visitRes.data.visit) {
              const visit = visitRes.data.visit;
              setExistingVisit(visit);

              // Set patient from visit
              if (visit.patient) {
                const patient = patientsList.find(p => p.id === visit.patient.id) || visit.patient;
                setSelectedPatient(patient);
                setValue('patientId', visit.patient.id);
              }

              // Expand patient history by default in edit mode
              setShowPatientHistory(true);

              // Pre-fill form with existing visit data
              // Pre-fill arrays directly — all items (master list or custom) go into selected
              setSelectedSymptoms((visit.symptoms || []).filter(Boolean));
              setSelectedDiagnoses((visit.diagnosis || []).filter(Boolean));
              setSelectedObservations((visit.observations || []).filter(Boolean));
              setSelectedTests((visit.recommended_tests || []).filter(Boolean));

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

              // Pre-fill existing medicines for editing (now stored directly on visit)
              if (visit.medicines && visit.medicines.length > 0) {
                setShowPrescriptionSection(true);
                setMedicines(visit.medicines.map(m => ({
                  id: m.id || Date.now(),
                  medicine_name: m.medicine_name || '',
                  dosage: m.dosage || '',
                  duration: m.duration || '',
                })));
                setPrescriptionNotes(visit.prescription_notes || '');
              }

              // Pre-fill amount
              if (visit.amount !== null && visit.amount !== undefined) {
                setAmount(visit.amount.toString());
              }
            }
          } catch (visitError) {
            console.error('Failed to fetch visit for editing:', visitError);
            toast.error('Failed to load visit for editing');
          } finally {
            setLoadingVisit(false);
          }
        }

        // Check if appointment already has a visit (OPD reopen case)
        if (appointmentIdFromUrl) {
          try {
            const visitRes = await opdAPI.getVisitByAppointment(appointmentIdFromUrl);
            if (visitRes.data.visit) {
              const visit = visitRes.data.visit;
              setExistingVisit(visit);

              // Pre-fill arrays directly
              setSelectedSymptoms((visit.symptoms || []).filter(Boolean));
              setSelectedDiagnoses((visit.diagnosis || []).filter(Boolean));
              setSelectedObservations((visit.observations || []).filter(Boolean));
              setSelectedTests((visit.recommended_tests || []).filter(Boolean));

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
  }, [id, patientIdFromUrl, appointmentIdFromUrl, setValue]);

  useEffect(() => {
    if (watchedPatientId) {
      const patient = patients.find(p => p.id === watchedPatientId);
      setSelectedPatient(patient);
      // Auto-expand patient history when patient is selected for easy access to previous visits
      if (patient) {
        setShowPatientHistory(true);
      }
    }
  }, [watchedPatientId, patients]);

  // Fetch patient history (visits and prescriptions) when patient is selected
  useEffect(() => {
    const fetchPatientHistory = async () => {
      if (!selectedPatient?.id) {
        setOldPrescriptions([]);
        setOldVisits([]);
        return;
      }

      setLoadingHistory(true);
      try {
        const [visitsRes, prescriptionsRes] = await Promise.all([
          patientsAPI.getVisits(selectedPatient.id),
          patientsAPI.getPrescriptions(selectedPatient.id)
        ]);
        setOldVisits(visitsRes.data.visits || visitsRes.data || []);
        setOldPrescriptions(prescriptionsRes.data.prescriptions || prescriptionsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch patient history:', error);
        // Don't show error toast - not critical
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPatientHistory();
  }, [selectedPatient?.id]);

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const hasUnsavedChanges = isDirty || medicines.length > 0 || selectedSymptoms.length > 0 || selectedDiagnoses.length > 0 || selectedObservations.length > 0 || selectedTests.length > 0;

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, medicines.length, selectedSymptoms.length, selectedDiagnoses.length, selectedObservations.length, selectedTests.length, isSubmitting]);

  const onSubmit = async (data) => {
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }

    // Validation
    if (selectedSymptoms.length === 0) {
      toast.error('Please add at least one symptom.');
      return;
    }

    if (selectedDiagnoses.length === 0) {
      toast.error('Please add at least one diagnosis.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter valid medicines
      const validMedicines = medicines.filter(m => m.medicine_name?.trim());

      const visitData = {
        patient_id: selectedPatient.id,
        appointment_id: appointmentIdFromUrl || null,
        symptoms: selectedSymptoms,
        diagnosis: selectedDiagnoses,
        observations: selectedObservations,
        recommended_tests: selectedTests,
        follow_up_date: data.followUpDate || null,
        vitals: {
          blood_pressure: data.bp,
          temperature: data.temperature,
          pulse: data.pulse,
          weight: data.weight,
          height: data.height,
          spo2: data.spo2,
        },
        // Include prescription data directly in visit
        prescription_notes: prescriptionNotes || null,
        amount: amount ? parseFloat(amount) : null,
        medicines: validMedicines.map(m => ({
          medicine_name: m.medicine_name,
          dosage: m.dosage || null,
          duration: m.duration || null,
        }))
      };

      // Update existing visit or create new one
      let visitRes;
      if (id) {
        // Editing existing visit via /visits/:id/edit
        visitRes = await visitsAPI.update(id, visitData);
      } else {
        visitRes = await visitsAPI.create(visitData);
      }

      const hasPrescription = validMedicines.length > 0;
      if (appointmentIdFromUrl) {
        // OPD flow - show print preview modal before navigating
        toast.success(
          existingVisit
            ? `Visit updated${hasPrescription ? ' with prescription' : ''}! Print prescription below.`
            : `Visit${hasPrescription ? ' and prescription' : ''} recorded! Print prescription below.`
        );

        // Prepare data for print modal
        setSavedVisitData({
          patient: selectedPatient,
          vitals: {
            blood_pressure: data.bp,
            temperature: data.temperature,
            pulse: data.pulse,
            weight: data.weight,
            height: data.height,
            spo2: data.spo2,
          },
          symptoms: selectedSymptoms,
          diagnoses: selectedDiagnoses,
          observations: selectedObservations,
          tests: selectedTests,
          followUpDate: data.followUpDate,
          medicines: validMedicines,
          prescriptionNotes: prescriptionNotes
        });
        setShowPrintModal(true);
        // Navigation happens when modal is closed
      } else if (id) {
        // Editing existing visit - navigate back to visit details
        toast.success(`Visit updated${hasPrescription ? ' with new prescription' : ''} successfully!`);
        navigate(`/visits/${id}`);
      } else {
        toast.success(`Visit${hasPrescription ? ' and prescription' : ''} recorded successfully!`);
        navigate(`/patients/${selectedPatient.id}`);
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
            ? `Updating Visit #${existingVisit.visit_number} from ${formatDateTime(existingVisit.visit_date)}`
            : 'Document patient consultation and vitals'}
        </p>
      </div>

      {loadingVisit && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading visit data...</p>
          </div>
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
              <label className="label">{id || patientIdFromUrl ? 'Patient' : 'Select Patient *'}</label>
              {loadingPatients ? (
                <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
              ) : (id || patientIdFromUrl) && selectedPatient ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                      {selectedPatient.full_name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.patient_code} • {selectedPatient.age_display || `${selectedPatient.age}y`} • {selectedPatient.gender}
                      </p>
                    </div>
                  </div>
                  <input type="hidden" {...register('patientId')} />
                </div>
              ) : (
                <select
                  className="input"
                  {...register('patientId', { required: 'Please select a patient' })}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_code} - {patient.full_name} ({patient.age_display || `${patient.age}y`})
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
                <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Allergies Alert:
                </p>
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

        {/* Patient History - Collapsible with Tabs */}
        {selectedPatient && (
          <PatientHistoryPanel
            visits={oldVisits}
            prescriptions={oldPrescriptions}
            loading={loadingHistory}
            expanded={showPatientHistory}
            onToggle={() => setShowPatientHistory(!showPatientHistory)}
          />
        )}

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
                className={`input ${errors.bp ? 'border-red-500' : ''}`}
                placeholder="e.g., 90/60"
                {...register('bp', { validate: validateBP })}
              />
              {errors.bp && (
                <p className="text-red-500 text-sm mt-1">{errors.bp.message}</p>
              )}
            </div>
            <div>
              <label className="label">Temperature (°F)</label>
              <input
                type="text"
                className={`input ${errors.temperature ? 'border-red-500' : ''}`}
                placeholder="e.g., 98.6"
                {...register('temperature', { validate: validateTemperature })}
              />
              {errors.temperature && (
                <p className="text-red-500 text-sm mt-1">{errors.temperature.message}</p>
              )}
            </div>
            <div>
              <label className="label">Pulse (bpm)</label>
              <input
                type="number"
                className={`input ${errors.pulse ? 'border-red-500' : ''}`}
                placeholder="e.g., 100"
                {...register('pulse', { validate: validatePulse })}
              />
              {errors.pulse && (
                <p className="text-red-500 text-sm mt-1">{errors.pulse.message}</p>
              )}
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={`input ${errors.weight ? 'border-red-500' : ''}`}
                placeholder="e.g., 24"
                {...register('weight', { validate: validateWeight })}
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
              )}
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input
                type="number"
                className={`input ${errors.height ? 'border-red-500' : ''}`}
                placeholder="e.g., 95"
                {...register('height', { validate: validateHeight })}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
              )}
            </div>
            <div>
              <label className="label">SpO2 (%)</label>
              <input
                type="number"
                className={`input ${errors.spo2 ? 'border-red-500' : ''}`}
                placeholder="e.g., 14"
                {...register('spo2', { validate: validateSpO2 })}
              />
              {errors.spo2 && (
                <p className="text-red-500 text-sm mt-1">{errors.spo2.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Consultation Details
          </h2>
          <div className="space-y-4">
            {/* Chief Complaints / Symptoms */}
            <div>
              <label className="label">Chief Complaints / Symptoms *</label>
              <MultiSelectComboBox
                selected={selectedSymptoms}
                onChange={setSelectedSymptoms}
                options={symptomOptions}
                onCreateNew={async (name) => {
                  try {
                    const res = await chiefComplaintsAPI.create({ name });
                    const newOpt = res.data;
                    setSymptomOptions(prev => [...prev, newOpt]);
                    toast.success(`"${name}" added to symptoms list`);
                    return newOpt;
                  } catch {
                    toast.error('Failed to add symptom');
                    return null;
                  }
                }}
                placeholder="Type to search or add symptoms..."
                chipColor="bg-red-100 text-red-800"
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label className="label">Diagnosis *</label>
              <MultiSelectComboBox
                selected={selectedDiagnoses}
                onChange={setSelectedDiagnoses}
                options={diagnosisOptions}
                onCreateNew={async (name) => {
                  try {
                    const res = await diagnosisOptionsAPI.create({ name });
                    const newOpt = res.data;
                    setDiagnosisOptions(prev => [...prev, newOpt]);
                    toast.success(`"${name}" added to diagnosis list`);
                    return newOpt;
                  } catch {
                    toast.error('Failed to add diagnosis');
                    return null;
                  }
                }}
                placeholder="Type to search or add diagnoses..."
                chipColor="bg-blue-100 text-blue-800"
              />
            </div>

            {/* Clinical Observations */}
            <div>
              <label className="label">Clinical Observations</label>
              <MultiSelectComboBox
                selected={selectedObservations}
                onChange={setSelectedObservations}
                options={observationOptions}
                onCreateNew={async (name) => {
                  try {
                    const res = await observationOptionsAPI.create({ name });
                    const newOpt = res.data;
                    setObservationOptions(prev => [...prev, newOpt]);
                    toast.success(`"${name}" added to observations list`);
                    return newOpt;
                  } catch {
                    toast.error('Failed to add observation');
                    return null;
                  }
                }}
                placeholder="Type to search or add observations..."
                chipColor="bg-green-100 text-green-800"
              />
            </div>

            {/* Recommended Tests */}
            <div>
              <label className="label">Recommended Tests</label>
              <MultiSelectComboBox
                selected={selectedTests}
                onChange={setSelectedTests}
                options={testOptions}
                onCreateNew={async (name) => {
                  try {
                    const res = await testOptionsAPI.create({ name });
                    const newOpt = res.data;
                    setTestOptions(prev => [...prev, newOpt]);
                    toast.success(`"${name}" added to tests list`);
                    return newOpt;
                  } catch {
                    toast.error('Failed to add test');
                    return null;
                  }
                }}
                placeholder="Type to search or add tests..."
                chipColor="bg-primary-100 text-primary-800"
              />
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

        {/* Prescription Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Prescription</h2>
            <button
              type="button"
              onClick={() => {
                setShowPrescriptionSection(!showPrescriptionSection);
                // Add first medicine row when opening
                if (!showPrescriptionSection && medicines.length === 0) {
                  setMedicines([{
                    id: Date.now(),
                    medicine_name: '',
                    dosage: '',
                    duration: '',
                  }]);
                }
              }}
              className="btn btn-secondary text-sm"
            >
              {showPrescriptionSection ? 'Hide Prescription' : '+ Add Prescription'}
            </button>
          </div>

          {showPrescriptionSection ? (
            <PrescriptionEditor
              medicines={medicines}
              setMedicines={setMedicines}
              notes={prescriptionNotes}
              setNotes={setPrescriptionNotes}
            />
          ) : (
            <p className="text-gray-500 text-sm">
              Click "Add Prescription" to prescribe medicines for this visit.
            </p>
          )}
        </div>

        {/* Billing Section */}
        {user?.enabled_plugins?.collections !== false && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Billing
          </h2>
          <div>
            <label className="label">Amount Charged</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input pl-8"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Internal tracking only - amount charged to patient
            </p>
          </div>
        </div>
        )}

        {/* Action Buttons */}
        <div className="card bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (
                appointmentIdFromUrl
                  ? (existingVisit ? '✓ Update & Complete OPD' : '✓ Save & Complete OPD')
                  : (id ? '✓ Update Visit' : '✓ Save Visit')
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {appointmentIdFromUrl
              ? (existingVisit
                  ? 'This will update the existing visit and mark the patient as done in OPD'
                  : 'This will record the visit and mark the patient as done in OPD')
              : (id
                  ? 'This will update the visit details'
                  : 'After saving, you can add prescriptions for this visit')}
          </p>
        </div>
      </form>

      {/* Print Preview Modal - shown after OPD visit save */}
      {showPrintModal && savedVisitData && (
        <VisitPreviewModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            navigate('/opd');
          }}
          data={savedVisitData}
          printSettings={user?.printSettings || { top: 280, left: 40 }}
          clinic={clinicData}
        />
      )}
    </div>
  );
}
