import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function ConnectButton({ userId, status, onChange }) {
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (status === 'self') return null;

  const handleConnect = async () => {
    setBusy(true);
    try {
      const res = await api.post('/api/connections', { to_user_id: userId });
      onChange?.(res.connection_status);
    } finally { setBusy(false); }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    try {
      const res = await api.del(`/api/connections/${userId}`);
      onChange?.(res.connection_status);
    } finally { setBusy(false); }
  };

  const handleChat = () => nav(`/chat/${userId}`);

  if (status === 'mutual') {
    return (
      <div className="connect-row">
        <button className="btn primary" onClick={handleChat}>Connected — say hi</button>
        <button className="btn ghost subtle" disabled={busy} onClick={handleWithdraw}>Disconnect</button>
      </div>
    );
  }
  if (status === 'outgoing_pending') {
    return (
      <button className="btn pending" disabled={busy} onClick={handleWithdraw}>
        Connect requested — tap to withdraw
      </button>
    );
  }
  if (status === 'incoming_pending') {
    return (
      <button className="btn primary" disabled={busy} onClick={handleConnect}>
        Connect back
      </button>
    );
  }
  return (
    <button className="btn primary" disabled={busy} onClick={handleConnect}>
      Connect
    </button>
  );
}
