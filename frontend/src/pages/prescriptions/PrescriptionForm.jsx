import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Mock patients data
const mockPatients = [
  { id: '1', fullName: 'Rajesh Kumar', age: 45, gender: 'Male', phone: '9876543210', address: 'Mumbai, Maharashtra' },
  { id: '2', fullName: 'Priya Sharma', age: 32, gender: 'Female', phone: '9876543211', address: 'Delhi' },
  { id: '3', fullName: 'Amit Patel', age: 28, gender: 'Male', phone: '9876543212', address: 'Ahmedabad, Gujarat' },
];

// In-memory prescription storage
const prescriptionStore = {
  prescriptions: [],
  nextId: 1001,

  add(prescription) {
    const newPrescription = {
      ...prescription,
      id: `rx-${Date.now()}`,
      prescriptionNumber: `RX-${this.nextId++}`,
      createdAt: new Date().toISOString(),
    };
    this.prescriptions.push(newPrescription);
    return newPrescription;
  },

  getAll() {
    return this.prescriptions;
  }
};

export default function PrescriptionForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Get print position from user settings
  const printPosition = {
    top: user?.printSettings?.top || 280,
    left: user?.printSettings?.left || 40,
  };

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      patientId: patientIdFromUrl || '',
      chiefComplaint: '',
      medicalHistory: '',
      clinicalDiagnosis: '',
    }
  });

  const watchedPatientId = watch('patientId');

  // Auto-select patient from URL
  useEffect(() => {
    if (watchedPatientId) {
      const patient = mockPatients.find(p => p.id === watchedPatientId);
      setSelectedPatient(patient || null);
    } else {
      setSelectedPatient(null);
    }
  }, [watchedPatientId]);

  // Add a new medicine row
  const addMedicine = () => {
    setMedicines([...medicines, {
      id: Date.now(),
      name: '',
      dosage: '',
      duration: '',
    }]);
  };

  // Remove medicine row
  const removeMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  // Update medicine field
  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Handle form submission
  const onSubmit = (data) => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    if (medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    // Prepare prescription data
    const prescriptionData = {
      ...data,
      patient: selectedPatient,
      medicines: medicines.filter(m => m.name.trim() !== ''),
      doctor: user,
      date: new Date().toLocaleDateString('en-GB'),
    };

    // Save to store
    const savedPrescription = prescriptionStore.add(prescriptionData);
    console.log('Prescription saved:', savedPrescription);

    // Show preview
    setPreviewData(prescriptionData);
    setShowPreview(true);
  };

  // Print prescription
  const handlePrint = () => {
    window.print();
  };

  // Close preview
  const closePreview = () => {
    setShowPreview(false);
    // Reset form
    setMedicines([]);
    setSelectedPatient(null);
    navigate('/prescriptions/new');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Form View */}
      {!showPreview && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New Prescription</h1>
            <p className="text-gray-600 mt-1">Create and print prescription for patients</p>
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
                  <select
                    className="input"
                    {...register('patientId', { required: 'Please select a patient' })}
                  >
                    <option value="">-- Select Patient --</option>
                    {mockPatients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName} - {patient.age}Y/{patient.gender[0]} - {patient.phone}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                {selectedPatient && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{selectedPatient.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <p className="font-medium">{selectedPatient.age} years</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender:</span>
                        <p className="font-medium">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div className="md:col-span-4">
                        <span className="text-gray-600">Address:</span>
                        <p className="font-medium">{selectedPatient.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Details */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Clinical Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Chief Complaint (C/C) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Pain in Upper Lt. Post. Teeth Regions"
                    {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                  />
                  {errors.chiefComplaint && (
                    <p className="text-red-500 text-sm mt-1">{errors.chiefComplaint.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Medical History (M/H)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., NAD, Diabetes, Hypertension"
                    {...register('medicalHistory')}
                  />
                </div>

                <div>
                  <label className="label">Clinical Diagnosis (C/Dia)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Carious 25"
                    {...register('clinicalDiagnosis')}
                  />
                </div>

                <div>
                  <label className="label">Treatment (T/T)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Rct 25 Obt"
                    {...register('treatment')}
                  />
                </div>
              </div>
            </div>

            {/* Medicines Table */}
            <div className="card">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Medicines</h2>
                <button
                  type="button"
                  onClick={addMedicine}
                  className="btn btn-secondary text-sm"
                >
                  + Add Medicine
                </button>
              </div>

              {medicines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No medicines added yet.</p>
                  <p className="text-sm mt-1">Click "Add Medicine" to start</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Medicine</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dosage</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Duration</th>
                        <th className="px-4 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((medicine) => (
                        <tr key={medicine.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g., Tab Moxclav 625 MG (10)"
                              value={medicine.name}
                              onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g., 1 Tab B.D."
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g., For 5 Days"
                              value={medicine.duration}
                              onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                Preview & Print
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Debug Panel */}
          <div className="card bg-gray-50 mt-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Debug: In-Memory Data</h3>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify({
                totalPrescriptions: prescriptionStore.getAll().length,
                medicines: medicines.length
              }, null, 2)}
            </pre>
          </div>
        </>
      )}

      {/* Preview & Print View */}
      {showPreview && previewData && (
        <div>
          {/* Screen Controls - Hidden when printing */}
          <div className="no-print mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Prescription Preview</h1>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="btn btn-primary">
                  🖨️ Print Prescription
                </button>
                <button onClick={closePreview} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>

            {/* Print Position Info */}
            <div className="card bg-blue-50 border border-blue-200 mt-4">
              <p className="text-sm text-blue-800">
                📐 <strong>Print Position:</strong> Top: {printPosition.top}px ({Math.round(printPosition.top / 37.8)}cm), Left: {printPosition.left}px ({Math.round(printPosition.left / 37.8)}cm)
                {' '}- <a href="/settings" className="underline">Change in Settings</a>
              </p>
            </div>
          </div>

          {/* Printable Prescription - Simple Lower Section Only */}
          <div className="prescription-print bg-white border border-gray-300 rounded-lg p-6 shadow-lg max-w-4xl mx-auto">

            {/* Date - Top Right */}
            <div className="text-right mb-4 pb-2 border-b border-gray-300">
              <p className="text-sm">Date: {previewData.date}</p>
            </div>

            {/* Patient Information - Single Line */}
            <div className="mb-3 pb-2 border-b border-gray-400">
              <p className="text-sm">
                <span>Patient: <strong>{previewData.patient.fullName}</strong></span>
                <span className="ml-8">Gender: <strong>{previewData.patient.gender}</strong></span>
                <span className="ml-8">Age: <strong>{previewData.patient.age} years</strong></span>
              </p>
              <p className="text-sm mt-1">
                <span>Phone: {previewData.patient.phone}</span>
                <span className="ml-8">Address: {previewData.patient.address}</span>
              </p>
            </div>

            {/* Clinical Details */}
            <div className="mb-4 space-y-1 text-sm">
              <div>
                <strong>C/C</strong> - {previewData.chiefComplaint}
              </div>
              {previewData.medicalHistory && (
                <div>
                  <strong>M/H</strong> - {previewData.medicalHistory}
                </div>
              )}
              {previewData.clinicalDiagnosis && (
                <div>
                  <strong>C/Dia</strong> - {previewData.clinicalDiagnosis}
                </div>
              )}
              {previewData.treatment && (
                <div>
                  <strong>T/T</strong> - {previewData.treatment}
                </div>
              )}
            </div>

            {/* Medicines Table */}
            <div className="my-6">
              <table className="w-full border-2 border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-3 py-2 text-left text-sm font-bold">
                      Medicine
                    </th>
                    <th className="border border-black px-3 py-2 text-left text-sm font-bold">
                      Dose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.medicines.map((medicine, index) => (
                    <tr key={index}>
                      <td className="border border-black px-3 py-2 text-sm">
                        {medicine.name}
                      </td>
                      <td className="border border-black px-3 py-2 text-sm">
                        {medicine.dosage} {medicine.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Doctor Signature */}
            <div className="text-right mt-12">
              <p className="font-bold uppercase">{user?.fullName || 'DR. A.K. DUBEY'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prescription-print, .prescription-print * {
            visibility: visible;
          }
          .prescription-print {
            position: absolute;
            left: ${printPosition.left}px;
            top: ${printPosition.top}px;
            right: 40px;
            width: auto;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
