import { useRef, useEffect, useState } from 'react';
import PrintHeader from './PrintHeader';
import PrintFooter from './PrintFooter';
import PrintWatermark from './PrintWatermark';

const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

export default function TemplatePreview({ template, clinic, doctor, mode = 'preview' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const isDigital = template?.print_mode === 'digital';
  const topPx = template?.content_top_px ?? 280;
  const leftPx = template?.content_left_px ?? 40;
  const rightPx = template?.content_right_px ?? 40;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 16;
        setScale(Math.min(1, containerWidth / A4_WIDTH_PX));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div ref={containerRef} className="bg-gray-200 p-2 sm:p-4 rounded-lg overflow-hidden">
      <div
        className="mx-auto"
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX * scale}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="bg-white shadow-lg relative"
          style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, overflow: 'hidden' }}
        >
          {isDigital ? (
            // Digital template mode: show header, footer, watermark
            <div style={{ position: 'relative', height: '100%' }}>
              {/* Watermark layer */}
              {template?.template_config?.watermark?.enabled && (
                <PrintWatermark config={template.template_config.watermark} clinic={clinic} />
              )}

              {/* Content area */}
              <div style={{
                paddingTop: '12px',
                paddingLeft: `${leftPx}px`,
                paddingRight: `${rightPx}px`,
                paddingBottom: '12px',
                position: 'relative',
                zIndex: 1,
              }}>
                <PrintHeader
                  clinic={clinic}
                  doctor={doctor}
                  templateConfig={template?.template_config}
                  presetId={template?.preset_id || 'classic'}
                />

                {/* Sample content */}
                <SamplePrescriptionContent />

                <PrintFooter
                  doctor={doctor}
                  clinic={clinic}
                  templateConfig={template?.template_config}
                  presetId={template?.preset_id || 'classic'}
                />
              </div>
            </div>
          ) : (
            // Letterhead mode: show positioning preview
            <>
              <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none" />
              {/* Letterhead area (top portion - pre-printed) */}
              {topPx > 0 && (
                <div
                  className="absolute bg-blue-50 border-b-2 border-dashed border-blue-300"
                  style={{ top: 0, left: 0, right: 0, height: `${topPx}px` }}
                >
                  <div className="text-center text-xs text-blue-400 mt-2">Pre-printed Letterhead Area</div>
                </div>
              )}
              {/* Print content area */}
              <div
                className="absolute bg-yellow-50 border-2 border-blue-400 opacity-50 transition-all duration-100"
                style={{
                  top: `${topPx}px`,
                  left: `${leftPx}px`,
                  right: `${rightPx}px`,
                  bottom: '40px',
                }}
              >
                <div className="text-center text-xs text-blue-600 mt-2">Print Area</div>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">A4 Preview (210mm x 297mm)</p>
    </div>
  );
}

function SamplePrescriptionContent() {
  return (
    <div style={{ fontSize: '10px', color: '#6b7280' }}>
      {/* Patient header */}
      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>Patient: John Doe</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>ID: PT-0001 | Age: 32 yrs | Gender: Male</div>
        <div style={{ fontSize: '10px' }}>Date: 01 Mar 2026</div>
      </div>

      {/* Sections */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px', marginBottom: '3px' }}>VITALS</div>
        <div>BP: 120/80 | Temp: 98.6F | Pulse: 72 bpm</div>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px', marginBottom: '3px' }}>DIAGNOSIS</div>
        <div>Upper respiratory tract infection</div>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px', marginBottom: '3px' }}>PRESCRIPTION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #d1d5db', padding: '2px 6px', textAlign: 'left' }}>#</th>
              <th style={{ border: '1px solid #d1d5db', padding: '2px 6px', textAlign: 'left' }}>Medicine</th>
              <th style={{ border: '1px solid #d1d5db', padding: '2px 6px', textAlign: 'left' }}>Dosage</th>
              <th style={{ border: '1px solid #d1d5db', padding: '2px 6px', textAlign: 'left' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>1</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>Paracetamol 500mg</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>1-0-1</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>5 days</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>2</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>Azithromycin 250mg</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>0-0-1</td>
              <td style={{ border: '1px solid #d1d5db', padding: '2px 6px' }}>3 days</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
