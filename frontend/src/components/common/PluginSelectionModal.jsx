import { useState } from 'react';

const PLUGINS = [
  {
    key: 'plugin_opd_queue',
    name: 'OPD Queue',
    description: 'Manage patient queues, appointments, and daily OPD flow',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'plugin_collections',
    name: 'Collections',
    description: 'Track visit fees and view monthly collection reports',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function PluginSelectionModal({ isOpen, onClose, onConfirm, isLoading }) {
  const [selected, setSelected] = useState({
    plugin_opd_queue: true,
    plugin_collections: true,
  });

  if (!isOpen) return null;

  const toggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900">Customize Your Demo</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Choose which features to explore</p>

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
            onClick={() => onConfirm(selected)}
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
