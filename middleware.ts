import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    // Validación adicional de JWT
    const token = req.nextauth.token

    // Si no hay token, rechazar
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Verificar expiración del token
    const now = Math.floor(Date.now() / 1000)
    if (token.exp && token.exp < now) {
      // Token expirado, redirigir a login
      return NextResponse.redirect(new URL("/login?expired=true", req.url))
    }

    // Si el token está próximo a expirar (menos de 2 minutos)
    // Agregar un header indicándolo al cliente
    const secondsUntilExpiry = token.exp ? token.exp - now : 0
    if (secondsUntilExpiry < 120 && secondsUntilExpiry > 0) {
      const response = NextResponse.next()
      response.headers.set("X-Token-Expiring-Soon", "true")
      response.headers.set("X-Token-Expires-In", String(secondsUntilExpiry))
      return response
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Verificación básica de existencia de token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/mi-arbol/:path*", "/seguimientos/:path*", "/perfil/:path*", "/identificador/:path*"],
}
