export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/(app)/:path*', '/dashboard/:path*', '/calendar/:path*', '/meetings/:path*', '/accountability/:path*', '/contacts/:path*', '/closeout/:path*', '/briefings/:path*', '/focus-modes/:path*', '/escalation/:path*', '/notifications/:path*', '/settings/:path*'],
};
