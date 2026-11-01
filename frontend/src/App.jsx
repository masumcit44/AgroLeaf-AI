import React, { lazy, Suspense } from 'react';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import { useHashRoute, ROUTES } from './routes/useHashRoute.js';
import useT from './i18n/useT.js';

const AccuracyPage = lazy(() => import('./pages/AccuracyPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const DevParityPage = lazy(() => import('./pages/DevParityPage.jsx'));

function PageFallback() {
  const { t } = useT();
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-gray-400 text-xs sm:text-sm">
      <div className="w-5 h-5 border-2 border-leaf-700 border-t-transparent rounded-full animate-spin mr-2" />
      <span>{t('pageLoading')}</span>
    </div>
  );
}

function AppContent() {
  const { route, navigate } = useHashRoute();

  const renderPage = () => {
    switch (route) {
      case ROUTES.ACCURACY:
        return (
          <Suspense fallback={<PageFallback />}>
            <AccuracyPage />
          </Suspense>
        );
      case ROUTES.ABOUT:
        return (
          <Suspense fallback={<PageFallback />}>
            <AboutPage />
          </Suspense>
        );
      case ROUTES.DEV_PARITY: {
        const isDevAllowed =
          Boolean(import.meta.env?.DEV) ||
          (typeof window !== 'undefined' && window.location.search.includes('dev=1'));
        return isDevAllowed ? (
          <Suspense fallback={<PageFallback />}>
            <DevParityPage />
          </Suspense>
        ) : (
          <HomePage />
        );
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
