import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit } from '@/lib/role-guards';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) return response!;

  try {
    const { id } = await params;
    const contentId = Number.parseInt(id, 10);
    const { nombre, descripcion, estado } = await req.json();

    if (!Number.isInteger(contentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 });
    }

    const before = await query('SELECT * FROM admin_content_items WHERE id = $1 LIMIT 1', [contentId]);
    if (before.rows.length === 0) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });
    }

    const result = await query(
      `UPDATE admin_content_items
       SET nombre = $1, descripcion = $2, estado = $3, fecha_actualizacion = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        nombre.trim(),
        descripcion?.trim() || null,
        estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO',
        contentId,
      ]
    );

    await logAudit({
      userId: context.userId,
      action: 'update_admin_content',
      resource: 'admin',
      resourceId: contentId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: `${result.rows[0].tipo}: ${result.rows[0].nombre}`,
      statusCode: 200,
      changesBefore: before.rows[0],
      changesAfter: result.rows[0],
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando contenido admin:', error);
    const message = error instanceof Error && error.message.includes('duplicate')
      ? 'Ya existe un registro con ese nombre y tipo'
      : 'Error actualizando contenido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) return response!;

  try {
    const { id } = await params;
    const contentId = Number.parseInt(id, 10);

    if (!Number.isInteger(contentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM admin_content_items WHERE id = $1 RETURNING *',
      [contentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });
    }

    await logAudit({
      userId: context.userId,
      action: 'delete_admin_content',
      resource: 'admin',
      resourceId: contentId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: `${result.rows[0].tipo}: ${result.rows[0].nombre}`,
      statusCode: 200,
      changesBefore: result.rows[0],
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error eliminando contenido admin:', error);
    return NextResponse.json({ error: 'Error eliminando contenido' }, { status: 500 });
  }
}
