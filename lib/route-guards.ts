// lib/route-guards.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { query } from "./db";

/**
 * Extrae y valida la sesión del usuario
 * Retorna el userId o un error response
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
      userId: null,
    };
  }

  return {
    error: null,
    userId: parseInt(session.user.id),
  };
}

/**
 * Valida que un recurso (árbol, seguimiento, etc) pertenezca al usuario
 * Retorna el recurso o un error response
 */
export async function validateResourceOwnership(
  tableName: string,
  resourceId: number,
  userId: number,
  selectColumns: string = "*"
) {
  try {
    const result = await query(
      `SELECT ${selectColumns} FROM ${tableName} WHERE id = $1 AND usuario_id = $2`,
      [resourceId, userId]
    );

    if (result.rows.length === 0) {
      return {
        error: NextResponse.json(
          { error: "Recurso no encontrado o no tienes permiso" },
          { status: 404 }
        ),
        resource: null,
      };
    }

    return {
      error: null,
      resource: result.rows[0],
    };
  } catch (error) {
    console.error(`Error validando propiedad en ${tableName}:`, error);
    return {
      error: NextResponse.json(
        { error: "Error al validar recurso" },
        { status: 500 }
      ),
      resource: null,
    };
  }
}

/**
 * Middleware de protección completo para rutas
 * Valida autenticación y retorna userId
 */
export async function protectRoute() {
  const { error, userId } = await requireAuth();
  if (error) return { error, userId: null };
  return { error: null, userId };
}
