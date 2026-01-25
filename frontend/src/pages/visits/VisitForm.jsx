import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { patientsAPI, visitsAPI, diagnosisOptionsAPI, observationOptionsAPI, testOptionsAPI, chiefComplaintsAPI, opdAPI } from '../../services/api';
import PrescriptionEditor from '../../components/prescriptions/PrescriptionEditor';
import PatientHistoryPanel from '../../components/patients/PatientHistoryPanel';
import VisitPreviewModal from '../../components/visits/VisitPreviewModal';

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
  const [customSymptom, setCustomSymptom] = useState('');
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [observationOptions, setObservationOptions] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [customObservation, setCustomObservation] = useState('');
  const [testOptions, setTestOptions] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState('');
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

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = useForm({
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
        const [patientsRes, chiefComplaintsRes, diagnosisRes, observationsRes, testsRes] = await Promise.all([
          patientsAPI.getAll({ limit: 100 }),
          chiefComplaintsAPI.getAll(true),
          diagnosisOptionsAPI.getAll(true),
          observationOptionsAPI.getAll(true),
          testOptionsAPI.getAll(true)
        ]);

        const patientsList = patientsRes.data.patients || [];
        setPatients(patientsList);
        setSymptomOptions(chiefComplaintsRes.data || []);
        setDiagnosisOptions(diagnosisRes.data || []);
        setObservationOptions(observationsRes.data || []);
        setTestOptions(testsRes.data || []);

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
              // Handle symptoms (now array)
              const symptomList = chiefComplaintsRes.data || [];
              const existingSymptoms = visit.symptoms || [];
              const matchedSymptoms = [];
              const customSymptoms = [];

              existingSymptoms.forEach(symptom => {
                const symptomMatch = symptomList.find(s => s.name === symptom);
                if (symptomMatch) {
                  matchedSymptoms.push(symptom);
                } else if (symptom) {
                  customSymptoms.push(symptom);
                }
              });

              setSelectedSymptoms(matchedSymptoms);
              if (customSymptoms.length > 0) {
                setCustomSymptom(customSymptoms.join(', '));
              }

              // Handle diagnosis (now array)
              const diagnosisList = diagnosisRes.data || [];
              const existingDiagnoses = visit.diagnosis || [];
              const matchedDiagnoses = [];
              const customDiagnoses = [];

              existingDiagnoses.forEach(diagnosis => {
                const diagnosisMatch = diagnosisList.find(d => d.name === diagnosis);
                if (diagnosisMatch) {
                  matchedDiagnoses.push(diagnosis);
                } else if (diagnosis) {
                  customDiagnoses.push(diagnosis);
                }
              });

              setSelectedDiagnoses(matchedDiagnoses);
              if (customDiagnoses.length > 0) {
                setCustomDiagnosis(customDiagnoses.join(', '));
              }

              // Handle observation (now array)
              const observationList = observationsRes.data || [];
              const existingObservations = visit.observations || [];
              const matchedObservations = [];
              const customObservations = [];

              existingObservations.forEach(observation => {
                const observationMatch = observationList.find(o => o.name === observation);
                if (observationMatch) {
                  matchedObservations.push(observation);
                } else if (observation) {
                  customObservations.push(observation);
                }
              });

              setSelectedObservations(matchedObservations);
              if (customObservations.length > 0) {
                setCustomObservation(customObservations.join(', '));
              }

              // Handle recommended tests
              const testList = testsRes.data || [];
              const existingTests = visit.recommended_tests || [];
              const matchedTests = [];
              const customTests = [];

              existingTests.forEach(test => {
                const testMatch = testList.find(t => t.name === test);
                if (testMatch) {
                  matchedTests.push(test);
                } else if (test) {
                  customTests.push(test);
                }
              });

              setSelectedTests(matchedTests);
              if (customTests.length > 0) {
                setCustomTest(customTests.join(', '));
              }

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

              // Pre-fill form with existing visit data (OPD reopen case)
              // Handle symptoms (now array)
              const symptomListOPD = chiefComplaintsRes.data || [];
              const existingSymptomsOPD = visit.symptoms || [];
              const matchedSymptomsOPD = [];
              const customSymptomsOPD = [];

              existingSymptomsOPD.forEach(symptom => {
                const symptomMatch = symptomListOPD.find(s => s.name === symptom);
                if (symptomMatch) {
                  matchedSymptomsOPD.push(symptom);
                } else if (symptom) {
                  customSymptomsOPD.push(symptom);
                }
              });

              setSelectedSymptoms(matchedSymptomsOPD);
              if (customSymptomsOPD.length > 0) {
                setCustomSymptom(customSymptomsOPD.join(', '));
              }

              // Handle diagnosis (now array)
              const diagnosisListOPD = diagnosisRes.data || [];
              const existingDiagnosesOPD = visit.diagnosis || [];
              const matchedDiagnosesOPD = [];
              const customDiagnosesOPD = [];

              existingDiagnosesOPD.forEach(diagnosis => {
                const diagnosisMatch = diagnosisListOPD.find(d => d.name === diagnosis);
                if (diagnosisMatch) {
                  matchedDiagnosesOPD.push(diagnosis);
                } else if (diagnosis) {
                  customDiagnosesOPD.push(diagnosis);
                }
              });

              setSelectedDiagnoses(matchedDiagnosesOPD);
              if (customDiagnosesOPD.length > 0) {
                setCustomDiagnosis(customDiagnosesOPD.join(', '));
              }

              // Handle observation (now array)
              const observationListOPD = observationsRes.data || [];
              const existingObservationsOPD = visit.observations || [];
              const matchedObservationsOPD = [];
              const customObservationsOPD = [];

              existingObservationsOPD.forEach(observation => {
                const observationMatch = observationListOPD.find(o => o.name === observation);
                if (observationMatch) {
                  matchedObservationsOPD.push(observation);
                } else if (observation) {
                  customObservationsOPD.push(observation);
                }
              });

              setSelectedObservations(matchedObservationsOPD);
              if (customObservationsOPD.length > 0) {
                setCustomObservation(customObservationsOPD.join(', '));
              }

              // Handle recommended tests
              const testListOPD = testsRes.data || [];
              const existingTestsOPD = visit.recommended_tests || [];
              const matchedTestsOPD = [];
              const customTestsOPD = [];

              existingTestsOPD.forEach(test => {
                const testMatch = testListOPD.find(t => t.name === test);
                if (testMatch) {
                  matchedTestsOPD.push(test);
                } else if (test) {
                  customTestsOPD.push(test);
                }
              });

              setSelectedTests(matchedTestsOPD);
              if (customTestsOPD.length > 0) {
                setCustomTest(customTestsOPD.join(', '));
              }

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

    // Combine selected symptoms with custom symptoms
    const allSymptoms = [...selectedSymptoms];
    if (customSymptom.trim()) {
      const customSymptomsList = customSymptom.split(',').map(s => s.trim()).filter(s => s);
      allSymptoms.push(...customSymptomsList);
    }

    // Combine selected diagnoses with custom diagnoses
    const allDiagnoses = [...selectedDiagnoses];
    if (customDiagnosis.trim()) {
      const customDiagnosesList = customDiagnosis.split(',').map(d => d.trim()).filter(d => d);
      allDiagnoses.push(...customDiagnosesList);
    }

    // Combine selected observations with custom observations
    const allObservations = [...selectedObservations];
    if (customObservation.trim()) {
      const customObservationsList = customObservation.split(',').map(o => o.trim()).filter(o => o);
      allObservations.push(...customObservationsList);
    }

    // Combine selected tests with custom tests
    const allTests = [...selectedTests];
    if (customTest.trim()) {
      const customTestsList = customTest.split(',').map(t => t.trim()).filter(t => t);
      allTests.push(...customTestsList);
    }

    // Validation
    if (allSymptoms.length === 0) {
      toast.error('Please add at least one symptom.');
      return;
    }

    if (allDiagnoses.length === 0) {
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
        symptoms: allSymptoms,
        diagnosis: allDiagnoses,
        observations: allObservations,
        recommended_tests: allTests,
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
          symptoms: allSymptoms,
          diagnoses: allDiagnoses,
          observations: allObservations,
          tests: allTests,
          followUpDate: data.followUpDate,
          medicines: validMedicines,
          prescriptionNotes: prescriptionNotes
        });
        setShowPrintModal(true);
        // Navigation happens when modal is closed
      } else if (id) {
        // Editing existing visit - navigate back to visit details
        toast.success(`Visit updated${hasPrescription ? ' with new prescription' : ''} successfully!`);
        setTimeout(() => {
          navigate(`/visits/${id}`);
        }, 1500);
      } else {
        toast.success(`Visit${hasPrescription ? ' and prescription' : ''} recorded successfully!`);
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
                        {selectedPatient.patient_code} • {selectedPatient.age} years • {selectedPatient.gender}
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
            {/* Chief Complaints / Symptoms - Multi-select */}
            <div>
              <label className="label">Chief Complaints / Symptoms *</label>
              <div className="space-y-3">
                {/* Selected symptoms as chips */}
                {selectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => setSelectedSymptoms(selectedSymptoms.filter((_, i) => i !== index))}
                          className="hover:text-red-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown to add symptoms */}
                {symptomOptions.length > 0 && (
                  <select
                    className="input"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedSymptoms.includes(value)) {
                        setSelectedSymptoms([...selectedSymptoms, value]);
                      }
                    }}
                  >
                    <option value="">Add a symptom...</option>
                    {symptomOptions
                      .filter(option => !selectedSymptoms.includes(option.name))
                      .map(option => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                )}

                {/* Custom symptom input */}
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Add custom symptoms (comma separated)"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter additional symptoms not in the list, separated by commas
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnosis - Multi-select */}
            <div>
              <label className="label">Diagnosis *</label>
              <div className="space-y-3">
                {/* Selected diagnoses as chips */}
                {selectedDiagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDiagnoses.map((diagnosis, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {diagnosis}
                        <button
                          type="button"
                          onClick={() => setSelectedDiagnoses(selectedDiagnoses.filter((_, i) => i !== index))}
                          className="hover:text-blue-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown to add diagnoses */}
                {diagnosisOptions.length > 0 && (
                  <select
                    className="input"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedDiagnoses.includes(value)) {
                        setSelectedDiagnoses([...selectedDiagnoses, value]);
                      }
                    }}
                  >
                    <option value="">Add a diagnosis...</option>
                    {diagnosisOptions
                      .filter(option => !selectedDiagnoses.includes(option.name))
                      .map(option => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                )}

                {/* Custom diagnosis input */}
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Add custom diagnoses (comma separated)"
                    value={customDiagnosis}
                    onChange={(e) => setCustomDiagnosis(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter additional diagnoses not in the list, separated by commas
                  </p>
                </div>
              </div>
            </div>

            {/* Clinical Observations - Multi-select */}
            <div>
              <label className="label">Clinical Observations</label>
              <div className="space-y-3">
                {/* Selected observations as chips */}
                {selectedObservations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedObservations.map((observation, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {observation}
                        <button
                          type="button"
                          onClick={() => setSelectedObservations(selectedObservations.filter((_, i) => i !== index))}
                          className="hover:text-green-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown to add observations */}
                {observationOptions.length > 0 && (
                  <select
                    className="input"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedObservations.includes(value)) {
                        setSelectedObservations([...selectedObservations, value]);
                      }
                    }}
                  >
                    <option value="">Add an observation...</option>
                    {observationOptions
                      .filter(option => !selectedObservations.includes(option.name))
                      .map(option => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                )}

                {/* Custom observation input */}
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Add custom observations (comma separated)"
                    value={customObservation}
                    onChange={(e) => setCustomObservation(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter additional observations not in the list, separated by commas
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Recommended Tests</label>
              {testOptions.length > 0 ? (
                <div className="space-y-3">
                  {/* Selected tests as chips */}
                  {selectedTests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTests.map((test, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                        >
                          {test}
                          <button
                            type="button"
                            onClick={() => setSelectedTests(selectedTests.filter((_, i) => i !== index))}
                            className="hover:text-primary-900 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dropdown to add more tests */}
                  <select
                    className="input"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value !== 'OTHER' && !selectedTests.includes(value)) {
                        setSelectedTests([...selectedTests, value]);
                      }
                    }}
                  >
                    <option value="">Add a test...</option>
                    {testOptions
                      .filter(option => !selectedTests.includes(option.name))
                      .map(option => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    <option value="OTHER">Other (specify below)</option>
                  </select>

                  {/* Custom test input */}
                  <div>
                    <input
                      type="text"
                      className="input"
                      placeholder="Add custom tests (comma separated)"
                      value={customTest}
                      onChange={(e) => setCustomTest(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter additional tests not in the list, separated by commas
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., CBC, Blood Sugar (comma separated)"
                    value={customTest}
                    onChange={(e) => setCustomTest(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter multiple tests separated by commas
                  </p>
                </>
              )}
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
        />
      )}
    </div>
  );
}
