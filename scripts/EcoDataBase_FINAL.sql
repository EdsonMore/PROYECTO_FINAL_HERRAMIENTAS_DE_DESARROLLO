-- =====================================================================
--   BASE DE DATOS COMPLETA "Mi Árbol Crece" 
--   Versión: 3.0 - Con Datos Reales + Usuarios Pre-cargados
--   Fecha: 2026-05-29
--   Árboles: 49 | Seguimientos: 49 | Usuarios: 4 (original + 3 nuevos)
-- =====================================================================

-- ============================
-- 0. PREPARACIÓN
-- ============================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS logs_auditoria CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS seguimientos CASCADE;
DROP TABLE IF EXISTS arboles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================
-- 1. TABLA: usuarios
-- ============================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  avatar_url TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rol VARCHAR(50) DEFAULT 'USER' NOT NULL,
  estado VARCHAR(50) DEFAULT 'ACTIVO' NOT NULL
);

-- ============================
-- 2. TABLA: arboles
-- ============================
CREATE TABLE arboles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  especie VARCHAR(100),
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  fecha_plantacion DATE,
  descripcion TEXT,
  foto_url TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. TABLA: seguimientos
-- ============================
CREATE TABLE seguimientos (
  id SERIAL PRIMARY KEY,
  arbol_id INTEGER NOT NULL REFERENCES arboles(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  foto_url TEXT,
  altura_cm DECIMAL(10, 2),
  salud VARCHAR(50),
  fecha_seguimiento DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 4. TABLA: logs_auditoria
-- ============================
CREATE TABLE logs_auditoria (
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

-- ============================
-- 5. TABLA: role_permissions
-- ============================
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL UNIQUE,
  permisos JSONB NOT NULL,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- ==================================
-- 6. ÍNDICES (rendimiento)
-- ==================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_avatar ON usuarios(id) WHERE avatar_url IS NOT NULL;

CREATE INDEX idx_arboles_usuario ON arboles(usuario_id);
CREATE INDEX idx_arboles_usuario_id ON arboles(usuario_id, id);
CREATE INDEX idx_arboles_especie ON arboles(especie);
CREATE INDEX idx_arboles_creado_en ON arboles(creado_en DESC);

CREATE INDEX idx_seguimientos_arbol ON seguimientos(arbol_id);
CREATE INDEX idx_seguimientos_usuario ON seguimientos(usuario_id);
CREATE INDEX idx_seguimientos_usuario_arbol ON seguimientos(usuario_id, arbol_id);
CREATE INDEX idx_seguimientos_fecha ON seguimientos(fecha_seguimiento);

CREATE INDEX idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_auditoria_fecha ON logs_auditoria(fecha_creacion DESC);
CREATE INDEX idx_logs_auditoria_accion ON logs_auditoria(accion);

CREATE INDEX idx_role_permissions_rol ON role_permissions(rol);

-- ==================================
-- 7. FUNCIÓN: Actualizar timestamp
-- ==================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- 8. TRIGGERS: Timestamp
-- ==================================
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

-- ==================================
-- 9. INSERTAR ROLES Y PERMISOS
-- ==================================
INSERT INTO role_permissions (rol, permisos, descripcion) VALUES
  ('USER', '{"tree": ["create", "read_own", "update_own", "delete_own"], "user": ["read_own", "update_own"], "admin": []}', 'Usuario regular con acceso a sus recursos'),
  ('ADMIN', '{"tree": ["create", "read_own", "read_all", "update_own", "delete_own"], "user": ["read_own", "read_all", "update_own"], "admin": ["manage_users", "manage_roles", "view_audit", "view_dashboard"]}', 'Administrador del sistema con acceso completo')
ON CONFLICT (rol) DO NOTHING;

-- ==================================
-- 10. INSERTAR USUARIO ORIGINAL (CON HASHES GENERADOS AUTOMÁTICAMENTE)
-- ==================================
-- 🔑 CONTRASEÑAS GENERADAS AUTOMÁTICAMENTE CON CRYPT
-- Los hashes se generan en tiempo de ejecución con pgcrypto
-- Cada usuario tiene su propia contraseña
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, estado, fecha_registro, actualizado_en)
VALUES 
  ('Brenda Nicole', 'Ramírez Neyra', 'nicoleramirezneyra@gmail.com', 
   crypt('password', gen_salt('bf')), 
   NULL, 'USER', 'ACTIVO', NOW(), NOW()),
  
  ('Edson', 'More Anton', 'edson@gmail.com',
   crypt('EdsonMore123', gen_salt('bf')), 
   NULL, 'USER', 'ACTIVO', NOW(), NOW()),
  
  ('Brandon', 'Inga Albines', 'brandon@gmail.com',
   crypt('Brandon123', gen_salt('bf')), 
   NULL, 'USER', 'ACTIVO', NOW(), NOW()),
  
  ('Admin', 'Sistema', 'admin@ecodataai.com',
   crypt('AdminPassword123', gen_salt('bf')), 
   NULL, 'ADMIN', 'ACTIVO', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    actualizado_en = NOW();

-- ==================================
-- 12. INSERTAR ÁRBOLES REALES
-- ==================================
INSERT INTO arboles (id, usuario_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, foto_url, creado_en, actualizado_en) VALUES
(65, 1, 'Mango Don Elpidio', 'Mango', -5.19460000, -80.63070000, NULL, 'Centro Piura', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(66, 1, 'Guanábana Silvestre', 'Guanábana', -5.18500000, -80.62500000, NULL, 'Norte 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(67, 1, 'Papaya Gigante', 'Papaya', -5.20500000, -80.63500000, NULL, 'Sur 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(68, 1, 'Limón Agrio', 'Limón', -5.19000000, -80.61000000, NULL, 'Este 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(69, 1, 'Naranja Valencia', 'Naranja', -5.19000000, -80.65000000, NULL, 'Oeste 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(70, 1, 'Manzana Roja', 'Manzana', -5.18000000, -80.62000000, NULL, 'Noreste 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(71, 1, 'Pera Dulce', 'Pera', -5.21000000, -80.64000000, NULL, 'Suroeste 1', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(72, 1, 'Durazno de Huancayo', 'Durazno', -5.19500000, -80.60500000, NULL, 'Este 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(73, 1, 'Sandía Negra', 'Sandía', -5.19500000, -80.65500000, NULL, 'Oeste 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(74, 1, 'Melón Cantalupo', 'Melón', -5.17500000, -80.63000000, NULL, 'Norte 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(75, 1, 'Plátano Isla', 'Plátano', -5.21500000, -80.63000000, NULL, 'Sur 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(76, 1, 'Coco Piurano', 'Coco', -5.18500000, -80.60500000, NULL, 'Noreste 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(77, 1, 'Cacao Amazonas', 'Cacao', -5.20500000, -80.65500000, NULL, 'Suroeste 2', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(78, 1, 'Café Arábica', 'Café', -5.19000000, -80.59500000, NULL, 'Este 3', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(79, 1, 'Caña Morada', 'Caña', -5.19000000, -80.66500000, NULL, 'Oeste 3', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(80, 1, 'Piña Dorada', 'Piña', -5.17000000, -80.62000000, NULL, 'Noreste 3', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(81, 1, 'Aguacate Hass', 'Aguacate', -5.22000000, -80.64000000, NULL, 'Suroeste 3', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(82, 1, 'Aceituno Andino', 'Aceituno', -5.20000000, -80.60000000, NULL, 'Este 4', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(83, 1, 'Almendro Blanco', 'Almendro', -5.18000000, -80.66000000, NULL, 'Oeste 4', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(84, 1, 'Nogal Gigante', 'Nogal', -5.16500000, -80.63500000, NULL, 'Noreste 4', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(85, 1, 'Ciruela Morada', 'Ciruela', -5.22500000, -80.63000000, NULL, 'Sur 3', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(86, 1, 'Higo Dulce', 'Higo', -5.19500000, -80.58500000, NULL, 'Este 5', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(87, 1, 'Granada Roja', 'Granada', -5.19500000, -80.67500000, NULL, 'Oeste 5', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(88, 1, 'Tamarindo Antiguo', 'Tamarindo', -5.16000000, -80.62500000, NULL, 'Noreste 5', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(89, 1, 'Zapote Negro', 'Zapote', -5.23000000, -80.63000000, NULL, 'Sur 4', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(90, 1, 'Chirimoya Andina', 'Chirimoya', -5.20000000, -80.58000000, NULL, 'Este 6', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(91, 1, 'Lúcuma Peruana', 'Lúcuma', -5.19000000, -80.68000000, NULL, 'Oeste 6', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(92, 1, 'Tuna Verde', 'Tuna', -5.15500000, -80.64000000, NULL, 'Noreste 6', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(93, 1, 'Uvá Silvestre', 'Uvá', -5.23500000, -80.62500000, NULL, 'Sur 5', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(94, 1, 'Maracuyá Tropical', 'Maracuyá', -5.20500000, -80.57500000, NULL, 'Este 7', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(95, 1, 'Anona Blanca', 'Anona', -5.18500000, -80.68500000, NULL, 'Oeste 7', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(96, 1, 'Ricino Gigante', 'Ricino', -5.15000000, -80.65000000, NULL, 'Noreste 7', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(97, 1, 'Ceibo Rojo', 'Ceibo', -5.24000000, -80.62000000, NULL, 'Sur 6', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(98, 1, 'Algarrobo Milenario', 'Algarrobo', -5.21000000, -80.57000000, NULL, 'Este 8', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(99, 1, 'Espino Negro', 'Espino', -5.18000000, -80.69000000, NULL, 'Oeste 8', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(100, 1, 'Molle Andino', 'Molle', -5.14500000, -80.66000000, NULL, 'Noreste 8', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(101, 1, 'Sauce Llorón', 'Sauce', -5.24500000, -80.61500000, NULL, 'Sur 7', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(102, 1, 'Eucalipto Australiano', 'Eucalipto', -5.21500000, -80.56500000, NULL, 'Este 9', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(103, 1, 'Pino Radiata', 'Pino', -5.17500000, -80.69500000, NULL, 'Oeste 9', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(104, 1, 'Teca Asiática', 'Teca', -5.14000000, -80.67000000, NULL, 'Noreste 9', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(105, 1, 'Cedro Andino', 'Cedro', -5.25000000, -80.61000000, NULL, 'Sur 8', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(106, 1, 'Caoba Tropical', 'Caoba', -5.22000000, -80.56000000, NULL, 'Este 10', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(107, 1, 'Roble Fuerte', 'Roble', -5.17000000, -80.70000000, NULL, 'Oeste 10', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(108, 1, 'Laurel Aromático', 'Laurel', -5.13500000, -80.68000000, NULL, 'Noreste 10', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(109, 1, 'Abedul Blanco', 'Abedul', -5.25500000, -80.60500000, NULL, 'Sur 9', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(110, 1, 'Arce Dorado', 'Arce', -5.22500000, -80.55500000, NULL, 'Este 11', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(111, 1, 'Fresno Noble', 'Fresno', -5.16500000, -80.70500000, NULL, 'Oeste 11', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(112, 1, 'Nogal Negro', 'Nogal', -5.13000000, -80.69000000, NULL, 'Noreste 11', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924'),
(113, 1, 'Cipres Elegante', 'Cipres', -5.26000000, -80.60000000, NULL, 'Sur 10', NULL, '2026-05-11 22:34:23.748382', '2026-05-11 23:10:28.874924')
ON CONFLICT (id) DO NOTHING;

-- ==================================
-- 13. INSERTAR SEGUIMIENTOS REALES
-- ==================================
INSERT INTO seguimientos (id, arbol_id, usuario_id, titulo, descripcion, foto_url, altura_cm, salud, fecha_seguimiento, creado_en, actualizado_en) VALUES
(64, 65, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(65, 66, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(66, 67, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(67, 68, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(68, 69, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(69, 70, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(70, 71, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(71, 72, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(72, 73, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(73, 74, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(74, 75, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(75, 76, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(76, 77, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(77, 78, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(78, 79, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(79, 80, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(80, 81, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(81, 82, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(82, 83, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(83, 84, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(84, 85, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(85, 86, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(86, 87, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(87, 88, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(88, 89, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(89, 90, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(90, 91, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(91, 92, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(92, 93, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(93, 94, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(94, 95, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(95, 96, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(96, 97, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(97, 98, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(98, 99, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(99, 100, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(100, 101, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(101, 102, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(102, 103, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(103, 104, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(104, 105, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(105, 106, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(106, 107, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(107, 108, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(108, 109, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(109, 110, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(110, 111, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'regular', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(111, 112, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'malo', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382'),
(112, 113, 1, 'Seguimiento inicial', NULL, NULL, NULL, 'excelente', '2026-05-11', '2026-05-11 22:34:23.748382', '2026-05-11 22:34:23.748382')
ON CONFLICT (id) DO NOTHING;

-- ==================================
-- 14. ACTUALIZAR SECUENCIAS
-- ==================================
SELECT setval('usuarios_id_seq', COALESCE(MAX(id), 0) + 1) FROM usuarios;
SELECT setval('arboles_id_seq', COALESCE(MAX(id), 0) + 1) FROM arboles;
SELECT setval('seguimientos_id_seq', COALESCE(MAX(id), 0) + 1) FROM seguimientos;

-- ==================================
-- 15. VISTAS ÚTILES
-- ==================================
CREATE OR REPLACE VIEW v_usuarios_activos AS
SELECT 
  id, nombre, email, rol, estado, 
  DATE(fecha_registro) AS fecha_registro,
  DATE(actualizado_en) AS actualizado_en
FROM usuarios
WHERE estado = 'ACTIVO'
ORDER BY fecha_registro DESC;

CREATE OR REPLACE VIEW v_audit_stats AS
SELECT 
  DATE_TRUNC('day', fecha_creacion)::DATE AS fecha,
  accion,
  COUNT(*) AS cantidad,
  COUNT(DISTINCT usuario_id) AS usuarios_unicos
FROM logs_auditoria
GROUP BY DATE_TRUNC('day', fecha_creacion), accion
ORDER BY fecha DESC, cantidad DESC;

CREATE OR REPLACE VIEW v_estadisticas_bd AS
SELECT 
  'usuarios' AS tabla,
  (SELECT COUNT(*) FROM usuarios) AS total,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'ADMIN') AS admins,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'USER') AS usuarios,
  (SELECT COUNT(*) FROM usuarios WHERE estado = 'ACTIVO') AS activos
UNION ALL
SELECT 
  'arboles' AS tabla,
  (SELECT COUNT(*) FROM arboles) AS total,
  0 AS admins,
  0 AS usuarios,
  0 AS activos
UNION ALL
SELECT 
  'seguimientos' AS tabla,
  (SELECT COUNT(*) FROM seguimientos) AS total,
  0 AS admins,
  0 AS usuarios,
  0 AS activos;

-- ==================================
-- 16. VERIFICACIÓN FINAL
-- ==================================
SELECT '
╔════════════════════════════════════════════════╗
║   ✅ BASE DE DATOS COMPLETA EXITOSAMENTE      ║
║   Proyecto: Mi Árbol Crece                    ║
║   Versión: 3.0 - Con Datos Reales             ║
║   Fecha: ' || NOW()::TEXT || '   ║
╚════════════════════════════════════════════════╝
' AS mensaje;

SELECT '📊 ESTADÍSTICAS FINALES:' AS seccion;
SELECT * FROM v_estadisticas_bd;

SELECT '👥 USUARIOS CREADOS:' AS seccion;
SELECT id, nombre, email, rol, estado FROM usuarios ORDER BY id;

SELECT '🌳 MUESTRA DE ÁRBOLES:' AS seccion;
SELECT id, nombre, especie, descripcion FROM arboles ORDER BY id LIMIT 5;

SELECT '📝 MUESTRA DE SEGUIMIENTOS:' AS seccion;
SELECT id, titulo, salud, fecha_seguimiento FROM seguimientos ORDER BY id LIMIT 5;

SELECT '🔐 INFORMACIÓN IMPORTANTE:' AS seccion;
SELECT E'
USUARIOS CREADOS EN ESTA BD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Brenda Nicole Ramírez Neyra (ORIGINAL)
   📧 nicoleramirezneyra@gmail.com
   � Password: password
   👤 USER - Propietaria de 49 árboles

2. Edson More Anton ⭐
   📧 edson@gmail.com
   🔐 Password: EdsonMore123
   👤 USER

3. Brandon Inga Albines ⭐
   📧 brandon@gmail.com
   🔐 Password: Brandon123
   👤 USER

4. Admin Sistema ⭐⭐ (ADMIN)
   📧 admin@ecodataai.com
   🔐 Password: AdminPassword123
   👤 ADMIN
' AS informacion;
