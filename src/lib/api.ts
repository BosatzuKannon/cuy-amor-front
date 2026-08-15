import { create } from 'axios';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'Missing API configuration. Set EXPO_PUBLIC_API_URL in your .env file.',
  );
}

export const api = create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});