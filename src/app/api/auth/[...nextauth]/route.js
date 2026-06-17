import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Forces Google to provide a long-term refresh token during user login
          access_type: 'offline',
          prompt: 'consent',
          // Requests permission to authenticate the user and gain read/write sync access to Gmail
          scope: 'openid email profile https://mail.google.com/',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Security check: Only lets YOU access the dashboard system
    async signIn({ user }) {
      const allowedEmail = 'hellohemantpandey@gmail.com';
      if (user.email === allowedEmail) {
        return true; // Access granted
      }
      console.warn(`🛑 Unauthorized login attempt blocked for: ${user.email}`);
      return false; // Access denied instantly
    },
    // Appends profile information and tokens straight into your dashboard session object
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
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