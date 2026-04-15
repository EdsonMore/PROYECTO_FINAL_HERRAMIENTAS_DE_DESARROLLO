// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    // Proveedor de Credenciales (Email + Contraseña)
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        try {
          // Buscar usuario en la base de datos
          const result = await query(
            "SELECT * FROM usuarios WHERE email = $1",
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          // Retornar usuario sin el hash de contraseña
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.nombre,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          throw error;
        }
      },
    }),

    // Proveedor de Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si viene de Google u otro provider OAuth
      if (account?.provider === "google") {
        try {
          // Verificar si el usuario ya existe
          const existingUser = await query(
            "SELECT id FROM usuarios WHERE email = $1",
            [user.email]
          );

          if (existingUser.rows.length === 0) {
            // Crear nuevo usuario con contraseña vacía (OAuth)
            const nombre = user.name || user.email?.split("@")[0] || "Usuario";
            await query(
              "INSERT INTO usuarios (nombre, email, password_hash, avatar_url) VALUES ($1, $2, $3, $4)",
              [nombre, user.email, "", user.image || ""]
            );
          } else {
            // Actualizar avatar si existe
            if (user.image) {
              await query(
                "UPDATE usuarios SET avatar_url = $1 WHERE email = $2",
                [user.image, user.email]
              );
            }
          }

          return true;
        } catch (error) {
          console.error("Error al registrar usuario de Google:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permitir redirect a callbackUrl si viene desde login
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // URLs relativas
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Por defecto, ir al dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};
