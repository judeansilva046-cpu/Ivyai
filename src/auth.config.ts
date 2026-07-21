// DeliveryHub — config de auth compatível com Edge (middleware)
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const publicPaths = [
        "/login",
        "/registro",
        "/api/auth",
        "/api/registro",
        "/api/health",
      ];

      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      );

      if (isPublic) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.organizationName = (user as { organizationName?: string }).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "operador");
        session.user.organizationId = String(token.organizationId || "");
        session.user.organizationName = String(token.organizationName || "");
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
