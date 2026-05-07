// hooks/use-token-expiry.ts
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

/**
 * Hook para monitorear y manejar la expiración de tokens
 */
export function useTokenExpiry() {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Listener para headers X-Token-Expiring-Soon
    const handleTokenExpiry = async () => {
      // Obtener la sesión actual
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (!session?.user) {
        // No hay sesión, hacer logout
        await signOut({ redirect: true, callbackUrl: "/login" });
        return;
      }
    };

    // Configurar check cada 30 segundos
    const interval = setInterval(handleTokenExpiry, 30000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
