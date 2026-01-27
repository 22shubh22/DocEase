import { useState } from 'react';

export default function PrescriptionCard({ prescription }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const medicines = prescription.medicines || [];

  return (
    <div className="border rounded-lg bg-gray-50 overflow-hidden">
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {formatDate(prescription.prescription_date)}
          </p>
          <p className="text-sm text-gray-600">
            {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
            {prescription.visit?.diagnosis && (
              <span className="ml-2 text-gray-500">
                • {prescription.visit.diagnosis}
              </span>
            )}
          </p>
        </div>
        <span className="text-gray-400 text-lg">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {expanded && medicines.length > 0 && (
        <div className="border-t bg-white p-3">
          <div className="space-y-2">
            {medicines.map((med, idx) => (
              <div key={med.id || idx} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <div className="font-medium text-gray-900">
                  {idx + 1}. {med.medicine_name}
                </div>
                <div className="text-gray-600 ml-4">
                  {med.dosage && <span>{med.dosage}</span>}
                  {med.frequency && <span> • {med.frequency}</span>}
                  {med.duration && <span> • {med.duration}</span>}
                </div>
                {med.instructions && (
                  <div className="text-gray-500 ml-4 text-xs italic">
                    {med.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
          {prescription.notes && (
            <div className="mt-3 pt-2 border-t text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {prescription.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
