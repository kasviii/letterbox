import React, { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs,
  doc, updateDoc, addDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from '../firebase';
import './Receive.css';

const designPresets = {
  midnight: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#e0e0e0' },
  warmth: { bg: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)', color: '#3d3d3d' },
  rain: { bg: 'linear-gradient(135deg, #4b4b4b 0%, #6d6d6d 100%)', color: '#f0f0f0' },
  dawn: { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#4a4a4a' },
  minimal: { bg: '#faf8f5', color: '#2c2825' }
};

const moodColors = {
  sad: { bg: 'var(--lavender-light)', color: 'var(--lavender-dark)', label: '🌧 sad' },
  hopeful: { bg: 'var(--sage-light)', color: 'var(--sage-dark)', label: '🌱 hopeful' },
  angry: { bg: '#fde8d8', color: '#c87050', label: '🔥 angry' },
  grateful: { bg: 'var(--blush-light)', color: 'var(--blush-dark)', label: '🌸 grateful' },
  untagged: { bg: 'var(--parchment)', color: 'var(--ink-muted)', label: '✦ untagged' },
};

// Random positions for floating envelopes, spaced out
function getPositions(count) {
  const positions = [];
  const cols = Math.min(count, 5);
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      left: 5 + (col / (cols - 1 || 1)) * 80 + (Math.random() * 6 - 3),
      top: 10 + row * 45 + (Math.random() * 10 - 5),
      rotation: Math.random() * 20 - 10,
      animDuration: 5 + Math.random() * 4,
      animDelay: Math.random() * 3,
    });
  }
  return positions;
}

function Receive({ setCurrentPage, user }) {
  const [letters, setLetters] = useState([]);
  const [positions, setPositions] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [flowerSent, setFlowerSent] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'reply' | 'flower' | 'pass' }

  useEffect(() => {
    if (!currentNote) fetchLetters();
  }, [currentNote]);

  const fetchLetters = async () => {
    try {
      const q = query(collection(db, 'notes'), where('hasBeenRead', '==', false));
      const snap = await getDocs(q);
      const notes = [];
      snap.forEach(d => {
        const data = d.data();
        // Filter out user's own notes
        if (data.userId !== user?.uid) {
          notes.push({ id: d.id, ...data });
        }
      });
      const shuffled = notes.sort(() => Math.random() - 0.5).slice(0, 10);
      setLetters(shuffled);
      setPositions(getPositions(shuffled.length));
    } catch (e) {
      console.error('Error fetching letters:', e);
    }
  };

  const openLetter = async (letter) => {
    try {
      await updateDoc(doc(db, 'notes', letter.id), { hasBeenRead: true });
      if (letter.returnToCirculation) {
        await addDoc(collection(db, 'notes'), {
          text: letter.text,
          mood: letter.mood,
          design: letter.design,
          openToReply: letter.openToReply,
          returnToCirculation: true,
          userId: letter.userId,
          createdAt: serverTimestamp(),
          hasBeenRead: false,
          replyText: null,
          flowers: 0,
        });
      }
      setCurrentNote(letter);
      setFlowerSent(false);
      setReplySent(false);
      setReplyText('');
    } catch (e) {
      console.error('Error opening letter:', e);
    }
  };

  const sendFlower = async () => {
    try {
      await updateDoc(doc(db, 'notes', currentNote.id), {
        flowers: increment(1),
      });
      setFlowerSent(true);
      setConfirm(null);
    } catch (e) {
      console.error('Error sending flower:', e);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await updateDoc(doc(db, 'notes', currentNote.id), {
        replyText: replyText.trim(),
        repliedAt: serverTimestamp(),
      });
      setReplySent(true);
      setConfirm(null);
    } catch (e) {
      console.error('Error sending reply:', e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const passItOn = async () => {
    try {
      await addDoc(collection(db, 'notes'), {
        text: currentNote.text,
        mood: currentNote.mood,
        design: currentNote.design,
        openToReply: currentNote.openToReply,
        returnToCirculation: true,
        userId: currentNote.userId,
        createdAt: serverTimestamp(),
        hasBeenRead: false,
        replyText: null,
        flowers: 0,
      });
      setConfirm(null);
      setCurrentNote(null);
    } catch (e) {
      console.error('Error passing on note:', e);
    }
  };

  const design = currentNote ? designPresets[currentNote.design] || designPresets.minimal : null;
  const mood = currentNote ? moodColors[currentNote.mood] || moodColors.untagged : null;

  return (
    <div className="receive-page">
      <div className="receive-container">
        <button className="back-btn" onClick={() => {
          setCurrentNote(null);
          setCurrentPage('landing');
        }}>
          ← Back
        </button>

        {!currentNote ? (
          <div className="floating-view">
            <div className="receive-header">
              <h1 className="receive-title">Reach out and grab a letter.</h1>
              <p className="receive-subtitle">Someone left these for a stranger. Maybe for you.</p>
            </div>

            {letters.length === 0 ? (
              <div className="no-letters">
                <div className="no-letters-icon">📭</div>
                <h3>No letters today</h3>
                <p>Be the first to leave one.</p>
                <button className="no-letters-btn" onClick={() => setCurrentPage('write')}>
                  Write a note
                </button>
              </div>
            ) : (
              <div className="letters-stage">
                {letters.map((letter, i) => {
                  const pos = positions[i] || { left: 20 + i * 10, top: 20, rotation: 0, animDuration: 6, animDelay: 0 };
                  const moodKey = letter.mood || 'untagged';
                  return (
                    <div
                      key={letter.id}
                      className="floating-letter"
                      style={{
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        animationDelay: `${pos.animDelay}s`,
                      }}
                      onClick={() => openLetter(letter)}
                    >
                      <div
                        className="envelope-wrapper"
                        style={{
                          transform: `rotate(${pos.rotation}deg)`,
                          animation: `float ${pos.animDuration}s ease-in-out ${pos.animDelay}s infinite`,
                        }}
                      >
                        <svg className="envelope-svg" viewBox="0 0 72 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="72" height="52" rx="5" fill="#f5f2ee"/>
                          <rect width="72" height="52" rx="5" fill="white" fillOpacity="0.6"/>
                          <path d="M2 3L36 30L70 3" stroke="#c8b4c8" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M2 3H70L36 30L2 3Z" fill="#e8d8e8" fillOpacity="0.5"/>
                          <rect x="1" y="1" width="70" height="50" rx="4" stroke="#d8c8d8" strokeWidth="1.5"/>
                        </svg>
                        <div className={`envelope-mood-dot mood-dot-${moodKey}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="note-display-view">
            <div className="note-display-eyebrow">You opened a letter ✦</div>

            <div className="note-card" style={{ background: design.bg, color: design.color }}>
              <p className="note-card-text">{currentNote.text}</p>
              <div className="note-card-footer">
                {currentNote.mood && currentNote.mood !== 'untagged' && (
                  <span className="note-mood-tag" style={{ background: mood.bg, color: mood.color }}>
                    {mood.label}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
                  {currentNote.openToReply ? '💌 open to reply' : ''}
                </span>
              </div>
            </div>

            {/* Reactions */}
            <div className="reaction-row">
              {/* Flower */}
              <div
                className={`flower-card ${flowerSent ? 'sent' : ''}`}
                onClick={() => !flowerSent && setConfirm('flower')}
              >
                <span className="flower-emoji">🌸</span>
                <div className="flower-label">
                  {flowerSent ? 'Flower sent ✓' : 'Leave a flower'}
                </div>
                <div className="flower-sublabel">
                  {flowerSent ? 'They\'ll know someone cared' : 'No words needed'}
                </div>
              </div>

              {/* Reply */}
              {currentNote.openToReply && (
                <div className="reply-card">
                  <div className="reply-card-title">💌 Reply with kindness</div>
                  {replySent ? (
                    <div className="reply-sent-msg">Your reply is on its way ✓</div>
                  ) : (
                    <>
                      <textarea
                        className="reply-textarea"
                        placeholder="Write something kind..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        maxLength={300}
                      />
                      <button
                        className="reply-send-btn"
                        onClick={() => replyText.trim() && setConfirm('reply')}
                        disabled={!replyText.trim() || isSubmittingReply}
                      >
                        Send reply
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="note-actions">
              <button className="action-btn" onClick={() => setCurrentNote(null)}>
                Open another letter
              </button>
              <button className="action-btn pass-on" onClick={() => setConfirm('pass')}>
                🔁 Pass it on
              </button>
              <button className="action-btn" onClick={() => setCurrentPage('landing')}>
                Done reading
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation overlays */}
      {confirm === 'flower' && (
        <div className="confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🌸</div>
            <div className="confirm-title">Leave a flower?</div>
            <div className="confirm-text">
              A silent way to say "I was here, and I care."<br />
              They'll see it when they check their notes.
            </div>
            <button className="confirm-btn" onClick={sendFlower}>Yes, leave a flower</button>
            <button className="confirm-btn-sec" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {confirm === 'reply' && (
        <div className="confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">💌</div>
            <div className="confirm-title">Send your reply?</div>
            <div className="confirm-text">
              Once sent, they'll receive it in their notes.<br />
              Make sure it's kind. 🌿
            </div>
            <button className="confirm-btn" onClick={sendReply} disabled={isSubmittingReply}>
              {isSubmittingReply ? 'Sending...' : 'Yes, send it'}
            </button>
            <button className="confirm-btn-sec" onClick={() => setConfirm(null)}>Go back</button>
          </div>
        </div>
      )}

      {confirm === 'pass' && (
        <div className="confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🔁</div>
            <div className="confirm-title">Pass it on?</div>
            <div className="confirm-text">
              This note will float back into the letterbox<br />
              for another stranger to find.
            </div>
            <button className="confirm-btn" onClick={passItOn}>Yes, pass it on</button>
            <button className="confirm-btn-sec" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receive;