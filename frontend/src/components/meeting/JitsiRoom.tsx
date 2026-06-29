import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface Props {
  roomName: string;
  displayName: string;
  onLeave: () => void;
  onEndForAll?: () => void;
  audioMuted?: boolean;
  videoMuted?: boolean;
  isHost?: boolean;
  isPrivate?: boolean;
  jwt?: string;
  skipPrejoin?: boolean;
}

const CustomSpinner = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', width: '100%', background: 'var(--bg)', color: 'var(--text)',
    position: 'absolute', top: 0, left: 0, zIndex: 10
  }}>
    <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px', marginBottom: 24, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 20, height: 20, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Preparing your meeting space...</span>
    </div>
    <style>
      {`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

export default function JitsiRoom({ roomName, displayName, onLeave, onEndForAll, audioMuted = true, videoMuted = false, isHost = false, isPrivate = false, jwt, skipPrejoin = false }: Props) {
  const [isReady, setIsReady] = React.useState(false);
  const [shouldMount, setShouldMount] = React.useState(false);
  const [showEndCallMenu, setShowEndCallMenu] = React.useState(false);
  const isUnloadingRef = React.useRef(false);
  const externalApiRef = React.useRef<any>(null);
  const participantsRef = React.useRef<Set<string>>(new Set());
  const hasJoinedMeetingRef = React.useRef(false);

  React.useEffect(() => {
    const handleUnload = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  React.useEffect(() => {
    const mountTimer = setTimeout(() => {
      setShouldMount(true);
    }, 150);

    // Fallback: hide loader after 10 seconds if event doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsReady(true);
    }, 10000);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="jitsi-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isReady && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', width: '100%', background: 'var(--bg)', color: 'var(--text)',
          position: 'absolute', top: 0, left: 0, zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <img src="/Hi_Logo.png" alt="hi logo" style={{ height: '40px' }} />
            <div className="hide-on-mobile" style={{ width: '1px', height: '50px', background: 'var(--border)' }}></div>
            <img src="/powered_by_aiRender.png" alt="Powered by aiRender" className="hide-on-mobile" style={{ height: '72px' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 20, height: 20, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Preparing your meeting space...</span>
          </div>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: .7; transform: scale(1.05); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      {shouldMount && (
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`${(import.meta as any).env.VITE_JAAS_APP_ID}/${roomName}`}
          jwt={jwt}
          userInfo={{ displayName, email: '' }}
          configOverwrite={{
            startWithAudioMuted: audioMuted,
            startWithVideoMuted: videoMuted,
            prejoinPageEnabled: !skipPrejoin,
            prejoinConfig: { enabled: !skipPrejoin },
            disableModeratorIndicator: true,
            enableInsecureRoomNameWarning: false,
            hideConferenceSubject: false,
            disableDeepLinking: true,
            subject: roomName,
            lobby: {
              enableChat: false
            },
            disableTranscriptionSubtitles: true,
            transcribingEnabled: false,
            toolbarButtons: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'participants-pane', 'tileview',
              'settings', 'fullscreen', 'hangup',
            ],
            // Intercept hangup for host
            ...(isHost ? {
              buttonsWithNotifyClick: [
                {
                  key: 'hangup',
                  preventExecution: true
                }
              ]
            } : {})
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: true,
            BRAND_WATERMARK_LINK: window.location.origin,
            DEFAULT_LOGO_URL: window.location.origin + '/Hi_Logo.png',
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: '#0f0f1a',
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'participants-pane', 'tileview',
              'settings', 'fullscreen', 'hangup',
            ],
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
          onApiReady={(externalApi: any) => {
            externalApiRef.current = externalApi;
            
            // Hide our custom spinner shortly after the API is ready so the user can see the prejoin screen
            setTimeout(() => {
              setIsReady(true);
            }, 800);

            externalApi.addListener('videoConferenceJoined', () => {
              hasJoinedMeetingRef.current = true;
              if (isHost && isPrivate) {
                externalApi.executeCommand('toggleLobby', true);
              }
            });
            externalApi.addListener('videoConferenceLeft', () => {
              if (!isUnloadingRef.current) {
                onLeave();
              }
            });
            externalApi.addListener('toolbarButtonClicked', ({ key }: any) => {
              if (key === 'hangup' && isHost) {
                if (hasJoinedMeetingRef.current) {
                  setShowEndCallMenu(prev => !prev);
                } else {
                  // If host hangs up on prejoin screen, just leave directly
                  onLeave();
                }
              }
            });

            // Track participants to manually kick them if needed (no longer used for aggressive kicking, but kept for future use)
            externalApi.addListener('participantJoined', (participant: any) => {
              if (participant && participant.id) {
                participantsRef.current.add(participant.id);
              }
            });
            externalApi.addListener('participantLeft', (participant: any) => {
              if (participant && participant.id) {
                participantsRef.current.delete(participant.id);
              }
            });
          }}
          onReadyToClose={() => {
            if (!isUnloadingRef.current) {
              onLeave();
            }
          }}
        />
      )}

      {/* Custom Logo Overlay */}
      {isReady && (
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '25px',
          zIndex: 50,
          pointerEvents: 'none'
        }}>
          <img
            src="/Hi_Logo.png"
            alt="hi"
            style={{
              height: '35px',
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
            }}
          />
        </div>
      )}

      {/* Host End Call Menu */}
      {showEndCallMenu && isHost && (
        <div style={{
          position: 'absolute',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideUp 0.2s ease-out'
        }}>
          <button 
            onClick={() => {
              setShowEndCallMenu(false);
              if (externalApiRef.current) {
                externalApiRef.current.executeCommand('hangup');
              }
              // Wait for videoConferenceLeft event to trigger onLeave, but add fallback
              setTimeout(() => {
                if (!isUnloadingRef.current) onLeave();
              }, 500);
            }}
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Leave
          </button>
          <button 
            onClick={() => {
              setShowEndCallMenu(false);
              if (externalApiRef.current) {
                externalApiRef.current.executeCommand('hangup');
              }
              if (onEndForAll) {
                onEndForAll(); // Tell parent to mark meeting as completed
              } else {
                setTimeout(() => { if (!isUnloadingRef.current) onLeave(); }, 500);
              }
            }}
            style={{
              padding: '12px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '15px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            End for all
          </button>
          <button
            onClick={() => setShowEndCallMenu(false)}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              background: '#333',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#444')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#333')}
          >
            ×
          </button>
        </div>
      )}
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
}
