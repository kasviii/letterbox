import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './MyNotes.css';

const designPresets = {
  midnight: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#e0e0e0' },
  warmth: { bg: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)', color: '#3d3d3d' },
  rain: { bg: 'linear-gradient(135deg, #4b4b4b 0%, #6d6d6d 100%)', color: '#f0f0f0' },
  dawn: { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#4a4a4a' },
  minimal: { bg: '#faf8f5', color: '#2c2825' }
};

const moodMeta = {
  sad: { bg: 'var(--lavender-light)', color: 'var(--lavender-dark)', label: '🌧 sad' },
  hopeful: { bg: 'var(--sage-light)', color: 'var(--sage-dark)', label: '🌱 hopeful' },
  angry: { bg: '#fde8d8', color: '#c87050', label: '🔥 angry' },
  grateful: { bg: 'var(--blush-light)', color: 'var(--blush-dark)', label: '🌸 grateful' },
};

function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function MyNotes({ setCurrentPage, user }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (user) fetchNotes();
    else setIsLoading(false);
  }, [user]);

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const fetched = [];
      snap.forEach(d => fetched.push({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db2 = b.createdAt?.toDate?.() || new Date(0);
        return db2 - da;
      });
      setNotes(fetched);
    } catch (e) {
      console.error('Error fetching notes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note? This can\'t be undone.')) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    } catch (e) {
      console.error('Error deleting:', e);
    }
  };

  const design = selectedNote
    ? designPresets[selectedNote.design] || designPresets.minimal
    : null;

  return (
    <div className="mynotes-page">
      <div className="mynotes-container">
        <button className="back-btn" onClick={() => setCurrentPage('landing')}>← Back</button>

        <div className="mynotes-header">
          <h1 className="mynotes-title">My Notes</h1>
          <p className="mynotes-subtitle">Your notes from the past 30 days</p>
        </div>

        {isLoading ? (
          <div className="skeleton-list">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : selectedNote ? (
          <div className="note-detail-view">
            <button className="detail-back" onClick={() => setSelectedNote(null)}>
              ← Back to list
            </button>

            <div className="note-full-card" style={{ background: design.bg, color: design.color }}>
              <p className="note-full-text">{selectedNote.text}</p>
              <div className="note-full-footer">
                <span>{formatDate(selectedNote.createdAt)}</span>
                {selectedNote.mood && selectedNote.mood !== 'untagged' && moodMeta[selectedNote.mood] && (
                  <span style={{
                    background: moodMeta[selectedNote.mood].bg,
                    color: moodMeta[selectedNote.mood].color,
                    padding: '3px 12px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-ui)'
                  }}>
                    {moodMeta[selectedNote.mood].label}
                  </span>
                )}
              </div>
            </div>

            {/* Flowers */}
            {selectedNote.flowers > 0 && (
              <div className="flowers-received">
                <span className="flowers-received-icon">🌸</span>
                <div className="flowers-received-text">
                  {selectedNote.flowers === 1
                    ? 'Someone left you a flower. They didn\'t need words.'
                    : `${selectedNote.flowers} people left you flowers.`}
                </div>
              </div>
            )}

            {/* Reply */}
            {selectedNote.replyText ? (
              <div className="reply-received-card">
                <div className="reply-received-header">💌 Someone replied to your note</div>
                <div className="reply-received-text">{selectedNote.replyText}</div>
                <div className="reply-received-date">{formatDate(selectedNote.repliedAt)}</div>
              </div>
            ) : selectedNote.openToReply ? (
              <div className="waiting-reply">
                Waiting for a reply... someone will find your words.
              </div>
            ) : null}
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Write something and release it into the world.</p>
            <button className="empty-write-btn" onClick={() => setCurrentPage('write')}>
              Write your first note
            </button>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map(note => {
              const mood = note.mood && moodMeta[note.mood];
              return (
                <div
                  key={note.id}
                  className="note-preview-card"
                  onClick={() => setSelectedNote(note)}
                >
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(note.id, e)}
                    title="Delete note"
                  >
                    ×
                  </button>

                  <div className="note-preview-text">{note.text}</div>

                  <div className="note-preview-meta">
                    <span className="meta-date">{formatDate(note.createdAt)}</span>

                    {mood && (
                      <span
                        className="meta-mood"
                        style={{ background: mood.bg, color: mood.color }}
                      >
                        {mood.label}
                      </span>
                    )}

                    {note.replyText && (
                      <span className="meta-badge badge-reply">💌 Reply received</span>
                    )}

                    {note.flowers > 0 && (
                      <span className="meta-badge badge-flower">
                        🌸 ×{note.flowers}
                      </span>
                    )}

                    {note.openToReply && !note.replyText && (
                      <span className="meta-badge badge-waiting">Waiting for reply</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyNotes;