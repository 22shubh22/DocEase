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
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: Arial, sans-serif;
        }
        /* Padding is set via inline styles on the element - do NOT override here */
        .print-content {
          background-color: white;
        }

        /* Border utilities */
        .border-b-2 { border-bottom: 2px solid #1f2937; }
        .border-b { border-bottom: 1px solid #d1d5db; }
        .border-t { border-top: 1px solid #d1d5db; }
        .border { border: 1px solid #d1d5db; }
        .border-gray-800 { border-color: #1f2937; }
        .border-gray-400 { border-color: #9ca3af; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-red-300 { border-color: #fca5a5; }

        /* Padding utilities */
        .pb-3 { padding-bottom: 0.75rem; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pt-4 { padding-top: 1rem; }
        .p-2 { padding: 0.5rem; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }

        /* Margin utilities */
        .mb-4 { margin-bottom: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-1 { margin-top: 0.25rem; }

        /* Typography */
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .font-bold { font-weight: 700; }
        .text-gray-900 { color: #111827; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .text-red-700 { color: #b91c1c; }
        .text-red-600 { color: #dc2626; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .whitespace-pre-wrap { white-space: pre-wrap; }

        /* Background */
        .bg-white { background-color: white; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .bg-red-50 { background-color: #fef2f2; }

        /* Layout */
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .gap-x-4 { column-gap: 1rem; }
        .gap-2 { gap: 0.5rem; }
        .inline-block { display: inline-block; }

        /* Grid */
        .grid { display: grid; }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

        /* Table & sizing */
        .w-full { width: 100%; }
        .w-48 { width: 12rem; }
        .w-8 { width: 2rem; }
        .w-24 { width: 6rem; }
        .border-collapse { border-collapse: collapse; }

        /* Border radius */
        .rounded { border-radius: 0.25rem; }

        /* Legacy element styles (keep for backward compatibility) */
        h2 { font-size: 18px; font-weight: bold; margin: 0 0 8px 0; }
        h3 { font-size: 14px; font-weight: bold; margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
        p { margin: 0 0 8px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
        th, td { border: 1px solid #666; padding: 4px 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
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
          ${printContent.outerHTML}
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
