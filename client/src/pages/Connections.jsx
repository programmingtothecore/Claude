import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Math.floor(Date.now() / 1000 - Number(ts));
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleDateString();
}

export default function Connections() {
  const [mutual, setMutual] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [a, b] = await Promise.all([
        api.get('/api/connections/mutual'),
        api.get('/api/connections/incoming'),
      ]);
      setMutual(a.connections);
      setIncoming(b.incoming);
    } catch (e) { setErr(e.message || 'failed to load'); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="connections page-container">
      <div className="section-head">
        <h2>Connections</h2>
        <p className="muted">When a Connect is mutual, you can chat.</p>
      </div>
      {err && <div className="error">{err}</div>}

      <section>
        <h3>Chat</h3>
        {mutual.length === 0 ? (
          <p className="muted">No mutual connections yet. Head to <Link to="/explore">Explore</Link>.</p>
        ) : (
          <ul className="conn-list">
            {mutual.map((c) => (
              <li key={c.id}>
                <Link to={`/chat/${c.id}`} className="conn-row">
                  <div className="avatar">
                    {c.primary_photo
                      ? <img src={`/uploads/${c.primary_photo}`} alt="" />
                      : <div className="no-photo small">·</div>}
                  </div>
                  <div className="conn-body">
                    <div className="conn-title">
                      <span>{c.display_name}</span>
                      {c.unread_count > 0 && <span className="unread-pill">{c.unread_count}</span>}
                    </div>
                    <div className="conn-preview">
                      {c.last_message
                        ? <>{c.last_message.slice(0, 80)}{c.last_message.length > 80 ? '…' : ''}</>
                        : <em>Say the first thing.</em>}
                    </div>
                  </div>
                  <div className="conn-time">{relativeTime(c.last_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="exploring-you">
        <h3>Exploring you</h3>
        <p className="muted small">
          People who connected with you. Nothing happens until you connect back.
        </p>
        {incoming.length === 0 ? (
          <p className="muted">Nobody right now.</p>
        ) : (
          <ul className="conn-list">
            {incoming.map((c) => (
              <li key={c.id}>
                <Link to={`/u/${c.id}`} className="conn-row">
                  <div className="avatar">
                    {c.primary_photo
                      ? <img src={`/uploads/${c.primary_photo}`} alt="" />
                      : <div className="no-photo small">·</div>}
                  </div>
                  <div className="conn-body">
                    <div className="conn-title">{c.display_name}, <span className="age">{c.age}</span></div>
                    {c.location && <div className="conn-preview">{c.location}</div>}
                  </div>
                  <div className="conn-time">{relativeTime(c.requested_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
