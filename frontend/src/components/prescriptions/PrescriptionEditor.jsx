import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { medicineOptionsAPI, dosageOptionsAPI, durationOptionsAPI } from '../../services/api';
import CreatableComboBox from '../common/CreatableComboBox';

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

  const updateMedicineMulti = (id, updates) => {
    setMedicines(medicines.map(med =>
      med.id === id ? { ...med, ...updates } : med
    ));
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(med => med.id !== id));
  };

  // When a medicine is selected from the master list, auto-fill dosage/duration defaults
  const handleMedicineChange = (medId, name, optionObj) => {
    const updates = { medicine_name: name };
    if (optionObj?.default_dosage) {
      updates.dosage = optionObj.default_dosage;
    }
    if (optionObj?.default_duration) {
      updates.duration = optionObj.default_duration;
    }
    updateMedicineMulti(medId, updates);
  };

  const handleCreateMedicine = async (name) => {
    try {
      const res = await medicineOptionsAPI.create({ name });
      const newOpt = res.data;
      setMedicineOptions(prev => [...prev, newOpt]);
      toast.success(`"${name}" added to medicine list`);
      return newOpt;
    } catch {
      toast.error('Failed to add medicine');
      return null;
    }
  };

  const handleCreateDosage = async (name) => {
    try {
      const res = await dosageOptionsAPI.create({ name });
      const newOpt = res.data;
      setDosageOptions(prev => [...prev, newOpt]);
      toast.success(`"${name}" added to dosage list`);
      return newOpt;
    } catch {
      toast.error('Failed to add dosage');
      return null;
    }
  };

  const handleCreateDuration = async (name) => {
    try {
      const res = await durationOptionsAPI.create({ name });
      const newOpt = res.data;
      setDurationOptions(prev => [...prev, newOpt]);
      toast.success(`"${name}" added to duration list`);
      return newOpt;
    } catch {
      toast.error('Failed to add duration');
      return null;
    }
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
          {/* Mobile: stacked card layout */}
          <div className="md:hidden space-y-3">
            {medicines.map((med, index) => (
              <div key={med.id} className="border rounded-lg p-3 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Medicine #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMedicine(med.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                    title="Remove medicine"
                  >
                    ×
                  </button>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Medicine Name *</label>
                  <CreatableComboBox
                    value={med.medicine_name}
                    onChange={(name, opt) => handleMedicineChange(med.id, name, opt)}
                    options={medicineOptions}
                    onCreateNew={handleCreateMedicine}
                    placeholder="Type medicine name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Dosage *</label>
                    <CreatableComboBox
                      value={med.dosage}
                      onChange={(val) => updateMedicine(med.id, 'dosage', val)}
                      options={dosageOptions}
                      onCreateNew={handleCreateDosage}
                      placeholder="Type dosage..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Duration *</label>
                    <CreatableComboBox
                      value={med.duration}
                      onChange={(val) => updateMedicine(med.id, 'duration', val)}
                      options={durationOptions}
                      onCreateNew={handleCreateDuration}
                      placeholder="Type duration..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 font-medium text-gray-700">#</th>
                  <th className="text-left p-2 font-medium text-gray-700">Medicine Name *</th>
                  <th className="text-left p-2 font-medium text-gray-700">Dosage *</th>
                  <th className="text-left p-2 font-medium text-gray-700">Duration *</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, index) => (
                  <tr key={med.id} className="border-b">
                    <td className="p-2 text-gray-500">{index + 1}</td>
                    <td className="p-2">
                      <CreatableComboBox
                        value={med.medicine_name}
                        onChange={(name, opt) => handleMedicineChange(med.id, name, opt)}
                        options={medicineOptions}
                        onCreateNew={handleCreateMedicine}
                        placeholder="Type medicine name..."
                      />
                    </td>
                    <td className="p-2">
                      <CreatableComboBox
                        value={med.dosage}
                        onChange={(val) => updateMedicine(med.id, 'dosage', val)}
                        options={dosageOptions}
                        onCreateNew={handleCreateDosage}
                        placeholder="Type dosage..."
                      />
                    </td>
                    <td className="p-2">
                      <CreatableComboBox
                        value={med.duration}
                        onChange={(val) => updateMedicine(med.id, 'duration', val)}
                        options={durationOptions}
                        onCreateNew={handleCreateDuration}
                        placeholder="Type duration..."
                      />
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
          placeholder="e.g., Give plenty of fluids, Continue breastfeeding, Follow up if fever persists..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
