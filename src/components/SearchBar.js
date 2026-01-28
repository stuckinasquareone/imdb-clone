import React, { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Debounce function to delay API calls
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // If query is empty, clear suggestions
    if (query.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Only fetch if query has 2 or more characters
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Set a new timer for debouncing (300ms delay)
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    setDebounceTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [query]);

  // Fetch suggestions from Datamuse API
  const fetchSuggestions = async (searchQuery) => {
    try {
      setLoading(true);
      // Datamuse API - words that start with the search query
      const response = await fetch(
        `https://api.datamuse.com/sug?s=${encodeURIComponent(searchQuery)}&max=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.word);
    setIsOpen(false);
    setSuggestions([]);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur (close dropdown after delay to allow click)
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle clear button click
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="search-bar-container">
      <div className="search-wrapper">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search for a word... (min 2 characters)"
            className="search-input"
            autoComplete="off"
          />
          {query && (
            <button onClick={handleClear} className="clear-button" title="Clear search">
              ✕
            </button>
          )}
          {loading && <span className="loading-spinner">⟳</span>}
        </div>

        {/* Dropdown suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-text">{suggestion.word}</span>
                {suggestion.score && (
                  <span className="suggestion-score">Score: {suggestion.score}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {isOpen && suggestions.length === 0 && query.trim().length >= 2 && !loading && (
          <div className="suggestions-dropdown">
            <div className="no-results">No suggestions found</div>
          </div>
        )}

        {/* Loading indicator in dropdown */}
        {loading && query.trim().length >= 2 && (
          <div className="suggestions-dropdown">
            <div className="loading-message">Loading suggestions...</div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="search-info">
        <p>💡 Tip: Type at least 2 characters to see word suggestions from the Datamuse API</p>
        {query && (
          <p className="search-result">
            Searching for: <strong>{query}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
