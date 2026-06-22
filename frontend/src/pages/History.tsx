import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, Search, Trash2, Copy, Calendar } from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';
import { formatDate, formatDuration, getRelativeTime } from '../utils/dateUtils';
import { copyToClipboard } from '../utils/meetingUtils';

export default function History() {
  const { meetings, deleteMeeting } = useMeetings();
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
            <div key={m.id} className="history-item">
              <div className={`history-icon ${m.status === 'completed' ? '' : ''}`}>
                <Video size={20} />
              </div>
              <div className="history-details">
                <h4>{m.title}</h4>
                <p>{formatDate(m.startTime)} • 👥 {m.participants.length}</p>
                {m.description && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {m.description.length <= 50 ? (
                      <span style={{ wordBreak: 'break-word' }}>{m.description}</span>
                    ) : expandedDescId === m.id ? (
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '4.8em', overflowY: 'auto', paddingRight: 4 }}>
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
                        {m.description.slice(0, 50)}...
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
              <div className="history-right">
                <div className="history-meta">
                  {typeof m.duration === 'number' && <div className="duration">{formatDuration(m.duration)}</div>}
                  <div className="time">{getRelativeTime(m.createdAt)}</div>
                </div>
                <div className="history-actions" style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-green btn-sm btn-icon" onClick={() => navigate(`/meeting/${m.roomName}`)} title="Join">
                    <Video size={16} />
                  </button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={async () => { await copyToClipboard(m.link); showToast('Link copied!'); }} title="Copy link">
                    <Copy size={16} />
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMeeting(m.id)} title="Delete" style={{ color: 'var(--accent-red)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
