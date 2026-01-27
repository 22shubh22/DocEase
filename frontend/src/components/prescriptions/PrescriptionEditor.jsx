import { useState, useEffect } from 'react';
import { medicineOptionsAPI, dosageOptionsAPI, durationOptionsAPI } from '../../services/api';

export default function PrescriptionEditor({ medicines, setMedicines, notes, setNotes }) {
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [dosageOptions, setDosageOptions] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [medicinesRes, dosagesRes, durationsRes] = await Promise.all([
          medicineOptionsAPI.getAll(true),
          dosageOptionsAPI.getAll(true),
          durationOptionsAPI.getAll(true),
        ]);
        setMedicineOptions(medicinesRes.data || []);
        setDosageOptions(dosagesRes.data || []);
        setDurationOptions(durationsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        id: Date.now(),
        medicine_name: '',
        dosage: '',
        duration: '',
      }
    ]);
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(med => med.id !== id));
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-500 text-sm">Loading prescription options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {medicines.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500 mb-3">No medicines added yet</p>
          <button
            type="button"
            onClick={addMedicine}
            className="btn btn-primary text-sm"
          >
            + Add Medicine
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 font-medium text-gray-700">#</th>
                  <th className="text-left p-2 font-medium text-gray-700 min-w-[200px]">Medicine Name *</th>
                  <th className="text-left p-2 font-medium text-gray-700 min-w-[150px]">Dosage *</th>
                  <th className="text-left p-2 font-medium text-gray-700 min-w-[150px]">Duration *</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, index) => (
                  <tr key={med.id} className="border-b">
                    <td className="p-2 text-gray-500">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="input text-sm py-1"
                        placeholder="Select or type medicine..."
                        list={`medicine-list-${med.id}`}
                        value={med.medicine_name}
                        onChange={(e) => updateMedicine(med.id, 'medicine_name', e.target.value)}
                      />
                      <datalist id={`medicine-list-${med.id}`}>
                        {medicineOptions.map(opt => (
                          <option key={opt.id} value={opt.name} />
                        ))}
                      </datalist>
                    </td>
                    <td className="p-2">
                      <select
                        className="input text-sm py-1"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(med.id, 'dosage', e.target.value)}
                      >
                        <option value="">Select dosage...</option>
                        {dosageOptions.map(opt => (
                          <option key={opt.id} value={opt.name}>{opt.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        className="input text-sm py-1"
                        value={med.duration}
                        onChange={(e) => updateMedicine(med.id, 'duration', e.target.value)}
                      >
                        <option value="">Select duration...</option>
                        {durationOptions.map(opt => (
                          <option key={opt.id} value={opt.name}>{opt.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeMedicine(med.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                        title="Remove medicine"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addMedicine}
            className="btn btn-secondary text-sm"
          >
            + Add Another Medicine
          </button>
        </>
      )}

      <div>
        <label className="label">Patient Instructions / Pharmacy Notes (Optional)</label>
        <textarea
          className="input"
          rows="2"
          placeholder="e.g., Take after meals, Avoid dairy products, Return if symptoms persist..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
