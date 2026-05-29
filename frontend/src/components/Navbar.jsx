import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(245, 240, 232, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--cream-border)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 500,
            color: 'var(--ink)', letterSpacing: '-0.02em',
          }}>
            Auth<span style={{ color: 'var(--gold)' }}>Craft</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
                {user.avatar && (
                  <img
                    src={user.avatar} alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--gold-pale)' }}
                  />
                )}
                <span style={{ fontSize: 14, color: 'var(--ink-soft)', display: 'none' }}
                  className="nav-name">
                  {user.name?.split(' ')[0]}
                </span>
              </div>
              <Link to="/dashboard">
                <button className="btn btn-ghost btn-sm" style={{
                  color: location.pathname === '/dashboard' ? 'var(--ink)' : 'var(--ink-muted)'
                }}>
                  Dashboard
                </button>
              </Link>
              <button className="btn btn-outline btn-sm" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/">
                <button className="btn btn-ghost btn-sm" style={{
                  color: location.pathname === '/' ? 'var(--ink)' : 'var(--ink-muted)'
                }}>
                  Home
                </button>
              </Link>
              <Link to="/login">
                <button className="btn btn-primary btn-sm">
                  Sign in
                </button>
              </Link>
            </>
          )}
        </nav>
      </div>

      <style>{`
        @media (min-width: 480px) { .nav-name { display: block !important; } }
      `}</style>
    </header>
  );
}
