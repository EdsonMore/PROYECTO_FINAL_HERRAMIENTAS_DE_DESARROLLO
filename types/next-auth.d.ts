// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    image?: string;
    // Campos de expiración
    iat: number;
    exp: number;
    jti?: string; // JWT ID para invalidación
  }
}
