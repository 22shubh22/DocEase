import { useState } from 'react';
import { PLUGIN_METADATA } from '../../constants/plugins';

const PLUGINS = PLUGIN_METADATA.map((p) => ({
  key: p.apiKey,
  name: p.name,
  description: p.description,
  icon: p.icon,
}));

const SPECIALTIES = [
  {
    key: 'general_physician',
    name: 'General Physician',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.508 23.508 0 0 0-1.66 4.795 47.65 47.65 0 0 0 6.978 3.03c.018-.15.038-.3.058-.448a60.502 60.502 0 0 1 1.063-5.533 23.47 23.47 0 0 1-6.44-1.844ZM12 2.25c.966 0 1.75.784 1.75 1.75a1.75 1.75 0 0 1-3.5 0c0-.966.784-1.75 1.75-1.75Zm0 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
    ),
  },
  {
    key: 'pediatrics',
    name: 'Pediatrics',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
  },
  {
    key: 'dental',
    name: 'Dental',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
  },
  {
    key: 'dermatology',
    name: 'Dermatology',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
];

export default function PluginSelectionModal({ isOpen, onClose, onConfirm, isLoading }) {
  const [specialty, setSpecialty] = useState('general_physician');
  const [selected, setSelected] = useState({
    plugin_opd_queue: true,
    plugin_collections: true,
  });

  if (!isOpen) return null;

  const toggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSpecialtyChange = (key) => {
    setSpecialty(key);
    // Auto-enable vaccination for pediatrics
    if (key === 'pediatrics') {
      setSelected((prev) => ({ ...prev, plugin_vaccination: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900">Customize Your Demo</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Choose your clinic type and features to explore</p>

        {/* Specialty Selection */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Clinic Type</p>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALTIES.map((s) => (
              <div
                key={s.key}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  specialty === s.key
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handleSpecialtyChange(s.key)}
              >
                <div className={`flex-shrink-0 ${specialty === s.key ? 'text-primary-600' : 'text-gray-400'}`}>
                  {s.icon}
                </div>
                <p className={`text-sm font-medium ${specialty === s.key ? 'text-primary-700' : 'text-gray-700'}`}>
                  {s.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plugin Selection */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Features</p>
          <div className="space-y-3">
            {PLUGINS.map((plugin) => (
              <div
                key={plugin.key}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selected[plugin.key]
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() => toggle(plugin.key)}
              >
                <div className={`flex-shrink-0 ${selected[plugin.key] ? 'text-primary-600' : 'text-gray-400'}`}>
                  {plugin.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{plugin.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{plugin.description}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(plugin.key); }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    selected[plugin.key] ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selected[plugin.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ ...selected, clinic_specialty: specialty })}
            disabled={isLoading}
            className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50"
          >
            {isLoading ? 'Setting up demo...' : 'Start Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}
