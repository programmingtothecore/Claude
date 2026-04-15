import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NavBar from './components/NavBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import OnboardingBanner from './components/OnboardingBanner.jsx';
import Landing from './pages/Landing.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import ProfileEditor from './pages/ProfileEditor.jsx';
import Explore from './pages/Explore.jsx';
import ProfileDetail from './pages/ProfileDetail.jsx';
import Connections from './pages/Connections.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (user) return <Navigate to="/explore" replace />;
  return children;
}

function Layout({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  const isChatPage = loc.pathname.startsWith('/chat/');
  return (
    <div className={`app ${user ? 'auth' : ''}`}>
      {user && !isChatPage && <NavBar />}
      {user && !isChatPage && <OnboardingBanner />}
      <main className={`main ${isChatPage ? 'chat-layout' : ''}`}>
        <ErrorBoundary key={loc.pathname}>{children}</ErrorBoundary>
      </main>
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading" style={{ paddingTop: 80 }}>Loading…</div>;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/explore" replace /> : <Landing />} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/me" element={<RequireAuth><ProfileEditor /></RequireAuth>} />
        <Route path="/explore" element={<RequireAuth><Explore /></RequireAuth>} />
        <Route path="/u/:id" element={<RequireAuth><ProfileDetail /></RequireAuth>} />
        <Route path="/connections" element={<RequireAuth><Connections /></RequireAuth>} />
        <Route path="/chat/:userId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
