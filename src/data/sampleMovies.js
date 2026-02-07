/**
 * Sample Movie Data
 * Static data for development and testing
 */

export const sampleMovies = [
  {
    id: 1,
    title: 'The Inception',
    releaseYear: 2010,
    rating: 8.8,
    poster: 'https://via.placeholder.com/300x450?text=Inception',
    genre: ['Sci-Fi', 'Thriller'],
    director: 'Christopher Nolan',
    synopsis: 'A thief who steals corporate secrets through dream-sharing technology.',
    runtime: 148,
    votes: 2289234
  },
  {
    id: 2,
    title: 'The Dark Knight',
    releaseYear: 2008,
    rating: 9.0,
    poster: 'https://via.placeholder.com/300x450?text=The+Dark+Knight',
    genre: ['Action', 'Crime', 'Drama'],
    director: 'Christopher Nolan',
    synopsis: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.',
    runtime: 152,
    votes: 2615652
  },
  {
    id: 3,
    title: 'Interstellar',
    releaseYear: 2014,
    rating: 8.6,
    poster: 'https://via.placeholder.com/300x450?text=Interstellar',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    director: 'Christopher Nolan',
    synopsis: 'A team of astronauts travels through a wormhole in search of a new habitable planet.',
    runtime: 169,
    votes: 1889455
  },
  {
    id: 4,
    title: 'Pulp Fiction',
    releaseYear: 1994,
    rating: 8.9,
    poster: 'https://via.placeholder.com/300x450?text=Pulp+Fiction',
    genre: ['Crime', 'Drama'],
    director: 'Quentin Tarantino',
    synopsis: 'Multiple interconnected stories of LA mobsters, fringe players, and other deviants.',
    runtime: 154,
    votes: 1901892
  },
  {
    id: 5,
    title: 'The Shawshank Redemption',
    releaseYear: 1994,
    rating: 9.3,
    poster: 'https://via.placeholder.com/300x450?text=Shawshank',
    genre: ['Drama'],
    director: 'Frank Darabont',
    synopsis: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.',
    runtime: 142,
    votes: 2530912
  },
  {
    id: 6,
    title: 'Forrest Gump',
    releaseYear: 1994,
    rating: 8.8,
    poster: 'https://via.placeholder.com/300x450?text=Forrest+Gump',
    genre: ['Drama', 'Romance'],
    director: 'Robert Zemeckis',
    synopsis: 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.',
    runtime: 142,
    votes: 1831012
  },
  {
    id: 7,
    title: 'The Matrix',
    releaseYear: 1999,
    rating: 8.7,
    poster: 'https://via.placeholder.com/300x450?text=The+Matrix',
    genre: ['Action', 'Sci-Fi'],
    director: 'Lana Wachowski, Lilly Wachowski',
    synopsis: 'A computer programmer discovers that his world is a simulated reality.',
    runtime: 136,
    votes: 1572348
  },
  {
    id: 8,
    title: 'Gladiator',
    releaseYear: 2000,
    rating: 8.5,
    poster: 'https://via.placeholder.com/300x450?text=Gladiator',
    genre: ['Action', 'Drama', 'History'],
    director: 'Ridley Scott',
    synopsis: 'A former Roman General sets out to exact vengeance against the Emperor.',
    runtime: 155,
    votes: 1289234
  },
  {
    id: 9,
    title: 'The Godfather',
    releaseYear: 1972,
    rating: 9.2,
    poster: 'https://via.placeholder.com/300x450?text=The+Godfather',
    genre: ['Crime', 'Drama'],
    director: 'Francis Ford Coppola',
    synopsis: 'The aging patriarch of an organized crime dynasty transfers control to his youngest son.',
    runtime: 175,
    votes: 1749234
  },
  {
    id: 10,
    title: 'Avatar',
    releaseYear: 2009,
    rating: 7.8,
    poster: 'https://via.placeholder.com/300x450?text=Avatar',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    director: 'James Cameron',
    synopsis: 'A paralyzed Marine dispatched to the moon Pandora on a unique mission.',
    runtime: 162,
    votes: 1289345
  }
];

/**
 * Get a random subset of movies
 */
export function getRandomMovies(count = 6) {
  return sampleMovies
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, sampleMovies.length));
}

/**
 * Get movie by ID
 */
export function getMovieById(id) {
  return sampleMovies.find(movie => movie.id === id);
}

/**
 * Filter movies by genre
 */
export function filterMoviesByGenre(genre) {
  return sampleMovies.filter(movie => movie.genre.includes(genre));
}

/**
 * Get top-rated movies
 */
export function getTopRatedMovies(limit = 5) {
  return [...sampleMovies]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
