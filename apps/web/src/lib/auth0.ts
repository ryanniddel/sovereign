/**
 * Auth0 configuration scaffolding for Sovereign web app.
 * Will be configured with NextAuth.js Auth0 provider.
 */

export const auth0Config = {
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  secret: process.env.NEXTAUTH_SECRET,
};
