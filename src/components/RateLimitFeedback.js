/**
 * RateLimitFeedback Component
 * Displays user-friendly feedback when rate limits are hit.
 * Encourages slower interaction and shows countdown timers.
 */

import React, { useState, useEffect } from 'react';
import { RateLimitStatus } from '../services/rateLimiterService';
import './RateLimitFeedback.css';

export default function RateLimitFeedback({
  status,
  timeUntilRetry,
  requestCount,
  maxRequests,
  isBlocked,
  action = 'action', // e.g., 'rating', 'commenting'
  showProgressBar = true,
  position = 'bottom-right' // top-right, bottom-right, bottom-center
}) {
  const [displayTime, setDisplayTime] = useState(timeUntilRetry);

  // Update display time
  useEffect(() => {
    setDisplayTime(timeUntilRetry);
  }, [timeUntilRetry]);

  if (!isBlocked && status === RateLimitStatus.ALLOWED) {
    return null;
  }

  const isThrottled = status === RateLimitStatus.THROTTLED;
  const isCoolingDown = status === RateLimitStatus.COOLING_DOWN;
  const isLimited = isBlocked || isThrottled || isCoolingDown;

  if (!isLimited) {
    return null;
  }

  const progressPercent = requestCount && maxRequests 
    ? (requestCount / maxRequests) * 100 
    : 0;

  const messageConfig = {
    [RateLimitStatus.BLOCKED]: {
      icon: '🔒',
      title: 'Action Blocked',
      message: `Too many ${action}s. Please wait before trying again.`,
      severity: 'blocked'
    },
    [RateLimitStatus.THROTTLED]: {
      icon: '⏱️',
      title: `Whoa, slow down!`,
      message: `You're performing ${action}s too quickly. Let's give your actions more breathing room.`,
      severity: 'throttled'
    },
    [RateLimitStatus.COOLING_DOWN]: {
      icon: '🌡️',
      title: 'Taking a breather',
      message: `Giving you a moment to cool down before the next ${action}.`,
      severity: 'cooling'
    }
  };

  const config = messageConfig[status] || messageConfig[RateLimitStatus.THROTTLED];

  return (
    <div className={`rate-limit-feedback rate-limit-${position} rate-limit-${config.severity}`}>
      <div className="feedback-content">
        {/* Header */}
        <div className="feedback-header">
          <span className="feedback-icon">{config.icon}</span>
          <h3 className="feedback-title">{config.title}</h3>
          {displayTime > 0 && (
            <span className="feedback-timer">
              {displayTime}s
            </span>
          )}
        </div>

        {/* Message */}
        <p className="feedback-message">{config.message}</p>

        {/* Request Count Progress */}
        {showProgressBar && requestCount !== undefined && maxRequests && (
          <div className="feedback-progress">
            <div className="progress-label">
              Request activity: <strong>{requestCount} / {maxRequests}</strong>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        <div className="feedback-encouragement">
          {isBlocked && (
            <p className="encouragement-text">
              💡 <strong>Pro tip:</strong> Taking time between actions leads to better decisions and less regret!
            </p>
          )}
          {isThrottled && (
            <p className="encouragement-text">
              💡 <strong>Think about it:</strong> Quality over quantity. Take a moment to make sure you really want to proceed.
            </p>
          )}
          {isCoolingDown && (
            <p className="encouragement-text">
              💡 <strong>Coming right up:</strong> Your next {action} will be ready in {displayTime} second{displayTime !== 1 ? 's' : ''}.
            </p>
          )}
        </div>

        {/* Status Details */}
        {(isBlocked || isThrottled) && (
          <div className="feedback-details">
            <div className="detail-item">
              <span className="detail-label">Reason:</span>
              <span className="detail-value">
                {isBlocked ? 'Too many recent actions' : 'Rate limit threshold reached'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Retry in:</span>
              <span className="detail-value">
                {displayTime > 0 ? `${displayTime} second${displayTime !== 1 ? 's' : ''}` : 'immediately'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Indicator */}
      <div className="feedback-indicator">
        <div className="indicator-dot" />
      </div>
    </div>
  );
}
