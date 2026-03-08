export default function PrintHeader({ clinic, doctor, templateConfig, presetId }) {
  const header = templateConfig?.header || {};

  const clinicName = clinic?.name || '';
  const clinicAddress = clinic?.address || '';
  const clinicPhone = clinic?.phone || '';
  const clinicEmail = clinic?.email || '';
  const logoUrl = clinic?.logo_url || '';

  const doctorName = doctor?.name || '';
  const doctorQualification = doctor?.qualification || '';
  const doctorRegistration = doctor?.registration_number || '';
  const doctorSpecialization = doctor?.specialization || '';

  if (presetId === 'modern') return renderModern();
  if (presetId === 'minimal') return renderMinimal();
  if (presetId === 'bold') return renderBold();
  return renderClassic();

  function renderClassic() {
    return (
      <div className="print-header" style={{ borderBottom: '2px solid #1f2937', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left: Logo */}
          {header.show_logo && logoUrl && (
            <div style={{ flexShrink: 0, marginRight: '8px' }}>
              <img src={logoUrl} alt="Clinic Logo" style={{ height: '40px', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
          )}

          {/* Center: Clinic Info */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            {header.show_clinic_name && (
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{clinicName}</div>
            )}
            {header.custom_tagline && (
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px', fontStyle: 'italic' }}>{header.custom_tagline}</div>
            )}
            {header.show_address && clinicAddress && (
              <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>{clinicAddress}</div>
            )}
            <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>
              {header.show_phone && clinicPhone && <span>Ph: {clinicPhone}</span>}
              {header.show_phone && clinicPhone && header.show_email && clinicEmail && <span> | </span>}
              {header.show_email && clinicEmail && <span>{clinicEmail}</span>}
            </div>
          </div>

          {/* Right: Doctor Info */}
          <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: '8px' }}>
            {header.show_doctor_name && doctorName && (
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>Dr. {doctorName}</div>
            )}
            {header.show_qualification && doctorQualification && (
              <div style={{ fontSize: '10px', color: '#4b5563' }}>{doctorQualification}</div>
            )}
            {header.show_specialization && doctorSpecialization && (
              <div style={{ fontSize: '10px', color: '#4b5563' }}>{doctorSpecialization}</div>
            )}
            {header.show_registration && doctorRegistration && (
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Reg. No: {doctorRegistration}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderModern() {
    return (
      <div className="print-header" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px' }}>
          {/* Left: Logo + Clinic Name inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {header.show_logo && logoUrl && (
              <img src={logoUrl} alt="Clinic Logo" style={{ height: '36px', maxWidth: '80px', objectFit: 'contain' }} />
            )}
            <div>
              {header.show_clinic_name && (
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>{clinicName}</div>
              )}
              {header.custom_tagline && (
                <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>{header.custom_tagline}</div>
              )}
            </div>
          </div>

          {/* Right: Contact + Doctor */}
          <div style={{ textAlign: 'right' }}>
            {header.show_doctor_name && doctorName && (
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937' }}>Dr. {doctorName}</div>
            )}
            {header.show_qualification && doctorQualification && (
              <div style={{ fontSize: '10px', color: '#4b5563' }}>{doctorQualification}</div>
            )}
            {header.show_registration && doctorRegistration && (
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Reg: {doctorRegistration}</div>
            )}
          </div>
        </div>

        {/* Accent bar */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: '2px' }}></div>

        {/* Sub-line: address + phone */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
          <span>
            {header.show_address && clinicAddress && clinicAddress}
          </span>
          <span>
            {header.show_phone && clinicPhone && `Ph: ${clinicPhone}`}
            {header.show_phone && clinicPhone && header.show_email && clinicEmail && ' | '}
            {header.show_email && clinicEmail && clinicEmail}
          </span>
        </div>
      </div>
    );
  }

  function renderMinimal() {
    return (
      <div className="print-header" style={{ textAlign: 'center', paddingBottom: '6px', marginBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
        {header.show_clinic_name && (
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', letterSpacing: '1px', textTransform: 'uppercase' }}>{clinicName}</div>
        )}
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
          {header.show_doctor_name && doctorName && <span>Dr. {doctorName}</span>}
          {header.show_doctor_name && doctorName && header.show_registration && doctorRegistration && <span> | </span>}
          {header.show_registration && doctorRegistration && <span>Reg: {doctorRegistration}</span>}
          {header.show_phone && clinicPhone && <span> | {clinicPhone}</span>}
        </div>
      </div>
    );
  }

  function renderBold() {
    return (
      <div className="print-header" style={{ marginBottom: '8px' }}>
        {/* Full-width colored header bar */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '0 0 8px 8px',
          marginLeft: '-40px',
          marginRight: '-40px',
          marginTop: '-12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {header.show_logo && logoUrl && (
              <img src={logoUrl} alt="Clinic Logo" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain', marginBottom: '3px' }} />
            )}
            {header.show_clinic_name && (
              <div style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{clinicName}</div>
            )}
            {header.custom_tagline && (
              <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '1px' }}>{header.custom_tagline}</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', opacity: 0.9 }}>
            <div>
              {header.show_doctor_name && doctorName && <span>Dr. {doctorName}</span>}
              {header.show_qualification && doctorQualification && <span> | {doctorQualification}</span>}
              {header.show_specialization && doctorSpecialization && <span> | {doctorSpecialization}</span>}
            </div>
            <div>
              {header.show_address && clinicAddress && <span>{clinicAddress}</span>}
              {header.show_phone && clinicPhone && <span> | {clinicPhone}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
