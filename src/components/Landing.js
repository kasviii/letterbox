import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import FloatingEnvelopes from './FloatingEnvelopes';
import './Landing.css';

function Landing({ setCurrentPage }) {
  const [noteCount, setNoteCount] = useState(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, 'notes'));
        setNoteCount(snap.data().count);
      } catch (e) {
        setNoteCount(null);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="landing">
      <FloatingEnvelopes />
      <div className="landing-blob-sage" />

      <nav className="landing-nav">
        <div className="landing-logo">letter<span>box</span></div>
        <button className="nav-link" onClick={() => setCurrentPage('mynotes')}>
          My Notes
        </button>
      </nav>

      <div className="landing-hero">
        <div className="hero-eyebrow">
          ✦ anonymous · kind · human
        </div>

        <h1 className="landing-title">
          Leave a note.<br />
          <em>Find a stranger's words.</em>
        </h1>

        <p className="landing-subtitle">
          A quiet corner of the internet to release what you're carrying — 
          and maybe lift someone else in return.
        </p>

        <div className="landing-cta">
          <button className="btn-write" onClick={() => setCurrentPage('write')}>
            Write a note
          </button>
          <button className="btn-read" onClick={() => setCurrentPage('receive')}>
            Open a letter
          </button>
        </div>

        <div className="landing-counter">
          <div className="counter-pill">
            <span>📬</span>
            {noteCount !== null ? (
              <>
                <span className="counter-number">{noteCount.toLocaleString()}</span>
                <span>notes shared so far</span>
              </>
            ) : (
              <span>a community of quiet voices</span>
            )}
          </div>
        </div>
      </div>

      <div className="floating-previews">
        <div className="preview-card">
          <div className="preview-card-text">
            "I got the rejection today. I smiled and said it's fine. It wasn't fine."
          </div>
          <span className="preview-card-tag tag-sad">sad</span>
        </div>
        <div className="preview-card">
          <div className="preview-card-text">
            "Applied for that job I thought was too good for me. Whatever happens, I tried."
          </div>
          <span className="preview-card-tag tag-hopeful">hopeful</span>
        </div>
        <div className="preview-card">
          <div className="preview-card-text">
            "My mum made my favourite meal without me asking. I didn't say enough."
          </div>
          <span className="preview-card-tag tag-grateful">grateful</span>
        </div>
      </div>

      <div className="landing-footer-note">
        No accounts. No tracking. Notes disappear after 30 days.
      </div>
    </div>
  );
}

export default Landing;