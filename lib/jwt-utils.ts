// lib/jwt-utils.ts
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

// Configurar la clave secreta para JWT
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET no configurado");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Tiempos de expiración configurables
 * Por defecto: 15 minutos para access token, 7 días para refresh token
 */
export const JWT_EXPIRY = {
  ACCESS_TOKEN: process.env.JWT_ACCESS_EXPIRY || "15m", // 15 minutos
  REFRESH_TOKEN: process.env.JWT_REFRESH_EXPIRY || "7d", // 7 días
};

/**
 * Convertir duración a segundos
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Duración inválida: ${duration}`);
  }

  const [, value, unit] = match;
  const seconds = parseInt(value);

  switch (unit) {
    case "s":
      return seconds;
    case "m":
      return seconds * 60;
    case "h":
      return seconds * 60 * 60;
    case "d":
      return seconds * 60 * 60 * 24;
    default:
      return seconds * 60; // default a minutos
  }
}

/**
 * Crear un JWT con expiración
 */
export async function createJWT(
  payload: Record<string, any>,
  expiryDuration: string = JWT_EXPIRY.ACCESS_TOKEN
): Promise<string> {
  try {
    const secret = getSecret();
    const expirySeconds = parseDuration(expiryDuration);
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .setJti(generateJTI()) // Agregar JWT ID único
      .sign(secret);

    return token;
  } catch (error) {
    console.error("Error creando JWT:", error);
    throw error;
  }
}

/**
 * Verificar y decodificar un JWT
 */
export async function verifyJWT(
  token: string
): Promise<{ valid: boolean; payload: any; error?: string }> {
  try {
    const secret = getSecret();

    const verified = await jwtVerify(token, secret);
    const payload = verified.payload;

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        valid: false,
        payload: payload,
        error: "Token expirado",
      };
    }

    return {
      valid: true,
      payload: payload,
    };
  } catch (error: any) {
    return {
      valid: false,
      payload: null,
      error: error.message || "Token inválido",
    };
  }
}

/**
 * Obtener JWT de cookies
 */
export async function getJWTFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("next-auth.session-token")?.value;
    return token || null;
  } catch (error) {
    console.error("Error obteniendo JWT de cookies:", error);
    return null;
  }
}

/**
 * Validar JWT y retornar payload si es válido
 */
export async function validateJWT(): Promise<{
  isValid: boolean;
  payload: any;
  needsRefresh: boolean;
}> {
  try {
    const token = await getJWTFromCookies();
    if (!token) {
      return { isValid: false, payload: null, needsRefresh: false };
    }

    const result = await verifyJWT(token);
    if (!result.valid) {
      return { isValid: false, payload: null, needsRefresh: true };
    }

    // Verificar si el token necesita refresh (menos del 10% de vida restante)
    const now = Math.floor(Date.now() / 1000);
    const iat = result.payload.iat;
    const exp = result.payload.exp;
    const totalLife = exp - iat;
    const remainingLife = exp - now;
    const needsRefresh = remainingLife < totalLife * 0.1; // Menos del 10%

    return {
      isValid: true,
      payload: result.payload,
      needsRefresh: needsRefresh,
    };
  } catch (error) {
    console.error("Error validando JWT:", error);
    return { isValid: false, payload: null, needsRefresh: false };
  }
}

/**
 * Generar JWT ID único
 */
function generateJTI(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verificar si un token está próximo a expirar
 */
export function isTokenNearExpiry(
  expiresAt: number,
  minutesThreshold: number = 5
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = expiresAt - now;
  return secondsUntilExpiry < minutesThreshold * 60;
}

/**
 * Obtener tiempo restante de un token en segundos
 */
export function getTokenTimeRemaining(expiresAt: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, expiresAt - now);
}
