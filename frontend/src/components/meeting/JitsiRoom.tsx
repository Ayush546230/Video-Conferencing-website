import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface Props {
  roomName: string;
  displayName: string;
  onLeave: () => void;
  audioMuted?: boolean;
  videoMuted?: boolean;
  isHost?: boolean;
  isPrivate?: boolean;
  jwt?: string;
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

export default function JitsiRoom({ roomName, displayName, onLeave, audioMuted = true, videoMuted = false, isHost = false, isPrivate = false, jwt }: Props) {
  const [isReady, setIsReady] = React.useState(false);
  const [shouldMount, setShouldMount] = React.useState(false);
  const isUnloadingRef = React.useRef(false);

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
            prejoinPageEnabled: true,
            prejoinConfig: { enabled: true },
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
            ]
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
            // Hide our custom spinner shortly after the API is ready so the user can see the prejoin screen
            setTimeout(() => {
              setIsReady(true);
            }, 800);

            externalApi.addListener('videoConferenceJoined', () => {
              if (isHost && isPrivate) {
                externalApi.executeCommand('toggleLobby', true);
              }
            });
            externalApi.addListener('videoConferenceLeft', () => {
              if (!isUnloadingRef.current) {
                onLeave();
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
    </div>
  );
}
