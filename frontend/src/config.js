// This file centralizes our API configuration.
// By default, Vercel may not have VITE_API_URL set, which would default to localhost and break the live site.
// We explicitly check if we are in development mode to use localhost, otherwise we use the live Render backend.

const isDevelopment = import.meta.env.MODE === 'development';
export const API_URL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:5000/api' : 'https://stock-tracker-project-1.onrender.com/api');
