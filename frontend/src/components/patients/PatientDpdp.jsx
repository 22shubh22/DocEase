import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { dpdpAPI } from '../../services/api';

const CONSENT_PURPOSES = [
  { value: 'TREATMENT', label: 'Medical Treatment', text: 'I consent to the collection and processing of my personal and health data for the purpose of medical treatment and care.' },
  { value: 'DATA_STORAGE', label: 'Data Storage', text: 'I consent to the storage of my personal and health data in the clinic\'s electronic records system.' },
  { value: 'COMMUNICATION', label: 'Communication', text: 'I consent to being contacted via phone/SMS/email for appointment reminders and health updates.' },
];

function ConsentManager({ patientId, patientCode }) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchConsents = async () => {
    try {
      const response = await dpdpAPI.getPatientConsents(patientId);
      setConsents(response.data.consents);
    } catch (error) {
      if (error.response?.status !== 403) toast.error('Failed to load consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsents(); }, [patientId]);

  const handleRecord = async () => {
    if (!selectedPurpose) return;
    const purpose = CONSENT_PURPOSES.find(p => p.value === selectedPurpose);
    setSubmitting(true);
    try {
      await dpdpAPI.createConsent({
        patient_id: patientId,
        purpose: selectedPurpose,
        consent_text: purpose.text,
      });
      toast.success('Consent recorded');
      setShowForm(false);
      setSelectedPurpose('');
      fetchConsents();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to record consent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (consentId) => {
    if (!confirm('Are you sure you want to revoke this consent?')) return;
    try {
      await dpdpAPI.revokeConsent(consentId);
      toast.success('Consent revoked');
      fetchConsents();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to revoke consent');
    }
  };

  if (loading) return <div className="animate-pulse h-16 bg-gray-100 rounded"></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Consent Records</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-sm text-primary-600 hover:text-primary-700">
          {showForm ? 'Cancel' : '+ Record Consent'}
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 mb-3 bg-blue-50 space-y-2">
          <select
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            className="input w-full text-sm"
          >
            <option value="">Select purpose...</option>
            {CONSENT_PURPOSES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {selectedPurpose && (
            <p className="text-xs text-gray-600 italic">
              "{CONSENT_PURPOSES.find(p => p.value === selectedPurpose)?.text}"
            </p>
          )}
          <button onClick={handleRecord} disabled={!selectedPurpose || submitting} className="btn btn-primary text-sm px-3 py-1.5">
            {submitting ? 'Recording...' : 'Record Consent'}
          </button>
        </div>
      )}

      {consents.length === 0 ? (
        <p className="text-sm text-gray-500">No consents recorded</p>
      ) : (
        <div className="space-y-2">
          {consents.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <span className="text-sm font-medium text-gray-800">
                  {CONSENT_PURPOSES.find(p => p.value === c.purpose)?.label || c.purpose}
                </span>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  c.status === 'GIVEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {c.status}
                </span>
                <p className="text-xs text-gray-500">
                  {c.given_at ? new Date(c.given_at).toLocaleDateString() : ''}
                  {c.revoked_at && ` | Revoked: ${new Date(c.revoked_at).toLocaleDateString()}`}
                </p>
              </div>
              {c.status === 'GIVEN' && (
                <button onClick={() => handleRevoke(c.id)} className="text-xs text-red-600 hover:text-red-700">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DataExportButton({ patientId }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await dpdpAPI.exportPatientData(patientId);
      const blob = new Blob([JSON.stringify(response.data.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-data-${patientId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Patient data exported');
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={exporting} className="btn btn-secondary text-sm">
      {exporting ? 'Exporting...' : 'Export Data'}
    </button>
  );
}

function ErasureRequestButton({ patientId, isAnonymized }) {
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    const reason = prompt('Reason for data erasure request (optional):');
    if (reason === null) return; // cancelled
    setRequesting(true);
    try {
      await dpdpAPI.createErasureRequest({ patient_id: patientId, reason: reason || undefined });
      toast.success('Erasure request submitted. The clinic owner will review it.');
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to create erasure request');
    } finally {
      setRequesting(false);
    }
  };

  if (isAnonymized) {
    return <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">Data Anonymized</span>;
  }

  return (
    <button onClick={handleRequest} disabled={requesting} className="btn btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
      {requesting ? 'Requesting...' : 'Request Erasure'}
    </button>
  );
}

export default function PatientDpdp({ patientId, patientCode, isAnonymized }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h2 className="text-xl font-semibold">Data Protection (DPDP)</h2>
        <div className="flex gap-2">
          <DataExportButton patientId={patientId} />
          <ErasureRequestButton patientId={patientId} isAnonymized={isAnonymized} />
        </div>
      </div>
      <ConsentManager patientId={patientId} patientCode={patientCode} />
    </div>
  );
}
