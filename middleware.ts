import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/politica/:path*',
    '/pc/:path*',
    '/inbox/:path*',
    '/chat/:path*',
    '/usability-test/:path*',
  ],
};
