// app/api/catalogo/route.ts
// API pública (solo requiere autenticación) para que usuarios busquen especies y tratamientos
import { type NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/route-guards';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { error } = await protectRoute();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'especie' | 'tratamiento'
    const q = searchParams.get('q') || '';

    if (tipo !== 'especie' && tipo !== 'tratamiento') {
      return NextResponse.json({ error: 'Tipo debe ser "especie" o "tratamiento"' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, nombre, descripcion
       FROM admin_content_items
       WHERE tipo = $1
         AND estado = 'ACTIVO'
         AND ($2 = '' OR LOWER(nombre) LIKE LOWER('%' || $2 || '%'))
       ORDER BY nombre ASC
       LIMIT 30`,
      [tipo, q]
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Error obteniendo catálogo:', error);
    return NextResponse.json({ error: 'Error obteniendo catálogo' }, { status: 500 });
  }
}
