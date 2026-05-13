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
          // Buscar usuario en la base de datos - seleccionar solo campos necesarios
          const result = await query(
            "SELECT id, email, password_hash, nombre, avatar_url FROM usuarios WHERE email = $1",
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          console.log("🔍 DEBUG LOGIN:", {
            email: user.email,
            password_hash_existe: !!user.password_hash,
            password_hash_length: user.password_hash?.length,
          });

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          // Retornar usuario sin el hash de contraseña ni avatar grande
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.nombre,
            // NO incluir image aquí para evitar cookies gigantes
            // Se recupera en session callback si es necesario
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
          // Usar UPSERT para optimizar: una sola consulta en lugar de SELECT + INSERT/UPDATE
          const nombre = user.name || user.email?.split("@")[0] || "Usuario";
          await query(
            `INSERT INTO usuarios (nombre, email, password_hash, avatar_url) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE 
             SET avatar_url = COALESCE($4, avatar_url),
                 actualizado_en = NOW()`,
            [nombre, user.email, "", user.image || ""]
          );

          return true;
        } catch (error) {
          console.error("❌ Error al registrar usuario de Google:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Tiempo actual en segundos
      const now = Math.floor(Date.now() / 1000);

      if (user) {
        token.id = user.id;
        token.email = user.email;
        // NO guardar image en JWT porque puede ser muy grande
        // Eso se recupera en session callback si es necesario
        
        // Campos de expiración JWT
        token.iat = now;
        // Access token válido por 15 minutos (900 segundos)
        token.exp = now + (15 * 60);
      }

      if (account) {
        token.provider = account.provider;
      }

      // Si el token existe y está próximo a expirar (menos de 1 minuto)
      // y el usuario tiene una sesión activa, renovarlo automáticamente
      if (token.exp && token.exp - now < 60 && user) {
        token.iat = now;
        token.exp = now + (15 * 60); // Renovar por otros 15 minutos
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        
        // Recuperar imagen desde BD si está en session
        if (token.id) {
          try {
            const userResult = await query(
              "SELECT avatar_url FROM usuarios WHERE id = $1 LIMIT 1",
              [parseInt(token.id as string)]
            );
            if (userResult.rows[0]?.avatar_url) {
              session.user.image = userResult.rows[0].avatar_url;
            }
          } catch (error) {
            console.error("⚠️ Error recuperando avatar en session:", error);
            // Continuar sin avatar si hay error
          }
        }
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
