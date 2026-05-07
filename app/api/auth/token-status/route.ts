// app/api/auth/token-status/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint para verificar estado del token JWT
 * Retorna información sobre expiración y renovación
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el token de la sesión
    const token = session as any;
    const now = Math.floor(Date.now() / 1000);

    // Calcular información de expiración
    const expiresAt = token.exp || 0;
    const issuedAt = token.iat || now;
    const secondsUntilExpiry = Math.max(0, expiresAt - now);
    const percentageRemaining = ((secondsUntilExpiry / (expiresAt - issuedAt)) * 100) || 0;
    const isExpiring = secondsUntilExpiry < 300; // Menos de 5 minutos
    const isExpired = secondsUntilExpiry <= 0;

    return NextResponse.json({
      isValid: !isExpired,
      isExpiring: isExpiring,
      isExpired: isExpired,
      expiresAt: expiresAt,
      secondsUntilExpiry: secondsUntilExpiry,
      percentageRemaining: Math.round(percentageRemaining),
      issuedAt: issuedAt,
      user: {
        id: token.sub || session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
      },
    });
  } catch (error) {
    console.error("Error en token-status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
