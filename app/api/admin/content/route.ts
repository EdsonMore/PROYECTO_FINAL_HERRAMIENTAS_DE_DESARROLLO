import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute, logAudit } from '@/lib/role-guards';
import { query } from '@/lib/db';

const VALID_TYPES = ['especie', 'tratamiento'] as const;

async function ensureContentTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_content_items (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('especie', 'tratamiento')),
      nombre VARCHAR(120) NOT NULL,
      descripcion TEXT,
      estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
      fecha_creacion TIMESTAMP DEFAULT NOW(),
      fecha_actualizacion TIMESTAMP DEFAULT NOW(),
      UNIQUE (tipo, nombre)
    )
  `);
}

export async function GET(req: NextRequest) {
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) return response!;

  try {
    await ensureContentTable();

    const result = await query(`
      SELECT
        c.id,
        c.tipo,
        c.nombre,
        c.descripcion,
        c.estado,
        c.fecha_creacion,
        c.fecha_actualizacion,
        CASE
          WHEN c.tipo = 'especie' THEN (
            SELECT COUNT(*)::int
            FROM arboles a
            WHERE LOWER(TRIM(a.especie)) = LOWER(TRIM(c.nombre))
          )
          ELSE 0
        END AS usos
      FROM admin_content_items c
      ORDER BY c.tipo ASC, c.nombre ASC
    `);

    await logAudit({
      userId: context.userId,
      action: 'view_admin_content',
      resource: 'admin',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      statusCode: 200,
    });

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error obteniendo contenido admin:', error);
    return NextResponse.json({ error: 'Error obteniendo contenido' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { isValid, response, context } = await protectAdminRoute(req);
  if (!isValid || !context) return response!;

  try {
    await ensureContentTable();
    const { tipo, nombre, descripcion, estado = 'ACTIVO' } = await req.json();

    if (!VALID_TYPES.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de contenido inválido' }, { status: 400 });
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO admin_content_items (tipo, nombre, descripcion, estado)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tipo, nombre.trim(), descripcion?.trim() || null, estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO']
    );

    await logAudit({
      userId: context.userId,
      action: 'create_admin_content',
      resource: 'admin',
      resourceId: result.rows[0].id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: `${tipo}: ${result.rows[0].nombre}`,
      statusCode: 201,
      changesAfter: result.rows[0],
    });

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creando contenido admin:', error);
    const message = error instanceof Error && error.message.includes('duplicate')
      ? 'Ya existe un registro con ese nombre y tipo'
      : 'Error creando contenido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
