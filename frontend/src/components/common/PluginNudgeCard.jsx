import { useState } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { clinicAPI } from '../../services/api';
import { getPluginByKey } from '../../constants/plugins';

export default function PluginNudgeCard({ pluginKey, contextMessage, onDismiss }) {
  const { refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const meta = getPluginByKey(pluginKey);
  if (!meta) return null;

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await clinicAPI.updatePlugins({ [meta.apiKey]: true });
      await refreshUser();
      toast.success(`${meta.name} enabled!`);
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
    <div className="relative rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        title="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-primary-600 flex-shrink-0 mt-0.5">
            {meta.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{meta.name}</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {contextMessage || meta.description}
            </p>
          </div>
        </div>

        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="btn btn-primary text-sm px-4 py-2 flex-shrink-0 disabled:opacity-50"
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
