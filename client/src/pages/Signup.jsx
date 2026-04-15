import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', display_name: '',
    age: 25, gender: 'female', seeking_gender: 'male', location: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await signup({ ...form, age: Number(form.age) });
      nav('/me');
    } catch (e) {
      setErr(e.message || 'signup failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="form-page">
      <h2>Create your profile</h2>
      <form className="form" onSubmit={submit}>
        <label>
          <span>Your name</span>
          <input value={form.display_name} onChange={set('display_name')} required maxLength={60} />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
          <small>At least 8 characters.</small>
        </label>
        <div className="row">
          <label className="grow">
            <span>Age</span>
            <input type="number" min="18" max="120" value={form.age} onChange={set('age')} required />
          </label>
          <label className="grow">
            <span>I am</span>
            <select value={form.gender} onChange={set('gender')}>
              <option value="female">A woman</option>
              <option value="male">A man</option>
              <option value="nonbinary">Nonbinary</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grow">
            <span>Looking for</span>
            <select value={form.seeking_gender} onChange={set('seeking_gender')}>
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="nonbinary">Nonbinary people</option>
              <option value="any">Anyone</option>
            </select>
          </label>
        </div>
        <label>
          <span>Location (optional)</span>
          <input value={form.location} onChange={set('location')} placeholder="City, State" maxLength={100} />
        </label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create profile'}
        </button>
        <p className="muted">Already have an account? <Link to="/login">Sign in</Link>.</p>
      </form>
    </div>
  );
}
