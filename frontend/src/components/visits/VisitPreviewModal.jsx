import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import VisitPrintContent from './VisitPrintContent';
import usePrintTemplateStore from '../../store/printTemplateStore';

export default function VisitPreviewModal({
  isOpen,
  onClose,
  data,
  printSettings,
  clinic
}) {
  const printRef = useRef();
  const navigate = useNavigate();
  const { getEffectiveTemplate } = usePrintTemplateStore();
  const printTemplate = getEffectiveTemplate();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups in your browser to print');
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
          height: 100%;
        }
        .print-content {
          background-color: white;
          min-height: 100%;
        }

        /* Multi-page table structure — browser repeats thead/tfoot on every printed page */
        .print-page-table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          margin: 0;
          padding: 0;
        }
        .print-page-table,
        .print-page-table > thead,
        .print-page-table > tfoot,
        .print-page-table > tbody,
        .print-page-table > thead > tr,
        .print-page-table > tfoot > tr,
        .print-page-table > tbody > tr,
        .print-page-table > thead > tr > td,
        .print-page-table > tfoot > tr > td,
        .print-page-table > tbody > tr > td {
          border: none !important;
          padding: 0 !important;
          margin: 0;
          background: none !important;
          overflow: visible;
          vertical-align: top;
        }
        .print-page-table > thead {
          display: table-header-group;
        }
        .print-page-table > tfoot {
          display: table-footer-group;
        }

        /* Prevent content sections from breaking mid-section */
        .print-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .print-section h3 {
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Watermark — fixed position repeats on every printed page */
        .print-watermark {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          pointer-events: none;
          z-index: 0;
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
        .pb-2 { padding-bottom: 0.5rem; }
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
        .text-base { font-size: 1rem; line-height: 1.5rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .font-bold { font-weight: 700; }
        .font-medium { font-weight: 500; }
        .text-gray-900 { color: #111827; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-500 { color: #6b7280; }
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
        .flex-col { flex-direction: column; }
        .flex-shrink-0 { flex-shrink: 0; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .items-center { align-items: center; }
        .items-end { align-items: flex-end; }
        .items-start { align-items: flex-start; }
        .gap-x-4 { column-gap: 1rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-1 { gap: 0.25rem; }
        .inline-block { display: inline-block; }

        /* Grid */
        .grid { display: grid; }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

        /* Table & sizing — scoped to body content so layout table is unaffected */
        .w-full { width: 100%; }
        .w-48 { width: 12rem; }
        .w-8 { width: 2rem; }
        .w-24 { width: 6rem; }
        .border-collapse { border-collapse: collapse; }

        /* Border radius */
        .rounded { border-radius: 0.25rem; }

        /* Scoped element styles for prescription content */
        .print-body-content h2 { font-size: 16px; font-weight: bold; margin: 0 0 4px 0; }
        .print-body-content h3 { font-size: 13px; font-weight: bold; margin: 8px 0 4px 0; padding-bottom: 3px; border-bottom: 1px solid #ccc; }
        .print-body-content p { margin: 0 0 4px 0; font-size: 13px; }
        .print-body-content table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 13px; }
        .print-body-content th, .print-body-content td { border: 1px solid #666; padding: 4px 8px; text-align: left; }
        .print-body-content th { background-color: #f0f0f0; font-weight: bold; }

        /* Print header/footer images */
        .print-header img, .print-footer img {
          display: inline-block;
        }
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

    // Wait for all images to load before printing
    const images = printWindow.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img =>
      img.complete ? Promise.resolve() : new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      })
    );

    // Close window after print completes (or cancel)
    printWindow.onafterprint = () => printWindow.close();

    Promise.all(imagePromises).then(() => {
      setTimeout(() => printWindow.print(), 100);
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDigital = printTemplate?.print_mode === 'digital';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Visit Preview</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isDigital ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {isDigital ? 'Digital Template' : 'Letterhead'}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => { onClose(); navigate('/settings?tab=print-template'); }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Customize print template"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Customize</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
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
                printTemplate={printTemplate}
                clinic={clinic}
                doctor={data.doctor}
                visitDate={data.visitDate}
                visitNumber={data.visitNumber}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
