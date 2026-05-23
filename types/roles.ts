// types/roles.ts
/**
 * Sistema de Roles y Permisos
 * Define los roles disponibles, permisos asociados y funciones de validación
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface RolePermission {
  tree: TreePermission[];
  user: UserPermission[];
  admin: AdminPermission[];
}

export type TreePermission = 'create' | 'read_own' | 'read_all' | 'update_own' | 'delete_own';
export type UserPermission = 'read_own' | 'read_all' | 'update_own' | 'delete_own';
export type AdminPermission = 'manage_users' | 'manage_roles' | 'view_audit' | 'view_dashboard';

export type ActionType = TreePermission | UserPermission | AdminPermission;
export type ResourceType = 'tree' | 'user' | 'admin';

/**
 * Estructura base de auditoría
 */
export interface AuditLog {
  id: number;
  usuario_id: number;
  accion: string;
  recurso: ResourceType;
  recurso_id?: number;
  cambios_antes?: Record<string, any>;
  cambios_despues?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  detalles?: string;
  estado_respuesta?: number;
  fecha_creacion: Date;
}

/**
 * Contexto de autorización para verificar permisos
 */
export interface AuthContext {
  userId: number;
  userRole: UserRole;
  userEmail?: string;
  resourceOwnerId?: number; // Para verificar propiedad del recurso
}

/**
 * Resultado de la verificación de permiso
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: string;
}

/**
 * Definición de permisos por rol
 * Cada rol tiene los permisos que puede realizar
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  [UserRole.USER]: {
    tree: ['create', 'read_own', 'update_own', 'delete_own'],
    user: ['read_own', 'update_own'],
    admin: [],
  },
  [UserRole.ADMIN]: {
    tree: ['create', 'read_own', 'read_all', 'update_own', 'delete_own'],
    user: ['read_own', 'read_all', 'update_own'],
    admin: ['manage_users', 'manage_roles', 'view_audit', 'view_dashboard'],
  },
};

/**
 * Acciones que requieren auditoría
 */
export const AUDITABLE_ACTIONS = [
  'create_tree',
  'update_tree',
  'delete_tree',
  'update_user_role',
  'delete_user',
  'manage_permissions',
] as const;

/**
 * Rutas protegidas por rol
 */
export const ADMIN_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/usuarios',
  '/admin/auditoria',
  '/api/admin',
];
