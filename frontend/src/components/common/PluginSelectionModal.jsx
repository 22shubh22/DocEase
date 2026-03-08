import { useState } from 'react';
import { PLUGIN_METADATA } from '../../constants/plugins';

const PLUGINS = PLUGIN_METADATA.map((p) => ({
  key: p.apiKey,
  name: p.name,
  description: p.description,
  icon: p.icon,
}));

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
