import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Podpinamy Prismę, aby Auth.js wiedział, gdzie zapisywać użytkowników
  adapter: PrismaAdapter(prisma),
  
  // Lista dostawców logowania (tzw. Providers)
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
})