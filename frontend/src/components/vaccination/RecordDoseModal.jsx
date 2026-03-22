import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { vaccinationAPI } from '../../services/api';

export default function RecordDoseModal({ dose, patientId, visitId, onClose, onRecorded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      date_administered: new Date().toISOString().split('T')[0],
      injection_site: dose?.record?.injection_site || '',
      route: dose?.record?.route || '',
      batch_number: '',
      adverse_reaction: '',
      notes: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        vaccine_name: dose.vaccine_name,
        dose_number: dose.dose_number,
        dose_label: dose.dose_label,
        schedule_entry_id: dose.schedule_entry_id,
        date_administered: data.date_administered,
        batch_number: data.batch_number || null,
        injection_site: data.injection_site || null,
        route: data.route || null,
        adverse_reaction: data.adverse_reaction || null,
        notes: data.notes || null,
      };

      if (visitId) {
        await vaccinationAPI.recordDoseDuringVisit(visitId, payload);
      } else {
        await vaccinationAPI.recordDose(patientId, payload);
      }

      toast.success(`${dose.dose_label || dose.vaccine_name} recorded successfully`);
      onRecorded?.();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to record dose');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Record Vaccine Dose
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {dose.dose_label || dose.vaccine_name} ({dose.age_label})
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Date Administered *</label>
              <input
                type="date"
                className="input"
                {...register('date_administered', { required: 'Date is required' })}
              />
              {errors.date_administered && (
                <p className="text-red-500 text-sm mt-1">{errors.date_administered.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Route</label>
                <select className="input" {...register('route')}>
                  <option value="">Select</option>
                  <option value="IM">IM (Intramuscular)</option>
                  <option value="SC">SC (Subcutaneous)</option>
                  <option value="ID">ID (Intradermal)</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
              <div>
                <label className="label">Injection Site</label>
                <select className="input" {...register('injection_site')}>
                  <option value="">Select</option>
                  <option value="Left upper arm">Left upper arm</option>
                  <option value="Right upper arm">Right upper arm</option>
                  <option value="Left thigh">Left thigh</option>
                  <option value="Right thigh">Right thigh</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Batch Number</label>
              <input
                type="text"
                className="input"
                placeholder="Vaccine batch number (optional)"
                {...register('batch_number')}
              />
            </div>

            <div>
              <label className="label">Adverse Reaction</label>
              <input
                type="text"
                className="input"
                placeholder="Any adverse reaction observed (optional)"
                {...register('adverse_reaction')}
              />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="2"
                placeholder="Additional notes (optional)"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Dose'}
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
