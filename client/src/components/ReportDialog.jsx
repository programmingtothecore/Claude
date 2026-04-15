import { useState } from 'react';
import { api } from '../api.js';

const REASONS = [
  { value: 'inappropriate_photo', label: 'Inappropriate photo' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam or fake account' },
  { value: 'underage', label: 'Appears underage' },
  { value: 'fake', label: 'Impersonation or catfishing' },
  { value: 'other', label: 'Other' },
];

export default function ReportDialog({ userId, displayName, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) { setStatus('Please select a reason.'); return; }
    try {
      await api.post('/api/safety/report', { user_id: userId, reason, details });
      setDone(true);
    } catch (e) { setStatus(e.message || 'report failed'); }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3>Report submitted</h3>
            <p className="muted">Thank you. We'll review your report.</p>
            <button className="btn ghost" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h3>Report {displayName}</h3>
            <form className="form" onSubmit={submit}>
              <label><span>Reason</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                  <option value="">Select a reason…</option>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
              <label><span>Details (optional)</span>
                <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
              </label>
              {status && <div className="error">{status}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn danger" type="submit">Submit report</button>
                <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
