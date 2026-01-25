import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { chiefComplaintsAPI, diagnosisOptionsAPI, observationOptionsAPI, testOptionsAPI, medicineOptionsAPI, dosageOptionsAPI, durationOptionsAPI, symptomOptionsAPI } from '../services/api';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Print position settings
  const [printPosition, setPrintPosition] = useState({
    top: user?.printSettings?.top || 280,
    left: user?.printSettings?.left || 40,
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      specialty: user?.specialty || '',
      licenseNumber: user?.licenseNumber || '',
    }
  });

  const { register: registerClinic, handleSubmit: handleClinicSubmit, formState: { errors: clinicErrors } } = useForm({
    defaultValues: {
      clinicName: user?.clinic?.name || 'City Health Clinic',
      clinicAddress: user?.clinic?.address || '123 Main Street, Mumbai, Maharashtra',
      clinicPhone: user?.clinic?.phone || '+91 9876543210',
      clinicEmail: user?.clinic?.email || 'info@cityhealthclinic.com',
      clinicLogo: user?.clinic?.logo || '',
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm();

  const [chiefComplaints, setChiefComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [showAddComplaint, setShowAddComplaint] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ name: '', description: '', display_order: 0 });

  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [diagnosisForm, setDiagnosisForm] = useState({ name: '', description: '', display_order: 0 });

  const [observationOptions, setObservationOptions] = useState([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);
  const [observationForm, setObservationForm] = useState({ name: '', description: '', display_order: 0 });

  const [testOptions, setTestOptions] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({ name: '', description: '', display_order: 0 });

  const [medicineOptions, setMedicineOptions] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineForm, setMedicineForm] = useState({ name: '', description: '', display_order: 0 });

  const [dosageOptions, setDosageOptions] = useState([]);
  const [loadingDosages, setLoadingDosages] = useState(false);
  const [showAddDosage, setShowAddDosage] = useState(false);
  const [editingDosage, setEditingDosage] = useState(null);
  const [dosageForm, setDosageForm] = useState({ name: '', description: '', display_order: 0 });

  const [durationOptions, setDurationOptions] = useState([]);
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [showAddDuration, setShowAddDuration] = useState(false);
  const [editingDuration, setEditingDuration] = useState(null);
  const [durationForm, setDurationForm] = useState({ name: '', description: '', display_order: 0 });

  const [symptomOptions, setSymptomOptions] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState(null);
  const [symptomForm, setSymptomForm] = useState({ name: '', description: '', display_order: 0 });

  const isDoctor = user?.role === 'DOCTOR';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'clinic', label: 'Clinic Settings', icon: '🏥' },
    ...(isDoctor ? [
      { id: 'complaints', label: 'Chief Complaints', icon: '📋' },
      { id: 'symptoms', label: 'Symptom Options', icon: '🤒' },
      { id: 'diagnosis', label: 'Diagnosis Options', icon: '🩺' },
      { id: 'observations', label: 'Observations', icon: '👁️' },
      { id: 'tests', label: 'Test Options', icon: '🧪' },
      { id: 'medicines', label: 'Medicines', icon: '💊' },
      { id: 'dosages', label: 'Dosage Options', icon: '📏' },
      { id: 'durations', label: 'Duration Options', icon: '⏱️' },
    ] : []),
    { id: 'password', label: 'Change Password', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  useEffect(() => {
    if (isDoctor) {
      fetchChiefComplaints();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints' && isDoctor && chiefComplaints.length === 0) {
      fetchChiefComplaints();
    }
  }, [activeTab]);

  const fetchChiefComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const response = await chiefComplaintsAPI.getAll(false);
      setChiefComplaints(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chief complaints:', error);
      toast.error('Failed to load chief complaints');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.name.trim()) {
      toast.error('Please enter a complaint name');
      return;
    }
    try {
      await chiefComplaintsAPI.create({
        name: complaintForm.name,
        description: complaintForm.description,
        display_order: complaintForm.display_order || chiefComplaints.length + 1,
        is_active: true,
      });
      toast.success('Chief complaint added');
      setShowAddComplaint(false);
      setComplaintForm({ name: '', description: '', display_order: 0 });
      fetchChiefComplaints();
    } catch (error) {
      console.error('Failed to add complaint:', error);
      toast.error(error.errorMessage || 'Failed to add chief complaint');
    }
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.name.trim()) {
      toast.error('Please enter a complaint name');
      return;
    }
    try {
      await chiefComplaintsAPI.update(editingComplaint.id, {
        name: complaintForm.name,
        description: complaintForm.description,
        display_order: complaintForm.display_order,
        is_active: editingComplaint.is_active,
      });
      toast.success('Chief complaint updated');
      setEditingComplaint(null);
      setComplaintForm({ name: '', description: '', display_order: 0 });
      fetchChiefComplaints();
    } catch (error) {
      console.error('Failed to update complaint:', error);
      toast.error(error.errorMessage || 'Failed to update chief complaint');
    }
  };

  const handleToggleActive = async (complaint) => {
    try {
      await chiefComplaintsAPI.update(complaint.id, {
        name: complaint.name,
        description: complaint.description,
        display_order: complaint.display_order,
        is_active: !complaint.is_active,
      });
      toast.success(complaint.is_active ? 'Complaint deactivated' : 'Complaint activated');
      fetchChiefComplaints();
    } catch (error) {
      console.error('Failed to toggle complaint:', error);
      toast.error(error.errorMessage || 'Failed to update complaint status');
    }
  };

  const handleDeleteComplaint = async (complaint) => {
    if (!confirm(`Are you sure you want to delete "${complaint.name}"?`)) return;
    try {
      await chiefComplaintsAPI.delete(complaint.id);
      toast.success('Chief complaint deleted');
      fetchChiefComplaints();
    } catch (error) {
      console.error('Failed to delete complaint:', error);
      toast.error(error.errorMessage || 'Failed to delete chief complaint');
    }
  };

  const startEditComplaint = (complaint) => {
    setEditingComplaint(complaint);
    setComplaintForm({
      name: complaint.name,
      description: complaint.description || '',
      display_order: complaint.display_order,
    });
    setShowAddComplaint(false);
  };

  const fetchDiagnosisOptions = async () => {
    setLoadingDiagnosis(true);
    try {
      const response = await diagnosisOptionsAPI.getAll(false);
      setDiagnosisOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch diagnosis options:', error);
      toast.error('Failed to load diagnosis options');
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagnosisForm.name.trim()) {
      toast.error('Please enter a diagnosis name');
      return;
    }
    try {
      await diagnosisOptionsAPI.create({
        name: diagnosisForm.name,
        description: diagnosisForm.description,
        display_order: diagnosisForm.display_order || diagnosisOptions.length + 1,
        is_active: true,
      });
      toast.success('Diagnosis option added');
      setShowAddDiagnosis(false);
      setDiagnosisForm({ name: '', description: '', display_order: 0 });
      fetchDiagnosisOptions();
    } catch (error) {
      console.error('Failed to add diagnosis:', error);
      toast.error(error.errorMessage || 'Failed to add diagnosis option');
    }
  };

  const handleUpdateDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagnosisForm.name.trim()) {
      toast.error('Please enter a diagnosis name');
      return;
    }
    try {
      await diagnosisOptionsAPI.update(editingDiagnosis.id, {
        name: diagnosisForm.name,
        description: diagnosisForm.description,
        display_order: diagnosisForm.display_order,
        is_active: editingDiagnosis.is_active,
      });
      toast.success('Diagnosis option updated');
      setEditingDiagnosis(null);
      setDiagnosisForm({ name: '', description: '', display_order: 0 });
      fetchDiagnosisOptions();
    } catch (error) {
      console.error('Failed to update diagnosis:', error);
      toast.error(error.errorMessage || 'Failed to update diagnosis option');
    }
  };

  const handleToggleDiagnosis = async (option) => {
    try {
      await diagnosisOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Diagnosis deactivated' : 'Diagnosis activated');
      fetchDiagnosisOptions();
    } catch (error) {
      console.error('Failed to toggle diagnosis:', error);
      toast.error(error.errorMessage || 'Failed to update diagnosis status');
    }
  };

  const handleDeleteDiagnosis = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await diagnosisOptionsAPI.delete(option.id);
      toast.success('Diagnosis option deleted');
      fetchDiagnosisOptions();
    } catch (error) {
      console.error('Failed to delete diagnosis:', error);
      toast.error(error.errorMessage || 'Failed to delete diagnosis option');
    }
  };

  const startEditDiagnosis = (option) => {
    setEditingDiagnosis(option);
    setDiagnosisForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddDiagnosis(false);
  };

  const fetchObservationOptions = async () => {
    setLoadingObservations(true);
    try {
      const response = await observationOptionsAPI.getAll(false);
      setObservationOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch observation options:', error);
      toast.error('Failed to load observation options');
    } finally {
      setLoadingObservations(false);
    }
  };

  const handleAddObservation = async (e) => {
    e.preventDefault();
    if (!observationForm.name.trim()) {
      toast.error('Please enter an observation name');
      return;
    }
    try {
      await observationOptionsAPI.create({
        name: observationForm.name,
        description: observationForm.description,
        display_order: observationForm.display_order || observationOptions.length + 1,
        is_active: true,
      });
      toast.success('Observation option added');
      setShowAddObservation(false);
      setObservationForm({ name: '', description: '', display_order: 0 });
      fetchObservationOptions();
    } catch (error) {
      console.error('Failed to add observation:', error);
      toast.error(error.errorMessage || 'Failed to add observation option');
    }
  };

  const handleUpdateObservation = async (e) => {
    e.preventDefault();
    if (!observationForm.name.trim()) {
      toast.error('Please enter an observation name');
      return;
    }
    try {
      await observationOptionsAPI.update(editingObservation.id, {
        name: observationForm.name,
        description: observationForm.description,
        display_order: observationForm.display_order,
        is_active: editingObservation.is_active,
      });
      toast.success('Observation option updated');
      setEditingObservation(null);
      setObservationForm({ name: '', description: '', display_order: 0 });
      fetchObservationOptions();
    } catch (error) {
      console.error('Failed to update observation:', error);
      toast.error(error.errorMessage || 'Failed to update observation option');
    }
  };

  const handleToggleObservation = async (option) => {
    try {
      await observationOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Observation deactivated' : 'Observation activated');
      fetchObservationOptions();
    } catch (error) {
      console.error('Failed to toggle observation:', error);
      toast.error(error.errorMessage || 'Failed to update observation status');
    }
  };

  const handleDeleteObservation = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await observationOptionsAPI.delete(option.id);
      toast.success('Observation option deleted');
      fetchObservationOptions();
    } catch (error) {
      console.error('Failed to delete observation:', error);
      toast.error(error.errorMessage || 'Failed to delete observation option');
    }
  };

  const startEditObservation = (option) => {
    setEditingObservation(option);
    setObservationForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddObservation(false);
  };

  const fetchTestOptions = async () => {
    setLoadingTests(true);
    try {
      const response = await testOptionsAPI.getAll(false);
      setTestOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch test options:', error);
      toast.error('Failed to load test options');
    } finally {
      setLoadingTests(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!testForm.name.trim()) {
      toast.error('Please enter a test name');
      return;
    }
    try {
      await testOptionsAPI.create({
        name: testForm.name,
        description: testForm.description,
        display_order: testForm.display_order || testOptions.length + 1,
        is_active: true,
      });
      toast.success('Test option added');
      setShowAddTest(false);
      setTestForm({ name: '', description: '', display_order: 0 });
      fetchTestOptions();
    } catch (error) {
      console.error('Failed to add test:', error);
      toast.error(error.errorMessage || 'Failed to add test option');
    }
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    if (!testForm.name.trim()) {
      toast.error('Please enter a test name');
      return;
    }
    try {
      await testOptionsAPI.update(editingTest.id, {
        name: testForm.name,
        description: testForm.description,
        display_order: testForm.display_order,
        is_active: editingTest.is_active,
      });
      toast.success('Test option updated');
      setEditingTest(null);
      setTestForm({ name: '', description: '', display_order: 0 });
      fetchTestOptions();
    } catch (error) {
      console.error('Failed to update test:', error);
      toast.error(error.errorMessage || 'Failed to update test option');
    }
  };

  const handleToggleTest = async (option) => {
    try {
      await testOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Test deactivated' : 'Test activated');
      fetchTestOptions();
    } catch (error) {
      console.error('Failed to toggle test:', error);
      toast.error(error.errorMessage || 'Failed to update test status');
    }
  };

  const handleDeleteTest = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await testOptionsAPI.delete(option.id);
      toast.success('Test option deleted');
      fetchTestOptions();
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error(error.errorMessage || 'Failed to delete test option');
    }
  };

  const startEditTest = (option) => {
    setEditingTest(option);
    setTestForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddTest(false);
  };

  // Medicine Options handlers
  const fetchMedicineOptions = async () => {
    setLoadingMedicines(true);
    try {
      const response = await medicineOptionsAPI.getAll(false);
      setMedicineOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch medicine options:', error);
      toast.error('Failed to load medicine options');
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medicineForm.name.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }
    try {
      await medicineOptionsAPI.create({
        name: medicineForm.name,
        description: medicineForm.description,
        display_order: medicineForm.display_order || medicineOptions.length + 1,
        is_active: true,
      });
      toast.success('Medicine option added');
      setShowAddMedicine(false);
      setMedicineForm({ name: '', description: '', display_order: 0 });
      fetchMedicineOptions();
    } catch (error) {
      console.error('Failed to add medicine:', error);
      toast.error(error.errorMessage || 'Failed to add medicine option');
    }
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!medicineForm.name.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }
    try {
      await medicineOptionsAPI.update(editingMedicine.id, {
        name: medicineForm.name,
        description: medicineForm.description,
        display_order: medicineForm.display_order,
        is_active: editingMedicine.is_active,
      });
      toast.success('Medicine option updated');
      setEditingMedicine(null);
      setMedicineForm({ name: '', description: '', display_order: 0 });
      fetchMedicineOptions();
    } catch (error) {
      console.error('Failed to update medicine:', error);
      toast.error(error.errorMessage || 'Failed to update medicine option');
    }
  };

  const handleToggleMedicine = async (option) => {
    try {
      await medicineOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Medicine deactivated' : 'Medicine activated');
      fetchMedicineOptions();
    } catch (error) {
      console.error('Failed to toggle medicine:', error);
      toast.error(error.errorMessage || 'Failed to update medicine status');
    }
  };

  const handleDeleteMedicine = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await medicineOptionsAPI.delete(option.id);
      toast.success('Medicine option deleted');
      fetchMedicineOptions();
    } catch (error) {
      console.error('Failed to delete medicine:', error);
      toast.error(error.errorMessage || 'Failed to delete medicine option');
    }
  };

  const startEditMedicine = (option) => {
    setEditingMedicine(option);
    setMedicineForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddMedicine(false);
  };

  // Dosage Options handlers
  const fetchDosageOptions = async () => {
    setLoadingDosages(true);
    try {
      const response = await dosageOptionsAPI.getAll(false);
      setDosageOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch dosage options:', error);
      toast.error('Failed to load dosage options');
    } finally {
      setLoadingDosages(false);
    }
  };

  const handleAddDosage = async (e) => {
    e.preventDefault();
    if (!dosageForm.name.trim()) {
      toast.error('Please enter a dosage name');
      return;
    }
    try {
      await dosageOptionsAPI.create({
        name: dosageForm.name,
        description: dosageForm.description,
        display_order: dosageForm.display_order || dosageOptions.length + 1,
        is_active: true,
      });
      toast.success('Dosage option added');
      setShowAddDosage(false);
      setDosageForm({ name: '', description: '', display_order: 0 });
      fetchDosageOptions();
    } catch (error) {
      console.error('Failed to add dosage:', error);
      toast.error(error.errorMessage || 'Failed to add dosage option');
    }
  };

  const handleUpdateDosage = async (e) => {
    e.preventDefault();
    if (!dosageForm.name.trim()) {
      toast.error('Please enter a dosage name');
      return;
    }
    try {
      await dosageOptionsAPI.update(editingDosage.id, {
        name: dosageForm.name,
        description: dosageForm.description,
        display_order: dosageForm.display_order,
        is_active: editingDosage.is_active,
      });
      toast.success('Dosage option updated');
      setEditingDosage(null);
      setDosageForm({ name: '', description: '', display_order: 0 });
      fetchDosageOptions();
    } catch (error) {
      console.error('Failed to update dosage:', error);
      toast.error(error.errorMessage || 'Failed to update dosage option');
    }
  };

  const handleToggleDosage = async (option) => {
    try {
      await dosageOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Dosage deactivated' : 'Dosage activated');
      fetchDosageOptions();
    } catch (error) {
      console.error('Failed to toggle dosage:', error);
      toast.error(error.errorMessage || 'Failed to update dosage status');
    }
  };

  const handleDeleteDosage = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await dosageOptionsAPI.delete(option.id);
      toast.success('Dosage option deleted');
      fetchDosageOptions();
    } catch (error) {
      console.error('Failed to delete dosage:', error);
      toast.error(error.errorMessage || 'Failed to delete dosage option');
    }
  };

  const startEditDosage = (option) => {
    setEditingDosage(option);
    setDosageForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddDosage(false);
  };

  // Duration Options handlers
  const fetchDurationOptions = async () => {
    setLoadingDurations(true);
    try {
      const response = await durationOptionsAPI.getAll(false);
      setDurationOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch duration options:', error);
      toast.error('Failed to load duration options');
    } finally {
      setLoadingDurations(false);
    }
  };

  const handleAddDuration = async (e) => {
    e.preventDefault();
    if (!durationForm.name.trim()) {
      toast.error('Please enter a duration name');
      return;
    }
    try {
      await durationOptionsAPI.create({
        name: durationForm.name,
        description: durationForm.description,
        display_order: durationForm.display_order || durationOptions.length + 1,
        is_active: true,
      });
      toast.success('Duration option added');
      setShowAddDuration(false);
      setDurationForm({ name: '', description: '', display_order: 0 });
      fetchDurationOptions();
    } catch (error) {
      console.error('Failed to add duration:', error);
      toast.error(error.errorMessage || 'Failed to add duration option');
    }
  };

  const handleUpdateDuration = async (e) => {
    e.preventDefault();
    if (!durationForm.name.trim()) {
      toast.error('Please enter a duration name');
      return;
    }
    try {
      await durationOptionsAPI.update(editingDuration.id, {
        name: durationForm.name,
        description: durationForm.description,
        display_order: durationForm.display_order,
        is_active: editingDuration.is_active,
      });
      toast.success('Duration option updated');
      setEditingDuration(null);
      setDurationForm({ name: '', description: '', display_order: 0 });
      fetchDurationOptions();
    } catch (error) {
      console.error('Failed to update duration:', error);
      toast.error(error.errorMessage || 'Failed to update duration option');
    }
  };

  const handleToggleDuration = async (option) => {
    try {
      await durationOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Duration deactivated' : 'Duration activated');
      fetchDurationOptions();
    } catch (error) {
      console.error('Failed to toggle duration:', error);
      toast.error(error.errorMessage || 'Failed to update duration status');
    }
  };

  const handleDeleteDuration = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await durationOptionsAPI.delete(option.id);
      toast.success('Duration option deleted');
      fetchDurationOptions();
    } catch (error) {
      console.error('Failed to delete duration:', error);
      toast.error(error.errorMessage || 'Failed to delete duration option');
    }
  };

  const startEditDuration = (option) => {
    setEditingDuration(option);
    setDurationForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddDuration(false);
  };

  // Symptom Options handlers
  const fetchSymptomOptions = async () => {
    setLoadingSymptoms(true);
    try {
      const response = await symptomOptionsAPI.getAll(false);
      setSymptomOptions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch symptom options:', error);
      toast.error('Failed to load symptom options');
    } finally {
      setLoadingSymptoms(false);
    }
  };

  const handleAddSymptom = async (e) => {
    e.preventDefault();
    if (!symptomForm.name.trim()) {
      toast.error('Please enter a symptom name');
      return;
    }
    try {
      await symptomOptionsAPI.create({
        name: symptomForm.name,
        description: symptomForm.description,
        display_order: symptomForm.display_order || symptomOptions.length + 1,
        is_active: true,
      });
      toast.success('Symptom option added');
      setShowAddSymptom(false);
      setSymptomForm({ name: '', description: '', display_order: 0 });
      fetchSymptomOptions();
    } catch (error) {
      console.error('Failed to add symptom:', error);
      toast.error(error.errorMessage || 'Failed to add symptom option');
    }
  };

  const handleUpdateSymptom = async (e) => {
    e.preventDefault();
    if (!symptomForm.name.trim()) {
      toast.error('Please enter a symptom name');
      return;
    }
    try {
      await symptomOptionsAPI.update(editingSymptom.id, {
        name: symptomForm.name,
        description: symptomForm.description,
        display_order: symptomForm.display_order,
        is_active: editingSymptom.is_active,
      });
      toast.success('Symptom option updated');
      setEditingSymptom(null);
      setSymptomForm({ name: '', description: '', display_order: 0 });
      fetchSymptomOptions();
    } catch (error) {
      console.error('Failed to update symptom:', error);
      toast.error(error.errorMessage || 'Failed to update symptom option');
    }
  };

  const handleToggleSymptom = async (option) => {
    try {
      await symptomOptionsAPI.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? 'Symptom deactivated' : 'Symptom activated');
      fetchSymptomOptions();
    } catch (error) {
      console.error('Failed to toggle symptom:', error);
      toast.error(error.errorMessage || 'Failed to update symptom status');
    }
  };

  const handleDeleteSymptom = async (option) => {
    if (!confirm(`Are you sure you want to delete "${option.name}"?`)) return;
    try {
      await symptomOptionsAPI.delete(option.id);
      toast.success('Symptom option deleted');
      fetchSymptomOptions();
    } catch (error) {
      console.error('Failed to delete symptom:', error);
      toast.error(error.errorMessage || 'Failed to delete symptom option');
    }
  };

  const startEditSymptom = (option) => {
    setEditingSymptom(option);
    setSymptomForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddSymptom(false);
  };

  useEffect(() => {
    if (activeTab === 'diagnosis' && isDoctor && diagnosisOptions.length === 0) {
      fetchDiagnosisOptions();
    }
    if (activeTab === 'observations' && isDoctor && observationOptions.length === 0) {
      fetchObservationOptions();
    }
    if (activeTab === 'tests' && isDoctor && testOptions.length === 0) {
      fetchTestOptions();
    }
    if (activeTab === 'medicines' && isDoctor && medicineOptions.length === 0) {
      fetchMedicineOptions();
    }
    if (activeTab === 'dosages' && isDoctor && dosageOptions.length === 0) {
      fetchDosageOptions();
    }
    if (activeTab === 'durations' && isDoctor && durationOptions.length === 0) {
      fetchDurationOptions();
    }
    if (activeTab === 'symptoms' && isDoctor && symptomOptions.length === 0) {
      fetchSymptomOptions();
    }
  }, [activeTab]);

  const onProfileSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const updatedUser = {
        ...user,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber,
      };

      updateUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onClinicSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const updatedUser = {
        ...user,
        clinic: {
          ...user.clinic,
          name: data.clinicName,
          address: data.clinicAddress,
          phone: data.clinicPhone,
          email: data.clinicEmail,
          logo: data.clinicLogo,
        }
      };

      updateUser(updatedUser);
      setSuccessMessage('Clinic settings updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating clinic settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    if (data.newPassword !== data.confirmPassword) {
      alert('New passwords do not match!');
      setIsSubmitting(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      console.log('Password change requested');
      setSuccessMessage('Password changed successfully!');
      resetPassword();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and clinic preferences</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Tabs */}
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

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Profile Information
          </h2>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter full name"
                  {...registerProfile('fullName', { required: 'Full name is required' })}
                />
                {profileErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  {...registerProfile('email', { required: 'Email is required' })}
                />
                {profileErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 1234567890"
                  {...registerProfile('phone')}
                />
              </div>

              <div>
                <label className="label">Specialty</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., General Physician, Cardiologist"
                  {...registerProfile('specialty')}
                />
              </div>

              <div>
                <label className="label">License Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Medical license number"
                  {...registerProfile('licenseNumber')}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clinic Settings */}
      {activeTab === 'clinic' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Clinic Information
          </h2>
          <form onSubmit={handleClinicSubmit(onClinicSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Clinic Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter clinic name"
                  {...registerClinic('clinicName', { required: 'Clinic name is required' })}
                />
                {clinicErrors.clinicName && (
                  <p className="text-red-500 text-sm mt-1">{clinicErrors.clinicName.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="label">Clinic Address</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Enter complete clinic address"
                  {...registerClinic('clinicAddress')}
                />
              </div>

              <div>
                <label className="label">Clinic Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 1234567890"
                  {...registerClinic('clinicPhone')}
                />
              </div>

              <div>
                <label className="label">Clinic Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="clinic@email.com"
                  {...registerClinic('clinicEmail')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Clinic Logo URL (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://example.com/logo.png"
                  {...registerClinic('clinicLogo')}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the URL of your clinic logo image
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chief Complaints */}
      {activeTab === 'complaints' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Chief Complaints
              </h2>
              <button
                onClick={() => {
                  setShowAddComplaint(true);
                  setEditingComplaint(null);
                  setComplaintForm({ name: '', description: '', display_order: chiefComplaints.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Complaint
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure the common complaints that appear in the OPD queue dropdown. 
              Patients can still enter custom complaints if needed.
            </p>

            {(showAddComplaint || editingComplaint) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingComplaint ? 'Edit Complaint' : 'Add New Complaint'}
                </h3>
                <form onSubmit={editingComplaint ? handleUpdateComplaint : handleAddComplaint} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Complaint Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Toothache, Routine Checkup"
                        value={complaintForm.name}
                        onChange={(e) => setComplaintForm({ ...complaintForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={complaintForm.display_order}
                        onChange={(e) => setComplaintForm({ ...complaintForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the complaint"
                        value={complaintForm.description}
                        onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingComplaint ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddComplaint(false);
                        setEditingComplaint(null);
                        setComplaintForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingComplaints ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading complaints...</p>
              </div>
            ) : chiefComplaints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No chief complaints configured</p>
                <p className="text-sm mt-1">Add complaints to show them in the OPD queue dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chiefComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      complaint.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{complaint.display_order}</span>
                      <div>
                        <span className={`font-medium ${complaint.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {complaint.name}
                        </span>
                        {complaint.description && (
                          <p className="text-sm text-gray-500">{complaint.description}</p>
                        )}
                      </div>
                      {!complaint.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditComplaint(complaint)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(complaint)}
                        className={`text-sm ${complaint.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {complaint.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteComplaint(complaint)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange complaints. Lower numbers appear first in the dropdown.
              Deactivated complaints won't appear in the OPD queue but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Diagnosis Options */}
      {activeTab === 'diagnosis' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Diagnosis Options
              </h2>
              <button
                onClick={() => {
                  setShowAddDiagnosis(true);
                  setEditingDiagnosis(null);
                  setDiagnosisForm({ name: '', description: '', display_order: diagnosisOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Diagnosis
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common diagnoses that appear in the visit form dropdown. 
              Doctors can still enter custom diagnoses if needed.
            </p>

            {(showAddDiagnosis || editingDiagnosis) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingDiagnosis ? 'Edit Diagnosis' : 'Add New Diagnosis'}
                </h3>
                <form onSubmit={editingDiagnosis ? handleUpdateDiagnosis : handleAddDiagnosis} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Diagnosis Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Dental Caries, Gingivitis"
                        value={diagnosisForm.name}
                        onChange={(e) => setDiagnosisForm({ ...diagnosisForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={diagnosisForm.display_order}
                        onChange={(e) => setDiagnosisForm({ ...diagnosisForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the diagnosis"
                        value={diagnosisForm.description}
                        onChange={(e) => setDiagnosisForm({ ...diagnosisForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingDiagnosis ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDiagnosis(false);
                        setEditingDiagnosis(null);
                        setDiagnosisForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingDiagnosis ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading diagnoses...</p>
              </div>
            ) : diagnosisOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🩺</div>
                <p>No diagnosis options configured</p>
                <p className="text-sm mt-1">Add diagnoses to show them in the visit form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diagnosisOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditDiagnosis(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleDiagnosis(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDiagnosis(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange diagnoses. Lower numbers appear first in the dropdown.
              Deactivated diagnoses won't appear in the visit form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Observation Options */}
      {activeTab === 'observations' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Clinical Observations
              </h2>
              <button
                onClick={() => {
                  setShowAddObservation(true);
                  setEditingObservation(null);
                  setObservationForm({ name: '', description: '', display_order: observationOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Observation
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common clinical observations that appear in the visit form dropdown. 
              Doctors can still enter custom observations if needed.
            </p>

            {(showAddObservation || editingObservation) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingObservation ? 'Edit Observation' : 'Add New Observation'}
                </h3>
                <form onSubmit={editingObservation ? handleUpdateObservation : handleAddObservation} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Observation Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Gums appear healthy, Mild inflammation"
                        value={observationForm.name}
                        onChange={(e) => setObservationForm({ ...observationForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={observationForm.display_order}
                        onChange={(e) => setObservationForm({ ...observationForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the observation"
                        value={observationForm.description}
                        onChange={(e) => setObservationForm({ ...observationForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingObservation ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddObservation(false);
                        setEditingObservation(null);
                        setObservationForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingObservations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading observations...</p>
              </div>
            ) : observationOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👁️</div>
                <p>No observation options configured</p>
                <p className="text-sm mt-1">Add observations to show them in the visit form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {observationOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditObservation(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleObservation(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteObservation(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange observations. Lower numbers appear first in the dropdown.
              Deactivated observations won't appear in the visit form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Test Options */}
      {activeTab === 'tests' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Recommended Tests
              </h2>
              <button
                onClick={() => {
                  setShowAddTest(true);
                  setEditingTest(null);
                  setTestForm({ name: '', description: '', display_order: testOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Test
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common recommended tests that appear in the visit form dropdown.
              Doctors can still enter custom tests if needed.
            </p>

            {(showAddTest || editingTest) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingTest ? 'Edit Test' : 'Add New Test'}
                </h3>
                <form onSubmit={editingTest ? handleUpdateTest : handleAddTest} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Test Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., CBC, Blood Sugar, X-Ray"
                        value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={testForm.display_order}
                        onChange={(e) => setTestForm({ ...testForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the test"
                        value={testForm.description}
                        onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingTest ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTest(false);
                        setEditingTest(null);
                        setTestForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingTests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading tests...</p>
              </div>
            ) : testOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🧪</div>
                <p>No test options configured</p>
                <p className="text-sm mt-1">Add tests to show them in the visit form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {testOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditTest(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleTest(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange tests. Lower numbers appear first in the dropdown.
              Deactivated tests won't appear in the visit form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Medicine Options */}
      {activeTab === 'medicines' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Medicine Options
              </h2>
              <button
                onClick={() => {
                  setShowAddMedicine(true);
                  setEditingMedicine(null);
                  setMedicineForm({ name: '', description: '', display_order: medicineOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Medicine
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common medicines that appear in the prescription form dropdown.
              Doctors can still enter custom medicines if needed.
            </p>

            {(showAddMedicine || editingMedicine) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                </h3>
                <form onSubmit={editingMedicine ? handleUpdateMedicine : handleAddMedicine} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Medicine Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Tab Amoxicillin 500mg"
                        value={medicineForm.name}
                        onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={medicineForm.display_order}
                        onChange={(e) => setMedicineForm({ ...medicineForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the medicine"
                        value={medicineForm.description}
                        onChange={(e) => setMedicineForm({ ...medicineForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingMedicine ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMedicine(false);
                        setEditingMedicine(null);
                        setMedicineForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingMedicines ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading medicines...</p>
              </div>
            ) : medicineOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💊</div>
                <p>No medicine options configured</p>
                <p className="text-sm mt-1">Add medicines to show them in the prescription form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {medicineOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditMedicine(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleMedicine(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteMedicine(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange medicines. Lower numbers appear first in the dropdown.
              Deactivated medicines won't appear in the prescription form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Dosage Options */}
      {activeTab === 'dosages' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Dosage Options
              </h2>
              <button
                onClick={() => {
                  setShowAddDosage(true);
                  setEditingDosage(null);
                  setDosageForm({ name: '', description: '', display_order: dosageOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Dosage
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common dosage options that appear in the prescription form dropdown.
              Examples: "1 tablet", "2 tablets", "1-0-1", "5ml"
            </p>

            {(showAddDosage || editingDosage) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingDosage ? 'Edit Dosage' : 'Add New Dosage'}
                </h3>
                <form onSubmit={editingDosage ? handleUpdateDosage : handleAddDosage} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Dosage Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., 1 tablet, 1-0-1, 5ml"
                        value={dosageForm.name}
                        onChange={(e) => setDosageForm({ ...dosageForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={dosageForm.display_order}
                        onChange={(e) => setDosageForm({ ...dosageForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the dosage"
                        value={dosageForm.description}
                        onChange={(e) => setDosageForm({ ...dosageForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingDosage ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDosage(false);
                        setEditingDosage(null);
                        setDosageForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingDosages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading dosages...</p>
              </div>
            ) : dosageOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📏</div>
                <p>No dosage options configured</p>
                <p className="text-sm mt-1">Add dosages to show them in the prescription form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dosageOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditDosage(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleDosage(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDosage(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange dosages. Lower numbers appear first in the dropdown.
              Deactivated dosages won't appear in the prescription form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Duration Options */}
      {activeTab === 'durations' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Duration Options
              </h2>
              <button
                onClick={() => {
                  setShowAddDuration(true);
                  setEditingDuration(null);
                  setDurationForm({ name: '', description: '', display_order: durationOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Duration
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common duration options that appear in the prescription form dropdown.
              Examples: "3 days", "5 days", "1 week", "As directed"
            </p>

            {(showAddDuration || editingDuration) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingDuration ? 'Edit Duration' : 'Add New Duration'}
                </h3>
                <form onSubmit={editingDuration ? handleUpdateDuration : handleAddDuration} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Duration Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., 5 days, 1 week, As directed"
                        value={durationForm.name}
                        onChange={(e) => setDurationForm({ ...durationForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={durationForm.display_order}
                        onChange={(e) => setDurationForm({ ...durationForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the duration"
                        value={durationForm.description}
                        onChange={(e) => setDurationForm({ ...durationForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingDuration ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDuration(false);
                        setEditingDuration(null);
                        setDurationForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingDurations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading durations...</p>
              </div>
            ) : durationOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">⏱️</div>
                <p>No duration options configured</p>
                <p className="text-sm mt-1">Add durations to show them in the prescription form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {durationOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditDuration(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleDuration(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDuration(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange durations. Lower numbers appear first in the dropdown.
              Deactivated durations won't appear in the prescription form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Symptom Options */}
      {activeTab === 'symptoms' && isDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Symptom Options
              </h2>
              <button
                onClick={() => {
                  setShowAddSymptom(true);
                  setEditingSymptom(null);
                  setSymptomForm({ name: '', description: '', display_order: symptomOptions.length + 1 });
                }}
                className="btn btn-primary"
              >
                + Add Symptom
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure common symptoms that appear in the visit form dropdown.
              Examples: "Fever", "Headache", "Cough", "Body Pain"
            </p>

            {(showAddSymptom || editingSymptom) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {editingSymptom ? 'Edit Symptom' : 'Add New Symptom'}
                </h3>
                <form onSubmit={editingSymptom ? handleUpdateSymptom : handleAddSymptom} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Symptom Name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Fever, Headache, Cough"
                        value={symptomForm.name}
                        onChange={(e) => setSymptomForm({ ...symptomForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Display Order</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="1"
                        value={symptomForm.display_order}
                        onChange={(e) => setSymptomForm({ ...symptomForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description of the symptom"
                        value={symptomForm.description}
                        onChange={(e) => setSymptomForm({ ...symptomForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingSymptom ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSymptom(false);
                        setEditingSymptom(null);
                        setSymptomForm({ name: '', description: '', display_order: 0 });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingSymptoms ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading symptoms...</p>
              </div>
            ) : symptomOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤒</div>
                <p>No symptom options configured</p>
                <p className="text-sm mt-1">Add symptoms to show them in the visit form dropdown</p>
              </div>
            ) : (
              <div className="space-y-2">
                {symptomOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                      <div>
                        <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {option.name}
                        </span>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                      </div>
                      {!option.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditSymptom(option)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleSymptom(option)}
                        className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {option.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteSymptom(option)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use the display order to arrange symptoms. Lower numbers appear first in the dropdown.
              Deactivated symptoms won't appear in the visit form but are kept for historical records.
            </p>
          </div>
        </div>
      )}

      {/* Change Password */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="max-w-md space-y-4">
              <div>
                <label className="label">Current Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter current password"
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="label">New Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter new password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirm new password"
                  {...registerPassword('confirmPassword', { required: 'Please confirm your password' })}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Password Requirements:</strong> Minimum 6 characters. Use a strong password with letters, numbers, and symbols.
            </p>
          </div>
        </div>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Application Preferences
            </h2>
            <div className="space-y-4">
              <div className="py-3">
                <h3 className="font-medium text-gray-900 mb-2">Default Consultation Fee</h3>
                <div className="max-w-xs">
                  <input
                    type="number"
                    className="input"
                    placeholder="500"
                    defaultValue="500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Amount in ₹</p>
                </div>
              </div>

              <div className="py-3">
                <h3 className="font-medium text-gray-900 mb-2">Appointment Duration</h3>
                <div className="max-w-xs">
                  <select className="input" defaultValue="15">
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Default time slot for appointments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Prescription Print Settings
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure where prescriptions will be printed on your pre-printed letterhead
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Distance from Top</label>
                <input
                  type="range"
                  min="0"
                  max="400"
                  value={printPosition.top}
                  onChange={(e) => setPrintPosition({...printPosition, top: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between items-center mt-2">
                  <input
                    type="number"
                    value={printPosition.top}
                    onChange={(e) => setPrintPosition({...printPosition, top: parseInt(e.target.value) || 0})}
                    className="input w-24"
                  />
                  <span className="text-sm text-gray-600">{Math.round(printPosition.top / 37.8)} cm</span>
                </div>
              </div>

              <div>
                <label className="label">Distance from Left</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={printPosition.left}
                  onChange={(e) => setPrintPosition({...printPosition, left: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between items-center mt-2">
                  <input
                    type="number"
                    value={printPosition.left}
                    onChange={(e) => setPrintPosition({...printPosition, left: parseInt(e.target.value) || 0})}
                    className="input w-24"
                  />
                  <span className="text-sm text-gray-600">{Math.round(printPosition.left / 37.8)} cm</span>
                </div>
              </div>
            </div>

            {/* A4 Preview */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Preview on A4 Page</h3>
              <div className="bg-gray-200 p-4 rounded-lg">
                <div className="bg-white mx-auto shadow-lg" style={{ width: '595px', height: '842px', position: 'relative', overflow: 'hidden' }}>
                  <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none"></div>
                  <div
                    className="absolute bg-yellow-50 border-2 border-blue-400 opacity-50"
                    style={{
                      top: `${printPosition.top}px`,
                      left: `${printPosition.left}px`,
                      right: '40px',
                      bottom: '40px',
                    }}
                  >
                    <div className="text-center text-xs text-blue-600 mt-2">Print Area</div>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-600 mt-2">A4 Page (21cm × 29.7cm)</p>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPrintPosition({ top: 280, left: 40 })}
                className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Default (Letterhead)
              </button>
              <button
                onClick={() => setPrintPosition({ top: 0, left: 40 })}
                className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Full Page
              </button>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  const updatedUser = {
                    ...user,
                    printSettings: printPosition
                  };
                  updateUser(updatedUser);
                  setSuccessMessage('Print settings saved successfully!');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
                className="btn btn-primary"
              >
                Save Print Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Mock Mode:</strong> Changes to settings are stored in localStorage. Refresh the page to reset to defaults.
        </p>
      </div>
    </div>
  );
}
