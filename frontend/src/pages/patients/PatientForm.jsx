import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { patientsAPI } from '../../services/api';
import { validatePhoneRequired, validatePhoneOptional } from '../../utils/phoneValidation';

function calculateDetailedAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime()) || dob > today) return null;

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

  return { label: parts.join(', '), years };
}

export default function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

  const todayStr = new Date().toISOString().split('T')[0];
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      patientSince: id ? '' : todayStr,
    },
  });

  const dateOfBirth = watch('dateOfBirth');
  const ageInfo = useMemo(() => calculateDetailedAge(dateOfBirth), [dateOfBirth]);

  useEffect(() => {
    if (id) {
      const fetchPatient = async () => {
        try {
          const response = await patientsAPI.getById(id);
          const patient = response.data.patient;
          
          // Pre-fill form fields
          reset({
            fullName: patient.full_name,
            age: patient.age,
            dateOfBirth: patient.date_of_birth || '',
            gender: patient.gender,
            bloodGroup: patient.blood_group,
            phone: patient.phone,
            emergencyContact: patient.emergency_contact,
            address: patient.address,
            allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
            medicalHistory: patient.medical_history?.notes || (typeof patient.medical_history === 'string' ? patient.medical_history : ''),
            patientSince: patient.created_at ? patient.created_at.split('T')[0] : '',
          });
        } catch (error) {
          console.error('Error fetching patient:', error);
          toast.error(error.errorMessage || 'Failed to load patient data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const patientData = {
        full_name: data.fullName,
        age: ageInfo ? ageInfo.years : null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        blood_group: data.bloodGroup || null,
        phone: data.phone,
        emergency_contact: data.emergencyContact || null,
        address: data.address || null,
        allergies: data.allergies
          ? data.allergies.split(',').map(a => a.trim()).filter(a => a)
          : [],
        medical_history: data.medicalHistory
          ? { notes: data.medicalHistory }
          : null,
        patient_since: data.patientSince || null,
      };

      if (id) {
        await patientsAPI.update(id, patientData);
        toast.success('Patient updated successfully!');
      } else {
        const response = await patientsAPI.create(patientData);
        const newPatient = response.data;
        toast.success(`Patient added successfully! Code: ${newPatient.patient.patient_code}`);
      }

      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(error.errorMessage || `Failed to ${id ? 'update' : 'add'} patient.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {id ? 'Edit Patient' : 'Add New Patient'}
        </h1>
        <p className="text-gray-600 mt-1">
          {id ? 'Update patient information' : 'Enter patient details to create a new record'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter full name"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                className="input"
                {...register('dateOfBirth')}
              />
              <p className="text-sm text-gray-500 mt-1">
                Important for vaccination tracking
              </p>
            </div>

            <div>
              <label className="label">Age</label>
              <div className="input bg-gray-50 flex items-center text-gray-700">
                {ageInfo ? ageInfo.label : <span className="text-gray-400">Enter date of birth</span>}
              </div>
            </div>

            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Blood Group</label>
              <select className="input" {...register('bloodGroup')}>
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="label">Patient Since</label>
              <input
                type="date"
                className="input"
                {...register('patientSince')}
              />
              <p className="text-sm text-gray-500 mt-1">
                When did this patient first visit? (Leave empty for today's date)
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 1234567890"
                {...register('phone', {
                  validate: validatePhoneRequired
                })}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="label">Emergency Contact</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 1234567890"
                {...register('emergencyContact', {
                  validate: validatePhoneOptional
                })}
              />
              {errors.emergencyContact && (
                <p className="text-red-500 text-sm mt-1">{errors.emergencyContact.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea
                className="input"
                rows="3"
                placeholder="Enter complete address"
                {...register('address')}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Medical Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Known Allergies</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Penicillin, Peanuts (comma separated)"
                {...register('allergies')}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple allergies separated by commas
              </p>
            </div>

            <div>
              <label className="label">Medical History</label>
              <textarea
                className="input"
                rows="4"
                placeholder="Previous conditions, surgeries, ongoing treatments, etc."
                {...register('medicalHistory')}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : id ? 'Update Patient' : 'Add Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
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
      </form>
    </div>
  );
}
