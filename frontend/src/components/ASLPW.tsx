import { useMemo } from 'react';
import bugGif from './asl gifs/bug.gif';
import cuteGif from './asl gifs/cute-sugar.gif';
import stopGif from './asl gifs/stop.gif';
import thanksGif from './asl gifs/thank-you.gif';
import sorryGif from './asl gifs/sorry-A.gif';

type Mode = 'signup' | 'login';
type StatusKind = 'info' | 'success' | 'error';

type AslLexiconItem = {
  id: number;
  gesture_label: string;
  translation_label?: string | null;
};

interface AuthPanelProps {
  mode: Mode;
  userId: string;
  setUserId: (userId: string) => void;
  lexicon: AslLexiconItem[];
  selectedForMode: number[];
  toggleSelection: (itemId: number) => void;
  translationVisible: boolean;
  loadingLexicon: boolean;
  submitting: boolean;
  canSubmitSignup: boolean;
  canSubmitLogin: boolean;
  hasEnrollment: boolean;
  statusMessage: string;
  statusKind: StatusKind;
  onEnroll: () => void;
  onVerifyLogin: () => void;
  requiredWordCount: number;
}

// Map translation labels to their corresponding GIF assets
const getGifForSign = (translationLabel?: string | null): string | null => {
  if (!translationLabel) return null;
  const gifMap: Record<string, string> = {
    'Bug': bugGif,
    'Cute': cuteGif,
    'Thank You': thanksGif,
    'Sorry': sorryGif,
    'Stop': stopGif
  };
  return gifMap[translationLabel] || null;
};


export default function ASLPW({
  mode,
  userId,
  setUserId,
  lexicon,
  selectedForMode,
  toggleSelection,
  translationVisible,
  loadingLexicon,
  submitting,
  canSubmitSignup,
  canSubmitLogin,
  hasEnrollment,
  statusMessage,
  statusKind,
  onEnroll,
  onVerifyLogin,
  requiredWordCount,
}: AuthPanelProps) {
  const helperText = useMemo(() => {
    if (mode === 'signup') {
      return 'Signup displays translations. The exact click order becomes your ASL passphrase sequence.';
    }
    return 'Login hides translations for privacy. Replay the same 5 items in the exact same order.';
  }, [mode]);

  return (
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
            autoComplete="username"
          />
        </label>
        <p className="selection-counter">
          Selected: {selectedForMode.length}/{requiredWordCount}
        </p>
      </div>

      <div className="word-grid" aria-live="polite">
        {loadingLexicon ? <p>Loading ASL options...</p> : null}
        {lexicon.map((item) => {
          const isSelected = selectedForMode.includes(item.id);
          const disabled = !isSelected && selectedForMode.length >= requiredWordCount;
          const order = selectedForMode.indexOf(item.id);
          const gifUrl = getGifForSign(item.translation_label);

          return (
            <button
              key={item.id}
              type="button"
              className={isSelected ? 'word-card selected' : 'word-card'}
              onClick={() => toggleSelection(item.id)}
              aria-pressed={isSelected}
              disabled={disabled || loadingLexicon || submitting}
            >
              {gifUrl && <img src={gifUrl} alt={item.gesture_label} className="asl-gif" />}
              {isSelected ? (
                <span className="translation-label">Step {order + 1}</span>
              ) : null}
              {translationVisible ? (
                <span className="translation-label">{item.translation_label ?? 'Unavailable'}</span>
              ) : (
                <span className="translation-label hidden">{item.gesture_label}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedForMode.length > 0 ? (
        <p className="selection-counter">
          Sequence: {selectedForMode.join(' -> ')}
        </p>
      ) : null}
      
      <div className="actions">
        
        {mode === 'signup' ? (
          <button
            type="button"
            className="action-button"
            onClick={onEnroll}
            disabled={!canSubmitSignup || loadingLexicon || submitting}
          >
            Save ASL Passphrase
          </button>
        ) : (
          
          <div className="actions">
            <button
              type="button"
              className="action-button"
              onClick={onVerifyLogin}
              disabled={!canSubmitLogin || loadingLexicon || submitting}
            >
              Verify Login
            </button>
          </div>
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
  );
}
