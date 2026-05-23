// lib/permissions.ts
/**
 * Sistema centralizado de permisos y validación de roles
 * Funciones para verificar si un usuario puede realizar una acción
 */

import {
  UserRole,
  ROLE_PERMISSIONS,
  AuthContext,
  PermissionCheckResult,
  ResourceType,
  ActionType,
} from '@/types/roles';

/**
 * Verifica si un usuario tiene un permiso específico en un recurso
 */
export function checkPermission(
  context: AuthContext,
  resource: ResourceType,
  action: ActionType
): PermissionCheckResult {
  // Los admins tienen acceso a todo
  if (context.userRole === UserRole.ADMIN) {
    return { allowed: true };
  }

  const rolePerms = ROLE_PERMISSIONS[context.userRole];
  
  if (!rolePerms) {
    return {
      allowed: false,
      reason: `Rol desconocido: ${context.userRole}`,
    };
  }

  // Acceder a los permisos del recurso
  const permsForResource = rolePerms[resource as keyof typeof rolePerms];
  
  if (!Array.isArray(permsForResource)) {
    return {
      allowed: false,
      reason: `Recurso no válido: ${resource}`,
    };
  }

  const hasPermission = permsForResource.includes(action as never);

  if (!hasPermission) {
    return {
      allowed: false,
      reason: `No tienes permiso para: ${action} en ${resource}`,
      requiredPermission: action,
    };
  }

  // Para acciones "own", validar propiedad del recurso
  if (action.includes('own') && context.resourceOwnerId !== undefined) {
    const isOwner = context.userId === context.resourceOwnerId;
    if (!isOwner) {
      return {
        allowed: false,
        reason: `No eres propietario de este recurso (${resource}:${context.resourceOwnerId})`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Verifica si el usuario es propietario de un recurso (para acciones "own")
 */
export function isResourceOwner(
  userId: number,
  resourceOwnerId: number | undefined
): boolean {
  return resourceOwnerId !== undefined && userId === resourceOwnerId;
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Obtiene los permisos de un rol
 */
export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role];
}

/**
 * Lista todos los roles disponibles
 */
export function getAvailableRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Descripción legible del rol
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.USER]: 'Usuario regular - Acceso a sus recursos propios',
    [UserRole.ADMIN]: 'Administrador - Acceso completo al sistema',
  };
  return descriptions[role];
}

/**
 * Verifica múltiples permisos (todos deben ser verdaderos)
 */
export function checkAllPermissions(
  context: AuthContext,
  checks: Array<{
    resource: ResourceType;
    action: ActionType;
  }>
): PermissionCheckResult {
  for (const check of checks) {
    const result = checkPermission(context, check.resource, check.action);
    if (!result.allowed) {
      return result;
    }
  }
  return { allowed: true };
}

/**
 * Verifica al menos uno de los permisos (OR)
 */
export function checkAnyPermission(
  context: AuthContext,
  checks: Array<{
    resource: ResourceType;
    action: ActionType;
  }>
): PermissionCheckResult {
  const results = checks.map((check) =>
    checkPermission(context, check.resource, check.action)
  );

  if (results.some((r) => r.allowed)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'No tienes ninguno de los permisos requeridos',
  };
}
