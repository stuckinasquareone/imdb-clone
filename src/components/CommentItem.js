/**
 * CommentItem Component
 * Displays a single comment with reply functionality, edit/delete actions
 * Shows optimistic state indicators and handles nested replies
 */

import React, { useState, useCallback } from 'react';
import CommentForm from './CommentForm';
import './CommentItem.css';

export function CommentItem({
  comment,
  depth = 0,
  onReply,
  onDelete,
  onUpdate,
  isLoadingReply,
  currentUserId,
  maxDepth = 3
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showChildren, setShowChildren] = useState(true);

  const isOptimistic = comment.isOptimistic;
  const isSyncing = comment.isSyncing;
  const canReply = depth < maxDepth;
  const canEdit = currentUserId === comment.authorId;
  const canDelete = currentUserId === comment.authorId;
  const hasChildren = comment.children && comment.children.length > 0;

  const handleReplySubmit = useCallback(
    ({ text, parentCommentId }) => {
      onReply({ text, parentCommentId: comment.id });
      setIsReplying(false);
    },
    [comment.id, onReply]
  );

  const handleEditSubmit = useCallback(() => {
    if (editText.trim() && editText !== comment.text) {
      onUpdate(comment.id, editText.trim());
      setIsEditing(false);
    }
  }, [editText, comment.text, comment.id, onUpdate]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  }, [comment.id, onDelete]);

  return (
    <div className={`comment-item comment-depth-${depth} ${isOptimistic ? 'optimistic' : ''}`}>
      {/* Status indicators */}
      {isOptimistic && (
        <div className="optimistic-indicator">
          <span className="spinner"></span>
          <span className="label">Posting...</span>
        </div>
      )}

      <div className="comment-wrapper">
        {/* Comment header */}
        <div className="comment-header">
          <div className="author-info">
            <div className="avatar">
              {comment.authorName?.charAt(0).toUpperCase()}
            </div>
            <div className="author-details">
              <div className="author-name">{comment.authorName}</div>
              <div className="timestamp">{formatTimestamp(comment.createdAt)}</div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="comment-actions">
            {canEdit && (
              <button
                className="action-btn edit-btn"
                onClick={() => setIsEditing(!isEditing)}
                title="Edit comment"
                aria-label="Edit comment"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                className="action-btn delete-btn"
                onClick={handleDelete}
                title="Delete comment"
                aria-label="Delete comment"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Comment content */}
        {isEditing ? (
          <div className="edit-mode">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button
                className="save-btn"
                onClick={handleEditSubmit}
                disabled={editText === comment.text}
              >
                💾 Save
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-text">
            {comment.text}
            {comment.isEdited && <span className="edited-badge">(edited)</span>}
          </div>
        )}

        {/* Engagement section */}
        <div className="comment-engagement">
          {canReply && (
            <button
              className="reply-btn"
              onClick={() => setIsReplying(!isReplying)}
              disabled={isLoadingReply || isOptimistic}
            >
              💬 Reply {hasChildren && `(${comment.children.length})`}
            </button>
          )}

          {hasChildren && (
            <button
              className="toggle-replies-btn"
              onClick={() => setShowChildren(!showChildren)}
            >
              {showChildren ? '▼ Hide' : '▶ Show'} {comment.children.length} repl{comment.children.length !== 1 ? 'ies' : 'y'}
            </button>
          )}

          {isSyncing && <span className="sync-badge">Syncing...</span>}
        </div>

        {/* Reply form */}
        {isReplying && (
          <div className="reply-form-container">
            <CommentForm
              onSubmit={handleReplySubmit}
              isLoading={isLoadingReply}
              parentCommentId={comment.id}
              onCancel={() => setIsReplying(false)}
              placeholder={`Reply to ${comment.authorName}...`}
            />
          </div>
        )}

        {/* Nested replies */}
        {hasChildren && showChildren && (
          <div className="comment-children">
            {comment.children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                onReply={onReply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                isLoadingReply={isLoadingReply}
                currentUserId={currentUserId}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
function formatTimestamp(createdAt) {
  const now = Date.now();
  const diff = now - createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(createdAt);
  return date.toLocaleDateString();
}

export default CommentItem;
