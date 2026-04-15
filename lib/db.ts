// lib/db.ts
import { Pool } from "pg"

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Función helper para ejecutar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Query ejecutada", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error en query de base de datos:", error)
    throw error
  }
}

// Función para obtener un cliente del pool (para transacciones)
export async function getClient() {
  const client = await pool.connect()
  return client
}

export default pool
