import { Link } from 'react-router-dom';

export default function ProfileCard({ user }) {
  return (
    <Link to={`/u/${user.id}`} className="profile-card">
      <div className="profile-card-photo">
        {user.primary_photo ? (
          <img src={`/uploads/${user.primary_photo}`} alt={user.display_name} />
        ) : (
          <div className="no-photo">No photo</div>
        )}
      </div>
      <div className="profile-card-meta">
        <h3>{user.display_name}, <span className="age">{user.age}</span></h3>
        {user.location && <div className="loc">{user.location}</div>}
      </div>
    </Link>
  );
}
