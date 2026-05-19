import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MatchDetail from './pages/MatchDetail';
import MyPicks from './pages/MyPicks';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [activeLeague, setActiveLeague] = useState('mlb');

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '24px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px' }}>
        <TopNav activeLeague={activeLeague} onLeague={setActiveLeague} />
        <main>
          <Outlet context={{ activeLeague }} />
        </main>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="games" element={<Dashboard />} />
            <Route path="league/:leagueSlug" element={<Dashboard />} />
            <Route path="match/:id" element={<MatchDetail />} />
            <Route path="picks" element={<MyPicks />} />
            <Route path="popular" element={<Dashboard />} />
            <Route path="props" element={<Dashboard />} />
            <Route path="ev" element={<Dashboard />} />
            <Route path="boosts" element={<Dashboard />} />
            <Route path="arbitrage" element={<Dashboard />} />
            <Route path="middle" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
