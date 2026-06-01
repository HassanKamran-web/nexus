// @ts-nocheck
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dbQuery } from "@/lib/db"; 

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", 
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const existingUser = await dbQuery(
          'SELECT id FROM "User" WHERE email = $1',
          [user.email]
        );

        if (!existingUser || existingUser.rows.length === 0) {
          
          await dbQuery(
            'INSERT INTO "User" (id, name, email, image) VALUES ($1, $2, $3, $4)',
            [
              user.id || `usr-${crypto.randomUUID()}`, 
              user.name || "Nexus User", 
              user.email, 
              user.image || ""
            ]
          );
        }
        
        return true; 
      } catch (error) {
        console.error("❌ Error saving user to database during signIn:", error);
        return true; 
      }
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };