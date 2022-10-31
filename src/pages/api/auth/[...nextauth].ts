import NextAuth, { type NextAuthOptions } from "next-auth";
import StravaProvider from "next-auth/providers/strava";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";
import type { Athlete } from "@prisma/client";


export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    StravaProvider({
      clientId: env.STRAVA_CLIENT_ID,
      clientSecret: env.STRAVA_CLIENT_SECRET,
      authorization: { params: { scope: 'activity:read' } },
      // Drop the nested athlete object
      // https://github.com/nextauthjs/next-auth/discussions/5279
      token: {
        async request({ client, params, checks, provider }) {
          const { token_type, expires_at, refresh_token, access_token } = await client.oauthCallback(provider.callbackUrl, params, checks)
          return {
            tokens: { token_type, expires_at, refresh_token, access_token },
          }
        },
      },
    }),
    // ...add more providers here
  ],
};

export default NextAuth(authOptions);
