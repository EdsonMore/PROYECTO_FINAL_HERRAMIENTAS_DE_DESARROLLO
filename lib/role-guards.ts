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
      'SELECT id, email, nombre, apellido, telefono, rol, estado, avatar_url FROM usuarios WHERE id = $1 LIMIT 1',
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
    // Query con JOIN para traer datos del usuario
    let query_str = `
      SELECT 
        la.id, 
        la.usuario_id, 
        u.email as usuario_email,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        la.accion, 
        la.recurso, 
        la.recurso_id, 
        la.ip_address as ip, 
        la.user_agent, 
        la.detalles, 
        la.estado_respuesta, 
        la.cambios_antes, 
        la.cambios_despues, 
        la.fecha_creacion
      FROM logs_auditoria la
      LEFT JOIN usuarios u ON la.usuario_id = u.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (params.userId) {
      query_str += ` AND la.usuario_id = $${paramCount}`;
      values.push(params.userId);
      paramCount++;
    }

    if (params.action) {
      query_str += ` AND la.accion ILIKE $${paramCount}`;
      values.push(`%${params.action}%`);
      paramCount++;
    }

    if (params.resource) {
      query_str += ` AND la.recurso = $${paramCount}`;
      values.push(params.resource);
      paramCount++;
    }

    query_str += ' ORDER BY la.fecha_creacion DESC';

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

/**
 * Crea un nuevo usuario (solo admin)
 */
export async function createUser(params: {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  contrasena: string;
  rol?: UserRole;
}) {
  try {
    // Validar que el email no exista
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
      [params.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Importar la función de hash de contraseña
    const { hashPassword } = await import('./password-utils');
    const hashedPassword = await hashPassword(params.contrasena);

    const result = await query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, estado, fecha_registro, actualizado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, nombre, apellido, email, telefono, rol, estado, fecha_registro`,
      [params.nombre, params.apellido, params.email, hashedPassword, params.telefono || null, params.rol || UserRole.USER, 'ACTIVO']
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
}

/**
 * Actualiza la información de un usuario (no el rol)
 */
export async function updateUser(userId: number, params: {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}) {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (params.nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(params.nombre);
      paramCount++;
    }

    if (params.apellido !== undefined) {
      updates.push(`apellido = $${paramCount}`);
      values.push(params.apellido);
      paramCount++;
    }

    if (params.email !== undefined) {
      // Validar que el email no exista en otro usuario
      const existingUser = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2 LIMIT 1',
        [params.email, userId]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('El email ya está registrado');
      }

      updates.push(`email = $${paramCount}`);
      values.push(params.email);
      paramCount++;
    }

    if (params.telefono !== undefined) {
      updates.push(`telefono = $${paramCount}`);
      values.push(params.telefono || null);
      paramCount++;
    }

    if (params.estado !== undefined) {
      updates.push(`estado = $${paramCount}`);
      values.push(params.estado);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    updates.push(`actualizado_en = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, nombre, apellido, email, telefono, rol, estado`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    throw error;
  }
}

/**
 * Elimina un usuario (soft delete - solo marca como inactivo)
 */
export async function deleteUser(userId: number) {
  try {
    // Soft delete: marcar como inactivo en lugar de eliminar
    const result = await query(
      'UPDATE usuarios SET estado = \'INACTIVO\', actualizado_en = NOW() WHERE id = $1 RETURNING id, nombre, email, estado',
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    throw error;
  }
}

/**
 * Obtiene los roles personalizados desde la BD
 */
export async function getRoles() {
  try {
    const result = await query(
      'SELECT id, rol, permisos, descripcion, fecha_creacion FROM role_permissions ORDER BY fecha_creacion DESC',
      []
    );

    return result.rows;
  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    return [];
  }
}

/**
 * Crea un nuevo rol con permisos
 */
export async function createRole(params: {
  rol: string;
  descripcion?: string;
  permisos: Record<string, any>;
}) {
  try {
    // Validar que el rol no exista
    const existingRole = await query(
      'SELECT id FROM role_permissions WHERE rol = $1 LIMIT 1',
      [params.rol]
    );

    if (existingRole.rows.length > 0) {
      throw new Error('El rol ya existe');
    }

    const result = await query(
      `INSERT INTO role_permissions (rol, permisos, descripcion, fecha_creacion)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, rol, permisos, descripcion, fecha_creacion`,
      [params.rol, JSON.stringify(params.permisos), params.descripcion || null]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error creando rol:', error);
    throw error;
  }
}

/**
 * Actualiza un rol existente
 */
export async function updateRole(roleId: number, params: {
  descripcion?: string;
  permisos?: Record<string, any>;
}) {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (params.descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      values.push(params.descripcion);
      paramCount++;
    }

    if (params.permisos !== undefined) {
      updates.push(`permisos = $${paramCount}`);
      values.push(JSON.stringify(params.permisos));
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(roleId);

    const result = await query(
      `UPDATE role_permissions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, rol, permisos, descripcion`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    throw error;
  }
}

/**
 * Elimina un rol (solo si no está asignado a ningún usuario)
 */
export async function deleteRole(roleId: number) {
  try {
    // Verificar que el rol no esté siendo usado
    const roleInfo = await query(
      'SELECT rol FROM role_permissions WHERE id = $1 LIMIT 1',
      [roleId]
    );

    if (roleInfo.rows.length === 0) {
      throw new Error('Rol no encontrado');
    }

    const roleName = roleInfo.rows[0].rol;

    // Verificar que no haya usuarios con este rol
    const usersWithRole = await query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = $1',
      [roleName]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      throw new Error(`No se puede eliminar el rol, hay ${usersWithRole.rows[0].count} usuario(s) asignado(s)`);
    }

    // Eliminar el rol
    const result = await query(
      'DELETE FROM role_permissions WHERE id = $1 RETURNING id, rol',
      [roleId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error eliminando rol:', error);
    throw error;
  }
}
