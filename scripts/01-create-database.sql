-- =====================================================================
--   BASE DE DATOS COMPLETA "Mi Árbol Crece" + MIGRACIONES INCLUIDAS
-- =====================================================================

-- ============================
-- 1. TABLA: usuarios
-- ============================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,  -- YA DIRECTAMENTE TEXT
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. TABLA: arboles
-- ============================
CREATE TABLE IF NOT EXISTS arboles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  especie VARCHAR(100),
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  fecha_plantacion DATE,
  descripcion TEXT,
  foto_url TEXT,  -- YA DIRECTAMENTE TEXT
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. TABLA: seguimientos
-- ============================
CREATE TABLE IF NOT EXISTS seguimientos (
  id SERIAL PRIMARY KEY,
  arbol_id INTEGER NOT NULL REFERENCES arboles(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  foto_url TEXT, -- YA DIRECTAMENTE TEXT
  altura_cm DECIMAL(10, 2),
  salud VARCHAR(50),
  fecha_seguimiento DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- 4. ÍNDICES (rendimiento)
-- ==================================
CREATE INDEX IF NOT EXISTS idx_arboles_usuario ON arboles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_arbol ON seguimientos(arbol_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario ON seguimientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_fecha ON seguimientos(fecha_seguimiento);
CREATE INDEX IF NOT EXISTS idx_usuarios_avatar ON usuarios(id) WHERE avatar_url IS NOT NULL;

-- ==================================
-- 5. TRIGGER: Actualizar timestamp
-- ==================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_arboles_timestamp
BEFORE UPDATE ON arboles
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_seguimientos_timestamp
BEFORE UPDATE ON seguimientos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();


-- =====================================================================
-- 6. MIGRACIONES (solo aplican si ya existían tablas)
--    Ya están incluidas aquí por compatibilidad
-- =====================================================================

-- Asegurar que avatar_url sea TEXT
ALTER TABLE usuarios
  ALTER COLUMN avatar_url TYPE TEXT;

-- Asegurar que foto_url sea TEXT en arboles
ALTER TABLE arboles
  ALTER COLUMN foto_url TYPE TEXT;

-- Asegurar que foto_url sea TEXT en seguimientos
ALTER TABLE seguimientos
  ALTER COLUMN foto_url TYPE TEXT;

-- =====================================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================================
SELECT 'Migración completada. Todas las columnas de imágenes ahora usan TEXT.' AS estado;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('usuarios','arboles','seguimientos')
AND column_name IN ('avatar_url','foto_url');
