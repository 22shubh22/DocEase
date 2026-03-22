import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { notificationAPI } from '../../services/api';

export default function NotificationConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const [authKey, setAuthKey] = useState('');
  const [senderId, setSenderId] = useState('DOCEZE');
  const [reminderDays, setReminderDays] = useState(2);
  const [sendOverdue, setSendOverdue] = useState(true);
  const [sendFollowUp, setSendFollowUp] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await notificationAPI.getConfig();
      const data = res.data;
      setConfig(data);
      setSenderId(data.sender_id || 'DOCEZE');
      setReminderDays(data.reminder_days_before ?? 2);
      setSendOverdue(data.send_overdue ?? true);
      setSendFollowUp(data.send_follow_up ?? true);
    } catch (err) {
      toast.error('Failed to load notification config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        sender_id: senderId,
        reminder_days_before: reminderDays,
        send_overdue: sendOverdue,
        send_follow_up: sendFollowUp,
      };
      if (authKey) {
        payload.msg91_auth_key = authKey;
      }
      const res = await notificationAPI.updateConfig(payload);
      setConfig(res.data);
      setAuthKey('');
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await notificationAPI.sendTest();
      if (res.data.success) {
        toast.success(`Test message sent via ${res.data.channel}`);
      } else {
        toast.error(res.data.error || 'Test message failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send test');
    } finally {
      setTesting(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await notificationAPI.trigger();
      const { vaccination_reminders_sent, follow_up_reminders_sent } = res.data;
      toast.success(
        `Sent ${vaccination_reminders_sent} vaccination + ${follow_up_reminders_sent} follow-up reminders`
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to trigger reminders');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure SMS & WhatsApp reminders for vaccinations and follow-ups via MSG91.
        </p>
      </div>

      {/* MSG91 Configuration */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">MSG91 Setup</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MSG91 Auth Key
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              placeholder={config?.msg91_auth_key_set ? '********** (key is set)' : 'Enter your MSG91 auth key'}
              className="input flex-1"
            />
            {config?.msg91_auth_key_set && (
              <span className="text-xs text-green-600 font-medium whitespace-nowrap">Configured</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Get your auth key from MSG91 dashboard. Required for sending messages.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sender ID (SMS)
          </label>
          <input
            type="text"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            placeholder="DOCEZE"
            className="input w-32"
          />
          <p className="text-xs text-gray-400 mt-1">6-character sender ID for SMS messages.</p>
        </div>
      </div>

      {/* Reminder Preferences */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Reminder Preferences</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Days before due date to send reminder
          </label>
          <input
            type="number"
            value={reminderDays}
            onChange={(e) => setReminderDays(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
            min={0}
            max={7}
            className="input w-20"
          />
          <p className="text-xs text-gray-400 mt-1">
            Send vaccination reminders this many days before the vaccine is due (0-7).
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendOverdue}
            onChange={(e) => setSendOverdue(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Send overdue vaccination reminders</span>
            <p className="text-xs text-gray-400">Weekly reminders for children with overdue vaccines.</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendFollowUp}
            onChange={(e) => setSendFollowUp(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Send follow-up visit reminders</span>
            <p className="text-xs text-gray-400">Remind patients about upcoming follow-up appointments.</p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <button
          onClick={handleTest}
          disabled={testing || !config?.msg91_auth_key_set}
          className="btn btn-secondary"
        >
          {testing ? 'Sending...' : 'Send Test Message'}
        </button>

        <button
          onClick={handleTrigger}
          disabled={triggering || !config?.msg91_auth_key_set}
          className="btn btn-secondary"
        >
          {triggering ? 'Processing...' : 'Send Reminders Now'}
        </button>
      </div>

      {!config?.msg91_auth_key_set && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Setup required:</strong> Enter your MSG91 auth key and save to start sending reminders.
            Messages are sent daily at 9:00 AM automatically once configured.
          </p>
        </div>
      )}
    </div>
  );
}
