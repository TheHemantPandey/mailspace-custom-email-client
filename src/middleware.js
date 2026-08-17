import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ALLOWED_EMAILS = [
  'hement.pandey2121@gmail.com',
  'hellohemantpandey@gmail.com',
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const email = token?.email?.toLowerCase().trim();

    if (!email || !ALLOWED_EMAILS.includes(email)) {
      const url = req.nextUrl.clone();
      url.pathname = '/api/auth/signin';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (!token?.email) return false;
        const email = token.email.toLowerCase().trim();
        return ALLOWED_EMAILS.includes(email);
      },
    },
    pages: {
      signIn: '/api/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (NextAuth authentication endpoints)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
