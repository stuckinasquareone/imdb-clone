/**
 * CommentSection Component
 * Main container for nested comments with real-time WebSocket updates
 * Manages loading state, error handling, and synchronization feedback
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useOptimisticComments } from '../hooks/useOptimisticComments';
import webSocketCommentService from '../services/webSocketCommentService';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './CommentSection.css';

export function CommentSection({
  entityType,
  entityId,
  currentUserId,
  currentUserName = 'Anonymous',
  wsUrl = 'ws://localhost:3001/comments',
  maxNestingDepth = 3
}) {
  const {
    comments,
    loading,
    error,
    syncStatus,
    addComment,
    deleteComment,
    updateComment,
    loadComments,
    clearError,
    getPendingCount
  } = useOptimisticComments(entityType, entityId);

  const [wsConnected, setWsConnected] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, most_replies

  /**
   * Initialize WebSocket connection on mount
   */
  useEffect(() => {
    const initializeWS = async () => {
      try {
        // Only connect if not already connected
        if (!webSocketCommentService.isConnected()) {
          await webSocketCommentService.connect(wsUrl, { autoReconnect: true });
        }
        setWsConnected(true);

        // Load initial comments
        loadComments();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        // Fallback: load comments without WebSocket
        loadComments();
      }
    };

    initializeWS();

    // Listen for connection changes
    const unsubConnect = webSocketCommentService.on('connect', () => {
      setWsConnected(true);
    });

    const unsubDisconnect = webSocketCommentService.on('disconnect', () => {
      setWsConnected(false);
    });

    const unsubReconnectScheduled = webSocketCommentService.on('reconnect:scheduled', (data) => {
      console.log(`Reconnecting in ${data.delayMs}ms...`);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubReconnectScheduled();
    };
  }, [wsUrl, loadComments]);

  /**
   * Handle new comment submission
   */
  const handleCommentSubmit = useCallback(
    ({ text, parentCommentId }) => {
      addComment({
        text,
        parentCommentId,
        authorId: currentUserId,
        authorName: currentUserName
      });
      setReplyingToId(null);
    },
    [addComment, currentUserId, currentUserName]
  );

  /**
   * Sort comments based on selected criteria
   */
  const sortedComments = useCallback(() => {
    const sorted = [...comments];

    switch (sortBy) {
      case 'oldest':
        return sorted.reverse();
      case 'most_replies':
        return sorted.sort(
          (a, b) => (b.children?.length || 0) - (a.children?.length || 0)
        );
      case 'newest':
      default:
        return sorted;
    }
  }, [comments, sortBy]);

  const pendingCount = getPendingCount();
  const hasError = error !== null;

  return (
    <div className="comment-section">
      {/* Header */}
      <div className="comments-header">
        <h2 className="comments-title">
          💬 Comments {comments.length > 0 && `(${comments.length})`}
        </h2>

        <div className="header-controls">
          <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
              disabled={loading}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_replies">Most Replies</option>
            </select>
          </div>

          {/* Connection status */}
          <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-indicator"></span>
            <span className="status-text">
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div className="status-bar">
        {syncStatus === 'syncing' && (
          <div className="status-badge syncing">
            <span className="spinner"></span>
            Syncing... {pendingCount > 0 && `(${pendingCount} pending)`}
          </div>
        )}
        {syncStatus === 'error' && hasError && (
          <div className="status-badge error">
            <span className="error-icon">⚠️</span>
            {error.message}
            <button
              className="dismiss-btn"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
        {!wsConnected && !loading && (
          <div className="status-badge offline">
            <span className="warning-icon">📡</span>
            Offline mode - changes will sync when reconnected
          </div>
        )}
      </div>

      {/* New comment form */}
      <div className="new-comment-section">
        <h3 className="new-comment-title">Share Your Thoughts</h3>
        <CommentForm
          onSubmit={handleCommentSubmit}
          isLoading={syncStatus === 'syncing'}
          placeholder="What are your thoughts about this?"
        />
      </div>

      {/* Loading state */}
      {loading && comments.length === 0 && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading comments...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💭</div>
          <p className="empty-text">No comments yet. Be the first to share!</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && comments.length > 0 && (
        <div className="comments-list">
          {sortedComments().map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={handleCommentSubmit}
              onDelete={deleteComment}
              onUpdate={updateComment}
              isLoadingReply={syncStatus === 'syncing'}
              currentUserId={currentUserId}
              maxDepth={maxNestingDepth}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="comments-footer">
        <p className="footer-text">
          💡 Comments are real-time. Your changes sync automatically.
          {!wsConnected && ' Offline mode is active.'}
        </p>
      </div>
    </div>
  );
}

export default CommentSection;
