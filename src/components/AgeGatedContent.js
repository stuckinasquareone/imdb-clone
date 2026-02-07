import React, { useState } from 'react';
import './AgeGatedContent.css';
import AgeVerificationModal from './AgeVerificationModal';

/**
 * Wrapper component that gates content based on age verification.
 * Shows blocked content message if not verified, modal to verify.
 */
export default function AgeGatedContent({
  isVerified,
  onVerify,
  children,
  title = 'Adult Content',
  description = 'This content is restricted to users 18 years or older.',
}) {
  const [showModal, setShowModal] = useState(false);

  if (isVerified) {
    return <div className="agc-content">{children}</div>;
  }

  return (
    <>
      <div className="agc-blocked">
        <div className="agc-blocked-icon">🔒</div>
        <h3 className="agc-blocked-title">{title}</h3>
        <p className="agc-blocked-description">{description}</p>

        <div className="agc-reasons">
          <p className="agc-reason-title">This content is restricted because:</p>
          <ul className="agc-reason-list">
            <li>Contains adult themes and mature content</li>
            <li>Not appropriate for viewers under 18</li>
            <li>Requires age verification for access</li>
          </ul>
        </div>

        <button
          className="agc-verify-btn"
          onClick={() => setShowModal(true)}
          aria-label="Verify your age to access this content"
        >
          🔓 Verify Age to Unlock
        </button>

        <p className="agc-legal">
          By continuing, you confirm that you are 18 years of age or older.
        </p>
      </div>

      <AgeVerificationModal
        isOpen={showModal}
        onVerify={onVerify}
        onDismiss={() => setShowModal(false)}
      />
    </>
  );
}
