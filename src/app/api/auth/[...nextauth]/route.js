import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const ALLOWED_EMAILS = [
  'hement.pandey2121@gmail.com',
  'hellohemantpandey@gmail.com',
];

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile https://mail.google.com/',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Security check: Only lets authorized whitelisted users access the system
    async signIn({ user, profile }) {
      const email = (user?.email || profile?.email || '').toLowerCase().trim();
      if (ALLOWED_EMAILS.includes(email)) {
        return true; // Access granted
      }
      console.warn(`🛑 Unauthorized login attempt blocked for: ${email}`);
      return false; // Access denied instantly
    },
    // Appends profile information and tokens straight into your dashboard session object
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user?.email) {
        token.email = user.email.toLowerCase().trim();
      }
      return token;
    },
    async session({ session, token }) {
      const sessionEmail = (session.user?.email || token.email || '').toLowerCase().trim();
      if (session.user && !ALLOWED_EMAILS.includes(sessionEmail)) {
        console.warn(`🛑 Invalid session detected for: ${sessionEmail}`);
        session.user = null;
        return session;
      }
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    signIn: '/', // If unauthenticated, bounce users back to the landing page
    error: '/',  
  },
};

const handler = NextAuth(authOptions);

// Next.js App Router requires explicitly defining the HTTP methods exported
export { handler as GET, handler as POST };