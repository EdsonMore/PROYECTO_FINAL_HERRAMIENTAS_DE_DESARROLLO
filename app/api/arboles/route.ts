// app/api/arboles/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { protectRoute } from "@/lib/route-guards"
import { query } from "@/lib/db"
import fs from "fs/promises"
import path from "path"
import { getCoherentSurvivalScore } from "@/lib/health-utils"

function generateLocalRecommendations(especie?: string, estado?: string, indice?: number) {
  const recs: string[] = []
  if (indice != null) {
    if (indice < 40) recs.push('🚨 Supervivencia baja: intervención urgente (riego, revisión)')
    else if (indice < 60) recs.push('⚠️ Riesgo moderado: aumentar monitoreo y riego según necesidad')
    else if (indice < 80) recs.push('🔍 Condiciones aceptables: monitorear salud y plagas')
    else recs.push('✅ Condiciones favorables')
  }
  if (estado === 'malo' || estado === 'critico') recs.unshift('❌ Estado crítico: considera intervención profesional')
  if (especie) recs.push(`📌 Especie: ${especie}`)
  return recs
}

function generateZoneRecommendations(lat?: number | string, lon?: number | string, riesgo?: string | null, indice?: number, especie?: string) {
  const recs: string[] = []
  if (riesgo) {
    const r = String(riesgo).toLowerCase()
    if (r.includes('alto')) recs.push('⚠️ Riesgo ambiental alto en la zona: aumentar riego y monitoreo')
    else if (r.includes('medio')) recs.push('⚠️ Riesgo ambiental moderado: programar revisiones y control de plagas')
    else if (r.includes('bajo')) recs.push('ℹ️ Riesgo ambiental bajo: mantenimiento rutinario')
  }

  if (typeof indice === 'number') {
    if (indice < 50) recs.push('🚨 Índice bajo: intervención local (sombra/acolchado/riego)')
    else if (indice < 70) recs.push('🔍 Índice medio: revisar exposición solar y humedad del suelo')
    else recs.push('✅ Índice alto: condiciones favorables, mantener plan de cuidado')
  }

  try {
    const latNum = Number(lat)
    const lonNum = Number(lon)
    if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
      if (Math.abs(lonNum + 80.63) < 0.05) recs.push('🌬️ Zona costera: proteger contra salitre y vientos fuertes')
      if (latNum > -5.25 && latNum < -5.10) recs.push('☀️ Alta exposición solar: considerar sombra temporal o riego por la mañana/tarde')
    }
  } catch (e) {
    // ignore
  }

  if (especie) recs.push(`📌 Recomendación por especie: ajustar cuidados para ${especie}`)
  return recs
}

function enrichTreeWithWeather(tree: any) {
  const estado = tree.estado_salud ? String(tree.estado_salud).toLowerCase() : undefined
  const baseIndice = tree.indice_supervivencia ?? (estado === 'excelente' ? 85 : estado === 'regular' ? 60 : estado === 'malo' || estado === 'critico' ? (estado === 'critico' ? 20 : 35) : 75)
  const survival = getCoherentSurvivalScore(estado, baseIndice, tree.id)
  const finalIndice = survival ?? baseIndice
  const localRecs = generateLocalRecommendations(tree.especie, estado, finalIndice)
  const zoneRecs = generateZoneRecommendations(tree.latitud, tree.longitud, null, finalIndice, tree.especie)
  const finalRecs = Array.isArray(localRecs) ? [...localRecs, ...zoneRecs] : zoneRecs
  return {
    ...tree,
    weather: {
      indice_supervivencia: finalIndice,
      riesgo_ambiental: null,
      recomendaciones: finalRecs,
    },
  }
}

type ArbolQueryMode = "full" | "summary" | "geo"

async function parseArbolesFromSQL(sqlContent: string) {
  // Parsear arboles
  const arbolesMatch = sqlContent.match(/INSERT INTO arboles\s*\([^)]*\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i)
  const arbolTuples = arbolesMatch && arbolesMatch[1] ? (arbolesMatch[1].match(/\([^)]*\)/g) || []) : []
  const arboles = arbolTuples.map(t => {
    const inner = t.slice(1, -1).trim()
    const parts = inner.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(p => p.trim())
    const [id, usuario_id, especie_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, altura_actual_cm, diametro_tronco_cm, estado_salud] = parts
    function unquote(v: string | undefined) {
      if (!v) return null
      const s = v.trim()
      if (s === 'NULL') return null
      if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
      return s
    }
    return {
      id: Number(unquote(id)),
      usuario_id: Number(unquote(usuario_id)),
      nombre: unquote(nombre),
      especie: unquote(especie),
      latitud: Number(unquote(latitud)),
      longitud: Number(unquote(longitud)),
      fecha_plantacion: unquote(fecha_plantacion),
      descripcion: unquote(descripcion),
      foto_url: null,
      altura_actual_cm: unquote(altura_actual_cm) ? Number(unquote(altura_actual_cm)) : null,
      diametro_tronco_cm: unquote(diametro_tronco_cm) ? Number(unquote(diametro_tronco_cm)) : null,
      estado_salud: unquote(estado_salud),
      creado_en: null,
      actualizado_en: null,
    }
  })

  // Parsear seguimientos para asignar estado_salud por arbol_id (último por fecha)
  const segMatch = sqlContent.match(/INSERT INTO seguimientos\s*\([^)]*\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i)
  const segTuples = segMatch && segMatch[1] ? (segMatch[1].match(/\([^)]*\)/g) || []) : []
  const seguimientos: any[] = segTuples.map(t => {
    const inner = t.slice(1, -1).trim()
    const parts = inner.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(p => p.trim())
    // seg: (id, arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento, creado_en, actualizado_en)
    const [id, arbol_id, usuario_id, titulo, descripcion, altura_cm, salud, tipo_seguimiento, fecha_seguimiento, temperatura_ambiente, humedad_suelo, notas_tecnicas] = parts
    function unquote(v: string | undefined) {
      if (!v) return null
      const s = v.trim()
      if (s === 'NULL') return null
      if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
      return s
    }
    return {
      id: Number(unquote(id)),
      arbol_id: Number(unquote(arbol_id)),
      usuario_id: Number(unquote(usuario_id)),
      titulo: unquote(titulo),
      descripcion: unquote(descripcion),
      foto_url: null,
      altura_cm: unquote(altura_cm) ? Number(unquote(altura_cm)) : null,
      salud: unquote(salud),
      tipo_seguimiento: unquote(tipo_seguimiento),
      fecha_seguimiento: unquote(fecha_seguimiento),
      temperatura_ambiente: unquote(temperatura_ambiente) ? Number(unquote(temperatura_ambiente)) : null,
      humedad_suelo: unquote(humedad_suelo) ? Number(unquote(humedad_suelo)) : null,
      notas_tecnicas: unquote(notas_tecnicas),
      creado_en: null,
      actualizado_en: null,
    }
  })

  // Mapear último seguimiento por arbol_id (por fecha_seguimiento si existe, si no por id)
  const segByArbol: Record<number, any> = {}
  for (const s of seguimientos) {
    if (!s.arbol_id) continue
    const existing = segByArbol[s.arbol_id]
    if (!existing) segByArbol[s.arbol_id] = s
    else {
      try {
        const dNew = s.fecha_seguimiento ? new Date(s.fecha_seguimiento) : new Date()
        const dExist = existing.fecha_seguimiento ? new Date(existing.fecha_seguimiento) : new Date(0)
        if (dNew > dExist) segByArbol[s.arbol_id] = s
        else if (!existing.fecha_seguimiento && s.id > existing.id) segByArbol[s.arbol_id] = s
      } catch (e) {
        // fallback por id
        if (s.id > existing.id) segByArbol[s.arbol_id] = s
      }
    }
  }

  // Asignar estado_salud a cada árbol: priorizar el último seguimiento si existe,
  // pero conservar el estado original del árbol cuando no haya seguimiento asociado.
  const final = arboles.map(a => ({
    ...a,
    estado_salud: segByArbol[a.id]?.salud ?? a.estado_salud ?? undefined,
  }))

  return final
}

async function loadTreesFromLocalSql(userId: number | null) {
  try {
    const sqlPath = path.join(process.cwd(), "scripts", "EcoDataBase_FINAL.sql")
    const sqlContent = await fs.readFile(sqlPath, "utf-8")
    const parsed = await parseArbolesFromSQL(sqlContent)
    return parsed
      .filter((tree) => tree.usuario_id === userId || tree.usuario_id === 1)
      .map(enrichTreeWithWeather)
  } catch (sqlErr) {
    console.warn("No se pudo leer el SQL local para árboles:", sqlErr)
    return []
  }
}

const ARBOLES_SELECTS: Record<ArbolQueryMode, string> = {
  full: `SELECT a.id, a.usuario_id, a.nombre, a.especie, a.latitud, a.longitud, a.fecha_plantacion, a.descripcion, a.foto_url, a.estado_salud, a.altura_actual_cm, a.diametro_tronco_cm, a.creado_en, a.actualizado_en
         FROM arboles a`,
  summary: `SELECT a.id, a.nombre, a.especie, a.foto_url, a.estado_salud, a.creado_en
            FROM arboles a`,
  geo: `SELECT a.id, a.nombre, a.especie, a.latitud, a.longitud, a.foto_url, a.estado_salud, a.creado_en
        FROM arboles a`,
}

function parseOptionalPositiveInt(value: string | null) {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

function buildDemoTrees(userId: number | null, count = 49) {
  const centerLat = -5.1940
  const centerLon = -80.6310
  const species = ["Ceiba", "Mango", "Palo", "Ficus", "Jacaranda", "Eucalipto", "Aliso"]
  const healthOptions = ["EXCELENTE", "BUENO", "REGULAR", "MALO", "CRITICO"]

  const generated: any[] = []
  for (let i = 1; i <= count; i++) {
    const angle = (i / count) * Math.PI * 2
    const radiusKm = 0.05 + (i % 7) * 0.02
    const deltaLat = (radiusKm / 111) * Math.cos(angle)
    const deltaLon = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle)
    const healthState = healthOptions[(i - 1) % healthOptions.length]

    generated.push({
      id: 10000 + i,
      usuario_id: userId ?? 1,
      nombre: `Árbol Demo ${i}`,
      especie: species[i % species.length],
      latitud: centerLat + deltaLat,
      longitud: centerLon + deltaLon,
      fecha_plantacion: new Date(Date.now() - i * 86400000).toISOString(),
      descripcion: `Árbol demo ${i} generado para pruebas`,
      foto_url: "",
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      estado_salud: healthState,
    })
  }

  return generated
}

const HEALTH_STATES = ["EXCELENTE", "BUENO", "REGULAR", "MALO", "CRITICO"] as const

function normalizeTreeHealthStatus(status?: string, index = 0, treeId?: string | number) {
  const normalized = String(status || "").trim().toUpperCase()
  if (HEALTH_STATES.includes(normalized as (typeof HEALTH_STATES)[number])) {
    return normalized
  }

  const seed = ((Number(treeId) || index + 1) * 13 + index * 17) % 100
  if (seed < 18) return "CRITICO"
  if (seed < 35) return "MALO"
  if (seed < 55) return "REGULAR"
  if (seed < 75) return "BUENO"
  return "EXCELENTE"
}

function assignBalancedHealthStates(rows: any[]) {
  return rows.map((tree, index) => ({
    ...tree,
    estado_salud: normalizeTreeHealthStatus(tree.estado_salud, index, tree.id),
  }))
}

function appendBalancedDemoTrees(rows: any[], userId: number | null) {
  const presentStates = new Set(
    rows
      .map((tree) => String(tree.estado_salud || "").trim().toUpperCase())
      .filter((state) => HEALTH_STATES.includes(state as (typeof HEALTH_STATES)[number]))
  )

  const missingStates = HEALTH_STATES.filter((state) => !presentStates.has(state))
  if (missingStates.length === 0) return rows

  const balancedTrees = buildDemoTrees(userId, missingStates.length * 2)
    .filter((tree) => missingStates.includes(String(tree.estado_salud || "").trim().toUpperCase() as (typeof HEALTH_STATES)[number]))
    .slice(0, missingStates.length)
    .map(enrichTreeWithWeather)

  return [...rows, ...balancedTrees]
}

// Helper: auto-registra especie en catálogo si no existe
async function autoRegistrarEspecie(especie: string) {
  if (!especie || especie.trim().length < 2) return;
  try {
    await query(
      `INSERT INTO admin_content_items (tipo, nombre, descripcion, estado)
       VALUES ('especie', $1, 'Registrada automáticamente por usuario', 'ACTIVO')
       ON CONFLICT (tipo, nombre) DO NOTHING`,
      [especie.trim()]
    );
  } catch (e) {
    // No bloquear el flujo si falla el registro en catálogo
    console.warn('No se pudo auto-registrar especie en catálogo:', e);
  }
}

// GET - Obtener todos los árboles del usuario
export async function GET(request: NextRequest) {
  try {
    // Intentamos obtener userId mediante protectRoute. Si falla (callbacks de NextAuth
    // intentan consultar la BD), caemos a modo demo para no bloquear la visualización.
    let userId: number | null = 1
    try {
      const protect = await protectRoute()
      if (!protect.error && protect.userId) {
        userId = protect.userId
      } else {
        console.warn("protectRoute devolvió error o sin userId, usando userId=1 para demo", protect.error)
      }
    } catch (protectErr) {
      console.warn("protectRoute lanzó excepción, usando modo demo para /api/arboles:", protectErr)
      userId = 1
    }
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get("mode") as ArbolQueryMode) || "full"
    const selectedQuery = ARBOLES_SELECTS[mode] ?? ARBOLES_SELECTS.full
    const limit = parseOptionalPositiveInt(searchParams.get("limit"))
    const offset = parseOptionalPositiveInt(searchParams.get("offset"))

    // Consultar BD (solo árboles del usuario autenticado, no eliminados)
    let queryText = `${selectedQuery} WHERE a.usuario_id = $1 AND a.deleted_at IS NULL ORDER BY a.creado_en DESC`
    const queryParams: Array<number> = [userId]

    let rows: any[] = []
    try {
      const result = await query(queryText, queryParams)
      rows = result.rows.map(enrichTreeWithWeather)
    } catch (dbError) {
      console.warn("Error en consulta a BD, usando fallback SQL local:", dbError)
    }

    // Fallback al SQL local si la BD falla o no retorna filas
    if (rows.length === 0) {
      const sqlRows = await loadTreesFromLocalSql(userId)
      if (sqlRows.length > 0) {
        console.log(`BD sin filas o caída — cargando ${sqlRows.length} árboles desde SQL local`)
        rows = sqlRows
      }
    }

    const start = offset ?? 0
    const end = limit !== null && limit !== undefined ? start + limit : undefined
    rows = rows.slice(start, end)

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener árboles:", error)
    return NextResponse.json({ error: "Error al obtener árboles" }, { status: 500 })
  }
}

// POST - Crear un nuevo árbol
export async function POST(request: NextRequest) {
  try {
    let userId: number | null = null
    try {
      const protect = await protectRoute()
      if (protect.error) return protect.error
      userId = protect.userId
    } catch (protectErr) {
      console.warn("protectRoute lanzó excepción en POST /api/arboles:", protectErr)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm } = body

    if (!nombre || !latitud || !longitud) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Auto-registrar especie en catálogo si se proporcionó
    if (especie) {
      await autoRegistrarEspecie(especie);
    }

    const fotoFinal = foto_url?.trim() || null;
    const alturaFinal = altura_actual_cm ? Number.parseFloat(altura_actual_cm) : null;
    const diametroFinal = diametro_tronco_cm ? Number.parseFloat(diametro_tronco_cm) : null;
    const saludFinal = estado_salud ? estado_salud.toUpperCase() : null;

    // Insertar el árbol
    const result = await query(
      `INSERT INTO arboles (usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, estado_salud, altura_actual_cm, diametro_tronco_cm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, fotoFinal, saludFinal, alturaFinal, diametroFinal],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error al crear árbol:", error)
    return NextResponse.json({ error: "Error al crear árbol" }, { status: 500 })
  }
}
