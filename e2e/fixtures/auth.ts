import { test as base, type Page } from '@playwright/test';

interface AuthFixtures {
  authToken: string;
  authenticatedPage: Page;
}

async function getFirebaseIdToken(): Promise<string> {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!email || !password || !apiKey) {
    throw new Error(
      'Missing E2E auth env vars: E2E_USER_EMAIL, E2E_USER_PASSWORD, FIREBASE_API_KEY',
    );
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firebase auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}

export const test = base.extend<AuthFixtures>({
  authToken: async ({}, use) => {
    const token = await getFirebaseIdToken();
    await use(token);
  },

  authenticatedPage: async ({ page, authToken }, use) => {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    // Intercept all API requests to inject the auth token header.
    // This bypasses the need for Firebase SDK auth state in the browser
    // while still testing real API calls with a valid Firebase token.
    await page.route(`${apiBaseUrl}/**`, async (route) => {
      const headers = {
        ...route.request().headers(),
        Authorization: `Bearer ${authToken}`,
      };
      await route.continue({ headers });
    });

    // Navigate to the app and sign in using Firebase SDK in-browser
    const webBaseUrl = process.env.WEB_BASE_URL || 'http://localhost:5173';
    await page.goto(webBaseUrl);

    // Wait for the login page to appear, then sign in via Firebase SDK
    // that's already loaded in the app bundle
    await page.waitForSelector('.login-btn', { timeout: 15_000 });

    const email = process.env.E2E_USER_EMAIL!;
    const password = process.env.E2E_USER_PASSWORD!;

    await page.evaluate(
      async ({ email, password }) => {
        const signIn = (
          globalThis as {
            __RIDEMYCITY_E2E_SIGN_IN__?: (
              email: string,
              password: string,
            ) => Promise<void>;
          }
        ).__RIDEMYCITY_E2E_SIGN_IN__;
        if (!signIn) {
          throw new Error(
            'Missing E2E sign-in hook. Ensure web app runs with VITE_E2E=true.',
          );
        }
        await signIn(email, password);
      },
      { email, password },
    );

    // Wait for the app to transition from LoginPage to MapPage
    await page.waitForSelector('.map-container', { timeout: 15_000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
