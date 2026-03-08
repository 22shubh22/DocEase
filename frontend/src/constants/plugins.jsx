export const PLUGIN_METADATA = [
  {
    key: 'opd_queue',
    apiKey: 'plugin_opd_queue',
    name: 'OPD Queue',
    description: 'Manage patient queues, appointments, and daily OPD flow',
    benefits: [
      'Real-time patient queue tracking',
      'Chief complaint logging at check-in',
      'Daily OPD statistics and insights',
      'Follow-up tracking for returning patients',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'collections',
    apiKey: 'plugin_collections',
    name: 'Collections',
    description: 'Track visit fees and view monthly collection reports',
    benefits: [
      'Daily and monthly collection summaries',
      'Revenue tracking per doctor',
      'Average collection per visit analytics',
      'Date range and doctor-wise filtering',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function getPluginByKey(key) {
  return PLUGIN_METADATA.find((p) => p.key === key);
}
