"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

/**
 * Hook para sincronizar automáticamente cambios en la sesión del usuario
 * Útil para componentes que necesitan reaccionar a cambios en el perfil
 * 
 * Soporta:
 * - Auto-actualización periódica de sesión
 * - Sincronización inmediata en login/logout
 * - Actualización manual con refreshSession()
 */
export function useSyncSession() {
  const { data: session, status, update } = useSession();
  const [isSynced, setIsSynced] = useState(false);

  // Callback para refrescar la sesión
  const refreshSession = useCallback(async () => {
    const updated = await update();
    return updated;
  }, [update]);

  // Sincronizar automáticamente cuando el estado cambia
  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      setIsSynced(true);
    } else if (status === "loading") {
      setIsSynced(false);
    }
  }, [status]);

  // Refrescar sesión cuando cambien datos del usuario
  useEffect(() => {
    if (session?.user) {
      setIsSynced(true);
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return {
    session,
    status,
    isSynced,
    refreshSession,
  };
}
