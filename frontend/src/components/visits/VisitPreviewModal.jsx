import { useRef } from 'react';
import VisitPrintContent from './VisitPrintContent';

export default function VisitPreviewModal({
  isOpen,
  onClose,
  data,
  printSettings
}) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const styles = `
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .print-content {
          padding-top: ${printSettings?.top || 280}px;
          padding-left: ${printSettings?.left || 40}px;
          padding-right: 40px;
        }
        h2 { font-size: 18px; font-weight: bold; margin: 0 0 8px 0; }
        h3 { font-size: 14px; font-weight: bold; margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
        p { margin: 0 0 8px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
        th, td { border: 1px solid #666; padding: 4px 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .header-info { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #444; margin-top: 4px; }
        .header-info span { margin-right: 16px; }
        .allergy-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 8px; margin-bottom: 16px; }
        .allergy-box .label { font-weight: bold; color: #b91c1c; }
        .allergy-box .value { color: #dc2626; }
        .vitals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 13px; }
        .signature-section { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ccc; text-align: right; }
        .signature-line { display: inline-block; text-align: center; }
        .signature-line div:first-child { width: 180px; border-bottom: 1px solid #666; margin-bottom: 4px; }
        .signature-line div:last-child { font-size: 12px; color: #666; }
        .section-border { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visit Summary - ${data.patient?.patient_code || 'Patient'}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-gray-900">Visit Preview</h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onClose}
                className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                Skip & Next Patient
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-100">
            {/* A4 Preview Container */}
            <div
              className="bg-white shadow-lg mx-auto"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '100%',
              }}
            >
              <VisitPrintContent
                ref={printRef}
                patient={data.patient}
                vitals={data.vitals}
                symptoms={data.symptoms}
                diagnoses={data.diagnoses}
                observations={data.observations}
                tests={data.tests}
                followUpDate={data.followUpDate}
                medicines={data.medicines}
                prescriptionNotes={data.prescriptionNotes}
                printSettings={printSettings}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
