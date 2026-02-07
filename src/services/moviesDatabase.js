/**
 * Movie data configuration with content ratings.
 * Includes age gating for adult content.
 */
export const MOVIES_DATABASE = {
  movie_shawshank: {
    id: 'movie_shawshank',
    title: 'The Shawshank Redemption',
    rating: 'PG-13',
    isAdultContent: false,
    description: 'Two imprisoned men bond over a number of years...',
    year: 1994,
  },
  movie_godfather: {
    id: 'movie_godfather',
    title: 'The Godfather',
    rating: 'R',
    isAdultContent: true,
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.',
    year: 1972,
  },
  movie_inception: {
    id: 'movie_inception',
    title: 'Inception',
    rating: 'PG-13',
    isAdultContent: false,
    description: 'A skilled thief who steals corporate secrets through dream-sharing technology...',
    year: 2010,
  },
  movie_dark_knight: {
    id: 'movie_dark_knight',
    title: 'The Dark Knight',
    rating: 'PG-13',
    isAdultContent: false,
    description: 'Batman faces off against the Joker in Gotham City.',
    year: 2008,
  },
  movie_pulp_fiction: {
    id: 'movie_pulp_fiction',
    title: 'Pulp Fiction',
    rating: 'R',
    isAdultContent: true,
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    year: 1994,
  },
};

/**
 * Get movie metadata by ID.
 * @param {string} movieId - The movie ID
 * @returns {Object} Movie metadata
 */
export function getMovieMetadata(movieId) {
  return MOVIES_DATABASE[movieId] || null;
}

/**
 * Check if a movie is marked as adult content (18+).
 * @param {string} movieId - The movie ID
 * @returns {boolean} True if movie is adult content
 */
export function isAdultContent(movieId) {
  const movie = getMovieMetadata(movieId);
  return movie ? movie.isAdultContent : false;
}

/**
 * Get all movies with their content ratings.
 * @returns {Array} Array of movie objects
 */
export function getAllMovies() {
  return Object.values(MOVIES_DATABASE);
}

/**
 * Filter movies by content type.
 * @param {boolean} adultOnly - If true, return only adult content; if false, only all-ages
 * @returns {Array} Filtered movie objects
 */
export function getMoviesByContentType(adultOnly = false) {
  return getAllMovies().filter((movie) => movie.isAdultContent === adultOnly);
}

export default MOVIES_DATABASE;
