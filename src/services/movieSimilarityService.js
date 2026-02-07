/**
 * Movie Similarity Service
 * Calculates similarity metrics between two movies across multiple dimensions.
 * Provides detailed breakdown of genre, actor, director, and popularity correlations.
 */

/**
 * Calculate Jaccard similarity (set intersection over union)
 * Used for genre, actor, and director overlap
 */
function calculateJaccardSimilarity(set1, set2) {
  if (!set1 || !set2 || set1.length === 0 || set2.length === 0) {
    return 0;
  }

  const s1 = new Set(set1.map(item => (typeof item === 'string' ? item.toLowerCase() : item)));
  const s2 = new Set(set2.map(item => (typeof item === 'string' ? item.toLowerCase() : item)));

  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate Pearson correlation between two arrays
 * Used for comparing popularity scores, ratings, etc.
 */
function calculatePearsonCorrelation(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
    return 0;
  }

  const n = Math.min(arr1.length, arr2.length);
  if (n < 2) return 0;

  const mean1 = arr1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denominator1 * denominator2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Normalize a value between 0 and 1
 */
function normalizeScore(value, min = 0, max = 10) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate popularity correlation based on audience demographics and ratings
 */
function calculatePopularityCorrelation(movie1, movie2) {
  // Compare ratings
  const ratingDiff = Math.abs((movie1.rating || 0) - (movie2.rating || 0)) / 10;
  const ratingScore = 1 - ratingDiff;

  // Compare popularity indices
  const popularityDiff = Math.abs((movie1.popularity || 0) - (movie2.popularity || 0));
  const popularityScore = Math.max(0, 1 - popularityDiff / 100);

  // Compare year (movies from similar eras tend to appeal to similar audiences)
  const yearDiff = Math.abs((movie1.year || 2000) - (movie2.year || 2000));
  const yearScore = Math.max(0, 1 - yearDiff / 30);

  // Weighted average
  return (ratingScore * 0.4 + popularityScore * 0.35 + yearScore * 0.25);
}

/**
 * Find matching items with detailed information
 */
function findMatches(items1, items2) {
  if (!items1 || !items2) return { matches: [], onlyIn1: [], onlyIn2: [] };

  const set2 = new Set(items2.map(item => {
    const key = typeof item === 'object' ? item.name : item;
    return key.toLowerCase();
  }));

  const matches = [];
  const onlyIn1 = [];

  for (const item1 of items1) {
    const key1 = typeof item1 === 'object' ? item1.name : item1;
    const lowerKey1 = key1.toLowerCase();

    if (set2.has(lowerKey1)) {
      matches.push({
        name: key1,
        source: item1
      });
    } else {
      onlyIn1.push(key1);
    }
  }

  const set1 = new Set(items1.map(item => {
    const key = typeof item === 'object' ? item.name : item;
    return key.toLowerCase();
  }));

  const onlyIn2 = [];
  for (const item2 of items2) {
    const key2 = typeof item2 === 'object' ? item2.name : item2;
    if (!set1.has(key2.toLowerCase())) {
      onlyIn2.push(key2);
    }
  }

  return { matches, onlyIn1, onlyIn2 };
}

/**
 * Main similarity calculation function
 */
export function calculateMovieSimilarity(movie1, movie2) {
  if (!movie1 || !movie2) {
    throw new Error('Both movies are required for similarity calculation');
  }

  // Genre similarity
  const genreSimilarity = calculateJaccardSimilarity(
    movie1.genres || [],
    movie2.genres || []
  );
  const genreMatches = findMatches(movie1.genres || [], movie2.genres || []);

  // Director similarity
  const directorSimilarity = calculateJaccardSimilarity(
    movie1.directors ? [movie1.directors].flat() : [],
    movie2.directors ? [movie2.directors].flat() : []
  );
  const directorMatches = findMatches(
    movie1.directors ? [movie1.directors].flat() : [],
    movie2.directors ? [movie2.directors].flat() : []
  );

  // Actor/Cast similarity
  const actorSimilarity = calculateJaccardSimilarity(
    movie1.cast || [],
    movie2.cast || []
  );
  const actorMatches = findMatches(movie1.cast || [], movie2.cast || []);

  // Popularity correlation (based on rating, popularity index, and release year)
  const popularityCorrelation = calculatePopularityCorrelation(movie1, movie2);

  // Calculate overall similarity (weighted average)
  const overallSimilarity =
    genreSimilarity * 0.35 +
    actorSimilarity * 0.25 +
    directorSimilarity * 0.2 +
    popularityCorrelation * 0.2;

  // Determine similarity level
  let similarityLevel = 'very_different';
  if (overallSimilarity >= 0.75) {
    similarityLevel = 'highly_similar';
  } else if (overallSimilarity >= 0.55) {
    similarityLevel = 'similar';
  } else if (overallSimilarity >= 0.35) {
    similarityLevel = 'somewhat_similar';
  } else if (overallSimilarity >= 0.15) {
    similarityLevel = 'slightly_similar';
  }

  return {
    // Overall metrics
    overallSimilarity: Math.round(overallSimilarity * 100),
    similarityLevel,

    // Genre analysis
    genres: {
      score: Math.round(genreSimilarity * 100),
      matches: genreMatches.matches.map(m => m.name),
      onlyInMovie1: genreMatches.onlyIn1,
      onlyInMovie2: genreMatches.onlyIn2,
      totalMatches: genreMatches.matches.length,
      totalGenresMovie1: (movie1.genres || []).length,
      totalGenresMovie2: (movie2.genres || []).length
    },

    // Director analysis
    director: {
      score: Math.round(directorSimilarity * 100),
      matches: directorMatches.matches.map(m => m.name),
      onlyInMovie1: directorMatches.onlyIn1,
      onlyInMovie2: directorMatches.onlyIn2,
      hasMatch: directorMatches.matches.length > 0
    },

    // Cast/Actor analysis
    cast: {
      score: Math.round(actorSimilarity * 100),
      matches: actorMatches.matches.map(m => m.name).slice(0, 5), // Top 5 matches
      matchCount: actorMatches.matches.length,
      onlyInMovie1: actorMatches.onlyIn1.slice(0, 3),
      onlyInMovie2: actorMatches.onlyIn2.slice(0, 3),
      totalCastMovie1: (movie1.cast || []).length,
      totalCastMovie2: (movie2.cast || []).length
    },

    // Popularity correlation
    popularity: {
      score: Math.round(popularityCorrelation * 100),
      movie1Rating: movie1.rating || 0,
      movie2Rating: movie2.rating || 0,
      ratingDifference: Math.abs((movie1.rating || 0) - (movie2.rating || 0)),
      movie1Popularity: movie1.popularity || 0,
      movie2Popularity: movie2.popularity || 0,
      yearDifference: Math.abs((movie1.year || 2000) - (movie2.year || 2000))
    },

    // Recommendation strength
    recommendationStrength: calculateRecommendationStrength(
      overallSimilarity,
      genreSimilarity,
      actorSimilarity,
      directorSimilarity
    ),

    // Explanation text
    explanation: generateExplanation(
      overallSimilarity,
      genreMatches,
      directorMatches,
      actorMatches,
      popularityCorrelation
    )
  };
}

/**
 * Calculate how strong the recommendation is based on similarity factors
 */
function calculateRecommendationStrength(overall, genre, actor, director) {
  const weights = {
    highGenreMatch: genre >= 0.5 ? 2 : 0,
    sharedActors: actor >= 0.3 ? 1.5 : 0,
    sharedDirector: director >= 0.5 ? 2 : 0,
    overallScore: overall * 2
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const strength = total / 7.5; // Normalize

  if (strength >= 0.8) return 'very_strong';
  if (strength >= 0.6) return 'strong';
  if (strength >= 0.4) return 'moderate';
  return 'weak';
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(overall, genreMatches, directorMatches, actorMatches, popularity) {
  const reasons = [];

  if (genreMatches.matches.length > 0) {
    reasons.push(
      `Both are ${genreMatches.matches.map(m => m.name).join(' and ')} films`
    );
  }

  if (directorMatches.matches.length > 0) {
    reasons.push(
      `Directed by ${directorMatches.matches.map(m => m.name).join(' and ')}`
    );
  }

  if (actorMatches.matches.length >= 2) {
    reasons.push(
      `Share ${actorMatches.matches.length} cast members`
    );
  } else if (actorMatches.matches.length === 1) {
    reasons.push(`Both feature ${actorMatches.matches[0]}`);
  }

  if (popularity >= 0.7) {
    reasons.push('Appeal to similar audience demographics');
  }

  return reasons.length > 0
    ? reasons.join('. ') + '.'
    : 'These movies share some qualities that might appeal to fans of either film.';
}

/**
 * Compare multiple movies against a base movie
 */
export function findSimilarMovies(baseMovie, movieList, limit = 5) {
  if (!baseMovie || !movieList || movieList.length === 0) {
    return [];
  }

  const similarities = movieList
    .filter(movie => movie.id !== baseMovie.id)
    .map(movie => ({
      movie,
      similarity: calculateMovieSimilarity(baseMovie, movie)
    }))
    .sort((a, b) => b.similarity.overallSimilarity - a.similarity.overallSimilarity)
    .slice(0, limit);

  return similarities;
}

export default {
  calculateMovieSimilarity,
  findSimilarMovies,
  calculateJaccardSimilarity,
  calculatePearsonCorrelation,
  normalizeScore
};
