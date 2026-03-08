export default function PrintFooter({ doctor, clinic, templateConfig, presetId }) {
  const footer = templateConfig?.footer || {};

  const doctorName = doctor?.name || '';
  const doctorRegistration = doctor?.registration_number || '';
  const signatureUrl = doctor?.signature_url || '';
  const clinicPhone = clinic?.phone || '';
  const clinicEmail = clinic?.email || '';

  if (presetId === 'modern') return renderModern();
  if (presetId === 'minimal') return renderMinimal();
  if (presetId === 'bold') return renderBold();
  return renderClassic();

  function renderClassic() {
    return (
      <div className="print-footer" style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Left: Custom text + clinic contact */}
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            {footer.custom_footer_text && (
              <div style={{ marginBottom: '4px', fontStyle: 'italic' }}>{footer.custom_footer_text}</div>
            )}
            {footer.show_clinic_contact && (clinicPhone || clinicEmail) && (
              <div>
                {clinicPhone && <span>Ph: {clinicPhone}</span>}
                {clinicPhone && clinicEmail && <span> | </span>}
                {clinicEmail && <span>{clinicEmail}</span>}
              </div>
            )}
          </div>

          {/* Right: Signature */}
          <div style={{ textAlign: 'center' }}>
            {footer.show_signature_image && signatureUrl && (
              <img src={signatureUrl} alt="Signature" style={{ height: '30px', maxWidth: '100px', objectFit: 'contain', marginBottom: '4px' }} />
            )}
            {footer.show_signature_line && (
              <div style={{ borderBottom: '1px solid #9ca3af', width: '150px', marginBottom: '4px' }}></div>
            )}
            {footer.show_doctor_name && doctorName && (
              <div style={{ fontSize: '11px', fontWeight: '500' }}>Dr. {doctorName}</div>
            )}
            {footer.show_doctor_name && doctorRegistration && (
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Reg. No: {doctorRegistration}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderModern() {
    return (
      <div className="print-footer" style={{ marginTop: '16px' }}>
        {/* Accent bar */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: '2px', marginBottom: '6px' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            {footer.custom_footer_text && (
              <div style={{ fontStyle: 'italic', marginBottom: '2px' }}>{footer.custom_footer_text}</div>
            )}
            {footer.show_clinic_contact && clinicPhone && <div>Ph: {clinicPhone}</div>}
          </div>

          <div style={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px' }}>
            {footer.show_signature_image && signatureUrl && (
              <img src={signatureUrl} alt="Signature" style={{ height: '28px', maxWidth: '80px', objectFit: 'contain', marginBottom: '4px' }} />
            )}
            {footer.show_doctor_name && doctorName && (
              <div style={{ fontSize: '11px', fontWeight: '500' }}>Dr. {doctorName}</div>
            )}
            {doctorRegistration && (
              <div style={{ fontSize: '9px', color: '#6b7280' }}>Reg: {doctorRegistration}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderMinimal() {
    return (
      <div className="print-footer" style={{ marginTop: '16px', textAlign: 'right' }}>
        {footer.show_signature_image && signatureUrl && (
          <img src={signatureUrl} alt="Signature" style={{ height: '28px', maxWidth: '80px', objectFit: 'contain', marginLeft: 'auto', marginBottom: '4px' }} />
        )}
        {footer.show_doctor_name && doctorName && (
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#374151' }}>Dr. {doctorName}</div>
        )}
        {footer.custom_footer_text && (
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>{footer.custom_footer_text}</div>
        )}
      </div>
    );
  }

  function renderBold() {
    return (
      <div className="print-footer" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            {footer.custom_footer_text && <div style={{ fontStyle: 'italic' }}>{footer.custom_footer_text}</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            {footer.show_signature_image && signatureUrl && (
              <img src={signatureUrl} alt="Signature" style={{ height: '30px', maxWidth: '100px', objectFit: 'contain', marginBottom: '4px' }} />
            )}
            {footer.show_signature_line && (
              <div style={{ borderBottom: '2px solid #1e3a5f', width: '150px', marginBottom: '4px' }}></div>
            )}
            {footer.show_doctor_name && doctorName && (
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e3a5f' }}>Dr. {doctorName}</div>
            )}
          </div>
        </div>

        {/* Colored footer bar */}
        <div style={{
          background: '#1e3a5f',
          color: 'white',
          padding: '4px 16px',
          borderRadius: '8px 8px 0 0',
          marginLeft: '-40px',
          marginRight: '-40px',
          marginBottom: '-40px',
          fontSize: '9px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
        }}>
          {footer.show_clinic_contact && clinicPhone && <span>Ph: {clinicPhone}</span>}
          {footer.show_clinic_contact && clinicEmail && <span>{clinicEmail}</span>}
        </div>
      </div>
    );
  }
}
