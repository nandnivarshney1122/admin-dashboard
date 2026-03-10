// src/config.ts

// Looks for the Netlify variable "VITE_API_URL"
// If not found, defaults to your local backend
const API_URL = import.meta.env.VITE_API_URL || "";

export default API_URL;