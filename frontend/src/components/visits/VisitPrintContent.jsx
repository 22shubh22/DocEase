import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PrintHeader from '../print/PrintHeader';
import PrintFooter from '../print/PrintFooter';
import PrintWatermark from '../print/PrintWatermark';
import { DOCEASE_ICON_BASE64, DOCEASE_URL, DOCEASE_BRAND } from '../../constants/branding';

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
  printTemplate,
  clinic,
  doctor,
  visitDate,
  visitNumber
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

  const displayDate = visitDate ? formatDate(visitDate) : today;

  const hasVitals = vitals && Object.values(vitals).some(v => v);
  const hasMedicines = medicines && medicines.length > 0;

  // Determine positioning based on template or legacy printSettings
  const isDigital = printTemplate?.print_mode === 'digital';
  const topPx = printTemplate ? printTemplate.content_top_px : (printSettings?.top || 280);
  const leftPx = printTemplate ? printTemplate.content_left_px : (printSettings?.left || 40);
  const rightPx = printTemplate ? (printTemplate.content_right_px || 40) : 40;

  return (
    <div
      ref={ref}
      className="print-content bg-white"
      style={{
        paddingLeft: `${leftPx}px`,
        paddingRight: `${rightPx}px`,
        paddingBottom: '20px',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
      }}
    >
      {/* Watermark (digital mode only) — outside table so it repeats on every page via position:fixed */}
      {isDigital && printTemplate?.template_config?.watermark?.enabled && (
        <PrintWatermark config={printTemplate.template_config.watermark} clinic={clinic} />
      )}

      <table className="print-page-table">
        {/* Header — repeated on every printed page by the browser */}
        <thead>
          <tr><td>
            <div className="print-header-space">
              {isDigital ? (
                <div style={{ paddingTop: '12px' }}>
                  <PrintHeader
                    clinic={clinic}
                    doctor={doctor}
                    templateConfig={printTemplate?.template_config}
                    presetId={printTemplate?.preset_id || 'classic'}
                    contentLeftPx={leftPx}
                    contentRightPx={rightPx}
                  />
                </div>
              ) : (
                <div style={{ height: `${topPx}px` }} />
              )}
            </div>
          </td></tr>
        </thead>

        {/* Footer — repeated on every printed page by the browser */}
        <tfoot>
          <tr><td>
            <div className="print-footer-space">
              {isDigital ? (
                <PrintFooter
                  doctor={doctor}
                  clinic={clinic}
                  templateConfig={printTemplate?.template_config}
                  presetId={printTemplate?.preset_id || 'classic'}
                  contentLeftPx={leftPx}
                  contentRightPx={rightPx}
                />
              ) : (
                <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {/* Left: Powered by DocEase */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QRCodeSVG
                        value={DOCEASE_URL}
                        size={40}
                        level="M"
                        imageSettings={{
                          src: DOCEASE_ICON_BASE64,
                          height: 12,
                          width: 12,
                          excavate: true,
                        }}
                      />
                      <div style={{ fontSize: '8px', color: '#9ca3af', lineHeight: '1.3' }}>
                        <div>Powered by</div>
                        <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '9px' }}>{DOCEASE_BRAND}</div>
                      </div>
                    </div>

                    {/* Right: Doctor's Signature */}
                    <div style={{ display: 'inline-block', textAlign: 'center' }}>
                      <div className="border-b border-gray-400" style={{ width: '12rem', marginBottom: '0.25rem' }}></div>
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
              )}
            </div>
          </td></tr>
        </tfoot>

        {/* Body content */}
        <tbody>
          <tr><td>
            <div className="print-body-content" style={{ paddingBottom: '24px' }}>
              {/* Patient Header */}
              <div className="print-section pb-2 mb-2" style={{ position: 'relative', zIndex: 1 }}>
                <h2 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>
                  Patient: {patient?.full_name || 'Unknown'}
                </h2>
                <div className="flex flex-wrap gap-x-4 text-sm text-gray-700 mt-1">
                  <span>ID: {patient?.patient_code || '-'}</span>
                  {visitNumber && <span>Visit #: {visitNumber}</span>}
                  <span>Age: {patient?.age_display || patient?.age || '-'}</span>
                  <span>Gender: {patient?.gender || '-'}</span>
                  {patient?.blood_group && <span>Blood Group: {patient.blood_group}</span>}
                  {patient?.phone && <span>Phone: {patient.phone}</span>}
                </div>
                <div className="text-sm text-gray-600 mt-1">Date: {displayDate}</div>
                {patient?.guardian_name && (
                  <div className="text-sm text-gray-600 mt-1">
                    Guardian: {patient.guardian_name}
                    {patient.guardian_relationship && ` (${patient.guardian_relationship})`}
                    {patient.guardian_phone && ` • Ph: ${patient.guardian_phone}`}
                  </div>
                )}
              </div>

              {/* Allergies Warning */}
              {patient?.allergies?.length > 0 && (
                <div className="print-section bg-red-50 border border-red-300 rounded mb-2" style={{ padding: '4px 8px' }}>
                  <span className="font-bold text-red-700">Allergies: </span>
                  <span className="text-red-600">{patient.allergies}</span>
                </div>
              )}

              {/* Vitals Section */}
              {hasVitals && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">VITALS</h3>
                  <div className="grid grid-cols-3 gap-1 text-sm">
                    {vitals.blood_pressure && <span>BP: {vitals.blood_pressure}</span>}
                    {vitals.temperature && <span>Temp: {vitals.temperature}&deg;F</span>}
                    {vitals.pulse && <span>Pulse: {vitals.pulse} bpm</span>}
                    {vitals.weight && <span>Weight: {vitals.weight} kg</span>}
                    {vitals.height && <span>Height: {vitals.height} cm</span>}
                    {vitals.spo2 && <span>SpO2: {vitals.spo2}%</span>}
                  </div>
                </div>
              )}

              {/* Chief Complaints */}
              {symptoms && symptoms.length > 0 && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">CHIEF COMPLAINTS</h3>
                  <p className="text-sm">{symptoms.join(', ')}</p>
                </div>
              )}

              {/* Diagnosis */}
              {diagnoses && diagnoses.length > 0 && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">DIAGNOSIS</h3>
                  <p className="text-sm">{diagnoses.join(', ')}</p>
                </div>
              )}

              {/* Clinical Observations */}
              {observations && observations.length > 0 && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">CLINICAL OBSERVATIONS</h3>
                  <p className="text-sm">{observations.join(', ')}</p>
                </div>
              )}

              {/* Recommended Tests */}
              {tests && tests.length > 0 && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">RECOMMENDED TESTS</h3>
                  <p className="text-sm">{tests.join(', ')}</p>
                </div>
              )}

              {/* Follow-up Date */}
              {followUpDate && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">FOLLOW-UP</h3>
                  <p className="text-sm">{formatDate(followUpDate)}</p>
                </div>
              )}

              {/* Prescription/Medicines */}
              {hasMedicines && (
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">PRESCRIPTION</h3>
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
                <div className="print-section mb-2">
                  <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-1">NOTES</h3>
                  <p className="text-sm whitespace-pre-wrap">{prescriptionNotes}</p>
                </div>
              )}
            </div>
          </td></tr>
        </tbody>
      </table>
    </div>
  );
});

VisitPrintContent.displayName = 'VisitPrintContent';

export default VisitPrintContent;
