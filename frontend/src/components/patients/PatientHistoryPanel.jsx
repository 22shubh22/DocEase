import { useState } from 'react';

export default function PatientHistoryPanel({
  visits = [],
  prescriptions = [],
  loading = false,
  expanded = false,
  onToggle
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisitId, setExpandedVisitId] = useState(null);

  // Helper to get prescriptions for a specific visit
  const getPrescriptionsForVisit = (visitId) => {
    return prescriptions.filter(p => p.visit_id === visitId);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'visits', label: 'Visit History', count: visits.length },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const countPendingFollowups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visits.filter(v => {
      if (!v.follow_up_date) return false;
      const followUp = new Date(v.follow_up_date);
      followUp.setHours(0, 0, 0, 0);
      return followUp >= today;
    }).length;
  };

  const renderOverviewTab = () => {
    const lastVisit = visits[0];

    return (
      <div className="space-y-4">
        {/* Last Visit Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Last Visit</h4>
          {lastVisit ? (
            <div className="text-sm text-blue-800 space-y-2">
              <p><span className="font-medium">Date:</span> {formatDateTime(lastVisit.visit_date)} (Visit #{lastVisit.visit_number})</p>
              <div>
                <span className="font-medium">Diagnosis:</span>{' '}
                {lastVisit.diagnosis && lastVisit.diagnosis.length > 0
                  ? lastVisit.diagnosis.join(', ')
                  : 'Not recorded'}
              </div>
              <div>
                <span className="font-medium">Symptoms:</span>{' '}
                {lastVisit.symptoms && lastVisit.symptoms.length > 0
                  ? lastVisit.symptoms.join(', ')
                  : 'Not recorded'}
              </div>
              {lastVisit.observations && lastVisit.observations.length > 0 && (
                <div>
                  <span className="font-medium">Observations:</span>{' '}
                  {lastVisit.observations.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <p className="text-blue-600 text-sm">First visit for this patient</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
            <p className="text-xs text-gray-600">Total Visits</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
            <p className="text-xs text-gray-600">Prescriptions</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{countPendingFollowups()}</p>
            <p className="text-xs text-gray-600">Pending Follow-ups</p>
          </div>
        </div>
      </div>
    );
  };

  const renderVisitsTab = () => {
    if (visits.length === 0) {
      return <p className="text-gray-500 text-center py-4">No previous visits</p>;
    }

    return (
      <div className="space-y-3">
        {visits.map(visit => {
          const isExpanded = expandedVisitId === visit.id;
          const visitPrescriptions = getPrescriptionsForVisit(visit.id);
          const hasVitals = visit.vitals && Object.values(visit.vitals).some(v => v);
          const hasTests = visit.recommended_tests && visit.recommended_tests.length > 0;

          return (
            <div key={visit.id} className="border rounded-lg overflow-hidden">
              {/* Clickable Header */}
              <div
                onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                className="p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">Visit #{visit.visit_number}</span>
                    <span className="text-sm text-gray-500">{formatDateTime(visit.visit_date)}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Diagnosis:</span>{' '}
                    {visit.diagnosis && visit.diagnosis.length > 0 ? visit.diagnosis.join(', ') : '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {visit.symptoms && visit.symptoms.length > 0 ? visit.symptoms.join(', ') : '-'}
                  </p>
                </div>
                <span className="text-gray-400 ml-2">{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-3 space-y-4">
                  {/* Observations */}
                  {visit.observations && visit.observations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Observations</h5>
                      <div className="flex flex-wrap gap-2">
                        {visit.observations.map((obs, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {obs}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vitals Grid */}
                  {hasVitals && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Vitals</h5>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
                        {visit.vitals.blood_pressure && (
                          <div><span className="text-gray-500">BP:</span> {visit.vitals.blood_pressure}</div>
                        )}
                        {visit.vitals.temperature && (
                          <div><span className="text-gray-500">Temp:</span> {visit.vitals.temperature}°F</div>
                        )}
                        {visit.vitals.pulse && (
                          <div><span className="text-gray-500">Pulse:</span> {visit.vitals.pulse}</div>
                        )}
                        {visit.vitals.weight && (
                          <div><span className="text-gray-500">Weight:</span> {visit.vitals.weight} kg</div>
                        )}
                        {visit.vitals.height && (
                          <div><span className="text-gray-500">Height:</span> {visit.vitals.height} cm</div>
                        )}
                        {visit.vitals.spo2 && (
                          <div><span className="text-gray-500">SpO2:</span> {visit.vitals.spo2}%</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tests */}
                  {hasTests && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Tests</h5>
                      <div className="flex flex-wrap gap-2">
                        {visit.recommended_tests.map((test, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {visitPrescriptions.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Prescriptions</h5>
                      {visitPrescriptions.map(rx => (
                        <div key={rx.id} className="bg-white rounded p-2 mb-2 border">
                          {rx.medicines?.map((med, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{idx + 1}. {med.medicine_name}</span>
                              {med.dosage && <span className="text-gray-600"> - {med.dosage}</span>}
                              {med.duration && <span className="text-gray-600"> - {med.duration}</span>}
                            </div>
                          ))}
                          {rx.notes && <p className="text-xs text-gray-500 mt-1">Note: {rx.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up */}
                  {visit.follow_up_date && (
                    <div className="text-sm">
                      <span className="text-gray-500">Follow-up:</span> {formatDate(visit.follow_up_date)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'visits':
        return renderVisitsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 pb-2 border-b"
      >
        <span>
          Patient History
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({visits.length} visit{visits.length !== 1 ? 's' : ''}, {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''})
            </span>
          )}
        </span>
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
          ) : visits.length === 0 && prescriptions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No previous history found for this patient.
            </p>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="border-b border-gray-200 mb-4">
                <div className="flex space-x-1 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`ml-1 text-xs ${
                          activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'
                        }`}>
                          ({tab.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="max-h-96 overflow-y-auto">
                {renderTabContent()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
