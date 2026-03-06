import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import './index.css';
import Landing from './components/Landing';
import Write from './components/Write';
import Receive from './components/Receive';
import MyNotes from './components/MyNotes';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthLoading(false);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error('Auth error:', error);
          setAuthLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        fontFamily: 'var(--font-ui)',
        color: 'var(--ink-muted)',
        fontSize: '1rem',
        letterSpacing: '0.05em'
      }}>
        opening letterbox...
      </div>
    );
  }

  return (
    <div>
      {currentPage === 'landing' && <Landing setCurrentPage={setCurrentPage} user={user} />}
      {currentPage === 'write' && <Write setCurrentPage={setCurrentPage} user={user} />}
      {currentPage === 'receive' && <Receive setCurrentPage={setCurrentPage} user={user} />}
      {currentPage === 'mynotes' && <MyNotes setCurrentPage={setCurrentPage} user={user} />}
    </div>
  );
}

export default App;