import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function ProfileEditor() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const fileInput = useRef(null);

  const load = async () => {
    const { user, photos } = await api.get('/api/users/me');
    setProfile(user);
    setPhotos(photos);
  };

  useEffect(() => { load().catch((e) => setStatus(e.message)); }, []);

  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setStatus('');
    try {
      const { user, photos } = await api.put('/api/users/me', {
        display_name: profile.display_name,
        age: Number(profile.age),
        gender: profile.gender,
        seeking_gender: profile.seeking_gender,
        location: profile.location || '',
        who_i_am: profile.who_i_am || '',
        who_i_want_to_be: profile.who_i_want_to_be || '',
        what_im_looking_for: profile.what_im_looking_for || '',
      });
      setProfile(user);
      setPhotos(photos);
      setStatus('Saved.');
      refresh();
    } catch (e) {
      setStatus(e.message || 'save failed');
    } finally { setSaving(false); }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const { photos } = await api.upload('/api/users/me/photos', fd);
      setPhotos(photos);
    } catch (e) {
      setStatus(e.message || 'upload failed');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const setPrimary = async (id) => {
    const { photos } = await api.put(`/api/users/me/photos/${id}/primary`);
    setPhotos(photos);
  };

  const remove = async (id) => {
    if (!confirm('Delete this photo?')) return;
    const { photos } = await api.del(`/api/users/me/photos/${id}`);
    setPhotos(photos);
  };

  if (!profile) return <div className="loading">Loading…</div>;

  return (
    <div className="editor page-container">
      <h2>Your profile</h2>

      <section className="photos-editor">
        <h3>Photos</h3>
        <p className="muted">
          Up to 6 photos, 5MB each. The primary photo is what people see first on Explore.
        </p>
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className={`photo-tile ${p.is_primary ? 'is-primary' : ''}`}>
              <img src={`/uploads/${p.filename}`} alt="" />
              <div className="photo-actions">
                {!p.is_primary && (
                  <button className="link-btn" onClick={() => setPrimary(p.id)}>Set primary</button>
                )}
                {p.is_primary && <span className="badge">Primary</span>}
                <button className="link-btn danger" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
          {photos.length < 6 && (
            <label className="photo-tile add">
              <input ref={fileInput} type="file" accept="image/*" onChange={upload} hidden />
              <span>+ Add photo</span>
            </label>
          )}
        </div>
      </section>

      <form className="form" onSubmit={save}>
        <h3>Basics</h3>
        <label>
          <span>Display name</span>
          <input value={profile.display_name} onChange={set('display_name')} required maxLength={60} />
        </label>
        <div className="row">
          <label className="grow">
            <span>Age</span>
            <input type="number" min="18" max="120" value={profile.age} onChange={set('age')} required />
          </label>
          <label className="grow">
            <span>I am</span>
            <select value={profile.gender} onChange={set('gender')}>
              <option value="female">A woman</option>
              <option value="male">A man</option>
              <option value="nonbinary">Nonbinary</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grow">
            <span>Looking for</span>
            <select value={profile.seeking_gender} onChange={set('seeking_gender')}>
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="nonbinary">Nonbinary people</option>
              <option value="any">Anyone</option>
            </select>
          </label>
        </div>
        <label>
          <span>Location</span>
          <input value={profile.location || ''} onChange={set('location')} placeholder="City, State" maxLength={100} />
        </label>

        <h3 className="story-heading">Your Story</h3>
        <p className="muted">Three prompts. Write like a person, not a résumé.</p>

        <label>
          <span>Who I am</span>
          <textarea rows={4} value={profile.who_i_am || ''} onChange={set('who_i_am')} maxLength={2000}
            placeholder="Who you are today — work, habits, small things." />
        </label>
        <label>
          <span>Who I want to be</span>
          <textarea rows={4} value={profile.who_i_want_to_be || ''} onChange={set('who_i_want_to_be')} maxLength={2000}
            placeholder="Where you're growing toward. What you'd want someone to know you're working on." />
        </label>
        <label>
          <span>What I'm looking for</span>
          <textarea rows={4} value={profile.what_im_looking_for || ''} onChange={set('what_im_looking_for')} maxLength={2000}
            placeholder="The kind of person you'd like to meet, and the kind of life you'd like to share." />
        </label>

        {status && <div className={status === 'Saved.' ? 'muted' : 'error'}>{status}</div>}
        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
