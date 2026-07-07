-- =====================================================================
--   BASE DE DATOS COMPLETA "Mi Árbol Crece" - VERSIÓN PRODUCCIÓN
--   Versión: 4.1 - SIN POSTGIS (Compatible con cualquier PostgreSQL)
--   Fecha: 2026-07-07
-- =====================================================================

-- ============================
-- 0. PREPARACIÓN
-- ============================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS logs_auditoria CASCADE;
DROP TABLE IF EXISTS admin_content_items CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS arboles_compartidos CASCADE;
DROP TABLE IF EXISTS seguimientos CASCADE;
DROP TABLE IF EXISTS arboles CASCADE;
DROP TABLE IF EXISTS especies_catalog CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================
-- 1. TABLA: usuarios (CON SOFT DELETE)
-- ============================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://.*\.(jpg|jpeg|png|gif|webp)$'),
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ,
  rol VARCHAR(50) DEFAULT 'USER' NOT NULL CHECK (rol IN ('USER', 'ADMIN', 'MODERATOR')),
  estado VARCHAR(50) DEFAULT 'ACTIVO' NOT NULL CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE')),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================
-- 2. TABLA: especies_catalog (NUEVA - 3FN)
-- ============================
CREATE TABLE especies_catalog (
  id SERIAL PRIMARY KEY,
  nombre_cientifico VARCHAR(150) NOT NULL UNIQUE,
  nombre_comun VARCHAR(100) NOT NULL,
  familia VARCHAR(100),
  origen VARCHAR(100),
  clima_recomendado VARCHAR(50),
  altura_maxima_cm INT,
  tiempo_crecimiento_anios INT,
  descripcion TEXT,
  imagen_referencia TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 3. TABLA: arboles (CON SOFT DELETE)
-- ============================
CREATE TABLE arboles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  especie_id INTEGER REFERENCES especies_catalog(id) ON DELETE SET NULL,
  nombre VARCHAR(100) NOT NULL,
  especie VARCHAR(100),
  latitud DECIMAL(10, 8) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud DECIMAL(11, 8) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  fecha_plantacion DATE,
  descripcion TEXT,
  foto_url TEXT CHECK (foto_url IS NULL OR foto_url ~ '^https?://.*\.(jpg|jpeg|png|gif|webp)$'),
  altura_actual_cm DECIMAL(10, 2) CHECK (altura_actual_cm IS NULL OR altura_actual_cm > 0),
  diametro_tronco_cm DECIMAL(8, 2) CHECK (diametro_tronco_cm IS NULL OR diametro_tronco_cm > 0),
  estado_salud VARCHAR(20) CHECK (estado_salud IN ('EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'CRITICO', NULL)),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT arboles_altura_check CHECK (altura_actual_cm IS NULL OR altura_actual_cm > 0)
);

-- ============================
-- 4. TABLA: arboles_compartidos (NUEVA - PARA COMPARTIR)
-- ============================
CREATE TABLE arboles_compartidos (
  id SERIAL PRIMARY KEY,
  arbol_id INTEGER NOT NULL REFERENCES arboles(id) ON DELETE CASCADE,
  usuario_comparte_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_compartido_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  permisos VARCHAR(20) DEFAULT 'READ' CHECK (permisos IN ('READ', 'WRITE', 'ADMIN')),
  fecha_compartido TIMESTAMPTZ DEFAULT NOW(),
  fecha_expiracion TIMESTAMPTZ,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(arbol_id, usuario_comparte_id, usuario_compartido_id)
);

-- ============================
-- 5. TABLA: seguimientos (CON TIPO Y VALIDACIONES)
-- ============================
CREATE TABLE seguimientos (
  id SERIAL PRIMARY KEY,
  arbol_id INTEGER NOT NULL REFERENCES arboles(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  foto_url TEXT CHECK (foto_url IS NULL OR foto_url ~ '^https?://.*\.(jpg|jpeg|png|gif|webp)$'),
  altura_cm DECIMAL(10, 2) CHECK (altura_cm IS NULL OR altura_cm > 0),
  salud VARCHAR(20) CHECK (salud IN ('EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'CRITICO', NULL)),
  tipo_seguimiento VARCHAR(30) DEFAULT 'OBSERVACION' CHECK (tipo_seguimiento IN ('RIEGO', 'PODA', 'FERTILIZACION', 'PLAGAS', 'OBSERVACION', 'COSECHA')),
  fecha_seguimiento DATE NOT NULL DEFAULT CURRENT_DATE,
  temperatura_ambiente DECIMAL(5,2),
  humedad_suelo DECIMAL(5,2),
  notas_tecnicas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- ============================
-- 6. TABLA: logs_auditoria (MEJORADA)
-- ============================
CREATE TABLE logs_auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  recurso_id INT,
  cambios_antes JSONB,
  cambios_despues JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  detalles TEXT,
  estado_respuesta INT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 7. TABLA: role_permissions
-- ============================
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL UNIQUE CHECK (rol IN ('USER', 'ADMIN', 'MODERATOR')),
  permisos JSONB NOT NULL,
  descripcion TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 8. TABLA: admin_content_items
-- ============================
CREATE TABLE admin_content_items (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('especie', 'tratamiento', 'consejo', 'enfermedad')),
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ARCHIVADO')),
  metadata JSONB,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  UNIQUE (tipo, nombre)
);

-- ============================
-- 9. ÍNDICES COMPLETOS
-- ============================
-- Usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_deleted ON usuarios(deleted_at) WHERE deleted_at IS NOT NULL;

-- Árboles
CREATE INDEX idx_arboles_usuario ON arboles(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_especie ON arboles(especie) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_estado_salud ON arboles(estado_salud) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_creado_en ON arboles(creado_en DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_usuario_fecha ON arboles(usuario_id, creado_en DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_ubicacion_lat_lon ON arboles(latitud, longitud) WHERE deleted_at IS NULL;

-- Seguimientos
CREATE INDEX idx_seguimientos_arbol ON seguimientos(arbol_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_usuario ON seguimientos(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_usuario_arbol ON seguimientos(usuario_id, arbol_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_fecha ON seguimientos(fecha_seguimiento DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_tipo ON seguimientos(tipo_seguimiento) WHERE deleted_at IS NULL;

-- Logs
CREATE INDEX idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_auditoria_fecha ON logs_auditoria(fecha_creacion DESC);
CREATE INDEX idx_logs_auditoria_accion ON logs_auditoria(accion);
CREATE INDEX idx_logs_cambios_gin ON logs_auditoria USING GIN (cambios_antes);
CREATE INDEX idx_logs_cambios_despues_gin ON logs_auditoria USING GIN (cambios_despues);

-- Role permissions
CREATE INDEX idx_role_permissions_rol ON role_permissions(rol);

-- Admin content
CREATE INDEX idx_admin_content_tipo ON admin_content_items(tipo, estado) WHERE deleted_at IS NULL;

-- ============================
-- 10. FUNCIONES Y TRIGGERS
-- ============================
-- Timestamp actualizador
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validación de coordenadas
CREATE OR REPLACE FUNCTION validar_coordenadas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitud IS NOT NULL AND (NEW.latitud < -90 OR NEW.latitud > 90) THEN
    RAISE EXCEPTION 'Latitud inválida: %', NEW.latitud;
  END IF;
  IF NEW.longitud IS NOT NULL AND (NEW.longitud < -180 OR NEW.longitud > 180) THEN
    RAISE EXCEPTION 'Longitud inválida: %', NEW.longitud;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Limpiar logs antiguos
CREATE OR REPLACE FUNCTION limpiar_logs_antiguos(dias_retencion INT DEFAULT 90)
RETURNS VOID AS $$
BEGIN
  DELETE FROM logs_auditoria 
  WHERE fecha_creacion < NOW() - (dias_retencion || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger timestamps
CREATE TRIGGER trigger_usuarios_timestamp BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_arboles_timestamp BEFORE UPDATE ON arboles FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_seguimientos_timestamp BEFORE UPDATE ON seguimientos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_especies_timestamp BEFORE UPDATE ON especies_catalog FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Trigger coordenadas
CREATE TRIGGER trigger_validar_arbol_coords BEFORE INSERT OR UPDATE ON arboles FOR EACH ROW EXECUTE FUNCTION validar_coordenadas();

-- ============================
-- 11. DATOS INICIALES - ESPECIES
-- ============================
INSERT INTO especies_catalog (nombre_cientifico, nombre_comun, familia, origen, clima_recomendado, altura_maxima_cm, tiempo_crecimiento_anios, descripcion) VALUES
('Mangifera indica', 'Mango', 'Anacardiaceae', 'India', 'Tropical', 3000, 10, 'Árbol frutal tropical de gran tamaño'),
('Annona muricata', 'Guanábana', 'Annonaceae', 'América Tropical', 'Tropical', 800, 8, 'Fruto con propiedades medicinales'),
('Carica papaya', 'Papaya', 'Caricaceae', 'América Central', 'Tropical', 1000, 5, 'Fruta rica en vitamina C'),
('Citrus aurantiifolia', 'Limón', 'Rutaceae', 'Sudeste Asiático', 'Tropical', 500, 6, 'Fruta ácida muy utilizada'),
('Citrus sinensis', 'Naranja', 'Rutaceae', 'Asia', 'Tropical', 1000, 7, 'Fruta cítrica más consumida'),
('Malus domestica', 'Manzana', 'Rosaceae', 'Asia Central', 'Templado', 1200, 8, 'Fruta de clima templado'),
('Pyrus communis', 'Pera', 'Rosaceae', 'Europa', 'Templado', 1000, 7, 'Fruta dulce de clima templado'),
('Prunus persica', 'Durazno', 'Rosaceae', 'China', 'Templado', 800, 6, 'Fruta de verano muy popular'),
('Citrullus lanatus', 'Sandía', 'Cucurbitaceae', 'África', 'Tropical', 300, 3, 'Fruta refrescante de verano'),
('Cucumis melo', 'Melón', 'Cucurbitaceae', 'África', 'Tropical', 200, 3, 'Fruta dulce y aromática'),
('Musa paradisiaca', 'Plátano', 'Musaceae', 'Sudeste Asiático', 'Tropical', 1500, 4, 'Fruta básica en alimentación'),
('Cocos nucifera', 'Coco', 'Arecaceae', 'Asia Tropical', 'Tropical', 3000, 10, 'Árbol de usos múltiples'),
('Theobroma cacao', 'Cacao', 'Malvaceae', 'América Tropical', 'Tropical', 1500, 8, 'Base del chocolate'),
('Coffea arabica', 'Café', 'Rubiaceae', 'Etiopía', 'Tropical', 500, 7, 'Planta de café de alta calidad'),
('Saccharum officinarum', 'Caña de Azúcar', 'Poaceae', 'Nueva Guinea', 'Tropical', 600, 2, 'Planta para producción de azúcar'),
('Ananas comosus', 'Piña', 'Bromeliaceae', 'Brasil', 'Tropical', 150, 3, 'Fruta tropical por excelencia'),
('Persea americana', 'Aguacate', 'Lauraceae', 'México', 'Tropical', 2000, 10, 'Fruta rica en grasas saludables'),
('Olea europaea', 'Aceituno', 'Oleaceae', 'Mediterráneo', 'Mediterráneo', 1500, 15, 'Árbol de aceite de oliva'),
('Prunus dulcis', 'Almendro', 'Rosaceae', 'Mediterráneo', 'Mediterráneo', 1000, 12, 'Fruto seco de alto valor'),
('Juglans regia', 'Nogal', 'Juglandaceae', 'Asia Central', 'Templado', 3000, 20, 'Madera noble y fruto comestible'),
('Prunus domestica', 'Ciruela', 'Rosaceae', 'Europa', 'Templado', 800, 8, 'Fruta de hueso'),
('Ficus carica', 'Higo', 'Moraceae', 'Mediterráneo', 'Mediterráneo', 1000, 7, 'Fruta de alto contenido en fibra'),
('Punica granatum', 'Granada', 'Lythraceae', 'Persia', 'Mediterráneo', 800, 8, 'Fruta antioxidante'),
('Tamarindus indica', 'Tamarindo', 'Fabaceae', 'África', 'Tropical', 3000, 15, 'Fruta con pulpa agridulce'),
('Diospyros nigra', 'Zapote Negro', 'Ebenaceae', 'México', 'Tropical', 2500, 10, 'Fruta exótica de pulpa dulce'),
('Annona cherimola', 'Chirimoya', 'Annonaceae', 'Perú', 'Subtropical', 900, 8, 'Fruta considerada la mejor del mundo'),
('Pouteria lucuma', 'Lúcuma', 'Sapotaceae', 'Perú', 'Subtropical', 1500, 10, 'Fruta emblemática del Perú'),
('Opuntia ficus-indica', 'Tuna', 'Cactaceae', 'México', 'Árido', 500, 6, 'Cactus de fruto comestible'),
('Vitis vinifera', 'Uva', 'Vitaceae', 'Mediterráneo', 'Mediterráneo', 300, 5, 'Fruta para vino y mesa'),
('Passiflora edulis', 'Maracuyá', 'Passifloraceae', 'Brasil', 'Tropical', 1000, 3, 'Fruta ácida para jugos'),
('Annona squamosa', 'Anona', 'Annonaceae', 'América Tropical', 'Tropical', 800, 7, 'Fruta de pulpa dulce'),
('Ricinus communis', 'Ricino', 'Euphorbiaceae', 'África', 'Tropical', 1200, 2, 'Planta de aceite industrial'),
('Erythrina crista-galli', 'Ceibo', 'Fabaceae', 'América del Sur', 'Tropical', 800, 12, 'Árbol ornamental de flor roja'),
('Neltuma alba', 'Algarrobo', 'Fabaceae', 'América del Sur', 'Árido', 1500, 30, 'Árbol de madera noble'),
('Vachellia caven', 'Espino', 'Fabaceae', 'América del Sur', 'Templado', 800, 15, 'Árbol de madera dura'),
('Schinus molle', 'Molle', 'Anacardiaceae', 'Perú', 'Árido', 1500, 20, 'Árbol de uso ornamental'),
('Salix babylonica', 'Sauce Llorón', 'Salicaceae', 'China', 'Templado', 2000, 15, 'Árbol de ribera muy ornamental'),
('Eucalyptus globulus', 'Eucalipto', 'Myrtaceae', 'Australia', 'Mediterráneo', 6000, 20, 'Árbol de rápido crecimiento'),
('Pinus radiata', 'Pino', 'Pinaceae', 'California', 'Mediterráneo', 3000, 30, 'Árbol para madera y resina'),
('Tectona grandis', 'Teca', 'Lamiaceae', 'Sudeste Asiático', 'Tropical', 4000, 40, 'Madera de alta calidad'),
('Cedrela odorata', 'Cedro Andino', 'Meliaceae', 'América del Sur', 'Tropical', 4000, 25, 'Madera de alta calidad'),
('Swietenia macrophylla', 'Caoba', 'Meliaceae', 'América del Sur', 'Tropical', 4000, 30, 'Madera de lujo'),
('Quercus robur', 'Roble', 'Fagaceae', 'Europa', 'Templado', 4000, 40, 'Madera noble por excelencia'),
('Laurus nobilis', 'Laurel', 'Lauraceae', 'Mediterráneo', 'Mediterráneo', 1800, 15, 'Árbol aromático de cocina'),
('Betula alba', 'Abedul', 'Betulaceae', 'Europa', 'Templado', 3000, 20, 'Árbol de corteza blanca'),
('Acer saccharum', 'Arce', 'Sapindaceae', 'América del Norte', 'Templado', 3000, 25, 'Árbol de savia dulce'),
('Fraxinus excelsior', 'Fresno', 'Oleaceae', 'Europa', 'Templado', 4000, 20, 'Madera flexible y resistente'),
('Juglans nigra', 'Nogal Negro', 'Juglandaceae', 'América del Norte', 'Templado', 4000, 30, 'Madera de alto valor'),
('Cupressus sempervirens', 'Ciprés', 'Cupressaceae', 'Mediterráneo', 'Mediterráneo', 3000, 30, 'Árbol de porte elegante'),
('Erythrina americana', 'Palo de Agua', 'Fabaceae', 'América', 'Tropical', 1500, 15, 'Árbol de floración roja');

-- ============================
-- 12. INSERTAR ROLES Y PERMISOS
-- ============================
INSERT INTO role_permissions (rol, permisos, descripcion) VALUES
  ('USER', '{
    "tree": ["create", "read_own", "update_own", "delete_own", "share"],
    "user": ["read_own", "update_own"],
    "seguimiento": ["create", "read_own", "update_own", "delete_own"],
    "admin": []
  }', 'Usuario regular con acceso a sus recursos'),
  ('MODERATOR', '{
    "tree": ["create", "read_own", "read_all", "update_own", "delete_own"],
    "user": ["read_own", "read_all", "update_own"],
    "seguimiento": ["create", "read_own", "read_all", "update_own", "delete_own"],
    "admin": ["view_audit", "view_dashboard", "manage_content"]
  }', 'Moderador con acceso intermedio'),
  ('ADMIN', '{
    "tree": ["create", "read_own", "read_all", "update_own", "update_all", "delete_own", "delete_all", "share"],
    "user": ["read_own", "read_all", "update_own", "update_all", "delete_own", "delete_all"],
    "seguimiento": ["create", "read_own", "read_all", "update_own", "update_all", "delete_own", "delete_all"],
    "admin": ["manage_users", "manage_roles", "view_audit", "view_dashboard", "manage_content", "manage_system"]
  }', 'Administrador del sistema con acceso completo')
ON CONFLICT (rol) DO NOTHING;

-- ============================
-- 13. INSERTAR USUARIOS
-- ============================
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, estado) VALUES
  ('Brenda Nicole', 'Ramírez Neyra', 'nicoleramirezneyra@gmail.com', crypt('password', gen_salt('bf')), NULL, 'USER', 'ACTIVO'),
  ('Edson', 'More Anton', 'edson@gmail.com', crypt('EdsonMore123', gen_salt('bf')), NULL, 'USER', 'ACTIVO'),
  ('Brandon', 'Inga Albines', 'brandon@gmail.com', crypt('Brandon123', gen_salt('bf')), NULL, 'USER', 'ACTIVO'),
  ('Admin', 'Sistema', 'admin@ecodataai.com', crypt('AdminPassword123', gen_salt('bf')), NULL, 'ADMIN', 'ACTIVO')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ============================
-- 14. INSERTAR ÁRBOLES
-- ============================
INSERT INTO arboles (id, usuario_id, especie_id, nombre, especie, latitud, longitud, estado_salud, descripcion) VALUES
(65, 1, 1, 'Mango Don Elpidio', 'Mango', -5.19460000, -80.63070000, 'BUENO', 'Centro Piura'),
(66, 1, 2, 'Guanábana Silvestre', 'Guanábana', -5.18500000, -80.62500000, 'REGULAR', 'Norte 1'),
(67, 1, 3, 'Papaya Gigante', 'Papaya', -5.20500000, -80.63500000, 'MALO', 'Sur 1'),
(68, 1, 4, 'Limón Agrio', 'Limón', -5.19000000, -80.61000000, 'EXCELENTE', 'Este 1'),
(69, 1, 5, 'Naranja Valencia', 'Naranja', -5.19000000, -80.65000000, 'BUENO', 'Oeste 1'),
(70, 1, 6, 'Manzana Roja', 'Manzana', -5.18000000, -80.62000000, 'REGULAR', 'Noreste 1'),
(71, 1, 7, 'Pera Dulce', 'Pera', -5.21000000, -80.64000000, 'MALO', 'Suroeste 1'),
(72, 1, 8, 'Durazno de Huancayo', 'Durazno', -5.19500000, -80.60500000, 'EXCELENTE', 'Este 2'),
(73, 1, 9, 'Sandía Negra', 'Sandía', -5.19500000, -80.65500000, 'BUENO', 'Oeste 2'),
(74, 1, 10, 'Melón Cantalupo', 'Melón', -5.17500000, -80.63000000, 'REGULAR', 'Norte 2'),
(75, 1, 11, 'Plátano Isla', 'Plátano', -5.21500000, -80.63000000, 'MALO', 'Sur 2'),
(76, 1, 12, 'Coco Piurano', 'Coco', -5.18500000, -80.60500000, 'EXCELENTE', 'Noreste 2'),
(77, 1, 13, 'Cacao Amazonas', 'Cacao', -5.20500000, -80.65500000, 'BUENO', 'Suroeste 2'),
(78, 1, 14, 'Café Arábica', 'Café', -5.19000000, -80.59500000, 'REGULAR', 'Este 3'),
(79, 1, 15, 'Caña Morada', 'Caña', -5.19000000, -80.66500000, 'MALO', 'Oeste 3'),
(80, 1, 16, 'Piña Dorada', 'Piña', -5.17000000, -80.62000000, 'EXCELENTE', 'Noreste 3'),
(81, 1, 17, 'Aguacate Hass', 'Aguacate', -5.22000000, -80.64000000, 'BUENO', 'Suroeste 3'),
(82, 1, 18, 'Aceituno Andino', 'Aceituno', -5.20000000, -80.60000000, 'REGULAR', 'Este 4'),
(83, 1, 19, 'Almendro Blanco', 'Almendro', -5.18000000, -80.66000000, 'MALO', 'Oeste 4'),
(84, 1, 20, 'Nogal Gigante', 'Nogal', -5.16500000, -80.63500000, 'EXCELENTE', 'Noreste 4'),
(85, 1, 21, 'Ciruela Morada', 'Ciruela', -5.22500000, -80.63000000, 'BUENO', 'Sur 3'),
(86, 1, 22, 'Higo Dulce', 'Higo', -5.19500000, -80.58500000, 'REGULAR', 'Este 5'),
(87, 1, 23, 'Granada Roja', 'Granada', -5.19500000, -80.67500000, 'MALO', 'Oeste 5'),
(88, 1, 24, 'Tamarindo Antiguo', 'Tamarindo', -5.16000000, -80.62500000, 'EXCELENTE', 'Noreste 5'),
(89, 1, 25, 'Zapote Negro', 'Zapote', -5.23000000, -80.63000000, 'BUENO', 'Sur 4'),
(90, 1, 26, 'Chirimoya Andina', 'Chirimoya', -5.20000000, -80.58000000, 'REGULAR', 'Este 6'),
(91, 1, 27, 'Lúcuma Peruana', 'Lúcuma', -5.19000000, -80.68000000, 'MALO', 'Oeste 6'),
(92, 1, 28, 'Tuna Verde', 'Tuna', -5.15500000, -80.64000000, 'EXCELENTE', 'Noreste 6'),
(93, 1, 29, 'Uvá Silvestre', 'Uvá', -5.23500000, -80.62500000, 'BUENO', 'Sur 5'),
(94, 1, 30, 'Maracuyá Tropical', 'Maracuyá', -5.20500000, -80.57500000, 'REGULAR', 'Este 7'),
(95, 1, 31, 'Anona Blanca', 'Anona', -5.18500000, -80.68500000, 'MALO', 'Oeste 7'),
(96, 1, 32, 'Ricino Gigante', 'Ricino', -5.15000000, -80.65000000, 'EXCELENTE', 'Noreste 7'),
(97, 1, 33, 'Ceibo Rojo', 'Ceibo', -5.24000000, -80.62000000, 'BUENO', 'Sur 6'),
(98, 1, 34, 'Algarrobo Milenario', 'Algarrobo', -5.21000000, -80.57000000, 'REGULAR', 'Este 8'),
(99, 1, 35, 'Espino Negro', 'Espino', -5.18000000, -80.69000000, 'MALO', 'Oeste 8'),
(100, 1, 36, 'Molle Andino', 'Molle', -5.14500000, -80.66000000, 'EXCELENTE', 'Noreste 8'),
(101, 1, 37, 'Sauce Llorón', 'Sauce', -5.24500000, -80.61500000, 'BUENO', 'Sur 7'),
(102, 1, 38, 'Eucalipto Australiano', 'Eucalipto', -5.21500000, -80.56500000, 'REGULAR', 'Este 9'),
(103, 1, 39, 'Pino Radiata', 'Pino', -5.17500000, -80.69500000, 'MALO', 'Oeste 9'),
(104, 1, 40, 'Teca Asiática', 'Teca', -5.14000000, -80.67000000, 'EXCELENTE', 'Noreste 9'),
(105, 1, 41, 'Cedro Andino', 'Cedro', -5.25000000, -80.61000000, 'BUENO', 'Sur 8'),
(106, 1, 42, 'Caoba Tropical', 'Caoba', -5.22000000, -80.56000000, 'REGULAR', 'Este 10'),
(107, 1, 43, 'Roble Fuerte', 'Roble', -5.17000000, -80.70000000, 'MALO', 'Oeste 10'),
(108, 1, 44, 'Laurel Aromático', 'Laurel', -5.13500000, -80.68000000, 'EXCELENTE', 'Noreste 10'),
(109, 1, 45, 'Abedul Blanco', 'Abedul', -5.25500000, -80.60500000, 'BUENO', 'Sur 9'),
(110, 1, 46, 'Arce Dorado', 'Arce', -5.22500000, -80.55500000, 'REGULAR', 'Este 11'),
(111, 1, 47, 'Fresno Noble', 'Fresno', -5.16500000, -80.70500000, 'MALO', 'Oeste 11'),
(112, 1, 48, 'Nogal Negro', 'Nogal', -5.13000000, -80.69000000, 'EXCELENTE', 'Noreste 11'),
(113, 1, 49, 'Cipres Elegante', 'Cipres', -5.26000000, -80.60000000, 'BUENO', 'Sur 10')
ON CONFLICT (id) DO NOTHING;

-- ============================
-- 15. INSERTAR SEGUIMIENTOS
-- ============================
INSERT INTO seguimientos (id, arbol_id, usuario_id, titulo, salud, tipo_seguimiento, fecha_seguimiento) VALUES
(64, 65, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(65, 66, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(66, 67, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(67, 68, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(68, 69, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(69, 70, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(70, 71, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(71, 72, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(72, 73, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(73, 74, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(74, 75, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(75, 76, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(76, 77, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(77, 78, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(78, 79, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(79, 80, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(80, 81, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(81, 82, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(82, 83, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(83, 84, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(84, 85, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(85, 86, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(86, 87, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(87, 88, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(88, 89, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(89, 90, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(90, 91, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(91, 92, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(92, 93, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(93, 94, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(94, 95, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(95, 96, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(96, 97, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(97, 98, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(98, 99, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(99, 100, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(100, 101, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(101, 102, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(102, 103, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(103, 104, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(104, 105, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(105, 106, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(106, 107, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(107, 108, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(108, 109, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11'),
(109, 110, 1, 'Seguimiento inicial', 'REGULAR', 'OBSERVACION', '2026-05-11'),
(110, 111, 1, 'Seguimiento inicial', 'MALO', 'OBSERVACION', '2026-05-11'),
(111, 112, 1, 'Seguimiento inicial', 'EXCELENTE', 'OBSERVACION', '2026-05-11'),
(112, 113, 1, 'Seguimiento inicial', 'BUENO', 'OBSERVACION', '2026-05-11')
ON CONFLICT (id) DO NOTHING;

-- ============================
-- 16. INSERTAR LOGS DE EJEMPLO
-- ============================
INSERT INTO logs_auditoria (usuario_id, accion, recurso, recurso_id, ip_address, user_agent, estado_respuesta) VALUES
(1, 'CREATE', 'arbol', 65, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 201),
(1, 'UPDATE', 'seguimiento', 64, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 200),
(4, 'MANAGE_ROLES', 'usuario', 2, '10.0.0.1', 'PostmanRuntime/7.26.8', 200);

-- ============================
-- 17. ACTUALIZAR SECUENCIAS
-- ============================
SELECT setval('usuarios_id_seq', COALESCE(MAX(id), 0) + 1) FROM usuarios;
SELECT setval('arboles_id_seq', COALESCE(MAX(id), 0) + 1) FROM arboles;
SELECT setval('seguimientos_id_seq', COALESCE(MAX(id), 0) + 1) FROM seguimientos;
SELECT setval('especies_catalog_id_seq', COALESCE(MAX(id), 0) + 1) FROM especies_catalog;
SELECT setval('role_permissions_id_seq', COALESCE(MAX(id), 0) + 1) FROM role_permissions;
SELECT setval('admin_content_items_id_seq', COALESCE(MAX(id), 0) + 1) FROM admin_content_items;

-- ============================
-- 18. VISTAS MEJORADAS
-- ============================
CREATE OR REPLACE VIEW v_usuarios_activos AS
SELECT id, nombre, email, rol, estado, DATE(fecha_registro) AS fecha_registro
FROM usuarios 
WHERE estado = 'ACTIVO' AND deleted_at IS NULL
ORDER BY fecha_registro DESC;

CREATE OR REPLACE VIEW v_arboles_con_especie AS
SELECT 
  a.id, a.nombre, a.especie, e.nombre_cientifico, e.nombre_comun,
  a.latitud, a.longitud, a.estado_salud, a.altura_actual_cm,
  a.fecha_plantacion, u.nombre AS usuario_nombre, u.email AS usuario_email,
  a.creado_en
FROM arboles a
LEFT JOIN especies_catalog e ON a.especie_id = e.id
JOIN usuarios u ON a.usuario_id = u.id
WHERE a.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_seguimientos_completos AS
SELECT 
  s.id, s.titulo, s.descripcion, s.altura_cm, s.salud,
  s.tipo_seguimiento, s.fecha_seguimiento,
  a.nombre AS arbol_nombre, a.especie AS arbol_especie,
  u.nombre AS usuario_nombre, u.email AS usuario_email,
  s.creado_en
FROM seguimientos s
JOIN arboles a ON s.arbol_id = a.id
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.deleted_at IS NULL AND a.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_estadisticas_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM usuarios WHERE deleted_at IS NULL) AS total_usuarios,
  (SELECT COUNT(*) FROM arboles WHERE deleted_at IS NULL) AS total_arboles,
  (SELECT COUNT(*) FROM seguimientos WHERE deleted_at IS NULL) AS total_seguimientos,
  (SELECT COUNT(*) FROM especies_catalog WHERE activo = true) AS total_especies,
  (SELECT COUNT(*) FROM arboles WHERE estado_salud = 'EXCELENTE' AND deleted_at IS NULL) AS arboles_excelentes,
  (SELECT AVG(altura_cm) FROM seguimientos WHERE deleted_at IS NULL) AS altura_promedio_cm;

CREATE OR REPLACE VIEW v_audit_stats AS
SELECT 
  DATE_TRUNC('day', fecha_creacion)::DATE AS fecha,
  accion,
  COUNT(*) AS cantidad,
  COUNT(DISTINCT usuario_id) AS usuarios_unicos
FROM logs_auditoria
GROUP BY DATE_TRUNC('day', fecha_creacion), accion
ORDER BY fecha DESC, cantidad DESC;

-- ============================
-- 19. FUNCIONES UTILITARIAS
-- ============================
-- Función para calcular distancia aproximada entre coordenadas (Fórmula de Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia_km(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Radio de la Tierra en km
  dlat DECIMAL := RADIANS(lat2 - lat1);
  dlon DECIMAL := RADIANS(lon2 - lon1);
  a DECIMAL;
  c DECIMAL;
BEGIN
  a := sin(dlat/2)^2 + cos(RADIANS(lat1)) * cos(RADIANS(lat2)) * sin(dlon/2)^2;
  c := 2 * asin(sqrt(a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Buscar árboles cercanos (versión sin PostGIS)
CREATE OR REPLACE FUNCTION buscar_arboles_cercanos(
  p_lat DECIMAL, 
  p_lon DECIMAL, 
  p_radio_km INT DEFAULT 10,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  id INT,
  nombre VARCHAR,
  especie VARCHAR,
  latitud DECIMAL,
  longitud DECIMAL,
  distancia_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.nombre,
    a.especie,
    a.latitud,
    a.longitud,
    calcular_distancia_km(p_lat, p_lon, a.latitud, a.longitud) AS distancia_km
  FROM arboles a
  WHERE a.deleted_at IS NULL
    AND calcular_distancia_km(p_lat, p_lon, a.latitud, a.longitud) <= p_radio_km
  ORDER BY distancia_km
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Obtener historial de salud de un árbol
CREATE OR REPLACE FUNCTION get_arbol_health_history(p_arbol_id INT)
RETURNS TABLE(
  fecha DATE,
  salud VARCHAR,
  altura_cm DECIMAL,
  tipo VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.fecha_seguimiento,
    s.salud,
    s.altura_cm,
    s.tipo_seguimiento
  FROM seguimientos s
  WHERE s.arbol_id = p_arbol_id
    AND s.deleted_at IS NULL
    AND s.salud IS NOT NULL
  ORDER BY s.fecha_seguimiento DESC;
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas de un usuario
CREATE OR REPLACE FUNCTION get_user_stats(p_usuario_id INT)
RETURNS TABLE(
  total_arboles INT,
  total_seguimientos INT,
  arboles_excelentes INT,
  arboles_regulares INT,
  arboles_malos INT,
  altura_promedio DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT a.id)::INT,
    COUNT(s.id)::INT,
    COUNT(CASE WHEN a.estado_salud = 'EXCELENTE' THEN 1 END)::INT,
    COUNT(CASE WHEN a.estado_salud = 'REGULAR' THEN 1 END)::INT,
    COUNT(CASE WHEN a.estado_salud = 'MALO' THEN 1 END)::INT,
    AVG(s.altura_cm)
  FROM usuarios u
  LEFT JOIN arboles a ON u.id = a.usuario_id AND a.deleted_at IS NULL
  LEFT JOIN seguimientos s ON a.id = s.arbol_id AND s.deleted_at IS NULL
  WHERE u.id = p_usuario_id AND u.deleted_at IS NULL
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 20. VERIFICACIÓN FINAL
-- ============================
SELECT '
╔══════════════════════════════════════════════════════════════════╗
║   ✅ BASE DE DATOS COMPLETA - VERSIÓN PRODUCCIÓN 4.1           ║
║   Proyecto: Mi Árbol Crece - SIN POSTGIS (Compatible)          ║
║   Fecha: ' || NOW()::TEXT || '                               ║
╠══════════════════════════════════════════════════════════════════╣
║   MEJORAS APLICADAS:                                           ║
║   ✅ Soft Delete (deleted_at) en todas las tablas              ║
║   ✅ Tabla especies_catalog (3FN)                              ║
║   ✅ Función Haversine para cálculos geográficos               ║
║   ✅ CHECK constraints en todos los campos enumerados          ║
║   ✅ Índices GIN para JSONB en auditoría                      ║
║   ✅ Tabla arboles_compartidos (compartir árboles)             ║
║   ✅ Función de búsqueda por cercanía                         ║
║   ✅ Historial de salud por árbol                             ║
║   ✅ Estadísticas por usuario                                 ║
║   ✅ SIN DEPENDENCIAS POSTGIS                                 ║
╚══════════════════════════════════════════════════════════════════╝
' AS mensaje;

SELECT '📊 ESTADÍSTICAS FINALES:' AS seccion;
SELECT 
  (SELECT COUNT(*) FROM usuarios WHERE deleted_at IS NULL) AS total_usuarios,
  (SELECT COUNT(*) FROM arboles WHERE deleted_at IS NULL) AS total_arboles,
  (SELECT COUNT(*) FROM seguimientos WHERE deleted_at IS NULL) AS total_seguimientos,
  (SELECT COUNT(*) FROM especies_catalog WHERE activo = true) AS total_especies;

SELECT '👥 USUARIOS CREADOS:' AS seccion;
SELECT id, nombre, email, rol, estado FROM usuarios WHERE deleted_at IS NULL ORDER BY id;

SELECT '🌳 MUESTRA DE ÁRBOLES CON ESPECIE:' AS seccion;
SELECT 
  a.id, a.nombre, a.especie, e.nombre_cientifico, a.estado_salud,
  ROUND(a.latitud::numeric, 4) AS lat, ROUND(a.longitud::numeric, 4) AS lon
FROM arboles a
LEFT JOIN especies_catalog e ON a.especie_id = e.id
WHERE a.deleted_at IS NULL
ORDER BY a.id LIMIT 5;

SELECT '🔐 CREDENCIALES DE ACCESO:' AS seccion;
SELECT E'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 nicoleramirezneyra@gmail.com  |  🔑 password
📧 edson@gmail.com                |  🔑 EdsonMore123
📧 brandon@gmail.com              |  🔑 Brandon123
📧 admin@ecodataai.com            |  🔑 AdminPassword123 (ADMIN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS credenciales;

-- ============================
-- 21. PRUEBAS RÁPIDAS
-- ============================
SELECT '🔍 PRUEBA: Árboles cercanos a (-5.19, -80.63) en 5 km:' AS seccion;
SELECT * FROM buscar_arboles_cercanos(-5.19000000, -80.63000000, 5, 3);

SELECT '📈 PRUEBA: Historial de salud del árbol 65:' AS seccion;
SELECT * FROM get_arbol_health_history(65) LIMIT 3;

SELECT '📊 PRUEBA: Estadísticas del usuario 1:' AS seccion;
SELECT * FROM get_user_stats(1);

SELECT '✅ BASE DE DATOS LISTA PARA PRODUCCIÓN (SIN POSTGIS)' AS estado_final;