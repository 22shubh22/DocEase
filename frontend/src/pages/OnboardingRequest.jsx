import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { onboardingAPI } from '../services/api';

export default function OnboardingRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await onboardingAPI.submitRequest(data);
      setRequestId(response.data.request_id);
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit request. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your onboarding request has been submitted successfully. Our team will review your application and get back to you soon.
            </p>
            {requestId && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                Reference ID: <span className="font-mono font-medium">{requestId}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/landing" className="btn btn-primary">
              Back to Home
            </Link>
            <Link to="/login" className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DocEase</h1>
          </Link>
          <p className="text-gray-600">Register your clinic with us</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Doctor Name *</label>
            <input
              type="text"
              className="input"
              placeholder="Dr. John Doe"
              {...register('doctor_name', { required: 'Doctor name is required' })}
            />
            {errors.doctor_name && <p className="text-red-500 text-sm mt-1">{errors.doctor_name.message}</p>}
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              placeholder="doctor@example.com"
              {...register('doctor_email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />
            {errors.doctor_email && <p className="text-red-500 text-sm mt-1">{errors.doctor_email.message}</p>}
          </div>

          <div>
            <label className="label">Phone Number *</label>
            <input
              type="tel"
              className="input"
              placeholder="+91 9876543210"
              {...register('doctor_phone', { required: 'Phone number is required' })}
            />
            {errors.doctor_phone && <p className="text-red-500 text-sm mt-1">{errors.doctor_phone.message}</p>}
          </div>

          <div>
            <label className="label">Clinic Name *</label>
            <input
              type="text"
              className="input"
              placeholder="My Clinic"
              {...register('clinic_name', { required: 'Clinic name is required' })}
            />
            {errors.clinic_name && <p className="text-red-500 text-sm mt-1">{errors.clinic_name.message}</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link to="/landing" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Home
            </Link>
            <button
              type="submit"
              className="btn btn-primary px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
