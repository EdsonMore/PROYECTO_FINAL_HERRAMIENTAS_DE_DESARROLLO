// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // 'USER' | 'ADMIN'
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    image?: string;
    role?: string; // 'USER' | 'ADMIN'
    // Campos de expiración
    iat: number;
    exp: number;
    jti?: string; // JWT ID para invalidación
  }
}
