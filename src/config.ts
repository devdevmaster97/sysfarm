// API Configuration
const isProduction = window.location.hostname !== 'localhost';
export const API_URL = isProduction
  ? ''
  : 'http://localhost:3000';
