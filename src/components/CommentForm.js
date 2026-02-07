/**
 * CommentForm Component
 * Handles comment input with real-time character count and submission feedback
 */

import React, { useState, useRef, useCallback } from 'react';
import './CommentForm.css';

const MAX_COMMENT_LENGTH = 5000;

export function CommentForm({ onSubmit, isLoading, parentCommentId, onCancel, placeholder = 'Share your thoughts...' }) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const remainingChars = MAX_COMMENT_LENGTH - text.length;
  const isValid = text.trim().length > 0 && text.length <= MAX_COMMENT_LENGTH;
  const showWarning = remainingChars <= 100;

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isValid) {
      onSubmit({
        text: text.trim(),
        parentCommentId
      });
      setText('');
      setIsFocused(false);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  }, [text, isValid, onSubmit, parentCommentId]);

  const handleCancel = useCallback(() => {
    setText('');
    setIsFocused(false);
    onCancel?.();
  }, [onCancel]);

  return (
    <form className={`comment-form ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
      <div className="form-input-wrapper">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !text && setIsFocused(false)}
          placeholder={placeholder}
          className="comment-textarea"
          rows="1"
          disabled={isLoading}
          aria-label="Comment text"
        />
        {isFocused && (
          <div className={`char-counter ${showWarning ? 'warning' : ''}`}>
            {remainingChars}/{MAX_COMMENT_LENGTH}
          </div>
        )}
      </div>

      {isFocused && (
        <div className="form-actions">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="submit-btn"
            aria-label="Post comment"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Posting...
              </>
            ) : (
              '📤 Post'
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

export default CommentForm;
