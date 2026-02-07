/**
 * useOptimisticComments Hook
 * Manages comment state with optimistic UI updates and server synchronization
 * Handles comment creation, deletion, replies with automatic rollback on server rejection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import webSocketCommentService from '../services/webSocketCommentService';

// Generate temporary ID for optimistic updates
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useOptimisticComments(entityType, entityId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const optimisticUpdatesRef = useRef(new Map()); // Track optimistic changes for rollback

  /**
   * Add a new comment optimistically
   * @param {object} comment - Comment data { text, authorId, parentCommentId? }
   */
  const addCommentOptimistic = useCallback((comment) => {
    const tempId = generateTempId();
    const optimisticComment = {
      id: tempId,
      ...comment,
      createdAt: Date.now(),
      isOptimistic: true,
      isSyncing: true,
      children: []
    };

    // Track this optimistic update for potential rollback
    optimisticUpdatesRef.current.set(tempId, {
      type: 'create',
      originalComment: optimisticComment,
      timestamp: Date.now()
    });

    // Update UI immediately
    setComments((prevComments) => {
      if (comment.parentCommentId) {
        // Add as reply to existing comment
        return prevComments.map((c) => {
          if (c.id === comment.parentCommentId) {
            return {
              ...c,
              children: [...(c.children || []), optimisticComment]
            };
          }
          return c;
        });
      }
      // Add as top-level comment
      return [...prevComments, optimisticComment];
    });

    // Send to server
    setSyncStatus('syncing');
    const messageId = webSocketCommentService.send(
      'comment:create',
      {
        ...comment,
        entityType,
        entityId,
        optimisticId: tempId
      },
      {
        onConfirmed: (payload) => {
          // Server confirmed - replace temp ID with real ID
          handleCommentConfirmed(tempId, payload);
        },
        onRejected: (error) => {
          // Server rejected - rollback optimistic update
          handleCommentRejected(tempId, error);
        }
      }
    );

    return tempId;
  }, [entityType, entityId]);

  /**
   * Handle server confirmation of optimistic comment
   */
  const handleCommentConfirmed = useCallback((tempId, payload) => {
    const { id: realId, ...updates } = payload;

    setComments((prevComments) => {
      return prevComments.map((c) => {
        if (c.id === tempId) {
          return {
            ...c,
            ...updates,
            id: realId,
            isOptimistic: false,
            isSyncing: false
          };
        }
        // Update children if this is a reply
        if (c.children?.length) {
          return {
            ...c,
            children: c.children.map((child) => {
              if (child.id === tempId) {
                return {
                  ...child,
                  ...updates,
                  id: realId,
                  isOptimistic: false,
                  isSyncing: false
                };
              }
              return child;
            })
          };
        }
        return c;
      });
    });

    optimisticUpdatesRef.current.delete(tempId);
    setSyncStatus('idle');
  }, []);

  /**
   * Handle server rejection of optimistic comment
   */
  const handleCommentRejected = useCallback((tempId, error) => {
    console.warn(`Comment ${tempId} rejected:`, error);

    // Remove the optimistic comment
    setComments((prevComments) => {
      return prevComments
        .map((c) => {
          if (c.children?.length) {
            return {
              ...c,
              children: c.children.filter((child) => child.id !== tempId)
            };
          }
          return c;
        })
        .filter((c) => c.id !== tempId);
    });

    optimisticUpdatesRef.current.delete(tempId);

    // Show error message
    setError({
      type: 'creation_failed',
      message: error.message || 'Failed to post comment',
      code: error.code
    });

    setSyncStatus('error');
    setTimeout(() => setSyncStatus('idle'), 3000);
  }, []);

  /**
   * Delete a comment optimistically
   */
  const deleteCommentOptimistic = useCallback((commentId) => {
    // Track deletion for rollback
    const comment = findCommentById(comments, commentId);
    if (comment) {
      optimisticUpdatesRef.current.set(commentId, {
        type: 'delete',
        originalComment: comment,
        timestamp: Date.now()
      });
    }

    // Remove from UI
    setComments((prevComments) => {
      return prevComments
        .map((c) => {
          if (c.children?.length) {
            return {
              ...c,
              children: c.children.filter((child) => child.id !== commentId)
            };
          }
          return c;
        })
        .filter((c) => c.id !== commentId);
    });

    // Send to server
    setSyncStatus('syncing');
    webSocketCommentService.send(
      'comment:delete',
      { commentId, entityType, entityId },
      {
        onConfirmed: () => {
          optimisticUpdatesRef.current.delete(commentId);
          setSyncStatus('idle');
        },
        onRejected: (error) => {
          // Rollback deletion
          const tracked = optimisticUpdatesRef.current.get(commentId);
          if (tracked && tracked.type === 'delete') {
            setComments((prevComments) => [...prevComments, tracked.originalComment]);
          }
          optimisticUpdatesRef.current.delete(commentId);
          setError({
            type: 'deletion_failed',
            message: error.message || 'Failed to delete comment',
            code: error.code
          });
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      }
    );
  }, [comments, entityType, entityId]);

  /**
   * Update comment text optimistically
   */
  const updateCommentOptimistic = useCallback((commentId, newText) => {
    const comment = findCommentById(comments, commentId);
    if (comment) {
      optimisticUpdatesRef.current.set(commentId, {
        type: 'update',
        originalComment: { ...comment },
        timestamp: Date.now()
      });
    }

    // Update UI
    setComments((prevComments) => {
      return prevComments.map((c) => {
        if (c.id === commentId) {
          return { ...c, text: newText, isEdited: true };
        }
        if (c.children?.length) {
          return {
            ...c,
            children: c.children.map((child) => {
              if (child.id === commentId) {
                return { ...child, text: newText, isEdited: true };
              }
              return child;
            })
          };
        }
        return c;
      });
    });

    // Send to server
    setSyncStatus('syncing');
    webSocketCommentService.send(
      'comment:update',
      { commentId, text: newText, entityType, entityId },
      {
        onConfirmed: () => {
          optimisticUpdatesRef.current.delete(commentId);
          setSyncStatus('idle');
        },
        onRejected: (error) => {
          // Rollback to original text
          const tracked = optimisticUpdatesRef.current.get(commentId);
          if (tracked && tracked.type === 'update') {
            setComments((prevComments) => {
              return prevComments.map((c) => {
                if (c.id === commentId) {
                  return { ...tracked.originalComment };
                }
                if (c.children?.length) {
                  return {
                    ...c,
                    children: c.children.map((child) => {
                      if (child.id === commentId) {
                        return { ...tracked.originalComment };
                      }
                      return child;
                    })
                  };
                }
                return c;
              });
            });
          }
          optimisticUpdatesRef.current.delete(commentId);
          setError({
            type: 'update_failed',
            message: error.message || 'Failed to update comment',
            code: error.code
          });
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      }
    );
  }, [comments, entityType, entityId]);

  /**
   * Load initial comments from server
   */
  const loadComments = useCallback(() => {
    setLoading(true);
    setSyncStatus('syncing');

    webSocketCommentService.send(
      'comments:fetch',
      { entityType, entityId },
      {
        onConfirmed: (payload) => {
          setComments(payload.comments || []);
          setLoading(false);
          setSyncStatus('idle');
        },
        onRejected: (error) => {
          setError(error);
          setLoading(false);
          setSyncStatus('error');
        }
      }
    );
  }, [entityType, entityId]);

  /**
   * Listen for real-time comment updates from other clients
   */
  useEffect(() => {
    // Handle incoming comments from other users
    const unsubCreateRemote = webSocketCommentService.on('comment:created_remote', (data) => {
      const { comment } = data;
      if (comment.entityType === entityType && comment.entityId === entityId) {
        setComments((prevComments) => {
          if (comment.parentCommentId) {
            return prevComments.map((c) => {
              if (c.id === comment.parentCommentId) {
                return {
                  ...c,
                  children: [...(c.children || []), comment]
                };
              }
              return c;
            });
          }
          return [...prevComments, comment];
        });
      }
    });

    // Handle comment deletions from other users
    const unsubDeleteRemote = webSocketCommentService.on('comment:deleted_remote', (data) => {
      const { commentId } = data;
      setComments((prevComments) => {
        return prevComments
          .map((c) => {
            if (c.children?.length) {
              return {
                ...c,
                children: c.children.filter((child) => child.id !== commentId)
              };
            }
            return c;
          })
          .filter((c) => c.id !== commentId);
      });
    });

    // Handle comment updates from other users
    const unsubUpdateRemote = webSocketCommentService.on('comment:updated_remote', (data) => {
      const { commentId, updates } = data;
      setComments((prevComments) => {
        return prevComments.map((c) => {
          if (c.id === commentId) {
            return { ...c, ...updates };
          }
          if (c.children?.length) {
            return {
              ...c,
              children: c.children.map((child) => {
                if (child.id === commentId) {
                  return { ...child, ...updates };
                }
                return child;
              })
            };
          }
          return c;
        });
      });
    });

    return () => {
      unsubCreateRemote();
      unsubDeleteRemote();
      unsubUpdateRemote();
    };
  }, [entityType, entityId]);

  return {
    comments,
    loading,
    error,
    syncStatus,
    addComment: addCommentOptimistic,
    deleteComment: deleteCommentOptimistic,
    updateComment: updateCommentOptimistic,
    loadComments,
    clearError: () => setError(null),
    getPendingCount: () => optimisticUpdatesRef.current.size
  };
}

/**
 * Utility function to find comment by ID in nested structure
 */
function findCommentById(comments, commentId) {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.children?.length) {
      const found = findCommentById(comment.children, commentId);
      if (found) return found;
    }
  }
  return null;
}
