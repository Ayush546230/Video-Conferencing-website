import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, registerPasskey } = useAuth();
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState('ask'); // 'ask' | 'creating' | 'success' | 'error'
  const [popupError, setPopupError] = useState('');
  const popupIntentRef = useRef(false);

  useEffect(() => {
    if (user && !showPasskeyPopup && !popupIntentRef.current) {
      navigate('/dashboard');
    }
  }, [user, showPasskeyPopup, navigate]);

  const handleGoogleSuccess = () => {
    // If user already has a passkey, go straight to dashboard
    if (user?.authMethods?.passkey) {
      navigate('/dashboard');
      return;
    }
    // Otherwise show create passkey popup
    popupIntentRef.current = true;
    setShowPasskeyPopup(true);
    setPopupStatus('ask');
    setPopupError('');
  };

  const handlePasskeySuccess = () => navigate('/dashboard');

  const handleCreatePasskey = async () => {
    setPopupStatus('creating');
    setPopupError('');
    try {
      await registerPasskey(user.email, user.name, 'My Device');
      setPopupStatus('success');
      setTimeout(() => {
        popupIntentRef.current = false;
        setShowPasskeyPopup(false);
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setPopupError(err?.response?.data?.error || err?.message || 'Failed to create passkey');
      setPopupStatus('error');
    }
  };

  const handleSkipPasskey = () => {
    popupIntentRef.current = false;
    setShowPasskeyPopup(false);
    navigate('/dashboard');
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,150,62,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <div className="card animate-fade-up" style={{ animationDelay: '80ms', display: 'flex', flexDirection: 'column', gap: 20, padding: '40px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Sign In</h2>
          </div>

          <GooglePanel onSuccess={handleGoogleSuccess} clientId={GOOGLE_CLIENT_ID} />
          <PasskeyPanel onSuccess={handlePasskeySuccess} />

          <div className="divider">or</div>

          <PushLoginPanel />
        </div>
      </div>

      {/* ─── Passkey Creation Popup (shown after Google Sign-In) ──── */}
      {showPasskeyPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}>
          <div className="card animate-fade-up" style={{ maxWidth: 420, width: '100%', padding: '40px 32px', textAlign: 'center' }}>

            {popupStatus === 'ask' && (
              <>
                <h3 style={{ fontSize: 22, fontFamily: 'var(--font-display)', marginBottom: 10 }}>Create a Passkey?</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 8, maxWidth: 320, margin: '0 auto 24px' }}>
                  Set up a passkey to sign in faster next time using your fingerprint, face recognition, or device PIN.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={handleCreatePasskey} style={{
                    width: '100%', height: 48, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: 15, fontWeight: 600, borderRadius: 14,
                  }}>
                    Yes, create passkey
                  </button>
                  <PopupFooter onSkip={handleSkipPasskey} onAlready={handleSkipPasskey} />
                </div>
              </>
            )}

            {popupStatus === 'creating' && (
              <div style={{ padding: '20px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36, color: 'var(--gold)' }} />
                <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 12 }}>Follow the prompt on your device...</p>
              </div>
            )}

            {popupStatus === 'success' && (
              <div style={{ padding: '20px 0' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #d4edda 0%, #b7e4c7 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, boxShadow: '0 8px 32px rgba(45,106,79,0.15)',
                }}>
                  
                </div>
                <h3 style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--success)', marginBottom: 8 }}>Passkey Created!</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {popupStatus === 'error' && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}></div>
                <h3 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Could not create passkey</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 20 }}>{popupError}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <button className="btn btn-outline" onClick={() => { setPopupStatus('ask'); setPopupError(''); }} style={{ width: '100%', height: 42, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Try again</button>
                  <PopupFooter onSkip={handleSkipPasskey} onAlready={handleSkipPasskey} />
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}

function PopupFooter({ onSkip, onAlready }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, alignItems: 'center' }}>
      <button onClick={onSkip} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>Skip for now</button>
      <span style={{ color: 'var(--cream-border)', fontSize: 12 }}>|</span>
      <button onClick={onAlready} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Already Created</button>
    </div>
  );
}

// ─── Google Panel ──────────────────────────────────────────
function GooglePanel({ onSuccess, clientId }) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(!!window.google);
  const btnRef = useRef(null);

  useEffect(() => {
    if (window.google) { setGoogleLoaded(true); return; }
    const intervalId = setInterval(() => { if (window.google) { setGoogleLoaded(true); clearInterval(intervalId); } }, 100);
    return () => clearInterval(intervalId);
  }, []);

  const handleCredentialResponse = useCallback(async (response) => {
    setLoading(true); setError('');
    try { await loginWithGoogle(response.credential); onSuccess(); }
    catch (err) { setError(err.response?.data?.error || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  }, [loginWithGoogle, onSuccess]);

  useEffect(() => {
    if (!clientId || !googleLoaded) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse, auto_select: false, cancel_on_tap_outside: true });
    window.google.accounts.id.renderButton(btnRef.current, { type: 'standard', shape: 'rectangular', theme: 'outline', text: 'signin_with', size: 'large', logo_alignment: 'center', width: 320 });
  }, [clientId, handleCredentialResponse, googleLoaded]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {error && <div className="toast toast-error" style={{ width: '320px' }}>{error}</div>}
      {!clientId ? (<div className="toast toast-error">Google OAuth not configured</div>)
        : loading ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}><div className="spinner" /></div>)
        : (<div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }} />)}
    </div>
  );
}

// ─── Passkey Panel ─────────────────────────────────────────
function PasskeyPanel({ onSuccess }) {
  const { loginWithDiscoverablePasskey } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try { await loginWithDiscoverablePasskey(); onSuccess(); }
    catch (err) { setError(err?.response?.data?.error || err?.message || 'No passkey found.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {error && <div className="toast toast-error" style={{ width: '320px', fontSize: 13, lineHeight: 1.4 }}>{error}</div>}
      <button className="btn btn-outline" onClick={handleLogin} disabled={loading} style={{ width: '320px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? <div className="spinner" /> : 'Sign in with Passkey'}
      </button>
    </div>
  );
}

// ─── Push Login Panel ──────────────────────────────────────
// Helper function for VAPID key conversion
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// ─── Push Login Panel ──────────────────────────────────────
function PushLoginPanel() {
  const { initiatePushLogin, checkPushLoginStatus } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('idle'); // 'idle' | 'checking' | 'sending' | 'waiting' | 'approved' | 'denied' | 'expired' | 'error'
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startPolling = (reqId) => {
    setCountdown(120);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          clearInterval(pollRef.current);
          setStep('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await checkPushLoginStatus(reqId);
        if (res.status === 'approved') {
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          setStep('approved');
          setTimeout(() => navigate('/dashboard'), 1200);
        } else if (res.status === 'denied') {
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          setStep('denied');
        } else if (res.status === 'expired') {
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          setStep('expired');
        }
      } catch { /* continue polling */ }
    }, 2000);
  };

  const handleSingleClickLogin = async () => {
    setStep('checking');
    setError('');

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser');
      }

      // 1. Request notification permission on-the-fly
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied. Please allow notifications to use Single Click.');
      }

      // 2. Register Service Worker and wait for it to be ready
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // 3. Clear any existing/stale subscription first to guarantee fresh keys match the server
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // 4. Fetch the fresh VAPID public key and create a new subscription
      const keyRes = await fetch('/api/push-auth/vapid-public-key');
      const { publicKey } = await keyRes.json();

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 4. Directly trigger the login flow using the subscription
      setStep('sending');
      const res = await initiatePushLogin({ subscription: subscription.toJSON() });
      setRequestId(res.requestId);
      setStep('waiting');
      startPolling(res.requestId);
    } catch (err) {
      console.error('Error during push login:', err);
      setError(err?.message || 'Failed to trigger push login.');
      setStep('error');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setStep('idle');
    setError('');
    setRequestId(null);
  };

  if (step === 'idle') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-gold" onClick={handleSingleClickLogin} style={{ width: '320px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          Login with Single Click
        </button>
        <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 280 }}>
          Directly receive a notification to Allow or Deny login instantly
        </p>
      </div>
    );
  }

  if (step === 'checking') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <div className="spinner" style={{ color: 'var(--gold)' }} />
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Initializing notification channel...</p>
      </div>
    );
  }

  if (step === 'sending') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <div className="spinner" style={{ color: 'var(--gold)' }} />
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Sending push notification to your device...</p>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>waiting for user for the input</p>
        <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 500 }}>
          Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
        </div>
        <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>Cancel</button>
      </div>
    );
  }

  if (step === 'approved') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <div style={{ fontSize: 40 }}></div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)' }}>Login Approved!</p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Signing you in...</p>
      </div>
    );
  }

  if (step === 'denied') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <div style={{ fontSize: 40 }}></div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--error)' }}>Login Denied</p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>The request was rejected from your notification.</p>
        <button className="btn btn-outline btn-sm" onClick={handleReset} style={{ marginTop: 8 }}>Try Again</button>
      </div>
    );
  }

  if (step === 'expired') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <div style={{ fontSize: 40 }}></div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold)' }}>Request Expired</p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>The login request timed out. Please try again.</p>
        <button className="btn btn-outline btn-sm" onClick={handleReset} style={{ marginTop: 8 }}>Try Again</button>
      </div>
    );
  }

  // error
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
      <div className="toast toast-error" style={{ width: '320px', fontSize: 13 }}>{error}</div>
      <button className="btn btn-outline btn-sm" onClick={handleReset}>Try Again</button>
    </div>
  );
}
