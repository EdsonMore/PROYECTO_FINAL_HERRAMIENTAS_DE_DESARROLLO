// app/api/admin/logs/route.ts
/**
 * GET /api/admin/logs
 * Retorna logs de auditoría del sistema
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit, getAuditLogs } from '@/lib/role-guards';

export async function GET(req: NextRequest) {
  // Verificar que el usuario sea admin
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) {
    return response!;
  }

  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const action = req.nextUrl.searchParams.get('action') || undefined;
    const resource = req.nextUrl.searchParams.get('resource') || undefined;
    const userId = req.nextUrl.searchParams.get('userId')
      ? parseInt(req.nextUrl.searchParams.get('userId')!)
      : undefined;

    // Obtener logs
    const logs = await getAuditLogs({
      action,
      resource,
      userId,
      limit,
      offset,
    });

    // Registrar acceso a logs
    await logAudit({
      userId: context.userId,
      action: 'view_audit_logs',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        hasMore: logs.length === limit,
      },
      filters: {
        action,
        resource,
        userId,
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);

    return NextResponse.json(
      { error: 'Error obteniendo logs de auditoría' },
      { status: 500 }
    );
  }
}
