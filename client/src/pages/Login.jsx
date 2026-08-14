import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(email, password);
      nav('/explore');
    } catch (e) {
      setErr(e.message || 'sign in failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="form-page">
      <h2>Welcome back</h2>
      <form className="form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
        </label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="muted center">New here? <Link to="/signup">Create a profile</Link></p>
        <div className="hint">
          <strong>Try a demo account</strong> &mdash; password: <code>password123</code>
          <br />
          <span className="muted small">
            mira@example.com, daniel@example.com, ayla@example.com, rafael@example.com
          </span>
        </div>
      </form>
    </div>
  );
}
