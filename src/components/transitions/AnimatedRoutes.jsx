import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

/**
 * AnimatedRoutes replaces the standard <Routes> block for authenticated pages.
 *
 * It uses React Router's useLocation to key route changes and
 * framer-motion's AnimatePresence to animate mount/unmount transitions.
 *
 * Props:
 *   - routes: Array of { path, element } objects
 *   - fallback: Element to render for unmatched routes (404)
 */
export default function AnimatedRoutes({ routes, fallback }) {
  const location = useLocation();

  // Extract the base path segment for keying transitions.
  // This prevents re-animating when only query params change,
  // and groups sub-routes (e.g. /AccountView?id=1 and /AccountView?id=2)
  // under the same key so they don't trigger page transitions for same-page nav.
  const locationKey = location.pathname;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={locationKey}>
        {routes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<PageTransition>{element}</PageTransition>}
          />
        ))}
        {fallback && (
          <Route
            path="*"
            element={<PageTransition>{fallback}</PageTransition>}
          />
        )}
      </Routes>
    </AnimatePresence>
  );
}
