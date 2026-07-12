import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, Search, Trash2, Copy, Calendar } from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDuration, getRelativeTime } from '../utils/dateUtils';
import { copyToClipboard } from '../utils/meetingUtils';

export default function History() {
  const { meetings, deleteMeeting } = useMeetings();
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

  const allMeetings = meetings.filter(m => {
    const s = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(s) ||
      (m.description && m.description.toLowerCase().includes(s)) ||
      m.id.toLowerCase().includes(s)
    );
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="history-page" id="history-page">
      <h1 style={{ marginBottom: 8 }}>Meeting History</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        View and manage your past and upcoming meetings
      </p>

      <div className="history-filters">
        <div className="join-input history-search">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {allMeetings.length === 0 ? (
        <div className="empty-state">
          <Calendar size={64} />
          <h3>No meetings found</h3>
          <p>{search ? 'Try a different search term' : 'Your meeting history will appear here'}</p>
        </div>
      ) : (
        <div className="history-list">
          {allMeetings.map(m => (
            <div key={m.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                <div className={`history-icon ${m.status === 'completed' ? '' : ''}`} style={{ flexShrink: 0 }}>
                  <Video size={20} />
                </div>
                <div className="history-details" style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.3', marginBottom: '4px' }}>{m.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {formatDate(m.startTime)} • 👥 {m.participants.length} 
                    <span className="hide-on-mobile">
                      {typeof m.duration === 'number' ? ` • ⏱️ ${formatDuration(m.duration)}` : ''}
                    </span>
                    <span style={{ opacity: 0.7 }}> • {getRelativeTime(m.createdAt)}</span>
                  </p>
                </div>
                <div className="history-right" style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <button className="btn btn-green btn-sm btn-icon" onClick={() => navigate(`/meeting/${m.roomName}`)} title="Join">
                    <Video size={16} />
                  </button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={async () => { await copyToClipboard(m.link); showToast('Link copied!'); }} title="Copy link">
                    <Copy size={16} />
                  </button>
                  {(!m.userId || m.userId === user?.id) && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMeeting(m.id)} title="Delete" style={{ color: 'var(--accent-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {m.description && (
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
                  {m.description.length <= 80 ? (
                    <span style={{ wordBreak: 'break-word' }}>{m.description}</span>
                  ) : expandedDescId === m.id ? (
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '10em', overflowY: 'auto', paddingRight: 4 }}>
                      {m.description}
                      <span 
                        style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: 8, fontWeight: 500, whiteSpace: 'nowrap' }}
                        onClick={() => setExpandedDescId(null)}
                      >
                        show less
                      </span>
                    </div>
                  ) : (
                    <span style={{ wordBreak: 'break-word' }}>
                      {m.description.slice(0, 80)}...
                      <span 
                        style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: 8, fontWeight: 500, whiteSpace: 'nowrap' }}
                        onClick={() => setExpandedDescId(m.id)}
                      >
                        see more
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

          ))}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
