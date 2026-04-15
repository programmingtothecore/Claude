import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { disconnectSocket } from '../socket.js';

export default function Settings() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();

  // Preferences
  const [prefs, setPrefs] = useState({ seeking_age_min: 18, seeking_age_max: 60 });
  const [prefStatus, setPrefStatus] = useState('');

  // Password change
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState(null);
  const [forgotStatus, setForgotStatus] = useState('');

  // Reset password
  const [reset, setReset] = useState({ token: '', new_password: '', confirm: '' });
  const [resetStatus, setResetStatus] = useState('');

  // Delete account
  const [delPw, setDelPw] = useState('');
  const [delConfirm, setDelConfirm] = useState(false);
  const [delStatus, setDelStatus] = useState('');

  // Blocks list
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (user) setPrefs({ seeking_age_min: user.seeking_age_min ?? 18, seeking_age_max: user.seeking_age_max ?? 60 });
    api.get('/api/safety/blocks').then(({ blocks }) => setBlocks(blocks)).catch(() => {});
  }, [user?.id]);

  const savePrefs = async (e) => {
    e.preventDefault(); setPrefStatus('');
    try {
      await api.put('/api/users/me', {
        seeking_age_min: Number(prefs.seeking_age_min),
        seeking_age_max: Number(prefs.seeking_age_max),
      });
      await refresh();
      setPrefStatus('Saved.');
    } catch (e) { setPrefStatus(e.message); }
  };

  const changePw = async (e) => {
    e.preventDefault(); setPwStatus('');
    if (pw.new_password !== pw.confirm) { setPwStatus('Passwords do not match.'); return; }
    try {
      await api.post('/api/account/change-password', { current_password: pw.current_password, new_password: pw.new_password });
      setPw({ current_password: '', new_password: '', confirm: '' });
      setPwStatus('Password changed.');
    } catch (e) { setPwStatus(e.message); }
  };

  const requestForgot = async (e) => {
    e.preventDefault(); setForgotStatus(''); setForgotResult(null);
    try {
      const res = await api.post('/api/account/forgot-password', { email: forgotEmail });
      setForgotResult(res);
      setForgotStatus('');
    } catch (e) { setForgotStatus(e.message); }
  };

  const doReset = async (e) => {
    e.preventDefault(); setResetStatus('');
    if (reset.new_password !== reset.confirm) { setResetStatus('Passwords do not match.'); return; }
    try {
      await api.post('/api/account/reset-password', { token: reset.token, new_password: reset.new_password });
      setResetStatus('Password reset! You can now sign in.');
      setReset({ token: '', new_password: '', confirm: '' });
    } catch (e) { setResetStatus(e.message); }
  };

  const unblock = async (userId) => {
    await api.del(`/api/safety/block/${userId}`);
    setBlocks((prev) => prev.filter((b) => b.id !== userId));
  };

  const deleteAccount = async (e) => {
    e.preventDefault(); setDelStatus('');
    try {
      await api.post('/api/account/delete', { password: delPw });
      disconnectSocket();
      logout();
      nav('/');
    } catch (e) { setDelStatus(e.message); }
  };

  return (
    <div className="settings page-container">
      <h2>Settings</h2>

      {/* ── Age range preferences ─────────────────────────── */}
      <section className="settings-section">
        <h3>Explore preferences</h3>
        <form className="form" onSubmit={savePrefs}>
          <div className="row">
            <label className="grow">
              <span>Min age</span>
              <input type="number" min="18" max="120"
                value={prefs.seeking_age_min}
                onChange={(e) => setPrefs({ ...prefs, seeking_age_min: e.target.value })} />
            </label>
            <label className="grow">
              <span>Max age</span>
              <input type="number" min="18" max="120"
                value={prefs.seeking_age_max}
                onChange={(e) => setPrefs({ ...prefs, seeking_age_max: e.target.value })} />
            </label>
          </div>
          {prefStatus && <div className={prefStatus === 'Saved.' ? 'muted' : 'error'}>{prefStatus}</div>}
          <button className="btn primary" type="submit">Save preferences</button>
        </form>
      </section>

      {/* ── Change password ───────────────────────────────── */}
      <section className="settings-section">
        <h3>Change password</h3>
        <form className="form" onSubmit={changePw}>
          <label><span>Current password</span>
            <input type="password" value={pw.current_password}
              onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required />
          </label>
          <label><span>New password</span>
            <input type="password" value={pw.new_password}
              onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required minLength={8} />
          </label>
          <label><span>Confirm new password</span>
            <input type="password" value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          </label>
          {pwStatus && <div className={pwStatus === 'Password changed.' ? 'muted' : 'error'}>{pwStatus}</div>}
          <button className="btn ghost" type="submit">Update password</button>
        </form>
      </section>

      {/* ── Forgot password ───────────────────────────────── */}
      <section className="settings-section">
        <h3>Forgot password</h3>
        <p className="muted small">
          Enter your email to get a reset token. In a real deployment this would be emailed to you.
          For this demo the token is shown inline.
        </p>
        <form className="form" onSubmit={requestForgot}>
          <label><span>Email</span>
            <input type="email" value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)} required />
          </label>
          {forgotStatus && <div className="error">{forgotStatus}</div>}
          <button className="btn ghost" type="submit">Request reset token</button>
        </form>
        {forgotResult && (
          <div className="hint" style={{ marginTop: 12 }}>
            <strong>Token:</strong> <code>{forgotResult.token}</code>
            <br /><span className="muted small">{forgotResult.message}</span>
          </div>
        )}

        <h4 style={{ marginTop: 24 }}>Use a reset token</h4>
        <form className="form" onSubmit={doReset}>
          <label><span>Reset token</span>
            <input value={reset.token} onChange={(e) => setReset({ ...reset, token: e.target.value })} required />
          </label>
          <label><span>New password</span>
            <input type="password" value={reset.new_password}
              onChange={(e) => setReset({ ...reset, new_password: e.target.value })} required minLength={8} />
          </label>
          <label><span>Confirm new password</span>
            <input type="password" value={reset.confirm}
              onChange={(e) => setReset({ ...reset, confirm: e.target.value })} required />
          </label>
          {resetStatus && <div className={resetStatus.includes('reset!') ? 'muted' : 'error'}>{resetStatus}</div>}
          <button className="btn ghost" type="submit">Reset password</button>
        </form>
      </section>

      {/* ── Blocked users ─────────────────────────────────── */}
      <section className="settings-section">
        <h3>Blocked people</h3>
        {blocks.length === 0
          ? <p className="muted">You haven't blocked anyone.</p>
          : (
            <ul className="block-list">
              {blocks.map((b) => (
                <li key={b.id} className="block-row">
                  <div className="avatar small">
                    {b.primary_photo
                      ? <img src={`/uploads/${b.primary_photo}`} alt="" />
                      : <div className="no-photo small">·</div>}
                  </div>
                  <span className="block-name">{b.display_name}</span>
                  <button className="link-btn" onClick={() => unblock(b.id)}>Unblock</button>
                </li>
              ))}
            </ul>
          )}
      </section>

      {/* ── Delete account ────────────────────────────────── */}
      <section className="settings-section danger-zone">
        <h3>Delete account</h3>
        <p className="muted small">
          Permanently removes your profile, photos, connections and messages. This cannot be undone.
        </p>
        {!delConfirm
          ? <button className="btn danger" onClick={() => setDelConfirm(true)}>Delete my account</button>
          : (
            <form className="form" onSubmit={deleteAccount}>
              <p className="error">Enter your password to confirm deletion.</p>
              <label><span>Password</span>
                <input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} required autoFocus />
              </label>
              {delStatus && <div className="error">{delStatus}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn danger" type="submit">Yes, delete everything</button>
                <button className="btn ghost" type="button" onClick={() => setDelConfirm(false)}>Cancel</button>
              </div>
            </form>
          )}
      </section>
    </div>
  );
}
