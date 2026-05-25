if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is not defined. Configure it in Netlify or .env files.');
}
export const API_BASE_URL = import.meta.env.VITE_API_URL;