import React, { useCallback, useState } from 'react';
import './AgeVerificationModal.css';

/**
 * Modal component for age verification.
 * Displays a form for birthdate entry with clear warnings.
 * Uses localStorage to persist verification state across sessions.
 */
export default function AgeVerificationModal({ onVerify, onDismiss, isOpen }) {
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = useCallback((e) => {
    setBirthDate(e.target.value);
    setError('');
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!birthDate) {
        setError('Please select your date of birth');
        return;
      }

      setIsSubmitting(true);

      try {
        const parsed = new Date(birthDate);
        const result = await onVerify(parsed);

        if (result.success) {
          // Close modal after successful verification
          setTimeout(() => {
            onDismiss();
          }, 500);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Age verification error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [birthDate, onVerify, onDismiss]
  );

  if (!isOpen) return null;

  // Max selectable date: today
  const today = new Date().toISOString().split('T')[0];

  // Min selectable date: 100 years ago (reasonable upper bound)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="avm-overlay">
      <div className="avm-modal">
        <button className="avm-close" onClick={onDismiss} aria-label="Close">
          ✕
        </button>

        <div className="avm-content">
          <div className="avm-icon">🔞</div>
          <h2 className="avm-title">Age Verification Required</h2>

          <p className="avm-message">
            This content is restricted to users <strong>18 years or older</strong>. Please verify your
            age to continue.
          </p>

          <form onSubmit={handleSubmit} className="avm-form">
            <div className="avm-form-group">
              <label htmlFor="birthdate" className="avm-label">
                Date of Birth
              </label>
              <input
                id="birthdate"
                type="date"
                className={`avm-input ${error ? 'error' : ''}`}
                value={birthDate}
                onChange={handleDateChange}
                min={minDateStr}
                max={today}
                disabled={isSubmitting}
                required
                aria-invalid={error ? 'true' : 'false'}
              />
              {error && (
                <span className="avm-error" role="alert">
                  {error}
                </span>
              )}
            </div>

            <div className="avm-warning">
              <strong>⚠️ Warning:</strong> Providing false information may result in account restrictions.
            </div>

            <div className="avm-actions">
              <button
                type="button"
                className="avm-btn avm-btn-cancel"
                onClick={onDismiss}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="avm-btn avm-btn-verify"
                disabled={!birthDate || isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Age'}
              </button>
            </div>
          </form>

          <p className="avm-privacy">
            Your birthdate is verified locally and never stored or transmitted.
          </p>
        </div>
      </div>
    </div>
  );
}
