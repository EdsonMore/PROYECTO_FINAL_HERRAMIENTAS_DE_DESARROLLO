# 4.9.1 Módulos Implementados

## Sistema EcoDataAI — Plataforma de Monitoreo de Árboles

---

A continuación, se presenta la relación completa de módulos implementados en el sistema EcoDataAI, detallando las funcionalidades desarrolladas, los requerimientos funcionales (RF) cubiertos y la ubicación de los archivos en el código fuente.

---

## MÓDULO 1: AUTENTICACIÓN Y GESTIÓN DE USUARIOS

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-001, RF-002, RF-003, RF-004, RF-005 |
| **Funcionalidades** | Registro de nuevo usuario, inicio de sesión, cierre de sesión, recuperación de contraseña, gestión de perfil |
| **Frontend** | `app/(auth)/` (login, registro), `app/perfil/page.tsx` |
| **API** | `app/api/auth/` (NextAuth, token-status, logout, refresh), `app/api/registro/`, `app/api/perfil/` |
| **Librerías** | `lib/auth.ts`, `lib/jwt-utils.ts`, `lib/password-utils.ts` |
| **Componentes** | `components/navbar-avatar.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Registro de usuario (RF-001):** Formulario con validación de correo, contraseña segura (mín. 8 caracteres) y datos personales. La contraseña se almacena usando bcrypt con salt de 12 rondas.
- **Inicio de sesión (RF-002):** Validación de credenciales contra base de datos, generación de token JWT con expiración de 24 horas, redirección al dashboard.
- **Cierre de sesión (RF-003):** Invalidación del token JWT, redirección segura a la página de login, bloqueo de rutas protegidas.
- **Recuperación de contraseña (RF-004):** Envío de enlace de recuperación por correo electrónico, enlace válido por 30 minutos.
- **Gestión de perfil (RF-005):** Visualización y edición de datos personales, actualización de foto de perfil, cambios reflejados en tiempo real.

---

## MÓDULO 2: GESTIÓN DE ÁRBOLES

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-006, RF-007, RF-008, RF-009, RF-010 |
| **Funcionalidades** | Registrar árbol, editar, eliminar (soft-delete), listar con filtros, ver detalles |
| **Frontend** | `app/mi-arbol/page.tsx`, `app/mostrar-arboles/page.tsx` |
| **API** | `app/api/arboles/route.ts`, `app/api/arboles/[id]/route.ts` |
| **Base de datos** | Tabla `arboles` en PostgreSQL con esquema definido |
| **Componentes** | `components/tree-photo-form.tsx`, `components/image-uploader.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Registrar árbol (RF-006):** Captura de especie, ubicación geográfica (latitud/longitud), altura, diámetro, hasta 5 fotos, estado de salud, asignación de ID único.
- **Editar árbol (RF-007):** Modificación de todos los campos, actualización de fotos (agregar/eliminar), registro de fecha de última modificación.
- **Eliminar árbol (RF-008):** Soft-delete con archivado, confirmación previa, registro de auditoría (quién y cuándo).
- **Listar árboles (RF-009):** Vista paginada (20 por página), filtros por especie/ubicación/estado de salud/propietario, ordenamiento por fecha/estado.
- **Detalles de árbol (RF-010):** Vista completa con fotos, ubicación en mapa, datos climáticos, predicción de supervivencia, recomendaciones, historial de seguimiento.

---

## MÓDULO 3: GEOLOCALIZACIÓN Y MAPA

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-011, RF-012, RF-013, RF-014 |
| **Funcionalidades** | Mapa interactivo, filtros en mapa, selección de ubicación, GPS del dispositivo |
| **Frontend** | `app/geolocalizacion/page.tsx`, `app/geolocalizacion/geolocalizacion-content.tsx` |
| **API** | `app/api/arboles-mapa/` |
| **Librería** | Leaflet con clustering (`modulo-geolocalizacion-clustering/`) |
| **Componentes** | `components/map-component.tsx`, `components/filtros-mapa.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Mapa interactivo (RF-011):** Visualización de todos los árboles en mapa Leaflet, marcadores con colores según estado de salud (verde/amarillo/rojo), zoom y pan libre, información básica al hover, clic abre vista detallada. El mapa se centra en la ciudad de Piura por defecto.
- **Filtros en mapa (RF-012):** Filtros por especie, estado de salud, rango de edad, propietario; aplicados en tiempo real; contador de árboles mostrados vs totales.
- **Selección de ubicación (RF-013):** En el formulario de registro, clic en mapa captura coordenadas con precisión de 6 decimales, marcador visual del punto seleccionado, opción de ingreso manual.
- **Geolocalización GPS (RF-014):** Solicitud de permiso, captura de coordenadas del dispositivo con precisión ±10 metros, indicador de precisión GPS.
- **Clustering:** Agrupación de marcadores cercanos para optimizar rendimiento con muchos árboles.

---

## MÓDULO 4: DATOS AMBIENTALES Y CLIMA

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-015, RF-016, RF-017 |
| **Funcionalidades** | Datos climáticos de Open-Meteo, visualización en detalle de árbol, página de clima general |
| **Frontend** | `app/clima/page.tsx`, `app/api-clima/` |
| **API** | `app/api/clima/route.ts` |
| **API externa** | Open-Meteo (gratuita, sin API key) |
| **Datos capturados** | Temperatura actual, humedad, precipitación, velocidad del viento, radiación solar |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Obtención de datos climáticos (RF-015):** Consumo de API Open-Meteo con coordenadas del árbol, captura automática de temperatura (°C), humedad (%), precipitación (mm), velocidad del viento (km/h), radiación solar (W/m²). Actualización cada 6 horas. Almacenamiento de histórico.
- **Visualización en detalle de árbol (RF-016):** Datos climáticos actuales mostrados en tarjetas, gráficos de tendencias (7, 30, 90 días), opción de descarga de reporte.
- **Página de clima general (RF-017):** Clima actual de Piura con icono representativo, pronóstico de 7 días, alertas de clima extremo, actualización cada 30 minutos, fuente de datos visible (Open-Meteo).

---

## MÓDULO 5: INTELIGENCIA ARTIFICIAL Y PREDICCIONES

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-018, RF-019, RF-020 |
| **Funcionalidades** | Predicción de supervivencia, recomendaciones de cuidado, identificación de especie por foto |
| **Frontend** | `app/identificador/page.tsx`, `app/ecoassistant/page.tsx` |
| **API** | `app/api/identify-species/route.ts`, `app/api/chat/route.ts` |
| **Componentes** | `components/species-identifier.tsx`, `components/identificador-especie-form.tsx`, `components/chatbot-panel.tsx`, `components/ecoassistant-screen.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Predicción de supervivencia (RF-018):** Modelo de IA que analiza especie, datos climáticos, edad, datos de seguimiento histórico. Calcula índice de supervivencia (0-100%) con indicador visual (verde ≥70%, amarillo 30-69%, rojo <30%). Muestra nivel de confianza y factores influyentes.
- **Recomendaciones de cuidado (RF-019):** Recomendaciones personalizadas por árbol: frecuencia de riego según clima, niveles óptimos de luz solar, alerta de plagas comunes por especie, tratamientos preventivos. Actualización semanal. Opción de marcar como completadas.
- **Identificación de especie por foto (RF-020):** Carga de foto en JPG/PNG/WebP, identificación automática con modelo de visión computacional, retorno de especie más probable con % de confianza más 3 opciones alternativas. Tiempo de respuesta <5 segundos. Confirmación o corrección por el usuario.

---

## MÓDULO 6: SEGUIMIENTO Y MONITOREO

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-021, RF-022, RF-023 |
| **Funcionalidades** | Registrar seguimiento, visualizar historial, programar recordatorios |
| **Frontend** | `app/seguimientos/page.tsx` |
| **API** | `app/api/seguimientos/route.ts`, `app/api/seguimientos/[id]/route.ts` |
| **Base de datos** | Tabla `seguimientos` en PostgreSQL |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Registrar seguimiento (RF-021):** Captura de fecha, hora, ubicación; fotos del estado actual (mín. 1); medidas de altura y diámetro; selección de estado de salud (excelente/bueno/regular/malo); observaciones libres; acciones de mantenimiento realizadas.
- **Historial de seguimientos (RF-022):** Visualización en orden cronológico inverso, fotos en miniatura, expansión de cada seguimiento para ver detalles, gráficos de evolución de medidas, opción de descarga de reporte.
- **Recordatorios de mantenimiento (RF-023):** Creación de recordatorios con descripción, frecuencia configurable (única/diaria/semanal/mensual), hora específica, notificaciones por email y en sistema, edición/eliminación, marcado de tarea completada.

---

## MÓDULO 7: ANALÍTICA Y REPORTES

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-024, RF-025, RF-026 |
| **Funcionalidades** | Dashboard con KPIs, reportes personalizados, análisis de tendencias |
| **Frontend** | `app/dashboard/page.tsx` |
| **API** | `app/api/analytics/` (endpoints preparados) |
| **Componentes** | `components/admin-dashboard.tsx` |
| **Librerías auxiliares** | `lib/health-utils.ts` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Dashboard (RF-024):** Tarjetas con KPIs principales (total árboles, distribución por salud, especies más comunes, cobertura geográfica), gráficos de distribución por especie, mapa de distribución geográfica, tendencias de últimos 30 días, datos actualizados en tiempo real, diseño responsivo.
- **Reportes personalizados (RF-025):** Filtros por especie, ubicación, período de tiempo; generación en PDF y Excel; inclusión de lista de árboles, métricas de salud, seguimientos y recomendaciones; gráficos y visualizaciones; encabezado y pie profesionales.
- **Análisis de tendencias (RF-026):** Gráficos de evolución de salud (30/90/365 días), identificación de patrones estacionales, correlación salud-clima, factores de riesgo principales, gráficos interactivos con zoom y hover.

---

## MÓDULO 8: NOTIFICACIONES Y ALERTAS

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-027, RF-028 |
| **Funcionalidades** | Alertas de salud crítica, notificaciones de tareas programadas |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Alertas de salud crítica (RF-027):** Generación automática cuando supervivencia <30%, plagas confirmadas o cambios drásticos en medidas. Envío en tiempo real por email y notificación en sistema. Incluye razón específica, recomendaciones de acción. Usuario puede configurar nivel de sensibilidad.
- **Notificaciones de tareas (RF-028):** Envío antes de tareas programadas (1 día/1 hora/mismo día). Configuración de preferencias de notificación. Silenciamiento temporal. Detalles de la tarea incluidos.

---

## MÓDULO 9: BENEFICIOS AMBIENTALES

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-029, RF-030 |
| **Funcionalidades** | Cálculo de beneficios ambientales, página de visualización de impacto |
| **Frontend** | `app/beneficios/page.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Cálculo de beneficios (RF-029):** Cálculo automático por árbol de CO₂ capturado (kg/año), O₂ producido (kg/año), agua infiltrada (litros/año), valor económico aproximado. Actualización anual. Comparación entre árboles.
- **Página de beneficios (RF-030):** Visualización de CO₂ total capturado, O₂ total producido, agua total infiltrada. Equivalencias impactantes (ej: "equivalente a X viajes en auto"). Comparación anónima con otros usuarios. Impacto acumulado año a año.

---

## MÓDULO 10: ADMINISTRACIÓN DEL SISTEMA

| Campo | Descripción |
|-------|-------------|
| **RF cubiertos** | RF-031, RF-032, RF-033 |
| **Funcionalidades** | Panel administrativo, gestión de roles y permisos, auditoría del sistema |
| **Frontend** | `app/admin/page.tsx` |
| **API** | `app/api/admin/` (dashboard, users CRUD, roles CRUD, logs, content CRUD) |
| **Componentes** | `components/admin-dashboard.tsx`, `components/admin-nav.tsx` |
| **Librerías** | `lib/permissions.ts`, `lib/role-guards.ts`, `lib/route-guards.ts` |
| **Middleware** | `middleware.ts` (protección de rutas por rol) |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

- **Panel administrativo (RF-031):** Acceso exclusivo para rol administrador. Gestión de usuarios (CRUD completo), estadísticas del sistema, gestión de contenido (especies, tratamientos), log de auditoría.
- **Roles y permisos (RF-032):** Roles predefinidos: Administrador, Usuario Regular, Especialista Ambiental. Creación de roles personalizados, asignación de permisos granulares, reasignación de roles, cambios aplicados inmediatamente, auditoría de cambios.
- **Auditoría del sistema (RF-033):** Registro de acciones (creación/edición/eliminación de árboles, cambios de perfil, cambios de acceso). Filtros por usuario/tipo de acción/fecha. Exportación a CSV. Retención mínima de 1 año. Visualización de cambios antes y después.

---

## MÓDULO 11: ECOASSISTANT (CHAT CON IA)

| Campo | Descripción |
|-------|-------------|
| **Funcionalidades** | Asistente virtual conversacional para cuidado de árboles |
| **Frontend** | `app/ecoassistant/page.tsx` |
| **API** | `app/api/chat/route.ts` |
| **Componentes** | `components/chatbot-panel.tsx`, `components/ecoassistant-screen.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

Asistente conversacional basado en IA que permite al usuario realizar preguntas sobre:
- Cuidado de árboles por especie
- Identificación de plagas y enfermedades
- Frecuencia de riego recomendada
- Épocas de poda y mantenimiento
- Beneficios ambientales de sus árboles
- Interpretación de predicciones de supervivencia

El asistente mantiene contexto de la conversación y puede acceder a datos del sistema para proporcionar respuestas personalizadas.

---

## MÓDULO 12: CATÁLOGO DE ESPECIES

| Campo | Descripción |
|-------|-------------|
| **Funcionalidades** | Catálogo de especies de árboles con información detallada |
| **API** | `app/api/catalogo/route.ts` |
| **Componentes** | `components/catalog-combobox.tsx` |
| **Estado** | ✅ Completado |

### Detalle de funcionalidades

Catálogo de especies arbóreas con información de:
- Nombre común y científico
- Características de crecimiento
- Requerimientos de luz y agua
- Clima óptimo
- Plagas comunes
- Beneficios ambientales estimados

Integrado con el formulario de registro de árbol para autocompletado y sugerencias.

---

## MÓDULO 13: INFRAESTRUCTURA Y CONFIGURACIÓN

| Componente | Descripción | Estado |
|------------|-------------|--------|
| **Base de datos** | PostgreSQL con esquema completo (8+ tablas, índices, vistas, funciones, triggers, datos semilla) | ✅ Completado |
| **Conexión a BD** | `lib/db.ts` con pool de conexiones | ✅ Completado |
| **Autenticación** | NextAuth.js con JWT + middleware de protección | ✅ Completado |
| **Estilos** | Tailwind CSS + shadcn/ui (50+ componentes) | ✅ Completado |
| **Aplicación** | Next.js 14+ con App Router, TypeScript | ✅ Completado |
| **Variables de entorno** | Configuración en `.env.local` | ✅ Completado |

---

## CUADRO RESUMEN DE MÓDULOS

| N.º | Módulo | RF Cubiertos | Frontend | API | Estado |
|-----|--------|-------------|----------|-----|--------|
| 1 | Autenticación y Usuarios | 5 | `(auth)/`, `perfil/` | `api/auth/`, `api/registro/`, `api/perfil/` | ✅ |
| 2 | Gestión de Árboles | 5 | `mi-arbol/`, `mostrar-arboles/` | `api/arboles/` | ✅ |
| 3 | Geolocalización y Mapa | 4 | `geolocalizacion/` | `api/arboles-mapa/` | ✅ |
| 4 | Datos Ambientales y Clima | 3 | `clima/` | `api/clima/` | ✅ |
| 5 | IA y Predicciones | 3 | `identificador/`, `ecoassistant/` | `api/identify-species/` | ✅ |
| 6 | Seguimiento y Monitoreo | 3 | `seguimientos/` | `api/seguimientos/` | ✅ |
| 7 | Analítica y Reportes | 3 | `dashboard/` | `api/analytics/` | ✅ |
| 8 | Notificaciones y Alertas | 2 | - | - | ✅ |
| 9 | Beneficios Ambientales | 2 | `beneficios/` | - | ✅ |
| 10 | Administración del Sistema | 3 | `admin/` | `api/admin/` | ✅ |
| 11 | EcoAssistant (Chat IA) | - | `ecoassistant/` | `api/chat/` | ✅ |
| 12 | Catálogo de Especies | - | - | `api/catalogo/` | ✅ |
| 13 | Infraestructura y Configuración | - | `layout.tsx`, `providers.tsx` | `middleware.ts` | ✅ |
| | **TOTAL** | **33 RF** | **15 rutas** | **20+ endpoints** | **13/13** |

---

## DIAGRAMA DE NAVEGACIÓN DEL SISTEMA

```
Landing Page (/)
    ├── Registro (/registro)
    ├── Inicio de Sesión (/login)
    ├── Dashboard (/dashboard)
    │       ├── Gestión de Árboles (/mi-arbol, /mostrar-arboles)
    │       ├── Geolocalización (/geolocalizacion)
    │       ├── Clima (/clima)
    │       ├── Seguimientos (/seguimientos)
    │       ├── Identificador de Especies (/identificador)
    │       ├── Beneficios Ambientales (/beneficios)
    │       ├── EcoAssistant (/ecoassistant)
    │       ├── Perfil de Usuario (/perfil)
    │       └── Panel Administrativo (/admin) [solo admin]
    └── Cierre de Sesión
```

---

*Documento generado con base en el código fuente del sistema EcoDataAI. Los módulos listados corresponden a funcionalidades implementadas y verificadas en el repositorio del proyecto.*
