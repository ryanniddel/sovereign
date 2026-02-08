import { registerAs } from '@nestjs/config';

export default registerAs('auth0', () => ({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  audience: process.env.AUTH0_AUDIENCE,
  callbackUrl: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/api/auth/callback',
}));
