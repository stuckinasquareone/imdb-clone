/**
 * Activity Feed Backend API
 * 
 * Endpoints for managing user activities with cursor-based pagination
 * 
 * This example uses Express.js and PostgreSQL
 * Modify database calls based on your actual database
 */

const express = require('express');
const cors = require('cors');
const router = express.Router();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * GET /api/activities/:userId
 * 
 * Query Parameters:
 * - limit: number of activities per page (default: 20, max: 100)
 * - cursor: pagination cursor from previous response
 * - type: filter by activity type (watch|review|rating|favorite)
 * - timeRange: filter by time (today|week|month|all)
 * 
 * Response:
 * {
 *   activities: Activity[],
 *   nextCursor: string|null,
 *   hasMore: boolean,
 *   total: number
 * }
 */
router.get('/api/activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      limit = 20,
      cursor = null,
      type = null,
      timeRange = 'all',
    } = req.query;

    // Validate inputs
    const pageSize = Math.min(parseInt(limit) || 20, 100);
    
    // Build database query
    let query = `
      SELECT 
        a.id,
        a.type,
        a.user_id,
        a.movie_id,
        a.created_at,
        a.data,
        m.title as movie_title,
        m.poster_url as movie_poster,
        m.release_year as movie_year
      FROM activities a
      LEFT JOIN movies m ON a.movie_id = m.id
      WHERE a.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    // Add type filter
    if (type) {
      paramCount++;
      query += ` AND a.type = $${paramCount}`;
      params.push(type);
    }

    // Add time range filter
    if (timeRange !== 'all') {
      paramCount++;
      const timeRangeMap = {
        today: "DATE(a.created_at) = CURRENT_DATE",
        week: "a.created_at > NOW() - INTERVAL '7 days'",
        month: "a.created_at > NOW() - INTERVAL '30 days'",
      };

      if (timeRangeMap[timeRange]) {
        query += ` AND ${timeRangeMap[timeRange]}`;
      }
    }

    // Add cursor-based pagination
    if (cursor) {
      paramCount++;
      // Assuming cursor is base64-encoded timestamp:id
      const [cursorTime, cursorId] = Buffer.from(cursor, 'base64')
        .toString()
        .split(':');
      
      query += ` AND (a.created_at < $${paramCount} OR (a.created_at = $${paramCount} AND a.id > $${paramCount + 1}))`;
      params.push(cursorTime);
      params.push(cursorId);
      paramCount += 2;
    }

    // Order by created_at descending (newest first)
    query += ` ORDER BY a.created_at DESC, a.id DESC`;

    // Fetch one extra to determine if there are more
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(pageSize + 1);

    // Execute query (adjust based on your database client)
    // const result = await db.query(query, params);
    // For this example, using mock data:
    const result = { rows: getMockActivities() };

    const activities = result.rows.slice(0, pageSize);
    const hasMore = result.rows.length > pageSize;

    // Generate next cursor
    let nextCursor = null;
    if (hasMore && activities.length > 0) {
      const lastActivity = activities[activities.length - 1];
      nextCursor = Buffer.from(
        `${lastActivity.created_at.toISOString()}:${lastActivity.id}`
      ).toString('base64');
    }

    // Format response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      movieId: activity.movie_id,
      movieTitle: activity.movie_title,
      moviePoster: activity.movie_poster,
      movieYear: activity.movie_year,
      createdAt: activity.created_at.getTime(),
      data: JSON.parse(activity.data || '{}'),
    }));

    res.json({
      activities: formattedActivities,
      nextCursor,
      hasMore,
      total: formattedActivities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      error: 'Failed to fetch activities',
      message: error.message,
    });
  }
});

/**
 * POST /api/activities
 * 
 * Create a new activity
 * 
 * Body:
 * {
 *   userId: string,
 *   type: 'watch|review|rating|favorite',
 *   movieId: string,
 *   data: object (type-specific data)
 * }
 */
router.post('/api/activities', async (req, res) => {
  try {
    const { userId, type, movieId, data } = req.body;

    // Validate required fields
    if (!userId || !type || !movieId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, movieId',
      });
    }

    // Validate activity type
    const validTypes = ['watch', 'review', 'rating', 'favorite'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Insert activity into database
    // const query = `
    //   INSERT INTO activities (user_id, type, movie_id, data, created_at)
    //   VALUES ($1, $2, $3, $4, NOW())
    //   RETURNING *
    // `;
    // const result = await db.query(query, [userId, type, movieId, JSON.stringify(data)]);

    // Mock response
    const activity = {
      id: `activity_${Date.now()}`,
      userId,
      type,
      movieId,
      data,
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      error: 'Failed to create activity',
      message: error.message,
    });
  }
});

/**
 * GET /api/activities/:userId/stats
 * 
 * Get activity statistics for a user
 */
router.get('/api/activities/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Query database for stats
    // SELECT 
    //   type,
    //   COUNT(*) as count,
    //   MAX(created_at) as last_activity
    // FROM activities
    // WHERE user_id = $1
    // GROUP BY type

    // Mock data
    const stats = {
      watch: { count: 45, lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      review: { count: 12, lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      rating: { count: 38, lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      favorite: { count: 8, lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * DELETE /api/activities/:activityId
 * 
 * Delete an activity
 */
router.delete('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;

    // Delete from database
    // await db.query('DELETE FROM activities WHERE id = $1', [activityId]);

    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      error: 'Failed to delete activity',
    });
  }
});

/**
 * Mock data generator for testing
 */
function getMockActivities() {
  const movieTitles = [
    'Avatar', 'The Dark Knight', 'Inception', 'Fight Club', 'Parasite',
    'Interstellar', 'The Matrix', 'Pulp Fiction', 'Shutter Island', 'Tenet'
  ];

  const activities = [];
  for (let i = 0; i < 50; i++) {
    const type = ['watch', 'review', 'rating', 'favorite'][Math.floor(Math.random() * 4)];
    const movieTitle = movieTitles[Math.floor(Math.random() * movieTitles.length)];

    activities.push({
      id: `activity_${i}`,
      type,
      movie_id: `movie_${i}`,
      movie_title: movieTitle,
      movie_poster: `/images/posters/${movieTitle.replace(/ /g, '_').toLowerCase()}.jpg`,
      movie_year: 2020 + Math.floor(Math.random() * 4),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      data: JSON.stringify({
        rating: type === 'rating' ? Math.floor(Math.random() * 8) + 2 : undefined,
        text: type === 'review' ? `This is an amazing movie! Really enjoyed every moment of it.` : undefined,
        watchedAt: type === 'watch' ? new Date() : undefined,
      }),
      user_id: 'user_123',
    });
  }

  return activities.sort((a, b) => b.created_at - a.created_at);
}

// Register routes
app.use('/', router);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Activity Feed API running on http://localhost:${PORT}`);
  console.log(`📊 Try: GET http://localhost:${PORT}/api/activities/user_123`);
});

module.exports = router;
