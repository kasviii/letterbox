import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './Write.css';

const CHAR_LIMIT = 500;

const designPresets = [
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#e0e0e0' },
  { id: 'warmth', name: 'Warmth', bg: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)', color: '#3d3d3d' },
  { id: 'rain', name: 'Rain', bg: 'linear-gradient(135deg, #4b4b4b 0%, #6d6d6d 100%)', color: '#f0f0f0' },
  { id: 'dawn', name: 'Dawn', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#4a4a4a' },
  { id: 'minimal', name: 'Minimal', bg: '#faf8f5', color: '#2c2825' }
];

const moods = [
  { id: 'sad', label: '🌧 sad' },
  { id: 'hopeful', label: '🌱 hopeful' },
  { id: 'angry', label: '🔥 angry' },
  { id: 'grateful', label: '🌸 grateful' },
];

function Write({ setCurrentPage, user }) {
  const [selectedDesign, setSelectedDesign] = useState(designPresets[0]);
  const [noteText, setNoteText] = useState('');
  const [mood, setMood] = useState('');
  const [openToReply, setOpenToReply] = useState(false);
  const [returnToCirculation, setReturnToCirculation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const remaining = CHAR_LIMIT - noteText.length;
  const fillPct = Math.min((noteText.length / CHAR_LIMIT) * 100, 100);
  const fillColor = fillPct > 90 ? '#c84040' : fillPct > 70 ? '#c8a040' : 'var(--sage-dark)';

  const handleSubmit = async () => {
    if (!noteText.trim()) return;
    if (noteText.length > CHAR_LIMIT) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'notes'), {
        text: noteText.trim(),
        mood: mood || 'untagged',
        design: selectedDesign.id,
        openToReply,
        returnToCirculation,
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        hasBeenRead: false,
        replyText: null,
        flowers: 0,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting note:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <div className="success-icon">📬</div>
          <h2 className="success-title">Your note is out there.</h2>
          <p className="success-subtitle">
            Somewhere, a stranger will find your words.<br />
            Maybe they needed them today.
          </p>
          <div className="success-actions">
            <button className="success-btn-primary" onClick={() => setCurrentPage('receive')}>
              Open someone else's letter
            </button>
            <button className="success-btn-secondary" onClick={() => setCurrentPage('landing')}>
              Back to Letterbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="write-page">
      <div className="write-container">
        <button className="back-btn" onClick={() => setCurrentPage('landing')}>
          ← Back
        </button>

        <div className="write-header">
          <h1 className="write-title">Write your note</h1>
          <p className="write-subtitle">Whatever you need to release. No names. No judgement.</p>
        </div>

        {/* Design */}
        <div className="design-selector">
          <div className="section-label">Choose a paper</div>
          <div className="design-options">
            {designPresets.map(design => (
              <button
                key={design.id}
                className={`design-btn ${selectedDesign.id === design.id ? 'active' : ''}`}
                style={{ background: design.bg, color: design.color }}
                onClick={() => setSelectedDesign(design)}
              >
                {design.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mood-selector">
          <div className="section-label">How are you feeling? (optional)</div>
          <div className="mood-options">
            {moods.map(m => (
              <button
                key={m.id}
                className={`mood-btn ${mood === m.id ? `active-${m.id}` : ''}`}
                onClick={() => setMood(mood === m.id ? '' : m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Writing area */}
        <div className="note-paper" style={{ background: selectedDesign.bg, color: selectedDesign.color }}>
          <textarea
            className="note-textarea"
            placeholder="Write whatever you need to release..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{ color: selectedDesign.color }}
            maxLength={CHAR_LIMIT + 50}
          />
          <div className="note-paper-footer">
            <span className={`char-count ${remaining < 0 ? 'over' : ''}`}>
              {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} left`}
            </span>
            <div className="char-limit-bar">
              <div
                className="char-limit-fill"
                style={{ width: `${fillPct}%`, background: fillColor }}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="options-card">
          <label className="option-row">
            <input
              className="custom-checkbox"
              type="checkbox"
              checked={openToReply}
              onChange={(e) => setOpenToReply(e.target.checked)}
            />
            <label>I'm open to receiving one reply</label>
          </label>

          <div className="options-divider" />

          <div className="option-group-label">After someone reads this:</div>
          <label className="option-row">
            <input className="custom-radio" type="radio" name="circulation" checked={!returnToCirculation} onChange={() => setReturnToCirculation(false)} />
            <label>Let it disappear</label>
          </label>
          <label className="option-row">
            <input className="custom-radio" type="radio" name="circulation" checked={returnToCirculation} onChange={() => setReturnToCirculation(true)} />
            <label>Return it to circulation</label>
          </label>
        </div>

        <div className="kindness-nudge">
          🌸 This is a safe space. Please be honest, be kind, and be yourself.
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || !noteText.trim() || noteText.length > CHAR_LIMIT}
        >
          {isSubmitting ? 'Releasing...' : 'Release into the letterbox'}
        </button>
      </div>
    </div>
  );
}

export default Write;