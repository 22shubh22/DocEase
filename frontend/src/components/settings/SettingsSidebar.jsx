export default function SettingsSidebar({ sections, activeTab, onTabChange }) {
  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="input w-full"
        >
          {sections.map((section) => (
            <optgroup key={section.label} label={section.label}>
              {section.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon} {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Desktop: Vertical sidebar */}
      <nav className="hidden md:block w-56 flex-shrink-0 sticky top-24 self-start">
        {sections.map((section, idx) => (
          <div key={section.label} className={idx > 0 ? 'mt-6' : ''}>
            <h3 className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.label}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary-50 text-primary-700 font-medium border-l-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
