import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/transitions/PageTransition';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import { OfflineProvider } from '@/lib/OfflineContext';
import NetworkToast from '@/components/offline/NetworkToast';
import ConflictDialog from '@/components/offline/ConflictDialog';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/**
 * AnimatedPageContent renders the animated Routes inside the persistent Layout.
 * The Layout (sidebar, header, footer) stays mounted and static,
 * while only the page content fades/slides with each route change.
 */
const AnimatedPageContent = () => {
  const location = useLocation();

  // Determine the current page name from the path for the Layout's active nav highlight
  const pathname = location.pathname;
  let currentPageName = mainPageKey;
  if (pathname !== '/') {
    const segment = pathname.replace(/^\//, '').split('/')[0];
    const matchedKey = Object.keys(Pages).find(
      key => key.toLowerCase() === segment.toLowerCase()
    );
    if (matchedKey) {
      currentPageName = matchedKey;
    }
  }

  return (
    <LayoutWrapper currentPageName={currentPageName}>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<MainPage />} />
            {Object.entries(Pages).map(([path, Page]) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<Page />}
              />
            ))}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </LayoutWrapper>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AnimatedPageContent />;
};


// SyncTrigger component that activates the sync hook
function SyncTrigger() {
  useOfflineSync();
  return null;
}

function App() {

  return (
    <OfflineProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SyncTrigger />
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Router>
          <Toaster />
          <NetworkToast />
          <ConflictDialog />
        </QueryClientProvider>
      </AuthProvider>
    </OfflineProvider>
  )
}

function LoginRoute() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageTransition>
      <Login />
    </PageTransition>
  );
}

export default App
