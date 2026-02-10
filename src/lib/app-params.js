/**
 * Application parameters.
 * In development, the Vite dev proxy forwards /api to the backend.
 * In production, the Express server serves both static files and API routes
 * from the same origin, so apiBaseUrl is just '/api'.
 */
export const appParams = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
};
