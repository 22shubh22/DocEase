const PRESET_META = {
  classic: {
    name: 'Classic',
    description: 'Traditional letterhead layout',
  },
  modern: {
    name: 'Modern',
    description: 'Clean design with accent bar',
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple and understated',
  },
  bold: {
    name: 'Bold',
    description: 'Prominent colored header',
  },
};

export default function PresetCard({ presetId, isSelected, onSelect, disabled }) {
  const meta = PRESET_META[presetId] || { name: presetId, description: '' };

  return (
    <button
      type="button"
      onClick={() => onSelect(presetId)}
      disabled={disabled}
      className={`
        relative p-3 rounded-lg border-2 text-left transition-all
        ${isSelected
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Mini SVG Preview */}
      <div className="w-full aspect-[3/4] bg-gray-50 rounded border border-gray-100 mb-2 overflow-hidden">
        <PresetThumbnail presetId={presetId} />
      </div>

      <div className="font-medium text-sm text-gray-900">{meta.name}</div>
      <div className="text-xs text-gray-500">{meta.description}</div>

      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

function PresetThumbnail({ presetId }) {
  const w = 100;
  const h = 140;

  if (presetId === 'modern') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Header: logo + name inline */}
        <rect x="8" y="8" width="12" height="12" rx="2" fill="#dbeafe" />
        <rect x="24" y="10" width="30" height="4" rx="1" fill="#1e40af" />
        <rect x="24" y="16" width="20" height="3" rx="1" fill="#93c5fd" />
        {/* Accent bar */}
        <rect x="0" y="26" width={w} height="2" fill="url(#modern-grad)" />
        <defs><linearGradient id="modern-grad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#2563eb"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
        {/* Content lines */}
        <rect x="8" y="34" width="60" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="40" width="84" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="46" width="70" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="56" width="84" height="3" rx="1" fill="#f3f4f6" />
        <rect x="8" y="62" width="84" height="3" rx="1" fill="#f3f4f6" />
        <rect x="8" y="68" width="50" height="3" rx="1" fill="#f3f4f6" />
        {/* Footer: signature in rounded box */}
        <rect x="50" y={h - 30} width="40" height="20" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="58" y={h - 24} width="24" height="3" rx="1" fill="#d1d5db" />
        <rect x="62" y={h - 18} width="16" height="2" rx="1" fill="#e5e7eb" />
      </svg>
    );
  }

  if (presetId === 'minimal') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Header: centered clinic name */}
        <rect x="25" y="10" width="50" height="4" rx="1" fill="#374151" />
        <rect x="30" y="17" width="40" height="2" rx="1" fill="#d1d5db" />
        <line x1="20" y1="24" x2="80" y2="24" stroke="#e5e7eb" strokeWidth="0.5" />
        {/* Content lines */}
        <rect x="8" y="32" width="60" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="38" width="84" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="44" width="70" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="54" width="84" height="3" rx="1" fill="#f3f4f6" />
        <rect x="8" y="60" width="84" height="3" rx="1" fill="#f3f4f6" />
        {/* Watermark hint */}
        <rect x="30" y="75" width="40" height="30" rx="4" fill="#f9fafb" stroke="#f3f4f6" strokeWidth="0.5" opacity="0.5" />
        {/* Footer: right-aligned name */}
        <rect x="62" y={h - 18} width="28" height="3" rx="1" fill="#d1d5db" />
        <rect x="68" y={h - 13} width="22" height="2" rx="1" fill="#e5e7eb" />
      </svg>
    );
  }

  if (presetId === 'bold') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Full-width colored header */}
        <rect x="0" y="0" width={w} height="30" fill="#1e40af" rx="0" />
        <rect x="35" y="6" width="30" height="5" rx="1" fill="white" />
        <rect x="30" y="14" width="40" height="3" rx="1" fill="#93c5fd" />
        <rect x="10" y="22" width="30" height="2" rx="0.5" fill="#bfdbfe" />
        <rect x="60" y="22" width="30" height="2" rx="0.5" fill="#bfdbfe" />
        {/* Content lines */}
        <rect x="8" y="38" width="60" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="44" width="84" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="50" width="70" height="3" rx="1" fill="#e5e7eb" />
        <rect x="8" y="60" width="84" height="3" rx="1" fill="#f3f4f6" />
        <rect x="8" y="66" width="84" height="3" rx="1" fill="#f3f4f6" />
        {/* Footer bar */}
        <rect x="0" y={h - 12} width={w} height="12" fill="#1e3a5f" />
        <rect x="25" y={h - 8} width="50" height="2" rx="0.5" fill="#93c5fd" />
        {/* Signature */}
        <rect x="55" y={h - 28} width="35" height="2" rx="0.5" fill="#9ca3af" />
        <rect x="60" y={h - 22} width="25" height="3" rx="1" fill="#d1d5db" />
      </svg>
    );
  }

  // Classic (default)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* Header: logo left, clinic center, doctor right */}
      <rect x="8" y="8" width="14" height="14" rx="2" fill="#dbeafe" />
      <rect x="35" y="8" width="30" height="5" rx="1" fill="#1f2937" />
      <rect x="38" y="15" width="24" height="3" rx="1" fill="#9ca3af" />
      <rect x="70" y="8" width="22" height="3" rx="1" fill="#374151" />
      <rect x="72" y="13" width="18" height="2" rx="0.5" fill="#9ca3af" />
      <rect x="74" y="17" width="16" height="2" rx="0.5" fill="#d1d5db" />
      <line x1="8" y1="24" x2="92" y2="24" stroke="#1f2937" strokeWidth="1" />
      {/* Content lines */}
      <rect x="8" y="32" width="60" height="3" rx="1" fill="#e5e7eb" />
      <rect x="8" y="38" width="84" height="3" rx="1" fill="#e5e7eb" />
      <rect x="8" y="44" width="70" height="3" rx="1" fill="#e5e7eb" />
      <rect x="8" y="54" width="84" height="3" rx="1" fill="#f3f4f6" />
      <rect x="8" y="60" width="84" height="3" rx="1" fill="#f3f4f6" />
      <rect x="8" y="66" width="50" height="3" rx="1" fill="#f3f4f6" />
      {/* Footer */}
      <line x1="8" y1={h - 26} x2="92" y2={h - 26} stroke="#d1d5db" strokeWidth="0.5" />
      <rect x="55" y={h - 20} width="35" height="2" rx="0.5" fill="#9ca3af" />
      <rect x="60" y={h - 15} width="28" height="3" rx="1" fill="#d1d5db" />
      <rect x="64" y={h - 10} width="22" height="2" rx="0.5" fill="#e5e7eb" />
    </svg>
  );
}
