/**
 * API Schemas for Frontend Contract Validation
 * Defines the expected structure of API responses.
 * Update these when backend API contracts change.
 */

import { SchemaTypes } from '../services/apiSchemaValidator';

/**
 * Movie response schema
 */
export const MovieSchema = {
  type: SchemaTypes.OBJECT,
  required: ['id', 'title', 'duration'],
  properties: {
    id: {
      type: SchemaTypes.STRING,
      required: true,
      minLength: 1
    },
    title: {
      type: SchemaTypes.STRING,
      required: true,
      minLength: 1,
      maxLength: 255
    },
    duration: {
      type: SchemaTypes.NUMBER,
      required: true,
      minimum: 0,
      maximum: 1000
    },
    year: {
      type: SchemaTypes.NUMBER,
      required: false,
      minimum: 1800,
      maximum: 2100
    },
    rating: {
      type: SchemaTypes.NUMBER,
      required: false,
      minimum: 0,
      maximum: 10
    },
    genre: {
      type: SchemaTypes.ARRAY,
      required: false,
      items: {
        type: SchemaTypes.STRING
      }
    },
    description: {
      type: SchemaTypes.STRING,
      required: false,
      maxLength: 1000
    },
    isAdult: {
      type: SchemaTypes.BOOLEAN,
      required: false
    }
  },
  additionalProperties: false
};

/**
 * Watch progress response schema
 */
export const WatchProgressSchema = {
  type: SchemaTypes.OBJECT,
  required: ['movieId', 'progress', 'totalDuration'],
  properties: {
    movieId: {
      type: SchemaTypes.STRING,
      required: true
    },
    progress: {
      type: SchemaTypes.NUMBER,
      required: true,
      minimum: 0
    },
    totalDuration: {
      type: SchemaTypes.NUMBER,
      required: true,
      minimum: 0
    },
    watched: {
      type: SchemaTypes.BOOLEAN,
      required: false
    },
    lastUpdated: {
      type: SchemaTypes.STRING,
      required: false,
      format: 'iso8601'
    },
    deviceId: {
      type: SchemaTypes.STRING,
      required: false
    }
  },
  additionalProperties: false
};

/**
 * User profile response schema
 */
export const UserProfileSchema = {
  type: SchemaTypes.OBJECT,
  required: ['id', 'email'],
  properties: {
    id: {
      type: SchemaTypes.STRING,
      required: true
    },
    email: {
      type: SchemaTypes.STRING,
      required: true,
      format: 'email'
    },
    username: {
      type: SchemaTypes.STRING,
      required: false,
      minLength: 3,
      maxLength: 50
    },
    age: {
      type: SchemaTypes.NUMBER,
      required: false,
      minimum: 13,
      maximum: 150
    },
    createdAt: {
      type: SchemaTypes.STRING,
      required: false,
      format: 'iso8601'
    },
    preferences: {
      type: SchemaTypes.OBJECT,
      required: false,
      properties: {
        language: {
          type: SchemaTypes.ENUM,
          enum: ['en', 'es', 'fr', 'de'],
          required: false
        },
        theme: {
          type: SchemaTypes.ENUM,
          enum: ['light', 'dark'],
          required: false
        },
        notifications: {
          type: SchemaTypes.BOOLEAN,
          required: false
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

/**
 * Search results response schema
 */
export const SearchResultsSchema = {
  type: SchemaTypes.OBJECT,
  required: ['results', 'total', 'page'],
  properties: {
    results: {
      type: SchemaTypes.ARRAY,
      required: true,
      items: MovieSchema,
      minItems: 0,
      maxItems: 100
    },
    total: {
      type: SchemaTypes.NUMBER,
      required: true,
      minimum: 0
    },
    page: {
      type: SchemaTypes.NUMBER,
      required: true,
      minimum: 1
    },
    pageSize: {
      type: SchemaTypes.NUMBER,
      required: false,
      minimum: 1,
      maximum: 100
    },
    hasMore: {
      type: SchemaTypes.BOOLEAN,
      required: false
    }
  },
  additionalProperties: false
};

/**
 * Activity feed response schema
 */
export const ActivityFeedSchema = {
  type: SchemaTypes.OBJECT,
  required: ['items'],
  properties: {
    items: {
      type: SchemaTypes.ARRAY,
      required: true,
      items: {
        type: SchemaTypes.OBJECT,
        required: ['id', 'type', 'timestamp'],
        properties: {
          id: {
            type: SchemaTypes.STRING,
            required: true
          },
          type: {
            type: SchemaTypes.ENUM,
            enum: ['movie_watched', 'review_posted', 'user_followed', 'rating_given'],
            required: true
          },
          timestamp: {
            type: SchemaTypes.STRING,
            required: true,
            format: 'iso8601'
          },
          movieId: {
            type: SchemaTypes.STRING,
            required: false
          },
          userId: {
            type: SchemaTypes.STRING,
            required: false
          },
          details: {
            type: SchemaTypes.OBJECT,
            required: false,
            properties: {
              rating: {
                type: SchemaTypes.NUMBER,
                required: false,
                minimum: 0,
                maximum: 10
              },
              comment: {
                type: SchemaTypes.STRING,
                required: false,
                maxLength: 500
              }
            }
          }
        },
        additionalProperties: false
      }
    },
    nextPage: {
      type: SchemaTypes.STRING,
      required: false
    }
  },
  additionalProperties: false
};

/**
 * Error response schema (for error handling validation)
 */
export const ErrorResponseSchema = {
  type: SchemaTypes.OBJECT,
  required: ['error', 'message'],
  properties: {
    error: {
      type: SchemaTypes.STRING,
      required: true
    },
    message: {
      type: SchemaTypes.STRING,
      required: true
    },
    code: {
      type: SchemaTypes.STRING,
      required: false
    },
    timestamp: {
      type: SchemaTypes.STRING,
      required: false,
      format: 'iso8601'
    },
    details: {
      type: SchemaTypes.OBJECT,
      required: false
    }
  },
  additionalProperties: false
};

/**
 * Sync status response schema
 */
export const SyncStatusSchema = {
  type: SchemaTypes.OBJECT,
  required: ['status', 'lastSync'],
  properties: {
    status: {
      type: SchemaTypes.ENUM,
      enum: ['synced', 'syncing', 'pending', 'error'],
      required: true
    },
    lastSync: {
      type: SchemaTypes.STRING,
      required: true,
      format: 'iso8601'
    },
    pendingCount: {
      type: SchemaTypes.NUMBER,
      required: false,
      minimum: 0
    },
    errorMessage: {
      type: SchemaTypes.STRING,
      required: false
    },
    device: {
      type: SchemaTypes.OBJECT,
      required: false,
      properties: {
        id: {
          type: SchemaTypes.STRING,
          required: true
        },
        name: {
          type: SchemaTypes.STRING,
          required: false
        }
      }
    }
  },
  additionalProperties: false
};

/**
 * Map of all schemas for easy registration
 */
export const AllSchemas = {
  movie: MovieSchema,
  watchProgress: WatchProgressSchema,
  userProfile: UserProfileSchema,
  searchResults: SearchResultsSchema,
  activityFeed: ActivityFeedSchema,
  errorResponse: ErrorResponseSchema,
  syncStatus: SyncStatusSchema
};

export default AllSchemas;
