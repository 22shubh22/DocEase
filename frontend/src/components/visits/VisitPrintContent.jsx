import { forwardRef } from 'react';

const VisitPrintContent = forwardRef(({
  patient,
  vitals,
  symptoms,
  diagnoses,
  observations,
  tests,
  followUpDate,
  medicines,
  prescriptionNotes,
  printSettings,
  doctor
}, ref) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const hasVitals = vitals && Object.values(vitals).some(v => v);
  const hasMedicines = medicines && medicines.length > 0;

  return (
    <div
      ref={ref}
      className="print-content bg-white"
      style={{
        paddingTop: `${printSettings?.top || 280}px`,
        paddingLeft: `${printSettings?.left || 40}px`,
        paddingRight: '40px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Patient Header */}
      <div className="border-b-2 border-gray-800 pb-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Patient: {patient?.full_name || 'Unknown'}
        </h2>
        <div className="flex flex-wrap gap-x-4 text-sm text-gray-700 mt-1">
          <span>ID: {patient?.patient_code || '-'}</span>
          <span>Age: {patient?.age || '-'} yrs</span>
          <span>Gender: {patient?.gender || '-'}</span>
          {patient?.blood_group && <span>Blood Group: {patient.blood_group}</span>}
        </div>
        <div className="text-sm text-gray-600 mt-1">Date: {today}</div>
      </div>

      {/* Allergies Warning */}
      {patient?.allergies && (
        <div className="bg-red-50 border border-red-300 rounded p-2 mb-4">
          <span className="font-bold text-red-700">Allergies: </span>
          <span className="text-red-600">{patient.allergies}</span>
        </div>
      )}

      {/* Vitals Section */}
      {hasVitals && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">VITALS</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {vitals.blood_pressure && <span>BP: {vitals.blood_pressure}</span>}
            {vitals.temperature && <span>Temp: {vitals.temperature}°F</span>}
            {vitals.pulse && <span>Pulse: {vitals.pulse} bpm</span>}
            {vitals.weight && <span>Weight: {vitals.weight} kg</span>}
            {vitals.height && <span>Height: {vitals.height} cm</span>}
            {vitals.spo2 && <span>SpO2: {vitals.spo2}%</span>}
          </div>
        </div>
      )}

      {/* Chief Complaints */}
      {symptoms && symptoms.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">CHIEF COMPLAINTS</h3>
          <p className="text-sm">{symptoms.join(', ')}</p>
        </div>
      )}

      {/* Diagnosis */}
      {diagnoses && diagnoses.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">DIAGNOSIS</h3>
          <p className="text-sm">{diagnoses.join(', ')}</p>
        </div>
      )}

      {/* Clinical Observations */}
      {observations && observations.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">CLINICAL OBSERVATIONS</h3>
          <p className="text-sm">{observations.join(', ')}</p>
        </div>
      )}

      {/* Recommended Tests */}
      {tests && tests.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">RECOMMENDED TESTS</h3>
          <p className="text-sm">{tests.join(', ')}</p>
        </div>
      )}

      {/* Follow-up Date */}
      {followUpDate && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">FOLLOW-UP</h3>
          <p className="text-sm">{formatDate(followUpDate)}</p>
        </div>
      )}

      {/* Prescription/Medicines */}
      {hasMedicines && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">PRESCRIPTION</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-1 text-left w-8">#</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Medicine</th>
                <th className="border border-gray-400 px-2 py-1 text-left w-24">Dosage</th>
                <th className="border border-gray-400 px-2 py-1 text-left w-24">Duration</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, index) => (
                <tr key={med.id || index}>
                  <td className="border border-gray-400 px-2 py-1">{index + 1}</td>
                  <td className="border border-gray-400 px-2 py-1">{med.medicine_name}</td>
                  <td className="border border-gray-400 px-2 py-1">{med.dosage || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{med.duration || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prescription Notes */}
      {prescriptionNotes && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">NOTES</h3>
          <p className="text-sm whitespace-pre-wrap">{prescriptionNotes}</p>
        </div>
      )}

      {/* Signature Line */}
      <div className="mt-8 pt-4 border-t border-gray-300">
        <div className="text-right">
          <div className="inline-block text-center">
            <div className="border-b border-gray-400 w-48 mb-1"></div>
            {doctor ? (
              <div>
                <div className="text-sm font-medium">Dr. {doctor.name}</div>
                {doctor.registration_number && (
                  <div className="text-xs text-gray-500">Reg. No: {doctor.registration_number}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">Doctor's Signature</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

VisitPrintContent.displayName = 'VisitPrintContent';

export default VisitPrintContent;
