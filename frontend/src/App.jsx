import React from 'react';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AccuracyPage from './pages/AccuracyPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import DevParityPage from './pages/DevParityPage.jsx';
import { useHashRoute, ROUTES } from './routes/useHashRoute.js';

function AppContent() {
  const { route, navigate } = useHashRoute();

  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const updateMetrics = () => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        document.title = `SW:${sw}_IW:${iw}`;
      };
      updateMetrics();
      const t = setTimeout(updateMetrics, 500);
      return () => clearTimeout(t);
    }
  });

  const renderPage = () => {
    switch (route) {
      case ROUTES.ACCURACY:
        return <AccuracyPage />;
      case ROUTES.ABOUT:
        return <AboutPage />;
      case ROUTES.DEV_PARITY: {
        const isDevAllowed =
          Boolean(import.meta.env?.DEV) ||
          (typeof window !== 'undefined' && window.location.search.includes('dev=1'));
        return isDevAllowed ? <DevParityPage /> : <HomePage />;
      }
      case ROUTES.HOME:
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-leaf-50 selection:text-leaf-700">
      <Navbar currentRoute={route} onNavigate={navigate} />
      <div className="flex-1 flex flex-col">
        {renderPage()}
      </div>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
