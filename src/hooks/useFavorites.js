import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('durgapuja_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load favorites', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('durgapuja_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (pandalId) => {
    setFavorites((prev) => {
      if (prev.includes(pandalId)) {
        return prev.filter((id) => id !== pandalId);
      } else {
        return [...prev, pandalId];
      }
    });
  };

  const isFavorite = (pandalId) => favorites.includes(pandalId);

  return { favorites, toggleFavorite, isFavorite };
}
