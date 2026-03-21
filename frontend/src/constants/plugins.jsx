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
  {
    key: 'dpdp_compliance',
    apiKey: 'plugin_dpdp_compliance',
    name: 'DPDP Compliance',
    description: 'Stay compliant with India\'s data protection law. Audit logging, consent management, data erasure, and breach reporting per DPDP Act 2023.',
    benefits: [
      'Complete audit trail of data access and modifications',
      'Patient consent tracking and management',
      'Right to erasure (data anonymization)',
      'Data breach incident logging',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    key: 'vaccination',
    apiKey: 'plugin_vaccination',
    name: 'Vaccination Tracking',
    description: 'Track child immunization schedules, record doses, and monitor vaccination status for pediatric patients.',
    benefits: [
      'Standard EPI vaccination schedule',
      'Visual vaccination card per child',
      'Due and overdue vaccine alerts',
      'Record doses during visits',
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export function getPluginByKey(key) {
  return PLUGIN_METADATA.find((p) => p.key === key);
}
