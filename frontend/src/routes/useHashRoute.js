import { useState, useEffect } from 'react';

export const ROUTES = {
  HOME: '#/',
  ACCURACY: '#/accuracy',
  ABOUT: '#/about',
};

function normalizeHash(hash) {
  if (!hash || hash === '#' || hash === '#/') {
    return ROUTES.HOME;
  }
  if (hash.startsWith('#/')) {
    return hash;
  }
  return `#/${hash.replace(/^#/, '')}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => normalizeHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(normalizeHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newRoute) => {
    window.location.hash = newRoute;
  };

  return { route, navigate };
}
