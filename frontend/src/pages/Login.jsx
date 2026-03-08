import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import PluginSelectionModal from '../components/common/PluginSelectionModal';

export default function Login() {
  const navigate = useNavigate();
  const { login, guestLogin, isLoading, error } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showPluginModal, setShowPluginModal] = useState(false);

  const onSubmit = async (data) => {
    const result = await login(data);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      // result.error already contains the message from extraction in store
      toast.error(result.error);
    }
  };

  const handleGuestLogin = () => {
    setShowPluginModal(true);
  };

  const handleGuestConfirm = async (plugins) => {
    setIsGuestLoading(true);
    const result = await guestLogin(plugins);
    setIsGuestLoading(false);

    if (result.success) {
      setShowPluginModal(false);
      toast.success('Welcome! Explore the demo with pre-loaded data.');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 relative">
      <Link
        to="/landing"
        className="absolute top-6 left-6 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DocEase</h1>
          <p className="text-gray-600">Clinic Management System</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Your data is encrypted and protected under DPDP Act 2023
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              {...register('email', { required: 'Email is required' })}
              placeholder="doctor@clinic.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
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
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading || isGuestLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={isLoading || isGuestLoading}
          className="w-full py-2.5 px-4 border-2 border-primary-300 text-primary-700 rounded-lg font-medium hover:bg-primary-50 hover:border-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGuestLoading ? 'Setting up demo...' : 'Try as Guest'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          No registration needed. Pre-loaded with sample data.
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/onboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Register your clinic
          </Link>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <span>·</span>
          <a href="mailto:22shubh22@gmail.com" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
      </div>

      <PluginSelectionModal
        isOpen={showPluginModal}
        onClose={() => setShowPluginModal(false)}
        onConfirm={handleGuestConfirm}
        isLoading={isGuestLoading}
      />
    </div>
  );
}
