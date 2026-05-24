// lib/role-guards.ts
/**
 * Middlewares y guardias de protección por roles
 * Funciones para proteger endpoints y acciones según el rol del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, ADMIN_ROUTES, AuthContext, AuditLog } from '@/types/roles';
import { checkPermission, isAdmin } from './permissions';
import { query } from './db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret';

/**
 * Extrae el contexto de autorización de la request
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  try {
    const token = await getToken({ req, secret: JWT_SECRET });

    if (!token || !token.id) {
      return null;
    }

    // Obtener el rol del usuario desde la BD (para mantener sincronización)
    try {
      const userResult = await query(
        'SELECT rol FROM usuarios WHERE id = $1 LIMIT 1',
        [parseInt(token.id as string)]
      );

      const rol = userResult.rows[0]?.rol || UserRole.USER;

      return {
        userId: parseInt(token.id as string),
        userRole: rol as UserRole,
        userEmail: token.email as string,
      };
    } catch (dbError) {
      // Si hay error en BD, usar el rol del token (fallback)
      console.warn('⚠️ Error obteniendo rol de BD, usando token:', dbError);
      return {
        userId: parseInt(token.id as string),
        userRole: (token.role as UserRole) || UserRole.USER,
        userEmail: token.email as string,
      };
    }
  } catch (error) {
    console.error('❌ Error extrayendo auth context:', error);
    return null;
  }
}

/**
 * Protege una ruta verificando que el usuario esté autenticado
 */
export async function protectAuthRoute(req: NextRequest) {
  const context = await getAuthContext(req);

  if (!context) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'No autorizado - Autenticación requerida' },
        { status: 401 }
      ),
      context: null,
    };
  }

  return { isValid: true, response: null, context };
}

/**
 * Protege una ruta verificando que el usuario sea admin
 */
export async function protectAdminRoute(req: NextRequest) {
  const context = await getAuthContext(req);

  if (!context) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'No autorizado - Autenticación requerida' },
        { status: 401 }
      ),
      context: null,
    };
  }

  if (!isAdmin(context.userRole)) {
    await logAudit({
      userId: context.userId,
      action: 'unauthorized_access',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      details: `Intento de acceso admin sin permisos: ${req.nextUrl.pathname}`,
      statusCode: 403,
    });

    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      ),
      context: null,
    };
  }

  return { isValid: true, response: null, context };
}

/**
 * Verifica un permiso específico dentro de una ruta
 */
export function requirePermission(
  context: AuthContext,
  resource: any,
  action: any
) {
  const result = checkPermission(context, resource, action);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: result.reason || 'Permiso denegado' },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, response: null };
}

/**
 * Registra una acción de auditoría en la BD
 */
export async function logAudit(params: {
  userId: number;
  action: string;
  resource?: string;
  resourceId?: number;
  ip?: string;
  userAgent?: string;
  details?: string;
  statusCode?: number;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO logs_auditoria 
       (usuario_id, accion, recurso, recurso_id, ip_address, user_agent, detalles, estado_respuesta, cambios_antes, cambios_despues) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.userId,
        params.action,
        params.resource || 'UNKNOWN',
        params.resourceId || null,
        params.ip || null,
        params.userAgent || null,
        params.details || null,
        params.statusCode || 200,
        params.changesBefore ? JSON.stringify(params.changesBefore) : null,
        params.changesAfter ? JSON.stringify(params.changesAfter) : null,
      ]
    );
  } catch (error) {
    console.error('❌ Error registrando auditoría:', error);
    // No lanzar error, solo registrar en consola para no romper la request
  }
}

/**
 * Middleware para validar que la acción sea de un admin o del propietario
 */
export async function validateOwnershipOrAdmin(
  context: AuthContext,
  resourceOwnerId: number | undefined
): Promise<{ valid: boolean; response?: NextResponse }> {
  if (!resourceOwnerId) {
    return { valid: true };
  }

  // Si es admin, permitir siempre
  if (isAdmin(context.userRole)) {
    return { valid: true };
  }

  // Si no es admin, verificar propiedad
  if (context.userId !== resourceOwnerId) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'No tienes permisos para acceder a este recurso' },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Obtiene la información del usuario desde la BD
 */
export async function getUserInfo(userId: number) {
  try {
    const result = await query(
      'SELECT id, email, nombre, rol, estado FROM usuarios WHERE id = $1 LIMIT 1',
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Actualiza el rol de un usuario (solo admin)
 */
export async function updateUserRole(userId: number, newRole: UserRole) {
  try {
    // Validar que el rol sea válido
    if (!Object.values(UserRole).includes(newRole)) {
      throw new Error(`Rol inválido: ${newRole}`);
    }

    const result = await query(
      'UPDATE usuarios SET rol = $1, actualizado_en = NOW() WHERE id = $2 RETURNING id, rol',
      [newRole, userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    throw error;
  }
}

/**
 * Obtiene logs de auditoría con filtros opcionales
 */
export async function getAuditLogs(params: {
  userId?: number;
  action?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query_str = 'SELECT * FROM logs_auditoria WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (params.userId) {
      query_str += ` AND usuario_id = $${paramCount}`;
      values.push(params.userId);
      paramCount++;
    }

    if (params.action) {
      query_str += ` AND accion ILIKE $${paramCount}`;
      values.push(`%${params.action}%`);
      paramCount++;
    }

    if (params.resource) {
      query_str += ` AND recurso = $${paramCount}`;
      values.push(params.resource);
      paramCount++;
    }

    query_str += ' ORDER BY fecha_creacion DESC';

    if (params.limit) {
      query_str += ` LIMIT $${paramCount}`;
      values.push(params.limit);
      paramCount++;
    }

    if (params.offset) {
      query_str += ` OFFSET $${paramCount}`;
      values.push(params.offset);
      paramCount++;
    }

    const result = await query(query_str, values);
    return result.rows;
  } catch (error) {
    console.error('❌ Error obteniendo logs de auditoría:', error);
    return [];
  }
}
