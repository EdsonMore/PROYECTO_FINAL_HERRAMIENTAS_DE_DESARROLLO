-- =====================================================================
--   BASE DE DATOS COMPLETA "Mi Árbol Crece" - VERSIÓN PRODUCCIÓN
--   Versión: 4.2 - CON DATOS REALISTAS (FECHAS Y MEDIDAS VARIADAS)
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
  foto_url TEXT CHECK (foto_url IS NULL OR foto_url ~ '^https?://' OR foto_url ~ '^data:image/'),
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
  foto_url TEXT CHECK (foto_url IS NULL OR foto_url ~ '^https?://' OR foto_url ~ '^data:image/'),
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
CREATE INDEX idx_usuarios_email ON usuarios(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_deleted ON usuarios(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_arboles_usuario ON arboles(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_especie ON arboles(especie) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_estado_salud ON arboles(estado_salud) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_creado_en ON arboles(creado_en DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_usuario_fecha ON arboles(usuario_id, creado_en DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_arboles_ubicacion_lat_lon ON arboles(latitud, longitud) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_arbol ON seguimientos(arbol_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_usuario ON seguimientos(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_usuario_arbol ON seguimientos(usuario_id, arbol_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_fecha ON seguimientos(fecha_seguimiento DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_seguimientos_tipo ON seguimientos(tipo_seguimiento) WHERE deleted_at IS NULL;
CREATE INDEX idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_auditoria_fecha ON logs_auditoria(fecha_creacion DESC);
CREATE INDEX idx_logs_auditoria_accion ON logs_auditoria(accion);
CREATE INDEX idx_logs_cambios_gin ON logs_auditoria USING GIN (cambios_antes);
CREATE INDEX idx_logs_cambios_despues_gin ON logs_auditoria USING GIN (cambios_despues);
CREATE INDEX idx_role_permissions_rol ON role_permissions(rol);
CREATE INDEX idx_admin_content_tipo ON admin_content_items(tipo, estado) WHERE deleted_at IS NULL;

-- ============================
-- 10. FUNCIONES Y TRIGGERS
-- ============================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION limpiar_logs_antiguos(dias_retencion INT DEFAULT 90)
RETURNS VOID AS $$
BEGIN
  DELETE FROM logs_auditoria 
  WHERE fecha_creacion < NOW() - (dias_retencion || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_timestamp BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_arboles_timestamp BEFORE UPDATE ON arboles FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_seguimientos_timestamp BEFORE UPDATE ON seguimientos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_especies_timestamp BEFORE UPDATE ON especies_catalog FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_validar_arbol_coords BEFORE INSERT OR UPDATE ON arboles FOR EACH ROW EXECUTE FUNCTION validar_coordenadas();



-- ==================================
--  11 POBLAR admin_content_items - ESPECIES
-- (SOLO INSERTS - SIN MODIFICAR ESTRUCTURA)
-- ==================================

INSERT INTO admin_content_items (tipo, nombre, descripcion, estado, metadata) VALUES
  ('especie', 'Mango', 'Árbol frutal tropical de la familia Anacardiaceae', 'ACTIVO', '{"familia": "Anacardiaceae", "origen": "India"}'),
  ('especie', 'Guanábana', 'Árbol frutal de la familia Annonaceae', 'ACTIVO', '{"familia": "Annonaceae", "origen": "América Tropical"}'),
  ('especie', 'Papaya', 'Fruta tropical de la familia Caricaceae', 'ACTIVO', '{"familia": "Caricaceae", "origen": "América Central"}'),
  ('especie', 'Limón', 'Cítrico de la familia Rutaceae', 'ACTIVO', '{"familia": "Rutaceae", "origen": "Sudeste Asiático"}'),
  ('especie', 'Naranja', 'Cítrico dulce de la familia Rutaceae', 'ACTIVO', '{"familia": "Rutaceae", "origen": "Asia"}'),
  ('especie', 'Manzana', 'Fruta de la familia Rosaceae', 'ACTIVO', '{"familia": "Rosaceae", "origen": "Asia Central"}'),
  ('especie', 'Pera', 'Fruta de la familia Rosaceae', 'ACTIVO', '{"familia": "Rosaceae", "origen": "Europa"}'),
  ('especie', 'Durazno', 'Fruta de la familia Rosaceae', 'ACTIVO', '{"familia": "Rosaceae", "origen": "China"}'),
  ('especie', 'Sandía', 'Fruta de la familia Cucurbitaceae', 'ACTIVO', '{"familia": "Cucurbitaceae", "origen": "África"}'),
  ('especie', 'Melón', 'Fruta de la familia Cucurbitaceae', 'ACTIVO', '{"familia": "Cucurbitaceae", "origen": "África"}'),
  ('especie', 'Plátano', 'Planta de la familia Musaceae', 'ACTIVO', '{"familia": "Musaceae", "origen": "Sudeste Asiático"}'),
  ('especie', 'Coco', 'Palma de la familia Arecaceae', 'ACTIVO', '{"familia": "Arecaceae", "origen": "Asia Tropical"}'),
  ('especie', 'Cacao', 'Árbol de la familia Malvaceae', 'ACTIVO', '{"familia": "Malvaceae", "origen": "América Tropical"}'),
  ('especie', 'Café', 'Arbusto de la familia Rubiaceae', 'ACTIVO', '{"familia": "Rubiaceae", "origen": "Etiopía"}'),
  ('especie', 'Caña de Azúcar', 'Planta de la familia Poaceae', 'ACTIVO', '{"familia": "Poaceae", "origen": "Nueva Guinea"}'),
  ('especie', 'Piña', 'Fruta tropical de la familia Bromeliaceae', 'ACTIVO', '{"familia": "Bromeliaceae", "origen": "Brasil"}'),
  ('especie', 'Aguacate', 'Árbol de la familia Lauraceae', 'ACTIVO', '{"familia": "Lauraceae", "origen": "México"}'),
  ('especie', 'Aceituno', 'Árbol de la familia Oleaceae', 'ACTIVO', '{"familia": "Oleaceae", "origen": "Mediterráneo"}'),
  ('especie', 'Almendro', 'Árbol de la familia Rosaceae', 'ACTIVO', '{"familia": "Rosaceae", "origen": "Mediterráneo"}'),
  ('especie', 'Nogal', 'Árbol de la familia Juglandaceae', 'ACTIVO', '{"familia": "Juglandaceae", "origen": "Asia Central"}'),
  ('especie', 'Ciruela', 'Árbol de la familia Rosaceae', 'ACTIVO', '{"familia": "Rosaceae", "origen": "Europa"}'),
  ('especie', 'Higo', 'Árbol de la familia Moraceae', 'ACTIVO', '{"familia": "Moraceae", "origen": "Mediterráneo"}'),
  ('especie', 'Granada', 'Arbusto de la familia Lythraceae', 'ACTIVO', '{"familia": "Lythraceae", "origen": "Persia"}'),
  ('especie', 'Tamarindo', 'Árbol de la familia Fabaceae', 'ACTIVO', '{"familia": "Fabaceae", "origen": "África"}'),
  ('especie', 'Zapote Negro', 'Árbol de la familia Ebenaceae', 'ACTIVO', '{"familia": "Ebenaceae", "origen": "México"}'),
  ('especie', 'Chirimoya', 'Árbol de la familia Annonaceae', 'ACTIVO', '{"familia": "Annonaceae", "origen": "Perú"}'),
  ('especie', 'Lúcuma', 'Árbol de la familia Sapotaceae', 'ACTIVO', '{"familia": "Sapotaceae", "origen": "Perú"}'),
  ('especie', 'Tuna', 'Cactus de la familia Cactaceae', 'ACTIVO', '{"familia": "Cactaceae", "origen": "México"}'),
  ('especie', 'Uva', 'Fruta de la familia Vitaceae', 'ACTIVO', '{"familia": "Vitaceae", "origen": "Mediterráneo"}'),
  ('especie', 'Maracuyá', 'Fruta de la familia Passifloraceae', 'ACTIVO', '{"familia": "Passifloraceae", "origen": "Brasil"}'),
  ('especie', 'Anona', 'Árbol de la familia Annonaceae', 'ACTIVO', '{"familia": "Annonaceae", "origen": "América Tropical"}'),
  ('especie', 'Ricino', 'Planta de la familia Euphorbiaceae', 'ACTIVO', '{"familia": "Euphorbiaceae", "origen": "África"}'),
  ('especie', 'Ceibo', 'Árbol de la familia Fabaceae', 'ACTIVO', '{"familia": "Fabaceae", "origen": "América del Sur"}'),
  ('especie', 'Algarrobo', 'Árbol de la familia Fabaceae', 'ACTIVO', '{"familia": "Fabaceae", "origen": "América del Sur"}'),
  ('especie', 'Espino', 'Árbol de la familia Fabaceae', 'ACTIVO', '{"familia": "Fabaceae", "origen": "América del Sur"}'),
  ('especie', 'Molle', 'Árbol de la familia Anacardiaceae', 'ACTIVO', '{"familia": "Anacardiaceae", "origen": "Perú"}'),
  ('especie', 'Sauce Llorón', 'Árbol de la familia Salicaceae', 'ACTIVO', '{"familia": "Salicaceae", "origen": "China"}'),
  ('especie', 'Eucalipto', 'Árbol de la familia Myrtaceae', 'ACTIVO', '{"familia": "Myrtaceae", "origen": "Australia"}'),
  ('especie', 'Pino', 'Árbol de la familia Pinaceae', 'ACTIVO', '{"familia": "Pinaceae", "origen": "California"}'),
  ('especie', 'Teca', 'Árbol de la familia Lamiaceae', 'ACTIVO', '{"familia": "Lamiaceae", "origen": "Sudeste Asiático"}'),
  ('especie', 'Cedro Andino', 'Árbol de la familia Meliaceae', 'ACTIVO', '{"familia": "Meliaceae", "origen": "América del Sur"}'),
  ('especie', 'Caoba', 'Árbol de la familia Meliaceae', 'ACTIVO', '{"familia": "Meliaceae", "origen": "América del Sur"}'),
  ('especie', 'Roble', 'Árbol de la familia Fagaceae', 'ACTIVO', '{"familia": "Fagaceae", "origen": "Europa"}'),
  ('especie', 'Laurel', 'Árbol de la familia Lauraceae', 'ACTIVO', '{"familia": "Lauraceae", "origen": "Mediterráneo"}'),
  ('especie', 'Abedul', 'Árbol de la familia Betulaceae', 'ACTIVO', '{"familia": "Betulaceae", "origen": "Europa"}'),
  ('especie', 'Arce', 'Árbol de la familia Sapindaceae', 'ACTIVO', '{"familia": "Sapindaceae", "origen": "América del Norte"}'),
  ('especie', 'Fresno', 'Árbol de la familia Oleaceae', 'ACTIVO', '{"familia": "Oleaceae", "origen": "Europa"}'),
  ('especie', 'Nogal Negro', 'Árbol de la familia Juglandaceae', 'ACTIVO', '{"familia": "Juglandaceae", "origen": "América del Norte"}'),
  ('especie', 'Ciprés', 'Árbol de la familia Cupressaceae', 'ACTIVO', '{"familia": "Cupressaceae", "origen": "Mediterráneo"}')
ON CONFLICT (tipo, nombre) DO NOTHING;


-- ==================================
-- 12 POBLAR admin_content_items - TRATAMIENTOS
-- (SOLO INSERTS - SIN MODIFICAR ESTRUCTURA)
-- ==================================

INSERT INTO admin_content_items (tipo, nombre, descripcion, estado, metadata) VALUES
  ('tratamiento', 'Poda sanitaria', 'Eliminación de ramas enfermas, secas o dañadas para mejorar la salud del árbol', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Anual"}'),
  ('tratamiento', 'Fertilización orgánica', 'Aplicación de abono orgánico (compost, humus, estiércol) para nutrir el suelo', 'ACTIVO', '{"categoria": "Nutrición", "frecuencia": "Semestral"}'),
  ('tratamiento', 'Fertilización química', 'Aplicación de fertilizantes NPK para corregir deficiencias nutricionales', 'ACTIVO', '{"categoria": "Nutrición", "frecuencia": "Trimestral"}'),
  ('tratamiento', 'Control de plagas', 'Aplicación de insecticidas o métodos biológicos para controlar plagas', 'ACTIVO', '{"categoria": "Sanidad", "frecuencia": "Según necesidad"}'),
  ('tratamiento', 'Control de hongos', 'Aplicación de fungicidas para prevenir o tratar enfermedades fúngicas', 'ACTIVO', '{"categoria": "Sanidad", "frecuencia": "Según necesidad"}'),
  ('tratamiento', 'Riego profundo', 'Riego abundante y profundo para asegurar humedad en raíces profundas', 'ACTIVO', '{"categoria": "Riego", "frecuencia": "Semanal"}'),
  ('tratamiento', 'Riego por goteo', 'Instalación de sistema de riego por goteo para uso eficiente del agua', 'ACTIVO', '{"categoria": "Riego", "frecuencia": "Diario"}'),
  ('tratamiento', 'Mulching', 'Cobertura del suelo con materia orgánica para conservar humedad y controlar malezas', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Anual"}'),
  ('tratamiento', 'Aclareo de frutos', 'Eliminación selectiva de frutos para mejorar calidad y tamaño', 'ACTIVO', '{"categoria": "Producción", "frecuencia": "Estacional"}'),
  ('tratamiento', 'Abonamiento foliar', 'Aplicación de nutrientes directamente sobre las hojas', 'ACTIVO', '{"categoria": "Nutrición", "frecuencia": "Mensual"}'),
  ('tratamiento', 'Poda de formación', 'Poda para dar forma estructural al árbol joven', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Anual"}'),
  ('tratamiento', 'Poda de rejuvenecimiento', 'Poda drástica para renovar árboles viejos o deteriorados', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Cada 3-5 años"}'),
  ('tratamiento', 'Control de malezas', 'Eliminación de plantas competidoras alrededor del árbol', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Mensual"}'),
  ('tratamiento', 'Injerto', 'Injerto de variedades mejoradas para cambiar o mejorar la producción', 'ACTIVO', '{"categoria": "Mejora", "frecuencia": "Una vez"}'),
  ('tratamiento', 'Cosecha', 'Recolección de frutos en el momento óptimo de madurez', 'ACTIVO', '{"categoria": "Producción", "frecuencia": "Estacional"}'),
  ('tratamiento', 'Tratamiento de heridas', 'Aplicación de pasta cicatrizante en cortes o heridas del tronco', 'ACTIVO', '{"categoria": "Sanidad", "frecuencia": "Según necesidad"}'),
  ('tratamiento', 'Cal hidratada', 'Aplicación de cal para prevenir enfermedades y controlar pH', 'ACTIVO', '{"categoria": "Sanidad", "frecuencia": "Anual"}'),
  ('tratamiento', 'Tutorado', 'Colocación de tutores para sostener árboles jóvenes o ramas débiles', 'ACTIVO', '{"categoria": "Mantenimiento", "frecuencia": "Una vez"}')
ON CONFLICT (tipo, nombre) DO NOTHING;


-- ==================================
-- 13 POBLAR admin_content_items - CONSEJOS (opcional)
-- ==================================

INSERT INTO admin_content_items (tipo, nombre, descripcion, estado) VALUES
  ('consejo', 'Riego matutino', 'Riega temprano en la mañana para evitar pérdida de agua por evaporación', 'ACTIVO'),
  ('consejo', 'Podas en invierno', 'Realiza podas durante el invierno para estimular crecimiento en primavera', 'ACTIVO'),
  ('consejo', 'Control de pH', 'Mantén el pH del suelo entre 6.0 y 7.0 para mejor absorción de nutrientes', 'ACTIVO'),
  ('consejo', 'Mulching orgánico', 'Usa restos de poda triturados como cobertura para el suelo', 'ACTIVO')
ON CONFLICT (tipo, nombre) DO NOTHING;

-- ============================
-- 14. DATOS INICIALES - ESPECIES
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
-- 15. INSERTAR ROLES Y PERMISOS
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
-- 16. INSERTAR USUARIOS
-- ============================
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, estado, fecha_registro) VALUES
  ('Brenda Nicole', 'Ramírez Neyra', 'nicoleramirezneyra@gmail.com', crypt('password', gen_salt('bf')), '+51987654321', 'USER', 'ACTIVO', '2025-01-15 10:30:00'),
  ('Edson', 'More Anton', 'edson@gmail.com', crypt('EdsonMore123', gen_salt('bf')), '+51912345678', 'USER', 'ACTIVO', '2025-03-20 14:15:00'),
  ('Brandon', 'Inga Albines', 'brandon@gmail.com', crypt('Brandon123', gen_salt('bf')), '+51923456789', 'USER', 'ACTIVO', '2025-06-10 09:45:00'),
  ('Admin', 'Sistema', 'admin@ecodataai.com', crypt('AdminPassword123', gen_salt('bf')), '+51987654321', 'ADMIN', 'ACTIVO', '2025-01-01 00:00:00')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ============================
-- 17. INSERTAR ÁRBOLES CON DATOS REALISTAS
-- ============================
INSERT INTO arboles (id, usuario_id, especie_id, nombre, especie, latitud, longitud, fecha_plantacion, descripcion, altura_actual_cm, diametro_tronco_cm, estado_salud) VALUES
(65, 1, 1, 'Mango Don Elpidio', 'Mango', -5.19460000, -80.63070000, '2019-05-15', 'Árbol centenario plantado por el abuelo Elpidio', 850.50, 45.20, 'BUENO'),
(66, 1, 2, 'Guanábana Silvestre', 'Guanábana', -5.18500000, -80.62500000, '2020-08-20', 'Crece cerca del río Piura', 320.00, 18.50, 'REGULAR'),
(67, 1, 3, 'Papaya Gigante', 'Papaya', -5.20500000, -80.63500000, '2022-01-10', 'Papaya de frutos enormes', 280.00, 15.00, 'MALO'),
(68, 1, 4, 'Limón Agrio', 'Limón', -5.19000000, -80.61000000, '2018-11-05', 'Producción excelente', 350.00, 22.00, 'EXCELENTE'),
(69, 1, 5, 'Naranja Valencia', 'Naranja', -5.19000000, -80.65000000, '2017-03-12', 'Naranjas dulces', 420.00, 28.00, 'BUENO'),
(70, 1, 6, 'Manzana Roja', 'Manzana', -5.18000000, -80.62000000, '2021-04-25', 'Variedad importada', 180.00, 12.00, 'REGULAR'),
(71, 1, 7, 'Pera Dulce', 'Pera', -5.21000000, -80.64000000, '2022-07-18', 'Pera de la costa', 150.00, 10.00, 'MALO'),
(72, 1, 8, 'Durazno de Huancayo', 'Durazno', -5.19500000, -80.60500000, '2019-09-30', 'Durazno para mermeladas', 220.00, 15.00, 'EXCELENTE'),
(73, 1, 9, 'Sandía Negra', 'Sandía', -5.19500000, -80.65500000, '2023-02-14', 'Frutos grandes', 120.00, 8.00, 'BUENO'),
(74, 1, 10, 'Melón Cantalupo', 'Melón', -5.17500000, -80.63000000, '2022-10-08', 'Melón muy dulce', 100.00, 6.00, 'REGULAR'),
(75, 1, 11, 'Plátano Isla', 'Plátano', -5.21500000, -80.63000000, '2021-06-22', 'Producción constante', 350.00, 20.00, 'MALO'),
(76, 1, 12, 'Coco Piurano', 'Coco', -5.18500000, -80.60500000, '2018-04-01', 'Cocos grandes y dulces', 1200.00, 60.00, 'EXCELENTE'),
(77, 1, 13, 'Cacao Amazonas', 'Cacao', -5.20500000, -80.65500000, '2020-12-15', 'Cacao fino de aroma', 450.00, 25.00, 'BUENO'),
(78, 1, 14, 'Café Arábica', 'Café', -5.19000000, -80.59500000, '2021-03-08', 'Café de especialidad', 320.00, 18.00, 'REGULAR'),
(79, 1, 15, 'Caña Morada', 'Caña', -5.19000000, -80.66500000, '2023-01-20', 'Caña para jugo', 280.00, 15.00, 'MALO'),
(80, 1, 16, 'Piña Dorada', 'Piña', -5.17000000, -80.62000000, '2022-05-30', 'Piña dulce', 90.00, 5.00, 'EXCELENTE'),
(81, 1, 17, 'Aguacate Hass', 'Aguacate', -5.22000000, -80.64000000, '2019-11-25', 'Aguacate de exportación', 550.00, 32.00, 'BUENO'),
(82, 1, 18, 'Aceituno Andino', 'Aceituno', -5.20000000, -80.60000000, '2020-07-14', 'Aceitunas para aceite', 480.00, 28.00, 'REGULAR'),
(83, 1, 19, 'Almendro Blanco', 'Almendro', -5.18000000, -80.66000000, '2021-09-03', 'Almendras dulces', 300.00, 18.00, 'MALO'),
(84, 1, 20, 'Nogal Gigante', 'Nogal', -5.16500000, -80.63500000, '2018-06-17', 'Nogal de frutos grandes', 650.00, 38.00, 'EXCELENTE'),
(85, 1, 21, 'Ciruela Morada', 'Ciruela', -5.22500000, -80.63000000, '2020-10-28', 'Ciruela para mermeladas', 250.00, 16.00, 'BUENO'),
(86, 1, 22, 'Higo Dulce', 'Higo', -5.19500000, -80.58500000, '2022-02-11', 'Higos muy dulces', 180.00, 12.00, 'REGULAR'),
(87, 1, 23, 'Granada Roja', 'Granada', -5.19500000, -80.67500000, '2021-08-19', 'Granadas antioxidantes', 220.00, 14.00, 'MALO'),
(88, 1, 24, 'Tamarindo Antiguo', 'Tamarindo', -5.16000000, -80.62500000, '2017-12-01', 'Tamarindo de pulpa dulce', 800.00, 42.00, 'EXCELENTE'),
(89, 1, 25, 'Zapote Negro', 'Zapote', -5.23000000, -80.63000000, '2020-04-05', 'Fruta exótica', 400.00, 24.00, 'BUENO'),
(90, 1, 26, 'Chirimoya Andina', 'Chirimoya', -5.20000000, -80.58000000, '2019-02-18', 'Chirimoya de alta calidad', 380.00, 22.00, 'REGULAR'),
(91, 1, 27, 'Lúcuma Peruana', 'Lúcuma', -5.19000000, -80.68000000, '2021-11-09', 'Lúcuma para helados', 350.00, 20.00, 'MALO'),
(92, 1, 28, 'Tuna Verde', 'Tuna', -5.15500000, -80.64000000, '2022-09-22', 'Tuna dulce', 200.00, 13.00, 'EXCELENTE'),
(93, 1, 29, 'Uvá Silvestre', 'Uvá', -5.23500000, -80.62500000, '2023-03-15', 'Uva de la costa', 150.00, 10.00, 'BUENO'),
(94, 1, 30, 'Maracuyá Tropical', 'Maracuyá', -5.20500000, -80.57500000, '2022-12-01', 'Maracuyá ácido', 350.00, 20.00, 'REGULAR'),
(95, 1, 31, 'Anona Blanca', 'Anona', -5.18500000, -80.68500000, '2020-06-30', 'Anona de pulpa cremosa', 280.00, 16.00, 'MALO'),
(96, 1, 32, 'Ricino Gigante', 'Ricino', -5.15000000, -80.65000000, '2023-05-10', 'Ricino para aceite', 400.00, 24.00, 'EXCELENTE'),
(97, 1, 33, 'Ceibo Rojo', 'Ceibo', -5.24000000, -80.62000000, '2018-10-12', 'Ceibo en floración roja', 550.00, 32.00, 'BUENO'),
(98, 1, 34, 'Algarrobo Milenario', 'Algarrobo', -5.21000000, -80.57000000, '2015-05-05', 'Algarrobo de más de 20 años', 1200.00, 55.00, 'REGULAR'),
(99, 1, 35, 'Espino Negro', 'Espino', -5.18000000, -80.69000000, '2021-07-25', 'Espino de madera dura', 300.00, 18.00, 'MALO'),
(100, 1, 36, 'Molle Andino', 'Molle', -5.14500000, -80.66000000, '2019-11-20', 'Molle de uso ornamental', 500.00, 30.00, 'EXCELENTE'),
(101, 1, 37, 'Sauce Llorón', 'Sauce', -5.24500000, -80.61500000, '2020-03-08', 'Sauce en la orilla', 450.00, 28.00, 'BUENO'),
(102, 1, 38, 'Eucalipto Australiano', 'Eucalipto', -5.21500000, -80.56500000, '2018-08-14', 'Eucalipto de crecimiento rápido', 800.00, 40.00, 'REGULAR'),
(103, 1, 39, 'Pino Radiata', 'Pino', -5.17500000, -80.69500000, '2017-09-19', 'Pino para madera', 650.00, 35.00, 'MALO'),
(104, 1, 40, 'Teca Asiática', 'Teca', -5.14000000, -80.67000000, '2019-04-22', 'Teca de alta calidad', 550.00, 32.00, 'EXCELENTE'),
(105, 1, 41, 'Cedro Andino', 'Cedro', -5.25000000, -80.61000000, '2020-10-30', 'Cedro para muebles', 480.00, 28.00, 'BUENO'),
(106, 1, 42, 'Caoba Tropical', 'Caoba', -5.22000000, -80.56000000, '2018-12-01', 'Caoba para ebanistería', 600.00, 35.00, 'REGULAR'),
(107, 1, 43, 'Roble Fuerte', 'Roble', -5.17000000, -80.70000000, '2016-07-19', 'Roble de madera dura', 750.00, 42.00, 'MALO'),
(108, 1, 44, 'Laurel Aromático', 'Laurel', -5.13500000, -80.68000000, '2021-02-14', 'Laurel para cocina', 350.00, 20.00, 'EXCELENTE'),
(109, 1, 45, 'Abedul Blanco', 'Abedul', -5.25500000, -80.60500000, '2020-06-09', 'Abedul de corteza blanca', 400.00, 24.00, 'BUENO'),
(110, 1, 46, 'Arce Dorado', 'Arce', -5.22500000, -80.55500000, '2022-04-18', 'Arce para otoño', 250.00, 15.00, 'REGULAR'),
(111, 1, 47, 'Fresno Noble', 'Fresno', -5.16500000, -80.70500000, '2019-08-23', 'Fresno para muebles', 500.00, 30.00, 'MALO'),
(112, 1, 48, 'Nogal Negro', 'Nogal', -5.13000000, -80.69000000, '2017-11-11', 'Nogal de madera oscura', 700.00, 40.00, 'EXCELENTE'),
(113, 1, 49, 'Cipres Elegante', 'Cipres', -5.26000000, -80.60000000, '2021-05-05', 'Ciprés de porte elegante', 450.00, 26.00, 'BUENO'),
(114, 1, 4, 'Limón de Catacaos', 'Limón', -5.27360000, -80.67750000, '2017-08-10', 'Árbol de limón cuidado por los vecinos de Catacaos', 360.00, 21.00, 'EXCELENTE'),
(115, 1, 5, 'Naranja de Castilla', 'Naranja', -5.22100000, -80.64700000, '2018-02-21', 'Árbol cítrico en huerto urbano de Castilla', 410.00, 27.00, 'BUENO'),
(116, 1, 1, 'Mango de San Miguel', 'Mango', -5.19870000, -80.63520000, '2016-11-03', 'Mango tradicional en la zona norte de Piura', 760.00, 40.00, 'BUENO'),
(117, 1, 11, 'Plátano del Centro', 'Plátano', -5.19050000, -80.62840000, '2021-01-15', 'Plátano de producción continua en zona urbana', 320.00, 17.50, 'REGULAR'),
(118, 1, 12, 'Coco de la Costa', 'Coco', -5.18620000, -80.62210000, '2015-06-27', 'Coco de playa y clima cálido', 1180.00, 56.00, 'EXCELENTE'),
(119, 1, 17, 'Aguacate de Miraflores', 'Aguacate', -5.20560000, -80.64130000, '2019-04-18', 'Aguacate de buena producción en barrio residencial', 530.00, 30.00, 'BUENO'),
(120, 1, 27, 'Lúcuma de Piura', 'Lúcuma', -5.12000000, -80.64000000, '2018-07-22', 'Lúcuma adaptada al clima cálido de Piura', 330.00, 19.00, 'BUENO'),
(121, 1, 31, 'Anona de la Costa', 'Anona', -5.18200000, -80.70500000, '2021-03-11', 'Árbol de anona en zona costera de Piura', 270.00, 15.00, 'MALO'),
(122, 1, 38, 'Eucalipto de Piura', 'Eucalipto', -5.17000000, -80.65000000, '2014-09-05', 'Eucalipto de sombra y protección en Piura', 900.00, 44.00, 'EXCELENTE'),
(123, 1, 40, 'Teca de la Zona Franca', 'Teca', -5.18040000, -80.64070000, '2017-12-29', 'Teca ornamental y de sombra en la zona urbana', 580.00, 33.00, 'REGULAR'),
(124, 1, 42, 'Caoba de Piura', 'Caoba', -5.14000000, -80.62000000, '2016-01-14', 'Árbol de caoba en zona de crecimiento moderado', 640.00, 37.00, 'BUENO'),
(125, 1, 5, 'Naranja de Chulucanas', 'Naranja', -5.18800000, -80.64800000, '2020-02-14', 'Árbol cítrico de la zona norte', 390.00, 23.00, 'BUENO'),
(126, 1, 17, 'Aguacate de Castilla', 'Aguacate', -5.20500000, -80.64200000, '2018-04-10', 'Aguacate de sombra en barrio urbano', 510.00, 29.00, 'BUENO')
ON CONFLICT (id) DO NOTHING;

-- ============================
-- 18. INSERTAR SEGUIMIENTOS CON FECHAS VARIADAS
-- ============================
INSERT INTO seguimientos (id, arbol_id, usuario_id, titulo, descripcion, altura_cm, salud, tipo_seguimiento, fecha_seguimiento, temperatura_ambiente, humedad_suelo, notas_tecnicas) VALUES
-- Mango Don Elpidio (ID 65) - Seguimientos variados
(64, 65, 1, 'Poda de primavera', 'Se realizó poda de formación', 850.50, 'EXCELENTE', 'PODA', '2025-09-15', 28.50, 65.00, 'Poda realizada correctamente'),
(65, 65, 1, 'Fertilización orgánica', 'Aplicación de compost y humus', 870.00, 'EXCELENTE', 'FERTILIZACION', '2025-10-20', 27.00, 70.00, 'Buena respuesta al fertilizante'),
(66, 65, 1, 'Control de plagas', 'Se detectó mosca de la fruta', 880.00, 'BUENO', 'PLAGAS', '2026-01-15', 30.50, 55.00, 'Aplicar trampas'),
(67, 65, 1, 'Seguimiento de floración', 'Buena floración para temporada', 890.00, 'EXCELENTE', 'OBSERVACION', '2026-03-10', 29.00, 60.00, 'Excelente producción esperada'),

-- Guanábana Silvestre (ID 66)
(68, 66, 1, 'Seguimiento inicial', 'Árbol creciendo en zona húmeda', 320.00, 'REGULAR', 'OBSERVACION', '2024-12-01', 26.00, 75.00, 'Necesita más sol'),
(69, 66, 1, 'Riego intensivo', 'Se aumentó frecuencia de riego', 340.00, 'REGULAR', 'RIEGO', '2025-02-14', 28.00, 80.00, 'Mejorar drenaje'),
(70, 66, 1, 'Evaluación de frutos', 'Primera cosecha de guanábana', 350.00, 'BUENO', 'COSECHA', '2025-05-20', 27.50, 70.00, 'Frutos pequeños pero sabrosos'),

-- Papaya Gigante (ID 67)
(71, 67, 1, 'Seguimiento temprano', 'Árbol afectado por vientos', 280.00, 'MALO', 'OBSERVACION', '2024-11-05', 29.00, 60.00, 'Proteger del viento'),
(72, 67, 1, 'Fertilización urgente', 'Aplicación de nitrógeno', 290.00, 'MALO', 'FERTILIZACION', '2025-01-25', 28.00, 55.00, 'Respuesta lenta'),
(73, 67, 1, 'Poda de recuperación', 'Se eliminaron ramas dañadas', 285.00, 'REGULAR', 'PODA', '2025-04-10', 27.00, 65.00, 'Mejoró apariencia'),

-- Limón Agrio (ID 68)
(74, 68, 1, 'Cosecha de limones', 'Excelente producción este año', 350.00, 'EXCELENTE', 'COSECHA', '2025-08-30', 28.50, 60.00, 'Más de 100 limones'),
(75, 68, 1, 'Poda de mantenimiento', 'Se eliminaron chupones', 355.00, 'EXCELENTE', 'PODA', '2025-10-15', 27.00, 65.00, 'Bien estructurado'),
(76, 68, 1, 'Fertilización post-cosecha', 'Abono compuesto', 360.00, 'EXCELENTE', 'FERTILIZACION', '2026-02-01', 29.00, 60.00, 'Preparando siguiente cosecha'),

-- Naranja Valencia (ID 69)
(77, 69, 1, 'Seguimiento de naranjas', 'Frutos en desarrollo', 420.00, 'BUENO', 'OBSERVACION', '2025-07-10', 28.00, 65.00, 'Buena coloración'),
(78, 69, 1, 'Control de cochinilla', 'Plaga controlada exitosamente', 430.00, 'BUENO', 'PLAGAS', '2025-09-25', 27.50, 70.00, 'Usar control biológico'),
(79, 69, 1, 'Riego por goteo', 'Instalación de riego tecnificado', 440.00, 'BUENO', 'RIEGO', '2026-01-10', 26.00, 75.00, 'Mejor uso del agua'),

-- Coco Piurano (ID 76) - Ejemplo con más seguimientos
(80, 76, 1, 'Cosecha de cocos', 'Excelente cosecha de cocos grandes', 1200.00, 'EXCELENTE', 'COSECHA', '2025-06-05', 30.00, 55.00, 'Cocos listos para venta'),
(81, 76, 1, 'Fertilización mineral', 'Potasio y magnesio aplicados', 1220.00, 'EXCELENTE', 'FERTILIZACION', '2025-09-18', 29.50, 60.00, 'Fertilización balanceada'),
(82, 76, 1, 'Poda de hojas secas', 'Hojas viejas eliminadas', 1240.00, 'EXCELENTE', 'PODA', '2025-12-02', 28.00, 58.00, 'Mejor ventilación'),

-- Algarrobo Milenario (ID 98) - Seguimientos históricos
(83, 98, 1, 'Seguimiento inicial', 'Algarrobo emblemático', 1200.00, 'REGULAR', 'OBSERVACION', '2024-10-10', 27.00, 45.00, 'Requiere cuidados'),
(84, 98, 1, 'Riego profundo', 'Riego profundo para raíces', 1200.00, 'REGULAR', 'RIEGO', '2025-03-20', 28.50, 50.00, 'Buena respuesta'),
(85, 98, 1, 'Fertilización foliar', 'Aplicación de nutrientes', 1210.00, 'BUENO', 'FERTILIZACION', '2025-07-15', 29.00, 48.00, 'Mejorando estado'),

-- Ceibo Rojo (ID 97) - Seguimientos de floración
(86, 97, 1, 'Floración temprana', 'Primeras flores rojas', 550.00, 'BUENO', 'OBSERVACION', '2025-09-01', 27.50, 60.00, 'Hermosa floración'),
(87, 97, 1, 'Poda de formación', 'Estructura mejorada', 560.00, 'BUENO', 'PODA', '2025-11-20', 26.00, 65.00, 'Buen crecimiento'),

-- Teca Asiática (ID 104) - Seguimientos de crecimiento
(88, 104, 1, 'Medición de crecimiento', 'Buen crecimiento anual', 550.00, 'EXCELENTE', 'OBSERVACION', '2025-05-01', 29.00, 60.00, 'Crecimiento constante'),
(89, 104, 1, 'Fertilización fosforada', 'Para desarrollo de raíces', 570.00, 'EXCELENTE', 'FERTILIZACION', '2025-08-10', 28.50, 58.00, 'Buena respuesta'),
(90, 104, 1, 'Poda de ramas bajas', 'Mejor calidad de madera', 590.00, 'EXCELENTE', 'PODA', '2026-02-20', 27.00, 55.00, 'Madera mejorada'),

-- Nogal Negro (ID 112) - Seguimientos de producción
(91, 112, 1, 'Cosecha de nogales', 'Primera cosecha importante', 700.00, 'EXCELENTE', 'COSECHA', '2025-04-15', 25.00, 50.00, 'Nueces de calidad'),
(92, 112, 1, 'Poda de renovación', 'Eliminar ramas viejas', 710.00, 'EXCELENTE', 'PODA', '2025-07-25', 26.50, 52.00, 'Preparando próxima temporada'),
(93, 112, 1, 'Fertilización otoñal', 'Nutrientes para invierno', 720.00, 'EXCELENTE', 'FERTILIZACION', '2025-10-30', 24.00, 48.00, 'Buen almacenamiento de nutrientes'),

-- Cedro Andino (ID 105) - Seguimientos con diferentes estados
(94, 105, 1, 'Seguimiento de plántula', 'Árbol joven en desarrollo', 480.00, 'BUENO', 'OBSERVACION', '2025-03-05', 27.00, 65.00, 'Buen progreso'),
(95, 105, 1, 'Riego suplementario', 'En época seca', 490.00, 'BUENO', 'RIEGO', '2025-06-12', 30.00, 55.00, 'Evitar estrés hídrico'),

-- Tuna Verde (ID 92) - Cactus y seguimientos especiales
(96, 92, 1, 'Seguimiento de tunas', 'Frutos en desarrollo', 200.00, 'EXCELENTE', 'OBSERVACION', '2025-08-05', 32.00, 30.00, 'Buena adaptación al calor'),
(97, 92, 1, 'Cosecha de tunas', 'Excelente producción', 210.00, 'EXCELENTE', 'COSECHA', '2025-10-20', 31.00, 25.00, 'Frutos dulces'),

-- Otros seguimientos variados
(98, 70, 1, 'Seguimiento manzanas', 'Frutos en formación', 185.00, 'REGULAR', 'OBSERVACION', '2025-11-15', 25.00, 70.00, 'Necesita más sol'),
(99, 72, 1, 'Cosecha de duraznos', 'Excelente calidad', 230.00, 'EXCELENTE', 'COSECHA', '2026-01-25', 28.00, 60.00, 'Duraznos muy dulces'),
(100, 77, 1, 'Control de monilia', 'Enfermedad controlada', 460.00, 'BUENO', 'PLAGAS', '2025-09-30', 27.00, 68.00, 'Tratamiento exitoso'),
(101, 81, 1, 'Poda de aguacate', 'Mejor producción', 560.00, 'BUENO', 'PODA', '2025-11-10', 26.50, 62.00, 'Estructura mejorada'),
(102, 88, 1, 'Cosecha de tamarindo', 'Frutos maduros', 810.00, 'EXCELENTE', 'COSECHA', '2026-03-05', 29.00, 55.00, 'Tamarindo muy dulce'),
(103, 90, 1, 'Fertilización de chirimoya', 'Nutrientes específicos', 385.00, 'REGULAR', 'FERTILIZACION', '2025-08-20', 27.00, 65.00, 'Esperar mejor respuesta'),
(104, 100, 1, 'Seguimiento de molle', 'Crecimiento estable', 510.00, 'EXCELENTE', 'OBSERVACION', '2025-12-15', 28.00, 50.00, 'Árbol saludable'),
(105, 106, 1, 'Evaluación de caoba', 'Crecimiento lento pero constante', 610.00, 'REGULAR', 'OBSERVACION', '2026-02-10', 27.00, 58.00, 'Paciencia en crecimiento'),
(106, 108, 1, 'Cosecha de laurel', 'Hojas para cocina', 355.00, 'EXCELENTE', 'COSECHA', '2025-07-05', 26.00, 60.00, 'Hojas aromáticas'),
(107, 110, 1, 'Seguimiento de arce', 'Coloración otoñal', 255.00, 'REGULAR', 'OBSERVACION', '2025-10-01', 24.00, 65.00, 'Hermoso color otoñal'),
(108, 113, 1, 'Poda de ciprés', 'Mantenimiento de forma', 460.00, 'BUENO', 'PODA', '2025-09-18', 26.00, 55.00, 'Mantener forma cónica'),

-- Seguimientos más recientes (2026)
(109, 65, 1, 'Seguimiento verano 2026', 'Calor intenso', 900.00, 'BUENO', 'RIEGO', '2026-06-15', 32.00, 50.00, 'Aumentar riego'),
(110, 68, 1, 'Nuevos limones', 'Floración abundante', 365.00, 'EXCELENTE', 'OBSERVACION', '2026-06-20', 30.00, 55.00, 'Buena producción'),
(111, 76, 1, 'Nuevos cocos', 'Crecimiento de cocos', 1260.00, 'EXCELENTE', 'OBSERVACION', '2026-06-25', 31.00, 52.00, 'Cocos grandes'),
(112, 97, 1, 'Segunda floración', 'Nuevas flores rojas', 570.00, 'EXCELENTE', 'OBSERVACION', '2026-07-01', 29.50, 58.00, 'Mejor que la primera')
ON CONFLICT (id) DO NOTHING;

-- ============================
-- 19. INSERTAR LOGS DE EJEMPLO
-- ============================
INSERT INTO logs_auditoria (usuario_id, accion, recurso, recurso_id, ip_address, user_agent, estado_respuesta, fecha_creacion) VALUES
(1, 'CREATE', 'arbol', 65, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 201, '2025-01-15 10:35:00'),
(1, 'UPDATE', 'seguimiento', 64, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 200, '2025-09-15 15:20:00'),
(4, 'MANAGE_ROLES', 'usuario', 2, '10.0.0.1', 'PostmanRuntime/7.26.8', 200, '2025-03-20 14:20:00'),
(1, 'CREATE', 'seguimiento', 80, '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 201, '2025-06-05 09:15:00'),
(1, 'UPDATE', 'arbol', 65, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 200, '2025-10-20 11:00:00'),
(4, 'VIEW_AUDIT', 'logs', NULL, '10.0.0.2', 'Chrome/98.0.4758.102', 200, '2026-01-15 08:30:00'),
(1, 'CREATE', 'seguimiento', 109, '192.168.1.103', 'Mozilla/5.0 (Android 12; Mobile; rv:95.0) Gecko/95.0 Firefox/95.0', 201, '2026-06-15 07:45:00'),
(1, 'DELETE', 'seguimiento', 73, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 204, '2026-04-10 16:30:00');

-- ============================
-- 20. ACTUALIZAR SECUENCIAS
-- ============================
SELECT setval('usuarios_id_seq', COALESCE(MAX(id), 0) + 1) FROM usuarios;
SELECT setval('arboles_id_seq', COALESCE(MAX(id), 0) + 1) FROM arboles;
SELECT setval('seguimientos_id_seq', COALESCE(MAX(id), 0) + 1) FROM seguimientos;
SELECT setval('especies_catalog_id_seq', COALESCE(MAX(id), 0) + 1) FROM especies_catalog;
SELECT setval('role_permissions_id_seq', COALESCE(MAX(id), 0) + 1) FROM role_permissions;
SELECT setval('admin_content_items_id_seq', COALESCE(MAX(id), 0) + 1) FROM admin_content_items;

-- ============================
-- 21. VISTAS MEJORADAS
-- ============================
CREATE OR REPLACE VIEW v_usuarios_activos AS
SELECT id, nombre, email, rol, estado, DATE(fecha_registro) AS fecha_registro
FROM usuarios 
WHERE estado = 'ACTIVO' AND deleted_at IS NULL
ORDER BY fecha_registro DESC;

CREATE OR REPLACE VIEW v_arboles_con_especie AS
SELECT 
  a.id, a.nombre, a.especie, e.nombre_cientifico, e.nombre_comun,
  a.latitud, a.longitud, a.estado_salud, a.altura_actual_cm, a.diametro_tronco_cm,
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
WHERE s.deleted_at IS NULL AND a.deleted_at IS NULL
ORDER BY s.fecha_seguimiento DESC;

CREATE OR REPLACE VIEW v_estadisticas_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM usuarios WHERE deleted_at IS NULL) AS total_usuarios,
  (SELECT COUNT(*) FROM arboles WHERE deleted_at IS NULL) AS total_arboles,
  (SELECT COUNT(*) FROM seguimientos WHERE deleted_at IS NULL) AS total_seguimientos,
  (SELECT COUNT(*) FROM especies_catalog WHERE activo = true) AS total_especies,
  (SELECT COUNT(*) FROM arboles WHERE estado_salud = 'EXCELENTE' AND deleted_at IS NULL) AS arboles_excelentes,
  (SELECT ROUND(AVG(altura_cm)::numeric, 2) FROM seguimientos WHERE deleted_at IS NULL) AS altura_promedio_cm;

CREATE OR REPLACE VIEW v_audit_stats AS
SELECT 
  DATE_TRUNC('day', fecha_creacion)::DATE AS fecha,
  accion,
  COUNT(*) AS cantidad,
  COUNT(DISTINCT usuario_id) AS usuarios_unicos
FROM logs_auditoria
GROUP BY DATE_TRUNC('day', fecha_creacion), accion
ORDER BY fecha DESC, cantidad DESC;

CREATE OR REPLACE VIEW v_seguimientos_recientes AS
SELECT 
  s.id, s.titulo, s.fecha_seguimiento, s.tipo_seguimiento,
  a.nombre AS arbol_nombre,
  u.nombre AS usuario_nombre
FROM seguimientos s
JOIN arboles a ON s.arbol_id = a.id
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.deleted_at IS NULL AND a.deleted_at IS NULL
ORDER BY s.fecha_seguimiento DESC
LIMIT 20;

-- ============================
-- 22. FUNCIONES UTILITARIAS
-- ============================
CREATE OR REPLACE FUNCTION calcular_distancia_km(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371;
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
    ROUND(AVG(s.altura_cm)::numeric, 2)
  FROM usuarios u
  LEFT JOIN arboles a ON u.id = a.usuario_id AND a.deleted_at IS NULL
  LEFT JOIN seguimientos s ON a.id = s.arbol_id AND s.deleted_at IS NULL
  WHERE u.id = p_usuario_id AND u.deleted_at IS NULL
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 23. VERIFICACIÓN FINAL
-- ============================
SELECT '
╔══════════════════════════════════════════════════════════════════╗
║   ✅ BASE DE DATOS COMPLETA - VERSIÓN PRODUCCIÓN 4.2           ║
║   Proyecto: Mi Árbol Crece - CON DATOS REALISTAS               ║
║   Fecha: ' || NOW()::TEXT || '                               ║
╠══════════════════════════════════════════════════════════════════╣
║   MEJORAS APLICADAS:                                           ║
║   ✅ Fechas de plantación realistas (2015-2023)                ║
║   ✅ Alturas actuales y diámetros de tronco reales             ║
║   ✅ Seguimientos con fechas variadas (2024-2026)              ║
║   ✅ Tipos de seguimiento variados (podas, cosechas, etc)     ║
║   ✅ Temperaturas y humedades realistas                       ║
║   ✅ Descripciones detalladas y consistentes                  ║
║   ✅ Logs con fechas distribuidas en el tiempo                ║
║   ✅ Soft Delete en todas las tablas                          ║
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
SELECT id, nombre, email, rol, estado, DATE(fecha_registro) AS fecha_registro FROM usuarios WHERE deleted_at IS NULL ORDER BY id;

SELECT '🌳 MUESTRA DE ÁRBOLES CON DATOS REALISTAS:' AS seccion;
SELECT 
  a.id, a.nombre, a.especie, a.fecha_plantacion, 
  a.altura_actual_cm || ' cm' AS altura, 
  a.diametro_tronco_cm || ' cm' AS diametro,
  a.estado_salud
FROM arboles a
WHERE a.deleted_at IS NULL
ORDER BY a.id LIMIT 5;

SELECT '📝 MUESTRA DE SEGUIMIENTOS VARIADOS:' AS seccion;
SELECT 
  s.id, s.titulo, s.tipo_seguimiento, s.fecha_seguimiento, 
  s.altura_cm || ' cm' AS altura, s.salud,
  s.temperatura_ambiente || ' °C' AS temp
FROM seguimientos s
WHERE s.deleted_at IS NULL
ORDER BY s.fecha_seguimiento DESC LIMIT 5;

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
-- 24. PRUEBAS RÁPIDAS
-- ============================
SELECT '🔍 PRUEBA: Árboles cercanos a (-5.19, -80.63) en 5 km:' AS seccion;
SELECT * FROM buscar_arboles_cercanos(-5.19000000, -80.63000000, 5, 3);

SELECT '📈 PRUEBA: Historial de salud del árbol 65 (Mango):' AS seccion;
SELECT * FROM get_arbol_health_history(65) LIMIT 5;

SELECT '📊 PRUEBA: Estadísticas del usuario 1 (Brenda):' AS seccion;
SELECT * FROM get_user_stats(1);

SELECT '📊 PRUEBA: Vista de seguimientos recientes:' AS seccion;
SELECT * FROM v_seguimientos_recientes LIMIT 5;

SELECT '✅ BASE DE DATOS LISTA PARA PRODUCCIÓN (CON DATOS REALISTAS)' AS estado_final;