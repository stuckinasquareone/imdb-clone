import {
  MOVIES_DATABASE,
  getMovieMetadata,
  isAdultContent,
  getAllMovies,
  getMoviesByContentType,
} from '../moviesDatabase';

describe('Movies Database', () => {
  describe('Movie Data Structure', () => {
    test('all movies have required fields', () => {
      Object.values(MOVIES_DATABASE).forEach((movie) => {
        expect(movie).toHaveProperty('id');
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('rating');
        expect(movie).toHaveProperty('isAdultContent');
        expect(movie).toHaveProperty('description');
        expect(movie).toHaveProperty('year');
      });
    });

    test('all isAdultContent values are boolean', () => {
      Object.values(MOVIES_DATABASE).forEach((movie) => {
        expect(typeof movie.isAdultContent).toBe('boolean');
      });
    });
  });

  describe('getMovieMetadata', () => {
    test('returns correct metadata for valid movie ID', () => {
      const movie = getMovieMetadata('movie_shawshank');
      expect(movie).toBeTruthy();
      expect(movie.id).toBe('movie_shawshank');
      expect(movie.title).toBe('The Shawshank Redemption');
    });

    test('returns null for invalid movie ID', () => {
      const movie = getMovieMetadata('invalid_id');
      expect(movie).toBeNull();
    });

    test('returns all expected properties', () => {
      const movie = getMovieMetadata('movie_inception');
      expect(movie).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          rating: expect.any(String),
          isAdultContent: expect.any(Boolean),
          description: expect.any(String),
          year: expect.any(Number),
        })
      );
    });
  });

  describe('isAdultContent', () => {
    test('returns true for adult content movies', () => {
      expect(isAdultContent('movie_godfather')).toBe(true);
      expect(isAdultContent('movie_pulp_fiction')).toBe(true);
    });

    test('returns false for all-ages movies', () => {
      expect(isAdultContent('movie_shawshank')).toBe(false);
      expect(isAdultContent('movie_inception')).toBe(false);
      expect(isAdultContent('movie_dark_knight')).toBe(false);
    });

    test('returns false for invalid movie ID', () => {
      expect(isAdultContent('invalid_id')).toBe(false);
    });
  });

  describe('getAllMovies', () => {
    test('returns array of all movies', () => {
      const movies = getAllMovies();
      expect(Array.isArray(movies)).toBe(true);
      expect(movies.length).toBeGreaterThan(0);
    });

    test('includes all movies from database', () => {
      const movies = getAllMovies();
      const ids = movies.map((m) => m.id);

      expect(ids).toContain('movie_shawshank');
      expect(ids).toContain('movie_godfather');
      expect(ids).toContain('movie_inception');
      expect(ids).toContain('movie_dark_knight');
      expect(ids).toContain('movie_pulp_fiction');
    });
  });

  describe('getMoviesByContentType', () => {
    test('returns only adult content when adultOnly=true', () => {
      const adultMovies = getMoviesByContentType(true);
      adultMovies.forEach((movie) => {
        expect(movie.isAdultContent).toBe(true);
      });
    });

    test('returns only all-ages content when adultOnly=false', () => {
      const allAgesMovies = getMoviesByContentType(false);
      allAgesMovies.forEach((movie) => {
        expect(movie.isAdultContent).toBe(false);
      });
    });

    test('returns correct count of adult movies', () => {
      const adultMovies = getMoviesByContentType(true);
      expect(adultMovies.length).toBe(2); // Godfather and Pulp Fiction
    });

    test('returns correct count of all-ages movies', () => {
      const allAgesMovies = getMoviesByContentType(false);
      expect(allAgesMovies.length).toBe(3); // Shawshank, Inception, Dark Knight
    });

    test('total movies equals sum of both content types', () => {
      const adult = getMoviesByContentType(true);
      const allAges = getMoviesByContentType(false);
      const total = getAllMovies();

      expect(adult.length + allAges.length).toBe(total.length);
    });
  });

  describe('Content Ratings', () => {
    test('adult content has R rating', () => {
      const movie = getMovieMetadata('movie_godfather');
      expect(movie.rating).toBe('R');
    });

    test('all-ages content has appropriate ratings', () => {
      const shawshank = getMovieMetadata('movie_shawshank');
      const inception = getMovieMetadata('movie_inception');
      const darkKnight = getMovieMetadata('movie_dark_knight');

      expect(['PG-13', 'PG', 'G'].includes(shawshank.rating)).toBe(true);
      expect(['PG-13', 'PG', 'G'].includes(inception.rating)).toBe(true);
      expect(['PG-13', 'PG', 'G'].includes(darkKnight.rating)).toBe(true);
    });
  });
});
