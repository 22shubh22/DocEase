import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'clinic', label: 'Clinic Settings', icon: '🏥' },
    { id: 'password', label: 'Change Password', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

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
