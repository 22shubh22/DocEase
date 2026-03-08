import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { dpdpAPI } from '../../services/api';

function ErasureRequestManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await dpdpAPI.getErasureRequests();
      setRequests(response.data.requests);
    } catch (error) {
      toast.error('Failed to load erasure requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    if (!confirm('This will permanently anonymize the patient\'s personal data. This cannot be undone. Continue?')) return;
    try {
      await dpdpAPI.approveErasure(id);
      toast.success('Erasure completed - patient data anonymized');
      fetchRequests();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to approve erasure');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await dpdpAPI.rejectErasure(id, { reason });
      toast.success('Erasure request rejected');
      fetchRequests();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to reject request');
    }
  };

  const STATUS_COLORS = {
    REQUESTED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Erasure Requests</h3>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No erasure requests</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{req.patient_name || 'Unknown'}</span>
                  <span className="text-gray-500 ml-2 text-sm">({req.patient_code})</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100'}`}>
                  {req.status}
                </span>
              </div>
              {req.reason && <p className="text-sm text-gray-600 mb-2">{req.reason}</p>}
              <div className="text-xs text-gray-500 mb-2">
                Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : '-'}
                {req.completed_at && <> | Completed: {new Date(req.completed_at).toLocaleString()}</>}
              </div>
              {req.anonymized_fields && (
                <p className="text-xs text-gray-500">Anonymized: {req.anonymized_fields.join(', ')}</p>
              )}
              {req.status === 'REQUESTED' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(req.id)} className="btn btn-primary text-sm px-3 py-1.5">
                    Approve & Anonymize
                  </button>
                  <button onClick={() => handleReject(req.id)} className="btn btn-secondary text-sm px-3 py-1.5">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RetentionPolicySettings() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await dpdpAPI.getRetentionPolicy();
        setPolicy(response.data.policy);
      } catch (error) {
        toast.error('Failed to load retention policy');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dpdpAPI.updateRetentionPolicy(policy);
      toast.success('Retention policy updated');
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to update retention policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Retention Policy</h3>
      <p className="text-sm text-gray-500 mb-4">
        Configure how long different types of data are retained
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Data Retention (months)</label>
          <input
            type="number"
            min="1"
            value={policy?.patient_data_retention_months || 120}
            onChange={(e) => setPolicy({ ...policy, patient_data_retention_months: parseInt(e.target.value) })}
            className="input w-32"
          />
          <p className="text-xs text-gray-500 mt-1">Default: 120 months (10 years) for medical records</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audit Log Retention (months)</label>
          <input
            type="number"
            min="1"
            value={policy?.audit_log_retention_months || 60}
            onChange={(e) => setPolicy({ ...policy, audit_log_retention_months: parseInt(e.target.value) })}
            className="input w-32"
          />
          <p className="text-xs text-gray-500 mt-1">Default: 60 months (5 years)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inactive Patient Archive (months)</label>
          <input
            type="number"
            min="1"
            value={policy?.inactive_patient_archive_months || 36}
            onChange={(e) => setPolicy({ ...policy, inactive_patient_archive_months: parseInt(e.target.value) })}
            className="input w-32"
          />
          <p className="text-xs text-gray-500 mt-1">Default: 36 months (3 years)</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </div>
  );
}

function BreachReportManager() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', severity: 'LOW', affected_records_count: '', containment_actions: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await dpdpAPI.getBreachReports();
      setReports(response.data.reports);
    } catch (error) {
      toast.error('Failed to load breach reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form };
      if (data.affected_records_count) data.affected_records_count = parseInt(data.affected_records_count);
      else delete data.affected_records_count;
      if (!data.containment_actions) delete data.containment_actions;

      await dpdpAPI.reportBreach(data);
      toast.success('Breach report created');
      setShowForm(false);
      setForm({ description: '', severity: 'LOW', affected_records_count: '', containment_actions: '' });
      fetchReports();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to create breach report');
    } finally {
      setSubmitting(false);
    }
  };

  const SEVERITY_COLORS = {
    LOW: 'bg-blue-100 text-blue-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Data Breach Reports</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? 'Cancel' : 'Report Breach'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4 bg-red-50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              className="input w-full"
              placeholder="Describe the breach incident..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="input w-full"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affected Records</label>
              <input
                type="number"
                value={form.affected_records_count}
                onChange={(e) => setForm({ ...form, affected_records_count: e.target.value })}
                className="input w-full"
                placeholder="Estimated count"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Containment Actions</label>
            <textarea
              value={form.containment_actions}
              onChange={(e) => setForm({ ...form, containment_actions: e.target.value })}
              rows={2}
              className="input w-full"
              placeholder="Actions taken to contain the breach..."
            />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No breach reports filed</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[r.severity]}`}>
                  {r.severity}
                </span>
                <span className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</span>
              </div>
              <p className="text-sm text-gray-800">{r.description}</p>
              {r.affected_records_count && <p className="text-xs text-gray-500 mt-1">Affected records: {r.affected_records_count}</p>}
              {r.containment_actions && <p className="text-xs text-gray-600 mt-1">Containment: {r.containment_actions}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DpdpSettings() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">DPDP Compliance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage data protection compliance per the Digital Personal Data Protection Act 2023
        </p>
      </div>

      <div className="space-y-8">
        <ErasureRequestManager />
        <hr />
        <RetentionPolicySettings />
        <hr />
        <BreachReportManager />
      </div>
    </div>
  );
}
