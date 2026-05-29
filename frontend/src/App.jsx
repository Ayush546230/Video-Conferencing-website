import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PushApprovePage from './pages/PushApprovePage.jsx';
import Navbar from './components/Navbar.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return children;
}

function FullPageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
      flexDirection: 'column', gap: '16px'
    }}>
      <div className="spinner" style={{ width: 32, height: 32, color: 'var(--gold)' }} />
      <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
        Loading…
      </p>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/dashboard';

  return (
    <AuthProvider>
      <div className="grain">
        {showNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />
          <Route path="/push-approve" element={
            <PublicRoute><PushApprovePage /></PublicRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
