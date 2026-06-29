import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useMeetings } from '../context/MeetingContext';
import PreJoinScreen from '../components/meeting/PreJoinScreen';
import JitsiRoom from '../components/meeting/JitsiRoom';
import { API, useAuth } from '../context/AuthContext';

// Initialize socket outside component to avoid reconnects on every render if possible,
// but since we need it connected dynamically, we'll instantiate it inside or use a ref.

export default function MeetingRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const navigate = useNavigate();
  const { userProfile, userPreferences, addToHistory, meetings, loading } = useMeetings();
  const { user, loading: authLoading } = useAuth();
  const joinTime = useRef<number>(Date.now());
  const [roomData, setRoomData] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Post-meeting screen state
  const [hasLeft, setHasLeft] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [skipPrejoin, setSkipPrejoin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?returnUrl=/meeting/${roomName}`);
    }
  }, [authLoading, user, navigate, roomName]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchRoom = async () => {
      try {
        const res = await API.get(`/meetings/room/${roomName}`);
        setRoomData(res.data.meeting);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Meeting not found');
        } else {
          setError('Failed to fetch meeting');
        }
      }
    };

    fetchRoom();
  }, [roomName]);

  // WebSocket Connection for Real-Time Updates
  useEffect(() => {
    if (!roomName) return;
    
    // Connect to the backend WebSocket server
    // Strip '/api' from the URL if it exists so Socket.io connects to the root namespace
    let apiUrl = (import.meta as any).env.VITE_API_URL || '';
    if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.replace(/\/api$/, '');
    }
    
    const socket: Socket = apiUrl
      ? io(apiUrl, { withCredentials: true })
      : io({ withCredentials: true }); // Automatically uses current host and Vite proxies /socket.io

    // Join the specific meeting room channel
    socket.emit('join-room', roomName);

    // Listen for the termination event
    socket.on('meeting-ended', () => {
      setIsEnded(true);
      setTimeLeft(30);
    });

    // Listen for host joining to automatically let guests in
    socket.on('host-joined', () => {
      setRoomData((prev: any) => {
        if (prev) {
          return { ...prev, hostJoined: true };
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [roomName]);

  // Timer for post-meeting and ended screens
  useEffect(() => {
    const showEndedScreen = isEnded || roomData?.status === 'completed';
    if (!hasLeft && !showEndedScreen) return;
    
    if (timeLeft <= 0) {
      navigate('/dashboard');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasLeft, isEnded, roomData?.status, timeLeft, navigate]);

  // When host joins, set hostJoined to true
  useEffect(() => {
    if (roomData && userProfile?.id === roomData.userId && !roomData.hostJoined && roomData.status === 'scheduled') {
      API.put(`/meetings/${roomData.id}`, { hostJoined: true }).catch(console.error);
    }
  }, [roomData?.id, roomData?.userId, roomData?.hostJoined, roomData?.status, userProfile?.id]);

  // Fetch JWT Token for authenticated users
  useEffect(() => {
    if (roomData?.id && userProfile?.id) {
      API.get(`/meetings/room/${roomName}/token`)
        .then(res => setJwtToken(res.data.token))
        .catch(err => {
          console.error('Failed to get JaaS token:', err);
          setJwtToken(''); // fallback to empty
        });
    } else if (roomData && !userProfile?.id) {
      setJwtToken(''); // guests don't get a token
    }
  }, [roomData?.id, userProfile?.id, roomName]);

  if (!roomName) {
    navigate('/');
    return null;
  }

  // If auth is still loading, show a spinner
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 40, height: 40, borderWidth: 3 }}></div>
      </div>
    );
  }

  // If user is not authenticated, render nothing while redirecting
  if (!user) {
    return null;
  }

  // If user is logged in, wait for preferences
  if (loading && userProfile?.id) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading preferences...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)', marginBottom: 8 }}>Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Joining meeting...</div>
      </div>
    );
  }

  if (roomData.status === 'cancelled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)', marginBottom: 8 }}>Meeting Cancelled</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This meeting has been cancelled by the host and is no longer available.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  const showEndedScreen = isEnded || roomData.status === 'completed';
  if (showEndedScreen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
          <div className="hide-on-mobile" style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" className="hide-on-mobile" style={{ height: '72px' }} />
        </div>
        <h2 style={{ color: 'var(--error)', marginBottom: 8 }}>Meeting Ended</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          This meeting has been concluded by the host.<br/>
          Returning to dashboard in <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{timeLeft}</span> seconds...
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/dashboard')}
        >
          Return to Home
        </button>
      </div>
    );
  }

  const isHost = userProfile?.id === roomData.userId;

  if (!isHost && !roomData.hostJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
          <div className="hide-on-mobile" style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" className="hide-on-mobile" style={{ height: '72px' }} />
        </div>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderLeftColor: 'var(--primary)', borderBottomColor: 'var(--primary)', width: 40, height: 40, marginBottom: 24, borderWidth: 3 }}></div>
        <h2 style={{ marginBottom: 8 }}>Waiting for Host</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Please wait, the meeting will start as soon as the host joins.</p>
      </div>
    );
  }

  // If user is authenticated, we MUST wait for the JWT token to be fetched before loading Jitsi.
  // We initialize it to null to represent 'fetching'. If it fails or user is a guest, we set it to empty string.
  if (userProfile?.id && jwtToken === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
          <div className="hide-on-mobile" style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" className="hide-on-mobile" style={{ height: '72px' }} />
        </div>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderLeftColor: 'var(--primary)', borderBottomColor: 'var(--primary)', width: 40, height: 40, marginBottom: 24, borderWidth: 3 }}></div>
        <h2 style={{ marginBottom: 8 }}>Securing connection...</h2>
      </div>
    );
  }

  const handleLeave = () => {
    setHasLeft(true);
    setTimeLeft(30); // reset timer
  };

  const handleEndForAll = async () => {
    if (isHost && roomData) {
      const durationMin = Math.round((Date.now() - joinTime.current) / 60000);
      try {
        await API.put(`/meetings/${roomData.id}`, { status: 'completed', duration: durationMin });
        
        // Also update local context state so history is immediately accurate
        const meeting = meetings.find(m => m.roomName === roomName);
        if (meeting) {
          addToHistory({ ...meeting, duration: durationMin });
        }
      } catch (err) {
        console.error('Failed to update meeting status', err);
      }
      setIsEnded(true);
      setTimeLeft(30);
    }
  };

  if (hasLeft) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
          <div className="hide-on-mobile" style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" className="hide-on-mobile" style={{ height: '72px' }} />
        </div>
        <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>You left the meeting</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Returning to dashboard in <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{timeLeft}</span> seconds...</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Home
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setHasLeft(false);
              setSkipPrejoin(true);
              setTimeLeft(30);
            }}
          >
            Rejoin Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      <JitsiRoom
        roomName={roomName}
        displayName={userProfile?.displayName || 'Guest'}
        onLeave={handleLeave}
        onEndForAll={handleEndForAll}
        audioMuted={!userPreferences?.micDefault}
        videoMuted={!userPreferences?.cameraDefault}
        isHost={isHost}
        isPrivate={roomData.isPrivate}
        jwt={jwtToken || undefined}
        skipPrejoin={skipPrejoin}
      />
    </div>
  );
}
