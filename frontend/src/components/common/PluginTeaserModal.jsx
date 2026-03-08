import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clinicAPI } from '../../services/api';
import { getPluginByKey } from '../../constants/plugins';

export default function PluginTeaserModal({ plugin, isOpen, onClose, isOwner }) {
  const { user, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !plugin) return null;

  const meta = getPluginByKey(plugin);
  if (!meta) return null;

  const isGuest = user?.is_guest;

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await clinicAPI.updatePlugins({ [meta.apiKey]: true });
      await refreshUser();
      toast.success(`${meta.name} enabled!`);
      onClose();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Only the clinic owner can enable plugins');
      } else {
        toast.error('Failed to enable plugin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-primary-600">{meta.icon}</div>
          <h2 className="text-xl font-bold text-gray-900">{meta.name}</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">{meta.description}</p>

        <ul className="space-y-2 mb-6">
          {meta.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Maybe Later
          </button>

          {isGuest ? (
            <Link
              to="/onboard"
              onClick={onClose}
              className="btn btn-primary px-5 py-2 text-sm"
            >
              Register Clinic
            </Link>
          ) : isOwner ? (
            <button
              type="button"
              onClick={handleEnable}
              disabled={isLoading}
              className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {isLoading ? 'Enabling...' : 'Enable Now'}
            </button>
          ) : (
            <p className="text-sm text-gray-500 italic py-2">
              Contact your clinic admin to enable this feature
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
