import { QRCodeSVG } from 'qrcode.react';
import { DOCEASE_ICON_BASE64, DOCEASE_URL, DOCEASE_BRAND } from '../../constants/branding';

function PoweredByDocEase() {
  return (
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
  );
}

export default function PrintFooter({ doctor, clinic, templateConfig, presetId, contentLeftPx = 40, contentRightPx = 40 }) {
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
          {/* Left: Powered by DocEase + QR */}
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
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
            <PoweredByDocEase />
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
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
              {footer.custom_footer_text && (
                <div style={{ fontStyle: 'italic', marginBottom: '2px' }}>{footer.custom_footer_text}</div>
              )}
              {footer.show_clinic_contact && clinicPhone && <div>Ph: {clinicPhone}</div>}
            </div>
            <PoweredByDocEase />
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
      <div className="print-footer" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Left: Powered by DocEase */}
          <div>
            {footer.custom_footer_text && (
              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontStyle: 'italic' }}>{footer.custom_footer_text}</div>
            )}
            <PoweredByDocEase />
          </div>

          {/* Right: Signature */}
          <div style={{ textAlign: 'right' }}>
            {footer.show_signature_image && signatureUrl && (
              <img src={signatureUrl} alt="Signature" style={{ height: '28px', maxWidth: '80px', objectFit: 'contain', marginLeft: 'auto', marginBottom: '4px' }} />
            )}
            {footer.show_doctor_name && doctorName && (
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#374151' }}>Dr. {doctorName}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderBold() {
    return (
      <div className="print-footer" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
          {/* Left: Powered by DocEase */}
          <div>
            {footer.custom_footer_text && (
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontStyle: 'italic' }}>{footer.custom_footer_text}</div>
            )}
            <PoweredByDocEase />
          </div>

          {/* Right: Signature */}
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

      </div>
    );
  }
}
