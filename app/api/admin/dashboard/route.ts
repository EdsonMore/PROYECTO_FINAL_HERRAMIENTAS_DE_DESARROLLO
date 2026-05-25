// app/api/admin/dashboard/route.ts
/**
 * GET /api/admin/dashboard
 * Retorna estadísticas generales del sistema
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit } from '@/lib/role-guards';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    // Obtener estadísticas
    const [
      usuariosResult,
      arbolesResult,
      seguimientosResult,
      auditResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN rol = $1 THEN 1 END) as admins FROM usuarios', ['ADMIN']),
      query('SELECT COUNT(*) as total FROM arboles'),
      query('SELECT COUNT(*) as total FROM seguimientos'),
      query('SELECT COUNT(*) as total_logs, COUNT(DISTINCT usuario_id) as usuarios_activos FROM logs_auditoria WHERE fecha_creacion > NOW() - INTERVAL \'7 days\''),
    ]);

    const stats = {
      usuarios: {
        total: parseInt(usuariosResult.rows[0]?.total || 0),
        admins: parseInt(usuariosResult.rows[0]?.admins || 0),
      },
      arboles: {
        total: parseInt(arbolesResult.rows[0]?.total || 0),
        saludables: parseInt(arbolesResult.rows[0]?.total || 0), // Todos los árboles registrados
      },
      seguimientos: {
        total: parseInt(seguimientosResult.rows[0]?.total || 0),
      },
      auditoria: {
        logs_semana: parseInt(auditResult.rows[0]?.total_logs || 0),
        usuarios_activos: parseInt(auditResult.rows[0]?.usuarios_activos || 0),
      },
    };

    // Registrar acceso al dashboard
    await logAudit({
      userId: context.userId,
      action: 'view_admin_dashboard',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: stats,
    });
  } catch (error) {
    console.error('❌ Error obteniendo dashboard:', error);

    await logAudit({
      userId: context.userId,
      action: 'error_admin_dashboard',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      details: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Error obteniendo estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
