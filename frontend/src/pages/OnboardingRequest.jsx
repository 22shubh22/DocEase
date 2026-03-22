import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { onboardingAPI } from '../services/api';
import { validatePhoneRequired } from '../utils/phoneValidation';

export default function OnboardingRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [googleMode, setGoogleMode] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [authMethod, setAuthMethod] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm();

  const password = watch('password');

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      setValue('doctor_name', decoded.name || '');
      setValue('doctor_email', decoded.email || '');
      setGoogleCredential(credentialResponse.credential);
      setGoogleMode(true);
      toast.success('Google account linked! Please fill in the remaining details.');
    } catch {
      toast.error('Failed to process Google account. Please try manual registration.');
    }
  };

  const clearGoogleMode = () => {
    setGoogleMode(false);
    setGoogleCredential(null);
    setValue('doctor_name', '');
    setValue('doctor_email', '');
  };

  const onSubmit = async (data) => {
    // Build payload
    const payload = {
      doctor_name: data.doctor_name,
      doctor_email: data.doctor_email,
      doctor_phone: data.doctor_phone,
      clinic_name: data.clinic_name,
    };

    if (googleMode) {
      payload.google_credential = googleCredential;
    } else {
      if (!data.password || data.password.length < 8) {
        toast.error('Password must be at least 8 characters.');
        return;
      }
      if (data.password !== data.confirm_password) {
        toast.error('Passwords do not match.');
        return;
      }
      payload.password = data.password;
    }

    setIsSubmitting(true);
    try {
      const response = await onboardingAPI.submitRequest(payload);
      setRequestId(response.data.request_id);
      setAuthMethod(googleMode ? 'google' : 'password');
      setSubmitted(true);
      toast.success('Registration submitted successfully!');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your registration request has been submitted. Our team will review your application and get back to you soon.
            </p>
            <p className="text-sm text-primary-600 bg-primary-50 rounded-lg p-3 mb-3">
              {authMethod === 'google'
                ? 'Once approved, you can log in using your Google account.'
                : 'Once approved, you can log in with your email and password.'}
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

        <div className="card space-y-4">
          {/* Google Sign-Up */}
          {!googleMode && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-up failed')}
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or register with email</span>
                </div>
              </div>
            </>
          )}

          {/* Google linked indicator */}
          {googleMode && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 font-medium">Google account linked</span>
              </div>
              <button
                type="button"
                onClick={clearGoogleMode}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Doctor Name *</label>
              <input
                type="text"
                className={`input ${googleMode ? 'bg-gray-50' : ''}`}
                placeholder="Dr. Priya Sharma"
                readOnly={googleMode}
                {...register('doctor_name', { required: 'Doctor name is required' })}
              />
              {errors.doctor_name && <p className="text-red-500 text-sm mt-1">{errors.doctor_name.message}</p>}
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className={`input ${googleMode ? 'bg-gray-50' : ''}`}
                placeholder="doctor@childclinic.com"
                readOnly={googleMode}
                {...register('doctor_email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i, message: 'Invalid email address' }
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
                {...register('doctor_phone', {
                  validate: validatePhoneRequired
                })}
              />
              {errors.doctor_phone && <p className="text-red-500 text-sm mt-1">{errors.doctor_phone.message}</p>}
            </div>

            <div>
              <label className="label">Clinic Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Little Stars Child Clinic"
                {...register('clinic_name', { required: 'Clinic name is required' })}
              />
              {errors.clinic_name && <p className="text-red-500 text-sm mt-1">{errors.clinic_name.message}</p>}
            </div>

            {/* Password fields — only for manual registration */}
            {!googleMode && (
              <>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input pr-10"
                      placeholder="Min. 8 characters"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="label">Confirm Password *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Re-enter password"
                    {...register('confirm_password', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                  />
                  {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password.message}</p>}
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link to="/landing" className="text-sm text-primary-600 hover:text-primary-700">
                Back to Home
              </Link>
              <button
                type="submit"
                className="btn btn-primary px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Register'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
