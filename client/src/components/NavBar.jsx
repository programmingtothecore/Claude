import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { disconnectSocket } from '../socket.js';
import { useUnread } from '../hooks/useUnread.js';

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const unread = useUnread();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    nav('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/explore" className="brand">Connect &amp; Explore</NavLink>
        <nav className="nav-links">
          <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}>Explore</NavLink>
          <NavLink to="/connections" className={({ isActive }) => isActive ? 'active' : ''}>
            Connections
            {unread > 0 && <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>}
          </NavLink>
          <NavLink to="/me" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>
        </nav>
        <div className="nav-right">
          <span className="nav-who">{user?.display_name}</span>
          <button className="link-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
