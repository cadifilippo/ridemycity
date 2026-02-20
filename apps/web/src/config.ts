const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('Missing required env variable: VITE_API_BASE_URL');
}

export const config = {
  apiBaseUrl: apiBaseUrl as string,
} as const;
 