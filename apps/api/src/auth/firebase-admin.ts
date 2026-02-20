import * as admin from 'firebase-admin';

let _auth: admin.auth.Auth | null = null;

export function getAdminAuth(): admin.auth.Auth {
  if (_auth) return _auth;

  if (admin.apps.length > 0) {
    _auth = admin.apps[0]!.auth();
    return _auth;
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!encoded) {
    throw new Error(
      'Missing required environment variable: FIREBASE_SERVICE_ACCOUNT_JSON',
    );
  }

  const json = Buffer.from(encoded, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(json) as admin.ServiceAccount;

  _auth = admin
    .initializeApp({ credential: admin.credential.cert(serviceAccount) })
    .auth();

  return _auth;
}
