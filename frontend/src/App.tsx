import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

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

  const helperText = useMemo(() => {
    if (mode === 'signup') {
      return 'Signup displays translations. The exact click order becomes your ASL passphrase sequence.';
    }
    return 'Login hides translations for privacy. Replay the same 5 items in the exact same order.';
  }, [mode]);

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
    // Persist the enrollment sequence for this user ID.
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
    // Verify login against the stored enrollment for this user ID.
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
      {/* Intro section for product context */}
      <section className="hero">
        <p className="eyebrow">Accessibility Auth Library</p>
        <h1>ASL Passphrase Authentication Demo</h1>
        <p className="hero-subtitle">
          Build disability-friendly sign-up and login interfaces with a reusable 5-word ASL flow.
        </p>
      </section>

      {/* Main interactive auth panel */}
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

        <div className="panel" role="tabpanel" id="auth-panel" aria-labelledby={`tab-${mode}`}>
          <div className="panel-header">
            <h2>{mode === 'signup' ? 'Create your ASL passphrase' : 'Replay your ASL passphrase'}</h2>
            <p>{helperText}</p>
            <label className="identity-row" htmlFor="user-id">
              User ID
              <input
                id="user-id"
                className="identity-input"
                type="text"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="e.g. arin@example.com"
                autoComplete="username"
              />
            </label>
            <p className="selection-counter">
              Selected: {selectedForMode.length}/{REQUIRED_WORD_COUNT}
            </p>
          </div>

          <div className="word-grid" aria-live="polite">
            {/* Cards represent ASL items; selected cards also show sequence step number. */}
            {loadingLexicon ? <p>Loading ASL options...</p> : null}
            {lexicon.map((item) => {
              const isSelected = selectedForMode.includes(item.id);
              const disabled = !isSelected && selectedForMode.length >= REQUIRED_WORD_COUNT;
              const order = selectedForMode.indexOf(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={isSelected ? 'word-card selected' : 'word-card'}
                  onClick={() => toggleSelection(item.id)}
                  aria-pressed={isSelected}
                  disabled={disabled || loadingLexicon || submitting}
                >
                  <span className="gesture-label">{item.gesture_label}</span>
                  {isSelected ? (
                    <span className="translation-label">Step {order + 1}</span>
                  ) : null}
                  {translationVisible ? (
                    <span className="translation-label">{item.translation_label ?? 'Unavailable'}</span>
                  ) : (
                    <span className="translation-label hidden">Translation hidden in login</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedForMode.length > 0 ? (
            // Visible sequence preview helps users confirm order before submit.
            <p className="selection-counter">
              Sequence: {selectedForMode.join(' -> ')}
            </p>
          ) : null}

          <div className="actions">
            {mode === 'signup' ? (
              <button
                type="button"
                className="action-button"
                onClick={handleEnroll}
                disabled={!canSubmitSignup || loadingLexicon || submitting}
              >
                Save ASL Passphrase
              </button>
            ) : (
              <button
                type="button"
                className="action-button"
                onClick={handleVerifyLogin}
                disabled={!canSubmitLogin || loadingLexicon || submitting}
              >
                Verify Login
              </button>
            )}
          </div>

          {hasEnrollment ? (
            <p className="enrollment-note">Enrollment is active for this user ID.</p>
          ) : (
            <p className="enrollment-note">No enrollment yet. Complete Signup first.</p>
          )}

          {statusMessage ? (
            <p className={`status-message ${statusKind}`}>{statusMessage}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default App;
