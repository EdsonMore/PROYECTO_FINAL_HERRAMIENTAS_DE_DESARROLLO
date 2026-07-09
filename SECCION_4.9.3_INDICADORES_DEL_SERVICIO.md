# 4.9.3 Indicadores del Servicio (KPIs)

## Sistema EcoDataAI — Plataforma de Monitoreo de Árboles

---

## 1. Introducción

Los Indicadores Clave de Desempeño (KPI, por sus siglas en inglés) permiten medir, evaluar y monitorear la calidad, eficiencia y efectividad del servicio EcoDataAI. Se definen KPIs organizados en cuatro categorías: **técnicos**, **funcionales**, **de calidad** y **de impacto ambiental**.

Cada KPI incluye: nombre, descripción, fórmula de cálculo, métrica objetivo, frecuencia de medición y herramienta utilizada.

---

## 2. KPIs Técnicos

Estos indicadores miden el desempeño técnico del sistema, incluyendo rendimiento, disponibilidad y capacidad de respuesta.

| ID | Indicador | Descripción | Fórmula | Meta | Frecuencia | Herramienta |
|----|-----------|-------------|---------|------|------------|-------------|
| **KPI-T-01** | Disponibilidad del sistema | Porcentaje de tiempo que el sistema está operativo | `(Tiempo activo / Tiempo total) × 100` | ≥ 99.5% (≤ 3.6h/mes de inactividad) | Mensual | Uptime Robot, monitoreo interno |
| **KPI-T-02** | Tiempo de respuesta de login | Tiempo promedio de autenticación | `(Suma de tiempos de login) / (Total de inicios de sesión)` | ≤ 2 segundos | Semanal | Chrome DevTools, pruebas de carga |
| **KPI-T-03** | Tiempo de carga del mapa | Tiempo de renderizado del mapa con 500 árboles | Medición desde solicitud hasta renderización completa | ≤ 3 segundos | Semanal | Chrome DevTools, Lighthouse |
| **KPI-T-04** | Tiempo de predicción de IA | Tiempo de generación de predicción de supervivencia | Medición desde solicitud hasta respuesta del modelo | ≤ 5 segundos | Mensual | Logs de API, cronómetro |
| **KPI-T-05** | Tiempo de búsqueda | Tiempo de respuesta en búsquedas avanzadas | `(Suma de tiempos de búsqueda) / (Total de búsquedas)` | ≤ 2 segundos | Semanal | Logs de base de datos |
| **KPI-T-06** | Tasa de error del sistema | Porcentaje de transacciones con error | `(Transacciones con error / Total transacciones) × 100` | ≤ 0.1% | Diario | Logs de API, monitoreo |
| **KPI-T-07** | Tiempo de recuperación ante fallos (RTO) | Tiempo máximo para restaurar el servicio tras fallo | Medición desde detección del fallo hasta restauración | ≤ 15 minutos | Por evento | Plan de recuperación, simulacros |
| **KPI-T-08** | Punto de recuperación (RPO) | Pérdida máxima de datos aceptable en caso de fallo | Diferencia entre último backup y momento del fallo | ≤ 1 hora | Por evento | Logs de backup |
| **KPI-T-09** | Usuarios concurrentes soportados | Cantidad máxima de usuarios simultáneos sin degradación | Pruebas de carga con incremento progresivo | ≥ 1,000 usuarios | Trimestral | k6, Artillery, JMeter |
| **KPI-T-10** | Tiempo de respuesta de APIs externas | Tiempo promedio de respuesta de Open-Meteo, PlantNet, Gemini | `(Suma de tiempos de API externa) / (Total de consultas)` | ≤ 3 segundos | Diario | Logs de API, New Relic |
| **KPI-T-11** | Tiempo de carga de dashboard | Tiempo de renderizado de página principal del dashboard | Medición desde navegación hasta paint completo | ≤ 3 segundos | Semanal | Lighthouse, Web Vitals |
| **KPI-T-12** | Tiempo de envío de notificaciones | Tiempo entre evento disparador y recepción de notificación | Medición desde evento hasta confirmación de entrega | ≤ 30 segundos | Diario | Logs de notificaciones |

---

## 3. KPIs Funcionales

Estos indicadores miden el uso y adopción del sistema por parte de los usuarios.

| ID | Indicador | Descripción | Fórmula | Meta | Frecuencia | Fuente de datos |
|----|-----------|-------------|---------|------|------------|-----------------|
| **KPI-F-01** | Total de árboles registrados | Número total de árboles en el sistema | `SELECT COUNT(*) FROM arboles WHERE deleted_at IS NULL` | — | Diario | Vista `v_estadisticas_dashboard` |
| **KPI-F-02** | Usuarios registrados | Número total de cuentas creadas | `SELECT COUNT(*) FROM usuarios WHERE deleted_at IS NULL` | — | Diario | Vista `v_estadisticas_dashboard` |
| **KPI-F-03** | Usuarios activos mensuales | Usuarios que iniciaron sesión en los últimos 30 días | `SELECT COUNT(DISTINCT usuario_id) FROM logs_auditoria WHERE accion = 'LOGIN' AND fecha_creacion >= NOW() - INTERVAL '30 days'` | — | Mensual | Tabla `logs_auditoria` |
| **KPI-F-04** | Árboles por usuario | Promedio de árboles registrados por usuario activo | `(Total árboles) / (Total usuarios activos)` | — | Mensual | Función `get_user_stats()` |
| **KPI-F-05** | Seguimientos registrados | Total de seguimientos realizados | `SELECT COUNT(*) FROM seguimientos WHERE deleted_at IS NULL` | — | Diario | Vista `v_estadisticas_dashboard` |
| **KPI-F-06** | Seguimientos por árbol | Promedio de seguimientos por árbol registrado | `(Total seguimientos) / (Total árboles)` | ≥ 2 seguimientos/árbol | Mensual | Función `get_user_stats()` |
| **KPI-F-07** | Tasa de árboles saludables | Porcentaje de árboles en estado Excelente o Bueno | `(Árboles con salud EXCELENTE + BUENO) / (Total árboles) × 100` | ≥ 70% | Mensual | Tabla `arboles`, campo `estado_salud` |
| **KPI-F-08** | Árboles con seguimiento reciente | Porcentaje de árboles con seguimiento en los últimos 30 días | `(Árboles con seguimiento en últimos 30 días) / (Total árboles) × 100` | ≥ 50% | Mensual | Tabla `seguimientos` |
| **KPI-F-09** | Predicciones generadas | Total de predicciones de supervivencia calculadas | Contar ejecuciones del modelo de IA | — | Diario | Logs de API |
| **KPI-F-10** | Identificaciones de especie | Total de identificaciones realizadas por foto | Contar consultas a API PlantNet | — | Diario | Logs de API `/api/identify-species` |
| **KPI-F-11** | Consultas al chat EcoAssistant | Total de mensajes enviados al asistente IA | Contar consultas a API Gemini | — | Diario | Logs de API `/api/chat` |
| **KPI-F-12** | Reportes generados | Total de reportes exportados (PDF + Excel) | Contar descargas de reportes | — | Mensual | Logs de auditoría |
| **KPI-F-13** | Usuarios nuevos por período | Tasa de registro de nuevos usuarios | `SELECT COUNT(*) FROM usuarios WHERE fecha_registro BETWEEN inicio AND fin` | — | Semanal | Tabla `usuarios` |
| **KPI-F-14** | Árboles por especie | Distribución de árboles por especie | `SELECT especie, COUNT(*) FROM arboles GROUP BY especie ORDER BY COUNT(*) DESC` | — | Mensual | Tabla `arboles` |
| **KPI-F-15** | Tasa de retención de usuarios | Porcentaje de usuarios que regresan después del primer mes | `(Usuarios con actividad en mes 2) / (Usuarios registrados en mes 1) × 100` | ≥ 40% | Mensual | Tabla `logs_auditoria` |

---

## 4. KPIs de Calidad

Estos indicadores miden la calidad del código, la cobertura de pruebas y la mantenibilidad del sistema.

| ID | Indicador | Descripción | Fórmula | Meta | Frecuencia | Herramienta |
|----|-----------|-------------|---------|------|------------|-------------|
| **KPI-C-01** | Cobertura de pruebas unitarias | Porcentaje de código cubierto por tests automatizados | `(Líneas probadas / Líneas totales) × 100` | ≥ 80% | Por commit | Jest, Codecov |
| **KPI-C-02** | Cobertura de pruebas de integración | Porcentaje de flujos críticos cubiertos por pruebas de integración | `(Flujos probados / Flujos totales críticos) × 100` | ≥ 70% | Por release | Jest, Supertest |
| **KPI-C-03** | Calidad de código ESLint | Porcentaje de reglas ESLint cumplidas | `(Reglas OK / Reglas totales) × 100` | 100% | Por commit | ESLint |
| **KPI-C-04** | Deuda técnica | Tiempo estimado para resolver problemas de código | Medición con SonarQube o CodeRabbit | ≤ 1 día | Mensual | SonarQube |
| **KPI-C-05** | Tiempo de build | Tiempo de compilación del proyecto Next.js | Medición desde `npm run build` | ≤ 5 minutos | Por commit | Next.js build output |
| **KPI-C-06** | Vulnerabilidades de seguridad | Cantidad de vulnerabilidades conocidas en dependencias | `npm audit` o `pnpm audit` | 0 críticas/altas | Semanal | npm audit, Snyk |
| **KPI-C-07** | Documentación actualizada | Porcentaje de endpoints API documentados | `(Endpoints documentados / Endpoints totales) × 100` | ≥ 90% | Por release | OpenAPI / Swagger |
| **KPI-C-08** | Cumplimiento de estándares WCAG | Porcentaje de criterios de accesibilidad WCAG 2.1 AA cumplidos | `(Criterios OK / Criterios totales AA) × 100` | 100% | Trimestral | axe DevTools, Lighthouse |

---

## 5. KPIs de Impacto Ambiental

Estos indicadores miden el impacto ecológico positivo generado por los usuarios del sistema.

| ID | Indicador | Descripción | Fórmula | Meta | Frecuencia | Fuente de datos |
|----|-----------|-------------|---------|------|------------|-----------------|
| **KPI-A-01** | CO₂ capturado total | Kilogramos de CO₂ capturados por todos los árboles del sistema | `SELECT SUM(co2_capturado_kg) FROM arboles WHERE deleted_at IS NULL` | — | Mensual | Función de beneficios ambientales |
| **KPI-A-02** | O₂ producido total | Kilogramos de oxígeno producidos por todos los árboles | `SELECT SUM(o2_producido_kg) FROM arboles WHERE deleted_at IS NULL` | — | Mensual | Función de beneficios ambientales |
| **KPI-A-03** | Agua infiltrada total | Litros de agua infiltrados al suelo por todos los árboles | `SELECT SUM(agua_infiltrada_l) FROM arboles WHERE deleted_at IS NULL` | — | Mensual | Función de beneficios ambientales |
| **KPI-A-04** | Valor económico total | Valor económico aproximado de todos los árboles del sistema | `SELECT SUM(valor_economico) FROM arboles WHERE deleted_at IS NULL` | — | Mensual | Función de beneficios ambientales |
| **KPI-A-05** | CO₂ capturado por usuario | Promedio de CO₂ capturado por usuario activo | `(CO₂ total) / (Usuarios activos)` | — | Mensual | Función `get_user_stats()` |
| **KPI-A-06** | Árboles por beneficio ambiental | Equivalencias ambientales generadas (ej: "equivalente a X autos menos") | Comparación con tablas de referencia de la EPA | — | Trimestral | Página `/beneficios` |
| **KPI-A-07** | Beneficios compartidos en redes | Cantidad de veces que usuarios comparten su impacto en redes sociales | `SELECT COUNT(*) FROM logs_auditoria WHERE accion = 'COMPARTIR_REDES'` | — | Mensual | Logs de auditoría |

---

## 6. KPIs de Seguridad

| ID | Indicador | Descripción | Fórmula | Meta | Frecuencia | Herramienta |
|----|-----------|-------------|---------|------|------------|-------------|
| **KPI-S-01** | Intentos de acceso no autorizado | Número de intentos fallidos de autenticación | `SELECT COUNT(*) FROM logs_auditoria WHERE accion = 'LOGIN_FALLIDO'` | — | Diario | Logs de auditoría |
| **KPI-S-02** | Tiempo medio de detección de incidentes | Tiempo entre ocurrencia y detección de un incidente de seguridad | Medición desde evento hasta alerta | ≤ 5 minutos | Por evento | Monitoreo, alertas |
| **KPI-S-03** | Cumplimiento de backups | Porcentaje de backups programados que se completaron exitosamente | `(Backups exitosos / Backups programados) × 100` | 100% | Diario | Script de backup |
| **KPI-S-04** | Pruebas de recuperación | Ejecución de simulacros de recuperación ante desastres | Número de drills completados | ≥ 2 por año | Semestral | Documentación DRP |

---

## 7. Tablero de Control (Dashboard de KPIs)

Los siguientes KPIs se visualizan en el dashboard principal del sistema (`/dashboard`):

```
╔══════════════════════════════════════════════════════════════════╗
║                     ECODATA AI — DASHBOARD                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             ║
║   │  🌳 ÁRBOLES  │  │  👥 USUARIOS │  │  📋 SEGUIM. │             ║
║   │    XXX total  │  │    XXX total │  │    XXX total │             ║
║   │    +XX este   │  │    +XX este  │  │    +XX este  │             ║
║   │    mes       │  │    mes      │  │    mes      │             ║
║   └─────────────┘  └─────────────┘  └─────────────┘             ║
║                                                                   ║
║   ┌────────────────────────────────────────────────────────┐     ║
║   │  DISTRIBUCIÓN POR ESTADO DE SALUD                       │     ║
║   │  ██████████ Excelente: XX%                              │     ║
║   │  ████████ Bueno: XX%                                    │     ║
║   │  ████ Regular: XX%                                      │     ║
║   │  ██ Malo: XX%                                           │     ║
║   │  █ Crítico: XX%                                         │     ║
║   └────────────────────────────────────────────────────────┘     ║
║                                                                   ║
║   ┌────────────────────────────────────────────────────────┐     ║
║   │  TENDENCIA DE SALUD (ÚLTIMOS 30 DÍAS)                   │     ║
║   │  ╱╲___╱╲___╱╲___╱╲___╱╲___                              │     ║
║   │  └──────────────────────────────────────────            │     ║
║   └────────────────────────────────────────────────────────┘     ║
║                                                                   ║
║   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             ║
║   │  🌡️ CLIMA   │  │  🤖 IA      │  │  🌱 BENEF.  │             ║
║   │  XX°C Hum.   │  │  Predicción │  │  XX kg CO₂  │             ║
║   │  XX%         │  │  promedio   │  │  capturado  │             ║
║   └─────────────┘  └─────────────┘  └─────────────┘             ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 8. Consultas SQL para KPIs

A continuación se presentan las consultas SQL utilizadas para calcular los principales KPIs desde la base de datos PostgreSQL:

### KPI-F-01: Total de árboles registrados
```sql
SELECT COUNT(*) AS total_arboles
FROM arboles
WHERE deleted_at IS NULL;
```

### KPI-F-02: Total de usuarios registrados
```sql
SELECT COUNT(*) AS total_usuarios
FROM usuarios
WHERE deleted_at IS NULL;
```

### KPI-F-05: Total de seguimientos
```sql
SELECT COUNT(*) AS total_seguimientos
FROM seguimientos
WHERE deleted_at IS NULL;
```

### KPI-F-07: Tasa de árboles saludables
```sql
SELECT
    ROUND(
        SUM(CASE WHEN estado_salud IN ('EXCELENTE', 'BUENO') THEN 1 ELSE 0 END) * 100.0
        / COUNT(*),
    2) AS tasa_saludable
FROM arboles
WHERE deleted_at IS NULL;
```

### KPI-F-04: Promedio de árboles por usuario
```sql
SELECT
    ROUND(
        (SELECT COUNT(*) FROM arboles WHERE deleted_at IS NULL)::decimal
        / NULLIF((SELECT COUNT(*) FROM usuarios WHERE deleted_at IS NULL AND estado = 'ACTIVO'), 0),
    2) AS arboles_por_usuario;
```

### Vista consolidada de estadísticas
```sql
-- Vista v_estadisticas_dashboard (ya existente en BD)
SELECT * FROM v_estadisticas_dashboard;
```

### Función de estadísticas por usuario
```sql
-- Función get_user_stats (ya existente en BD)
SELECT * FROM get_user_stats(1); -- Reemplazar 1 por ID del usuario
```

---

## 9. Metas y Umbrales

| Categoría | KPI | Meta | Aceptable | Crítico |
|-----------|-----|------|-----------|---------|
| **Técnico** | Disponibilidad | ≥ 99.5% | ≥ 99.0% | < 99.0% |
| **Técnico** | Tiempo de login | ≤ 2s | ≤ 3s | > 3s |
| **Técnico** | Tiempo de mapa | ≤ 3s | ≤ 5s | > 5s |
| **Técnico** | Tasa de error | ≤ 0.1% | ≤ 0.5% | > 0.5% |
| **Técnico** | RTO | ≤ 15 min | ≤ 30 min | > 30 min |
| **Técnico** | RPO | ≤ 1 hora | ≤ 2 horas | > 2 horas |
| **Funcional** | Tasa de saludables | ≥ 70% | ≥ 50% | < 50% |
| **Funcional** | Seguimientos por árbol | ≥ 2 | ≥ 1 | < 1 |
| **Funcional** | Retención de usuarios | ≥ 40% | ≥ 25% | < 25% |
| **Calidad** | Cobertura de pruebas | ≥ 80% | ≥ 60% | < 60% |
| **Calidad** | Vulnerabilidades críticas | 0 | 0 | ≥ 1 |
| **Seguridad** | Backups exitosos | 100% | ≥ 95% | < 95% |

---

## 10. Herramientas de Monitoreo

| Herramienta | Propósito | KPIs monitoreados |
|-------------|-----------|-------------------|
| **Chrome DevTools / Lighthouse** | Rendimiento frontend | KPI-T-02, KPI-T-03, KPI-T-11 |
| **Logs de base de datos** | Consultas SQL, tiempos de respuesta | KPI-T-05, KPIs funcionales |
| **Logs de API (Next.js)** | Tiempos de respuesta de endpoints | KPI-T-04, KPI-T-10, KPI-F-09, KPI-F-10, KPI-F-11 |
| **Vista v_estadisticas_dashboard** | Estadísticas consolidadas | KPI-F-01, KPI-F-02, KPI-F-05 |
| **Función get_user_stats()** | Estadísticas por usuario | KPI-F-04, KPI-F-06 |
| **Logs de auditoría** | Seguimiento de acciones | KPI-F-03, KPI-F-13, KPI-S-01 |
| **npm audit / pnpm audit** | Vulnerabilidades de seguridad | KPI-C-06 |
| **ESLint** | Calidad de código | KPI-C-03 |
| **Plan de recuperación (DRP)** | Continuidad del negocio | KPI-T-07, KPI-T-08, KPI-S-04 |

---

## 11. Cronograma de Revisión

| KPI | Revisión | Responsable |
|-----|----------|-------------|
| KPI-T-01 a KPI-T-06, KPI-T-10 a KPI-T-12 | Diaria | Equipo de operaciones |
| KPI-T-09 | Trimestral | Equipo de infraestructura |
| KPI-F-01, KPI-F-02, KPI-F-05, KPI-F-09 a KPI-F-11 | Diaria | Dashboard automático |
| KPI-F-03, KPI-F-04, KPI-F-06 a KPI-F-08, KPI-F-12 a KPI-F-15 | Mensual | Product owner |
| KPI-C-01 a KPI-C-05, KPI-C-07 | Por release | Equipo de desarrollo |
| KPI-C-06 | Semanal | Equipo de seguridad |
| KPI-C-08 | Trimestral | Equipo de UX |
| KPI-A-01 a KPI-A-07 | Mensual | Product owner |
| KPI-S-01, KPI-S-03 | Diaria | Equipo de operaciones |
| KPI-S-02, KPI-S-04 | Semestral | Equipo de seguridad |

---

*Documento de indicadores del sistema EcoDataAI. Los KPIs definidos están alineados con los Requerimientos No Funcionales establecidos en la Fase 05 y con las capacidades de monitoreo disponibles en la infraestructura del proyecto.*
