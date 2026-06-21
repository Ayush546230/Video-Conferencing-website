import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetings } from '../context/MeetingContext';
import PreJoinScreen from '../components/meeting/PreJoinScreen';
import JitsiRoom from '../components/meeting/JitsiRoom';
import { API } from '../context/AuthContext';

export default function MeetingRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const navigate = useNavigate();
  const { userProfile, userPreferences, addToHistory, meetings, loading } = useMeetings();
  const joinTime = useRef<number>(Date.now());
  const [roomData, setRoomData] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [error, setError] = useState('');

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

    // Poll every 3 seconds if host hasn't joined
    interval = setInterval(() => {
      if (!roomData?.hostJoined && roomData?.status !== 'completed' && roomData?.status !== 'cancelled') {
        fetchRoom();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomName, roomData?.hostJoined, roomData?.status]);

  // When host joins, set hostJoined to true
  useEffect(() => {
    if (roomData && userProfile?.id === roomData.userId && !roomData.hostJoined && roomData.status === 'scheduled') {
      API.put(`/meetings/${roomData.id}`, { hostJoined: true }).catch(console.error);
    }
  }, [roomData, userProfile]);

  // Fetch JWT Token for authenticated users
  useEffect(() => {
    if (roomData && userProfile?.id) {
      API.get(`/meetings/room/${roomName}/token`)
        .then(res => setJwtToken(res.data.token))
        .catch(err => {
          console.error('Failed to get JaaS token:', err);
          setJwtToken(''); // fallback to empty
        });
    } else if (roomData && !userProfile?.id) {
      setJwtToken(''); // guests don't get a token
    }
  }, [roomData, userProfile, roomName]);

  if (!roomName) {
    navigate('/');
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

  if (roomData.status === 'completed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>Meeting Ended</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This meeting has already concluded.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  const isHost = userProfile?.id === roomData.userId;

  if (!isHost && !roomData.hostJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
          <div style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" style={{ height: '72px' }} />
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
          <div style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
          <img src="/powered_by_aiRender.png" alt="Powered by aiRender" style={{ height: '72px' }} />
        </div>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderLeftColor: 'var(--primary)', borderBottomColor: 'var(--primary)', width: 40, height: 40, marginBottom: 24, borderWidth: 3 }}></div>
        <h2 style={{ marginBottom: 8 }}>Securing connection...</h2>
      </div>
    );
  }

  const handleLeave = async () => {
    if (isHost) {
      const durationMin = Math.round((Date.now() - joinTime.current) / 60000);
      const meeting = meetings.find(m => m.roomName === roomName);
      if (meeting) {
        await addToHistory({ ...meeting, duration: durationMin });
      }
    }
    navigate('/');
  };

  return (
    <div className="meeting-room">
      <JitsiRoom
        roomName={roomName}
        displayName={userProfile?.displayName || 'Guest'}
        onLeave={handleLeave}
        audioMuted={!userPreferences?.micDefault}
        videoMuted={!userPreferences?.cameraDefault}
        isHost={isHost}
        isPrivate={roomData.isPrivate}
        jwt={jwtToken || undefined}
      />
    </div>
  );
}
