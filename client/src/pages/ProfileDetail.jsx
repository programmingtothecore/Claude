import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import PhotoCarousel from '../components/PhotoCarousel.jsx';
import ConnectButton from '../components/ConnectButton.jsx';
import StoryBlock from '../components/StoryBlock.jsx';
import ReportDialog from '../components/ReportDialog.jsx';

export default function ProfileDetail() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blockDone, setBlockDone] = useState(false);

  const load = async () => {
    try {
      setData(await api.get(`/api/users/${id}`));
    } catch (e) { setErr(e.message || 'failed to load profile'); }
  };

  useEffect(() => { load(); }, [id]);

  if (err) return <div className="page-container"><div className="error">{err}</div></div>;
  if (!data) return <div className="loading">Loading…</div>;
  if (blockDone) return (
    <div className="page-container">
      <p className="muted">User blocked. <Link to="/explore">Back to Explore</Link>.</p>
    </div>
  );

  const { user, photos, connection_status } = data;
  const isSelf = me?.id === user.id;

  const handleBlock = async () => {
    if (!confirm(`Block ${user.display_name}? They won't appear in your Explore and you won't appear in theirs.`)) return;
    try {
      await api.post('/api/safety/block', { user_id: user.id });
      setBlockDone(true);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="detail page-container">
      <div className="detail-topbar">
        <Link to="/explore" className="back">← Explore</Link>
        {!isSelf && (
          <div className="more-menu-wrap">
            <button className="link-btn more-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="More options">⋯</button>
            {menuOpen && (
              <div className="more-menu">
                <button onClick={() => { setMenuOpen(false); setShowReport(true); }}>Report</button>
                <button className="danger" onClick={() => { setMenuOpen(false); handleBlock(); }}>Block</button>
              </div>
            )}
          </div>
        )}
      </div>

      <PhotoCarousel photos={photos} />

      <header className="detail-header">
        <h1>{user.display_name}, <span className="age">{user.age}</span></h1>
        {user.location && <div className="loc">{user.location}</div>}
      </header>

      {!isSelf && (
        <ConnectButton
          userId={user.id}
          status={connection_status}
          onChange={(s) => setData({ ...data, connection_status: s })}
        />
      )}

      <div className="stories">
        <StoryBlock label="Who I am" text={user.who_i_am} />
        <StoryBlock label="Who I want to be" text={user.who_i_want_to_be} />
        <StoryBlock label="What I'm looking for" text={user.what_im_looking_for} />
      </div>

      {showReport && (
        <ReportDialog
          userId={user.id}
          displayName={user.display_name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
