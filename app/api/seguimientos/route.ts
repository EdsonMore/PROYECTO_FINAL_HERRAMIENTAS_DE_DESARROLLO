// app/api/seguimientos/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { protectRoute, validateResourceOwnership } from "@/lib/route-guards"
import { query } from "@/lib/db"

// Helper: auto-registra tratamiento en catálogo si no existe
async function autoRegistrarTratamiento(tratamiento: string) {
  if (!tratamiento || tratamiento.trim().length < 2) return;
  try {
    await query(
      `INSERT INTO admin_content_items (tipo, nombre, descripcion, estado)
       VALUES ('tratamiento', $1, 'Registrado automáticamente por usuario', 'ACTIVO')
       ON CONFLICT (tipo, nombre) DO NOTHING`,
      [tratamiento.trim()]
    );
  } catch (e) {
    console.warn('No se pudo auto-registrar tratamiento en catálogo:', e);
  }
}

// GET - Obtener seguimientos (todos o de un árbol específico)
export async function GET(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const arbolId = searchParams.get("arbol_id")

    let result
    if (arbolId) {
      result = await query(
        `SELECT s.id, s.arbol_id, s.usuario_id, s.titulo, s.descripcion, s.foto_url, s.altura_cm, s.salud, s.tratamiento, s.fecha_seguimiento, s.creado_en, s.actualizado_en, a.nombre as arbol_nombre 
         FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         WHERE s.arbol_id = $1 AND s.usuario_id = $2 AND a.usuario_id = $2
         ORDER BY s.fecha_seguimiento DESC`,
        [arbolId, userId],
      )
    } else {
      result = await query(
        `SELECT s.id, s.arbol_id, s.usuario_id, s.titulo, s.descripcion, s.foto_url, s.altura_cm, s.salud, s.tratamiento, s.fecha_seguimiento, s.creado_en, s.actualizado_en, a.nombre as arbol_nombre 
         FROM seguimientos s
         INNER JOIN arboles a ON s.arbol_id = a.id
         WHERE s.usuario_id = $1
         ORDER BY s.fecha_seguimiento DESC`,
        [userId],
      )
    }

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error al obtener seguimientos:", error)
    return NextResponse.json({ error: "Error al obtener seguimientos" }, { status: 500 })
  }
}

// POST - Crear un nuevo seguimiento
export async function POST(request: NextRequest) {
  try {
    const { error, userId } = await protectRoute()
    if (error) return error

    const body = await request.json()
    const { arbol_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento, tratamiento } = body

    if (!arbol_id || !titulo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el árbol pertenece al usuario
    const { error: ownershipError } = await validateResourceOwnership("arboles", arbol_id, userId)
    if (ownershipError) return ownershipError

    // Auto-registrar tratamiento en catálogo si se proporcionó
    if (tratamiento) {
      await autoRegistrarTratamiento(tratamiento);
    }

    // Insertar el seguimiento - usamos columna tratamiento si existe, si no la ignoramos
    let result;
    try {
      result = await query(
        `INSERT INTO seguimientos (arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, tratamiento, fecha_seguimiento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [arbol_id, userId, titulo, descripcion, foto_url, altura_cm, salud, tratamiento || null, fecha_seguimiento || new Date()],
      )
    } catch (colError: any) {
      // Si la columna tratamiento no existe aún, insertar sin ella
      if (colError.message && colError.message.includes('tratamiento')) {
        result = await query(
          `INSERT INTO seguimientos (arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [arbol_id, userId, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento || new Date()],
        )
      } else {
        throw colError;
      }
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear seguimiento:", error)
    return NextResponse.json({ error: "Error al crear seguimiento" }, { status: 500 })
  }
}
