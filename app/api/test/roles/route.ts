// app/api/test/roles/route.ts
/**
 * GET /api/test/roles
 * Endpoint de prueba para verificar que el sistema de roles funciona
 * NOTA: Solo para desarrollo, eliminar en producción
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, logAudit } from '@/lib/role-guards';
import { checkPermission } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Obtener contexto
    const context = await getAuthContext(req);

    if (!context) {
      return NextResponse.json({
        status: 'error',
        message: 'No autenticado',
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Obtener info del usuario
    const userResult = await query(
      'SELECT id, email, nombre, rol, estado FROM usuarios WHERE id = $1 LIMIT 1',
      [context.userId]
    );

    const user = userResult.rows[0];

    // Verificar algunos permisos
    const canCreateTree = checkPermission(context, 'tree', 'create');
    const canReadAllTrees = checkPermission(context, 'tree', 'read_all');
    const canManageUsers = checkPermission(context, 'admin', 'manage_users');

    // Contar estadísticas
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM arboles) as total_arboles,
        (SELECT COUNT(*) FROM logs_auditoria) as total_logs
    `);

    const stats = statsResult.rows[0];

    // Registrar acceso
    await logAudit({
      userId: context.userId,
      action: 'test_api_roles',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      usuario: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        estado: user.estado,
      },
      permisos: {
        puede_crear_arbol: canCreateTree.allowed,
        puede_ver_todos_arboles: canReadAllTrees.allowed,
        puede_gestionar_usuarios: canManageUsers.allowed,
      },
      estadisticas: {
        total_usuarios: parseInt(stats.total_usuarios),
        total_arboles: parseInt(stats.total_arboles),
        total_logs_auditoria: parseInt(stats.total_logs),
      },
      mensaje: `✅ Sistema de roles funcionando correctamente. Eres: ${user.rol}`,
    });
  } catch (error) {
    console.error('❌ Error en test de roles:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
