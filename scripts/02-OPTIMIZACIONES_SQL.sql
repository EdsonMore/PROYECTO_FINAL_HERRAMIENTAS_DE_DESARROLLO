-- ============================================================================
-- OPTIMIZACIONES DE BASE DE DATOS - VERSIÓN DEFINITIVA
-- ============================================================================

-- 1. ÍNDICES EN TABLA USUARIOS
-- ============================================================================

-- Índice en email (útil para login)
CREATE INDEX IF NOT EXISTS idx_usuarios_email 
  ON usuarios(email);

-- 2. ÍNDICES EN TABLA ARBOLES
-- ============================================================================

-- Índice en usuario_id (CRÍTICO - usado en WHERE usuario_id = $1)
CREATE INDEX IF NOT EXISTS idx_arboles_usuario_id 
  ON arboles(usuario_id);

-- Índice para ordenamiento por fecha (útil para dashboard)
CREATE INDEX IF NOT EXISTS idx_arboles_creado_en 
  ON arboles(creado_en DESC);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_arboles_usuario_creado 
  ON arboles(usuario_id, creado_en DESC);


-- 3. ÍNDICES EN TABLA SEGUIMIENTOS
-- ============================================================================

-- Índices simples (más eficientes para JOINs)
CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario_id 
  ON seguimientos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_arbol_id 
  ON seguimientos(arbol_id);

-- NOTA: idx_seguimientos_fecha YA EXISTE, no lo creamos de nuevo
-- Si quieres recrearlo, primero elimínalo:
-- DROP INDEX IF EXISTS idx_seguimientos_fecha;
-- CREATE INDEX idx_seguimientos_fecha ON seguimientos(fecha_seguimiento DESC);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario_fecha 
  ON seguimientos(usuario_id, fecha_seguimiento DESC);


-- 4. CONSTRAINTS DE INTEGRIDAD
-- ============================================================================

DO $$ 
BEGIN
    -- Verificar foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_arboles_usuario') THEN
        ALTER TABLE arboles 
        ADD CONSTRAINT fk_arboles_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_seguimientos_usuario') THEN
        ALTER TABLE seguimientos 
        ADD CONSTRAINT fk_seguimientos_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_seguimientos_arbol') THEN
        ALTER TABLE seguimientos 
        ADD CONSTRAINT fk_seguimientos_arbol 
        FOREIGN KEY (arbol_id) REFERENCES arboles(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 5. VERIFICACIÓN DE ÍNDICES (CORREGIDO)
-- ============================================================================

-- Ver qué índices existen realmente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Ver estadísticas de uso de índices (cuando haya datos)
SELECT 
    schemaname,
    relname AS nombre_tabla,  -- CORREGIDO: relname en lugar de tablename
    indexrelname AS nombre_indice,
    idx_scan AS numero_escaneos,
    idx_tup_read AS tuplas_leidas,
    idx_tup_fetch AS tuplas_devueltas,
    pg_size_pretty(pg_relation_size(indexrelid)) AS tamaño
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;


-- 6. QUERIES DE PRUEBA CON EXPLAIN ANALYZE
-- ============================================================================

-- Para probar el rendimiento (ejecutar individualmente):

-- Query 1: Obtener árboles de un usuario
-- EXPLAIN ANALYZE 
-- SELECT * FROM arboles WHERE usuario_id = 1 ORDER BY creado_en DESC;

-- Query 2: Obtener seguimientos con JOIN
-- EXPLAIN ANALYZE 
-- SELECT s.*, a.nombre as arbol_nombre 
-- FROM seguimientos s
-- INNER JOIN arboles a ON s.arbol_id = a.id
-- WHERE s.usuario_id = 1
-- ORDER BY s.fecha_seguimiento DESC;

-- Query 3: Verificar propiedad de un árbol
-- EXPLAIN ANALYZE 
-- SELECT * FROM arboles WHERE id = 10 AND usuario_id = 1;


-- 7. SCRIPT DE LIMPIEZA (SI QUIERES REORGANIZAR)
-- ============================================================================

-- Opcional: Eliminar índices duplicados o no usados
-- DROP INDEX IF EXISTS idx_arboles_id_usuario_id;  -- Si existe
-- DROP INDEX IF EXISTS idx_arboles_pk_usuario;     -- Si existe
-- DROP INDEX IF EXISTS idx_seguimientos_arbol_usuario; -- Si existe

-- NOTA: Los índices duplicados no dañan el rendimiento significativamente
-- pero ocupan espacio. Mejor mantener solo los necesarios.


-- 8. RECOMENDACIONES DE MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas después de crear índices
ANALYZE usuarios;
ANALYZE arboles;
ANALYZE seguimientos;

-- Ver tamaño de índices (para monitoreo)
SELECT 
    schemaname,
    tablename,
    COUNT(*) AS cantidad_indices,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) AS tamaño_total
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tamaño_total DESC;


-- 9. VERIFICACIÓN RÁPIDA DE CONFLICTOS
-- ============================================================================

-- Verificar si hay índices duplicados exactos
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef IN (
    SELECT indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY indexdef 
    HAVING COUNT(*) > 1
)
ORDER BY tablename, indexdef;

