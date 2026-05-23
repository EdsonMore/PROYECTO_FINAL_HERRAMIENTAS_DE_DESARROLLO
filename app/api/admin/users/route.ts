// app/api/admin/users/route.ts
/**
 * GET /api/admin/users
 * Retorna lista de usuarios del sistema
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
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const search = req.nextUrl.searchParams.get('search') || '';

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE nombre ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }

    // Obtener usuarios (sin incluir password_hash)
    const usuariosResult = await query(
      `SELECT 
        id, nombre, email, rol, estado, avatar_url, fecha_registro, actualizado_en
       FROM usuarios 
       ${whereClause}
       ORDER BY fecha_registro DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM usuarios ${whereClause}`,
      params
    );

    // Registrar acceso
    await logAudit({
      userId: context.userId,
      action: 'view_users_list',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: usuariosResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);

    return NextResponse.json(
      { error: 'Error obteniendo lista de usuarios' },
      { status: 500 }
    );
  }
}
