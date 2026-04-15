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
      <h2>Sign in</h2>
      <form className="form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted">New here? <Link to="/signup">Create a profile</Link>.</p>
        <p className="hint">
          Demo accounts (password <code>password123</code>):
          <br />
          <code>mira@example.com</code>, <code>daniel@example.com</code>, <code>ayla@example.com</code>, <code>rafael@example.com</code>, and more — see <code>server/seed.js</code>.
        </p>
      </form>
    </div>
  );
}
