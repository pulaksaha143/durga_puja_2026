import { useState, useEffect } from 'react';

// Shared global state
let globalFavorites = [];
const listeners = new Set();

// Initialize from localStorage once
try {
  const stored = localStorage.getItem('durgapuja_favorites');
  if (stored) {
    globalFavorites = JSON.parse(stored);
  }
} catch (error) {
  console.error('Failed to load favorites', error);
}

const updateFavorites = (newFavorites) => {
  globalFavorites = newFavorites;
  localStorage.setItem('durgapuja_favorites', JSON.stringify(globalFavorites));
  listeners.forEach(listener => listener(globalFavorites));
};

export function useFavorites() {
  const [favorites, setFavorites] = useState(globalFavorites);

  useEffect(() => {
    // Sync if globalFavorites changed before effect ran
    if (globalFavorites !== favorites) {
      setFavorites(globalFavorites);
    }
    listeners.add(setFavorites);
    return () => listeners.delete(setFavorites);
  }, [favorites]);

  const toggleFavorite = (pandalId) => {
    let nextFavorites;
    if (globalFavorites.includes(pandalId)) {
      nextFavorites = globalFavorites.filter((id) => id !== pandalId);
    } else {
      nextFavorites = [...globalFavorites, pandalId];
    }
    updateFavorites(nextFavorites);
  };

  const addMultipleFavorites = (pandalIds) => {
    const newSet = new Set([...globalFavorites, ...pandalIds]);
    updateFavorites(Array.from(newSet));
  };

  const isFavorite = (pandalId) => favorites.includes(pandalId);

  return { favorites, toggleFavorite, isFavorite, addMultipleFavorites };
}
