import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="form-page" style={{ textAlign: 'center' }}>
      <h2>Page not found</h2>
      <p className="muted">That page doesn't exist.</p>
      <Link to="/" className="btn ghost" style={{ marginTop: 16 }}>Go home</Link>
    </div>
  );
}
