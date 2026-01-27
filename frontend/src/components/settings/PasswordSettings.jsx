import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

// Password validation constants
const MIN_PASSWORD_LENGTH = 8;

// Calculate password strength
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const textColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'];

  const index = Math.min(score, 4);
  return {
    score,
    label: labels[index],
    color: colors[index],
    textColor: textColors[index]
  };
};

export default function PasswordSettings({ user }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-gray-200' });

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (data.newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      setIsSubmitting(false);
      return;
    }

    if (!/[a-zA-Z]/.test(data.newPassword)) {
      toast.error('Password must contain at least one letter');
      setIsSubmitting(false);
      return;
    }

    if (!/\d/.test(data.newPassword)) {
      toast.error('Password must contain at least one number');
      setIsSubmitting(false);
      return;
    }

    try {
      await authAPI.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      toast.success('Password changed successfully!');
      reset();
      setPasswordStrength({ score: 0, label: '', color: 'bg-gray-200' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.errorMessage || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password change for strength indicator
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPasswordStrength(calculatePasswordStrength(value));
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
          Profile Information
        </h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input bg-gray-50"
              value={user?.full_name || ''}
              disabled
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input bg-gray-50"
              value={user?.email || ''}
              disabled
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Contact your administrator to update your profile information.
        </p>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
          Change Password
        </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="max-w-md space-y-4">
          <div>
            <label className="label">Current Password *</label>
            <input
              type="password"
              className="input"
              placeholder="Enter current password"
              {...register('currentPassword', { required: 'Current password is required' })}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              className="input"
              placeholder="Enter new password"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: MIN_PASSWORD_LENGTH, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
                validate: {
                  hasLetter: v => /[a-zA-Z]/.test(v) || 'Must contain at least one letter',
                  hasNumber: v => /\d/.test(v) || 'Must contain at least one number',
                },
                onChange: handlePasswordChange
              })}
              aria-describedby="password-strength"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
            {/* Password Strength Indicator */}
            {passwordStrength.score > 0 && (
              <div id="password-strength" className="mt-2">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded transition-colors ${
                        i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${passwordStrength.textColor}`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              className="input"
              placeholder="Confirm new password"
              {...register('confirmPassword', { required: 'Please confirm your password' })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
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
        <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>At least {MIN_PASSWORD_LENGTH} characters</li>
          <li>At least one letter</li>
          <li>At least one number</li>
          <li>Recommended: Use uppercase, lowercase, and special characters for a stronger password</li>
        </ul>
      </div>
      </div>
    </div>
  );
}
