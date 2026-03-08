import { useState } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { clinicAPI } from '../../services/api';
import { PLUGIN_METADATA } from '../../constants/plugins';

export default function PluginManager({ isOwner }) {
  const { user, refreshUser } = useAuthStore();
  const plugins = user?.enabled_plugins;
  const [loadingKey, setLoadingKey] = useState(null);

  const handleToggle = async (plugin) => {
    if (!isOwner) return;

    const currentValue = plugins?.[plugin.key] !== false;
    setLoadingKey(plugin.key);

    try {
      await clinicAPI.updatePlugins({ [plugin.apiKey]: !currentValue });
      await refreshUser();
      toast.success(`${plugin.name} ${currentValue ? 'disabled' : 'enabled'}`);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Only the clinic owner can manage plugins');
      } else {
        toast.error('Failed to update plugin');
      }
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Manage Plugins</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enable or disable features for your clinic. Changes apply to all team members.
        </p>
      </div>

      <div className="space-y-4">
        {PLUGIN_METADATA.map((plugin) => {
          const isEnabled = plugins?.[plugin.key] !== false;
          const isLoading = loadingKey === plugin.key;

          return (
            <div
              key={plugin.key}
              className={`rounded-xl border-2 p-5 transition-colors ${
                isEnabled
                  ? 'border-primary-200 bg-primary-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 mt-0.5 ${isEnabled ? 'text-primary-600' : 'text-gray-400'}`}>
                  {plugin.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">{plugin.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isEnabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{plugin.description}</p>
                  <ul className="space-y-1.5">
                    {plugin.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-shrink-0">
                  {isOwner ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggle(plugin)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                      } ${isEnabled ? 'bg-primary-600' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400 text-right max-w-[120px]">
                      Only the clinic owner can manage plugins
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
