import { useState } from 'react';
import RecordDoseModal from './RecordDoseModal';

const STATUS_STYLES = {
  given: { bg: 'bg-green-100', text: 'text-green-800', label: 'Given' },
  due: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Due' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  upcoming: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Upcoming' },
};

export default function VaccinationCardView({ card, onDoseRecorded, patientId }) {
  const [showDoseModal, setShowDoseModal] = useState(null);

  if (!card) return null;

  const { doses, summary, date_of_birth, age_days, patient_name, warnings } = card;

  // Group doses by age_label for the card view
  const grouped = {};
  for (const dose of doses) {
    const key = dose.age_label || `${dose.age_days} days`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(dose);
  }

  const ageLabelText = age_days !== null && age_days !== undefined
    ? age_days < 30
      ? `${age_days} day${age_days !== 1 ? 's' : ''}`
      : age_days < 365
        ? `${Math.floor(age_days / 30)} month${Math.floor(age_days / 30) !== 1 ? 's' : ''}`
        : `${Math.floor(age_days / 365)} year${Math.floor(age_days / 365) !== 1 ? 's' : ''} ${Math.floor((age_days % 365) / 30)} month${Math.floor((age_days % 365) / 30) !== 1 ? 's' : ''}`
    : 'N/A';

  return (
    <div>
      {/* Patient Info Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          {date_of_birth && (
            <p className="text-sm text-gray-600">
              DOB: {new Date(date_of_birth).toLocaleDateString('en-IN')} | Age: {ageLabelText}
            </p>
          )}
          {!date_of_birth && (
            <p className="text-sm text-yellow-600">Date of birth not set - vaccination status may be inaccurate</p>
          )}
          {warnings?.length > 0 && warnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-600">{w}</p>
          ))}
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 font-medium">{summary.given} Given</span>
          <span className="text-yellow-600 font-medium">{summary.due} Due</span>
          <span className="text-red-600 font-medium">{summary.overdue} Overdue</span>
          <span className="text-gray-500">{summary.upcoming} Upcoming</span>
        </div>
      </div>

      {/* Vaccination Card Grid */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([ageLabel, ageDoses]) => (
          <div key={ageLabel} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700 text-sm">{ageLabel}</h3>
            </div>
            <div className="divide-y">
              {ageDoses.map((dose) => {
                const style = STATUS_STYLES[dose.status];
                return (
                  <div key={`${dose.vaccine_name}-${dose.dose_number}`} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{dose.dose_label || dose.vaccine_name}</p>
                      {dose.record?.date_administered && (
                        <p className="text-xs text-gray-500">
                          Given on {new Date(dose.record.date_administered).toLocaleDateString('en-IN')}
                          {dose.record.batch_number && ` | Batch: ${dose.record.batch_number}`}
                        </p>
                      )}
                      {dose.record?.adverse_reaction && (
                        <p className="text-xs text-red-500 mt-1">Reaction: {dose.record.adverse_reaction}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      {dose.status !== 'given' && dose.status !== 'upcoming' && (
                        <button
                          onClick={() => setShowDoseModal(dose)}
                          className="btn btn-primary text-xs px-2 py-1"
                        >
                          Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showDoseModal && (
        <RecordDoseModal
          dose={showDoseModal}
          patientId={patientId}
          onClose={() => setShowDoseModal(null)}
          onRecorded={() => {
            setShowDoseModal(null);
            onDoseRecorded?.();
          }}
        />
      )}
    </div>
  );
}
