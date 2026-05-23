-- 03-add-roles-to-db.sql
-- Agregar sistema de roles y auditoría
-- Ejecución segura: verifica si la columna ya existe

-- 1. Agregar columna rol a usuarios (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='usuarios' AND column_name='rol'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) DEFAULT 'USER' NOT NULL;
    RAISE NOTICE 'Columna rol agregada a usuarios';
  END IF;
END $$;

-- 2. Agregar columna estado a usuarios (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='usuarios' AND column_name='estado'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN estado VARCHAR(50) DEFAULT 'ACTIVO' NOT NULL;
    RAISE NOTICE 'Columna estado agregada a usuarios';
  END IF;
END $$;

-- 3. Crear tabla logs_auditoria (si no existe)
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  recurso_id INT,
  cambios_antes JSONB,
  cambios_despues JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  detalles TEXT,
  estado_respuesta INT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha ON logs_auditoria(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_accion ON logs_auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_recurso ON logs_auditoria(recurso);

-- 4. Crear tabla de permisos por rol (para futura extensión)
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL UNIQUE,
  permisos JSONB NOT NULL,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índice para roles
CREATE INDEX IF NOT EXISTS idx_role_permissions_rol ON role_permissions(rol);

-- 5. Insertar permisos por defecto (si no existen)
INSERT INTO role_permissions (rol, permisos, descripcion) VALUES
  ('USER', '{"tree": ["create", "read_own", "update_own", "delete_own"], "user": ["read_own", "update_own"], "admin": []}', 'Usuario regular con acceso a sus recursos'),
  ('ADMIN', '{"tree": ["create", "read_own", "read_all", "update_own", "delete_own"], "user": ["read_own", "read_all", "update_own"], "admin": ["manage_users", "manage_roles", "view_audit", "view_dashboard"]}', 'Administrador del sistema con acceso completo')
ON CONFLICT (rol) DO NOTHING;

-- 6. Actualizar usuario de semilla si existe (para testing)
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'admin@ecodataai.com' AND rol != 'ADMIN';

-- 7. Crear vista para estadísticas de auditoría
CREATE OR REPLACE VIEW v_audit_stats AS
SELECT 
  DATE_TRUNC('day', fecha_creacion)::DATE AS fecha,
  accion,
  COUNT(*) AS cantidad,
  COUNT(DISTINCT usuario_id) AS usuarios_unicos
FROM logs_auditoria
GROUP BY DATE_TRUNC('day', fecha_creacion), accion
ORDER BY fecha DESC, cantidad DESC;

-- Confirmación
SELECT '✅ Migración completada: Roles y Auditoría' AS mensaje;

-- Verificar estado
SELECT 
  'usuarios' AS tabla,
  COUNT(*) AS total_registros,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'ADMIN') AS admins,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'USER') AS usuarios
FROM usuarios;

SELECT 
  'logs_auditoria' AS tabla,
  COUNT(*) AS total_registros,
  MAX(fecha_creacion) AS ultimo_registro
FROM logs_auditoria;
