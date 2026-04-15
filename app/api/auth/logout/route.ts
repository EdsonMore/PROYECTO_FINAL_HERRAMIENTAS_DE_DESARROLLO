import { signOut } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route para logout explícito
 * Asegura que la sesión se limpie correctamente en el servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Invalidar la sesión en el servidor
    const response = NextResponse.json(
      { success: true, message: "Sesión cerrada correctamente" },
      { status: 200 }
    );

    // Limpiar cookies de NextAuth
    response.cookies.set("next-auth.session-token", "", {
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("next-auth.csrf-token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en logout API:", error);
    return NextResponse.json(
      { success: false, error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
