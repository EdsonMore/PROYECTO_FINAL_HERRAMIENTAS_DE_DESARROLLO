-- ============================================================
--  ÁRBOLES DE CATACAOS, PIURA - DISTRITO DE LOS ARTESANOS
--  TODOS PARA EDSON (edson@gmail.com - ID: 2)
--  20 ÁRBOLES - SELECCIÓN CUIDADA Y COHERENTE
-- ============================================================

-- ============================================================
-- 1. VERIFICAR QUE EDSON EXISTA
-- ============================================================
DO $$
DECLARE
  v_usuario_id INTEGER;
BEGIN
  SELECT id INTO v_usuario_id FROM usuarios WHERE email = 'edson@gmail.com' AND deleted_at IS NULL;
  
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION '❌ Usuario edson@gmail.com no encontrado. Ejecuta primero los INSERTs de usuarios.';
  ELSE
    RAISE NOTICE '✅ Usuario Edson encontrado con ID: %', v_usuario_id;
  END IF;
END $$;

-- ============================================================
-- 2. 20 ÁRBOLES DE CATACAOS - TODOS PARA EDSON (ID 2)
-- ============================================================

INSERT INTO arboles (usuario_id, especie, nombre, latitud, longitud, fecha_plantacion, descripcion, altura_actual_cm, diametro_tronco_cm, estado_salud, creado_en, actualizado_en) 
VALUES 

-- ============================================================
-- FRUTALES TRADICIONALES (8 árboles)
-- ============================================================

(2, 'Mangifera indica', 'Mangó Criollo - Catacaos', -5.2632, -80.6745, '2023-06-15', 
 'Árbol de mangó criollo con excelente producción de frutos. Altura 8 metros. Bien adaptado al clima tropical seco de Catacaos. Riego por goteo. Jr. Comercio 234.', 
 800.00, 45.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Mangifera indica', 'Mangó Kent - Catacaos', -5.2658, -80.6728, '2021-11-10', 
 'Mangó Kent de floración abundante. Altura 7 metros. Producción constante. Frutos grandes y jugosos. Zona Los Jardines, Catacaos.', 
 720.00, 42.00, 'BUENO', NOW(), NOW()),

(2, 'Prosopis spp', 'Algarrobo - Catacaos', -5.2672, -80.6750, '2021-03-22', 
 'Algarrobo nativo bien establecido. Altura 12 metros. Frondoso y proporcionador de sombra. Muy resistente al clima seco. Av. Principal 156.', 
 1200.00, 65.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Carica papaya', 'Papayo - Catacaos', -5.2615, -80.6760, '2024-02-10', 
 'Papayo de 3 años con producción constante. Altura 4.5 metros. Frutos de buena calidad. Riego regular por goteo. Zona Agrícola 89.', 
 450.00, 25.00, 'BUENO', NOW(), NOW()),

(2, 'Citrus limetta', 'Limón Persa - Catacaos', -5.2668, -80.6735, '2022-08-18', 
 'Árbol de limón persa de buena producción. Altura 6 metros. Produce frutas todo el año en Catacaos. Jr. Piura 512.', 
 600.00, 38.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Citrus sinensis', 'Naranja Dulce - Catacaos', -5.2648, -80.6718, '2020-09-12', 
 'Naranja dulce variedad Valencia. Altura 7 metros. Producción abundante. Frutos jugosos y dulces. Zona de Naranjales.', 
 720.00, 45.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Cocos nucifera', 'Cocotero - Catacaos', -5.2695, -80.6760, '2020-11-05', 
 'Cocotero de 6 años bien establecido. Altura 8 metros. Produce cocos regularmente. Muy adaptado al clima tropical de Piura. Av. Los Cocoteros 198.', 
 800.00, 60.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Tamarindus indica', 'Tamarindo - Catacaos', -5.2640, -80.6728, '2023-05-14', 
 'Tamarindo en buen estado vegetativo. Altura 7 metros. Copudo y sombrante. Produce vainas con pulpa aromática. Zona Parques 345.', 
 700.00, 42.00, 'BUENO', NOW(), NOW()),

-- ============================================================
-- ÁRBOLES NATIVOS DE PIURA (6 árboles)
-- ============================================================

(2, 'Enterolobium cyclocarpum', 'Guanacaste - Catacaos', -5.2710, -80.6710, '2021-07-08', 
 'Guanacaste majestuoso de 5 años. Altura 11 metros. Amplia copa proporciona sombra excelente. Especie emblemática de Piura. Sector Rural 421.', 
 1100.00, 65.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Ceiba pentandra', 'Ceiba Sagrada - Catacaos', -5.2705, -80.6720, '2018-06-12', 
 'Ceiba majestuosa de 8 años. Altura 15 metros. Árbol sagrado y emblemático de la costa peruana. Muy resistente al clima seco. Av. Circunvalación 234.', 
 1500.00, 90.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Schinus molle', 'Molle Costeño - Catacaos', -5.2650, -80.6700, '2020-10-08', 
 'Molle de la costa peruana. Altura 7 metros. Árbol ornamental de follaje colgante. Produce frutos aromáticos. Muy resistente a la sequía. Jr. Los Molle 345.', 
 720.00, 45.00, 'BUENO', NOW(), NOW()),

(2, 'Erythrina edulis', 'Poroto de Palo - Catacaos', -5.2690, -80.6730, '2021-10-08', 
 'Árbol de poroto de palo de 5 años. Altura 8 metros. Leguminosa comestible y forrajera. Excelente para sombra. Zona de amortiguamiento.', 
 820.00, 48.00, 'BUENO', NOW(), NOW()),

(2, 'Guazuma ulmifolia', 'Guácimo - Catacaos', -5.2635, -80.6715, '2022-04-25', 
 'Árbol de guácimo de 4 años. Altura 6 metros. Maderable de buena calidad. Muy útil para cercas vivas. Sector El Caballo.', 
 620.00, 38.00, 'REGULAR', NOW(), NOW()),

(2, 'Bursera graveolens', 'Palo Santo - Catacaos', -5.2685, -80.6745, '2019-08-20', 
 'Palo Santo aromático de 7 años. Altura 9 metros. Madera sagrada de uso ceremonial y medicinal. Muy apreciada en la región. Av. San Martín 789.', 
 920.00, 55.00, 'EXCELENTE', NOW(), NOW()),

-- ============================================================
-- FRUTALES Y ÚTILES ADICIONALES (6 árboles)
-- ============================================================

(2, 'Psidium guajava', 'Guayaba Dulce - Catacaos', -5.2645, -80.6730, '2022-09-10', 
 'Guayaba de frutos dulces y aromáticos. Altura 5 metros. Producción constante. Muy adaptada al clima de Catacaos. Jr. Grau 456.', 
 500.00, 30.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Annona cherimola', 'Chirimoyo - Catacaos', -5.2655, -80.6752, '2023-09-22', 
 'Chirimoyo híbrido de 3 años con floración abundante. Altura 5 metros. Frutos de buena calidad. Camino Viejo 267.', 
 520.00, 35.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Inga edulis', 'Guaba - Catacaos', -5.2678, -80.6718, '2023-07-30', 
 'Árbol de guaba de 3 años. Altura 5 metros. Leguminosa productora de vainas dulces comestibles. Excelente para sombra. Zona Las Mercedes.', 
 520.00, 32.00, 'BUENO', NOW(), NOW()),

(2, 'Musa sapientum', 'Platanero - Catacaos', -5.2620, -80.6740, '2024-01-20', 
 'Platanero de 2 años en producción inicial. Altura 4 metros. Especie de rápido crecimiento. Adaptación excelente al clima tropical-seco. Huerta Familiar 156.', 
 420.00, 22.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Moringa oleifera', 'Moringa - Catacaos', -5.2650, -80.6765, '2023-04-08', 
 'Moringa de 3 años. Altura 5 metros. Árbol nutritivo de rápido crecimiento. Hojas comestibles y medicinales. Huerta Saludable 123.', 
 520.00, 25.00, 'EXCELENTE', NOW(), NOW()),

(2, 'Persea americana', 'Aguacate Criollo - Catacaos', -5.2670, -80.6720, '2020-09-10', 
 'Aguacate criollo de la zona. Altura 7 metros. Frutos medianos de buena calidad. Adaptado al clima de Catacaos. Zona de Paltares 456.', 
 720.00, 45.00, 'BUENO', NOW(), NOW());

-- ============================================================
-- 3. VERIFICAR INSERCIÓN
-- ============================================================
DO $$
DECLARE
  v_total INTEGER;
  v_edson_id INTEGER;
BEGIN
  SELECT id INTO v_edson_id FROM usuarios WHERE email = 'edson@gmail.com' AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO v_total 
  FROM arboles 
  WHERE usuario_id = v_edson_id 
    AND deleted_at IS NULL 
    AND latitud BETWEEN -5.28 AND -5.25 
    AND longitud BETWEEN -80.68 AND -80.66;
  
  RAISE NOTICE '✅ Total de árboles de Catacaos para Edson: %', v_total;
  RAISE NOTICE '📊 Rango de coordenadas: Lat -5.28 a -5.25 | Lon -80.68 a -80.66';
  RAISE NOTICE '🌳 Distrito: Catacaos, Piura - "Distrito de los Artesanos"';
END $$;

-- ============================================================
-- 4. LISTA DE ÁRBOLES INSERTADOS
-- ============================================================
SELECT 
  ROW_NUMBER() OVER (ORDER BY a.id) AS "#",
  a.nombre,
  a.especie,
  a.fecha_plantacion,
  a.altura_actual_cm || ' cm' AS altura,
  a.estado_salud,
  ROUND(CAST(a.latitud AS NUMERIC), 4) AS latitud,
  ROUND(CAST(a.longitud AS NUMERIC), 4) AS longitud
FROM arboles a
WHERE a.usuario_id = (SELECT id FROM usuarios WHERE email = 'edson@gmail.com' AND deleted_at IS NULL)
  AND a.deleted_at IS NULL
  AND a.latitud BETWEEN -5.28 AND -5.25 
  AND a.longitud BETWEEN -80.68 AND -80.66
ORDER BY a.id;

-- ============================================================
-- 5. RESUMEN EJECUTIVO
-- ============================================================
SELECT 
  '✅ INSERCIÓN COMPLETA - 20 ÁRBOLES DE CATACAOS' AS estado,
  '📍 Ubicación: Distrito de Catacaos, Piura, Perú' AS ubicacion,
  '👤 Usuario: Edson (edson@gmail.com)' AS propietario,
  '🌳 Total árboles: 20' AS total,
  '📅 Fecha: ' || NOW()::DATE AS fecha,
  '📌 Coordenadas: -5.2652777777778, -80.675 (Base)' AS coordenadas_base;

SELECT 
  '📊 DISTRIBUCIÓN POR GRUPO' AS seccion,
  CASE 
    WHEN especie IN ('Mangifera indica', 'Prosopis spp', 'Carica papaya', 'Citrus limetta', 'Citrus sinensis', 'Cocos nucifera', 'Tamarindus indica') THEN 'Frutales Tradicionales'
    WHEN especie IN ('Enterolobium cyclocarpum', 'Ceiba pentandra', 'Schinus molle', 'Erythrina edulis', 'Guazuma ulmifolia', 'Bursera graveolens') THEN 'Nativos de Piura'
    ELSE 'Frutales y Útiles Adicionales'
  END AS grupo,
  COUNT(*) AS cantidad,
  STRING_AGG(DISTINCT especie, ', ' ORDER BY especie) AS especies
FROM arboles
WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'edson@gmail.com' AND deleted_at IS NULL)
  AND deleted_at IS NULL
  AND latitud BETWEEN -5.28 AND -5.25 
  AND longitud BETWEEN -80.68 AND -80.66
GROUP BY grupo;