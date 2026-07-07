// app/api/auth/refresh/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    // Obtener sesión actual
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }


    // Verificar si el token necesita renovación
    const token = session as any;
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = Math.max(0, token.exp - now);

    if (secondsUntilExpiry < 300) { // TIENE menos de 5 minutos
      // El token será renovado automáticamente en la próxima solicitud
      return NextResponse.json({
        success: true,
        message: "Sesión renovada",
        expiresAt: token.exp,
        willRenewAt: now + (15 * 60), // Se renovará en 15 minutos
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sesión válida",
      expiresAt: token.exp,
      secondsUntilExpiry: secondsUntilExpiry,
    });
  } catch (error) {
    console.error("Error en refresh:", error);
    return NextResponse.json(
      { error: "Error al renovar sesión" },
      { status: 500 }
    );
  }
}
