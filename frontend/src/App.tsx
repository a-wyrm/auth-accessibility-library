import React, { useEffect, useState } from 'react';
import './App.css';
import ASLPW from './components/ASLPW';

type Mode = 'signup' | 'login';
type StatusKind = 'info' | 'success' | 'error';

type AslLexiconItem = {
  id: number;
  gesture_label: string;
  translation_label?: string | null;
};

type StartResponse = {
  translation_visible: boolean;
  items: AslLexiconItem[];
};

const REQUIRED_WORD_COUNT = 5;

function App() {
  // App-level state for mode, identity, selection, and UX feedback.
  const [mode, setMode] = useState<Mode>('signup');
  const [userId, setUserId] = useState<string>('');
  const [lexicon, setLexicon] = useState<AslLexiconItem[]>([]);
  const [translationVisible, setTranslationVisible] = useState<boolean>(true);
  const [signupSelection, setSignupSelection] = useState<number[]>([]);
  const [loginSelection, setLoginSelection] = useState<number[]>([]);
  const [hasEnrollment, setHasEnrollment] = useState<boolean>(false);
  const [loadingLexicon, setLoadingLexicon] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusKind, setStatusKind] = useState<StatusKind>('info');

  const selectedForMode = mode === 'signup' ? signupSelection : loginSelection;

  const canSubmitSignup = userId.trim().length > 0 && signupSelection.length === REQUIRED_WORD_COUNT;
  const canSubmitLogin =
    userId.trim().length > 0 && loginSelection.length === REQUIRED_WORD_COUNT;

  useEffect(() => {
    // Load lexicon for the active mode. Signup returns translations; login hides them.
    const loadLexicon = async () => {
      setLoadingLexicon(true);
      try {
        const endpoint = mode === 'signup'
          ? '/api/auth/asl/enroll/start'
          : '/api/auth/asl/login/start';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locale: 'en-US' }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('failed to load ASL lexicon (404). Start backend on :8080 and restart npm start so proxy is applied.');
          }
          throw new Error(`failed to load ASL lexicon (${response.status})`);
        }

        const payload = (await response.json()) as StartResponse;
        setLexicon(payload.items);
        setTranslationVisible(payload.translation_visible);
      } catch (error) {
        setLexicon([]);
        setStatusKind('error');
        setStatusMessage(
          `Could not load ASL options. ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      } finally {
        setLoadingLexicon(false);
      }
    };

    void loadLexicon();
  }, [mode]);

  const toggleSelection = (itemId: number) => {
    // Keep click order stable and cap selections at the required sequence size.
    const applySelection = mode === 'signup' ? setSignupSelection : setLoginSelection;

    applySelection((current: number[]) => {
      const exists = current.includes(itemId);
      if (exists) {
        return current.filter((id: number) => id !== itemId);
      }
      if (current.length >= REQUIRED_WORD_COUNT) {
        return current;
      }
      return [...current, itemId];
    });
  };

  const handleEnroll = async () => {
    
    if (!canSubmitSignup) {
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/asl/enroll/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          item_ids: signupSelection,
        }),
      });

      if (!response.ok) {
        throw new Error(`enrollment failed (${response.status})`);
      }

      setHasEnrollment(true);
      setLoginSelection([]);
      setMode('login');
      setStatusKind('success');
      setStatusMessage('Enrollment saved on server. Switch to Login and replay your 5-item sequence.');
    } catch (error) {
      setStatusKind('error');
      setStatusMessage(
        `Could not save enrollment. ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!canSubmitLogin) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/asl/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          item_ids: loginSelection,
        }),
      });

      if (!response.ok) {
        throw new Error(`verification failed (${response.status})`);
      }

      const payload = (await response.json()) as { authenticated: boolean };
      if (payload.authenticated) {
        setStatusKind('success');
        setStatusMessage('Login successful. Sequence matched your enrolled ASL passphrase.');
      } else {
        setStatusKind('error');
        setStatusMessage('Login failed. Make sure the user ID matches enrollment and the 5-item click order is identical to signup.');
      }
    } catch (error) {
      setStatusKind('error');
      setStatusMessage(
        `Could not verify login. ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="App">
      <section className="hero">
        <p className="eyebrow">Accessibility Auth Library</p>
        <h1>Authentication Demo</h1>
      </section>

      <section className="auth-shell" aria-label="Authentication playground">
        <div className="mode-toggle" role="tablist" aria-label="Choose auth mode">
          <button
            type="button"
            className={mode === 'signup' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
            aria-controls="auth-panel"
            id="tab-signup"
          >
            Signup
          </button>
          <button
            type="button"
            className={mode === 'login' ? 'mode-button active' : 'mode-button'}
            onClick={() => setMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
            aria-controls="auth-panel"
            id="tab-login"
          >
            Login
          </button>
        </div>

        <ASLPW
          mode={mode}
          userId={userId}
          setUserId={setUserId}
          lexicon={lexicon}
          selectedForMode={selectedForMode}
          toggleSelection={toggleSelection}
          translationVisible={translationVisible}
          loadingLexicon={loadingLexicon}
          submitting={submitting}
          canSubmitSignup={canSubmitSignup}
          canSubmitLogin={canSubmitLogin}
          hasEnrollment={hasEnrollment}
          statusMessage={statusMessage}
          statusKind={statusKind}
          onEnroll={handleEnroll}
          onVerifyLogin={handleVerifyLogin}
          requiredWordCount={REQUIRED_WORD_COUNT}
        />
      </section>
    </main>
  );
}

export default App;
