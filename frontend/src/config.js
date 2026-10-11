// Central API configuration — driven by VITE_API_URL env var
// Set VITE_API_URL in your .env or Vercel environment variables to point at your deployed backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
