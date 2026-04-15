import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ProfileCard from '../components/ProfileCard.jsx';

export default function Explore() {
  const [users, setUsers] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async (reset = false) => {
    setLoading(true); setErr('');
    try {
      const c = reset ? 0 : cursor;
      const { users: batch, next_cursor } = await api.get(`/api/explore?cursor=${c}&limit=20`);
      setUsers(reset ? batch : [...users, ...batch]);
      setCursor(next_cursor || 0);
      setDone(!next_cursor);
    } catch (e) { setErr(e.message || 'failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, []);

  return (
    <div className="explore page-container">
      <div className="section-head">
        <h2>Explore</h2>
        <p className="muted">People who match the basics — read their story to learn who they are.</p>
      </div>

      {err && <div className="error">{err}</div>}

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <p>No profiles to show right now.</p>
          <p className="muted">
            Try broadening your <em>Looking for</em> in <a href="/me">your profile</a>, or check back later.
          </p>
        </div>
      )}

      <div className="grid">
        {users.map((u) => <ProfileCard key={u.id} user={u} />)}
      </div>

      <div className="center" style={{ marginTop: 24 }}>
        {!done && users.length > 0 && (
          <button className="btn ghost" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Loading…' : 'Show more'}
          </button>
        )}
        {done && users.length > 0 && <p className="muted">That's everyone for now.</p>}
      </div>
    </div>
  );
}
