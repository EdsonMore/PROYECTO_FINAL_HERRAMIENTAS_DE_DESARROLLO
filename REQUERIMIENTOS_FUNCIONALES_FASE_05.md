# 🎯 FASE 05: ANÁLISIS DE REQUERIMIENTOS FUNCIONALES
## Sistema EcoDataAI - Plataforma de Monitoreo de Árboles

---

## 📋 REQUERIMIENTOS FUNCIONALES POR MÓDULO

---

## **MÓDULO 1: AUTENTICACIÓN Y GESTIÓN DE USUARIOS**

### RF-001: Registro de nuevo usuario

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-001 |
| **Nombre** | Registro de nuevo usuario |
| **Descripción** | El usuario nuevo podrá crear una cuenta en el sistema proporcionando correo electrónico, contraseña y datos personales. El sistema validará la información y creará la cuenta. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario anónimo |
| **Precondición** | El usuario no debe estar registrado en el sistema previamente. |
| **Postcondición** | La cuenta está creada y el usuario puede iniciar sesión. |
| **Criterio de aceptación** | ✓ El sistema valida que el email no esté duplicado<br>✓ La contraseña cumple con requisitos de seguridad (mín. 8 caracteres)<br>✓ Se envía correo de confirmación<br>✓ El usuario es redirigido al login tras registro exitoso |

---

### RF-002: Inicio de sesión de usuario

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-002 |
| **Nombre** | Inicio de sesión de usuario |
| **Descripción** | El usuario registrado podrá acceder al sistema ingresando su correo electrónico y contraseña. El sistema validará las credenciales y generará un token JWT. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario registrado |
| **Precondición** | El usuario debe tener una cuenta activa en el sistema. |
| **Postcondición** | El usuario inicia sesión y accede al dashboard. Se genera y almacena un token JWT. |
| **Criterio de aceptación** | ✓ Las credenciales se validan correctamente<br>✓ Se genera un token JWT válido<br>✓ El token tiene expiración de 24 horas<br>✓ El usuario es redirigido al dashboard tras login exitoso<br>✓ Se muestra error si credenciales son inválidas |

---

### RF-003: Cierre de sesión

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-003 |
| **Nombre** | Cierre de sesión del usuario |
| **Descripción** | El usuario podrá cerrar su sesión de forma segura. El sistema invalidará el token JWT y redirigirá al usuario a la página de login. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe tener una sesión activa. |
| **Postcondición** | El token JWT es invalidado y el usuario es redirigido al login. |
| **Criterio de aceptación** | ✓ El token se invalida correctamente<br>✓ El usuario es redirigido a la página de login<br>✓ El acceso a rutas protegidas es bloqueado<br>✓ Se muestra mensaje de confirmación |

---

### RF-004: Recuperación de contraseña

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-004 |
| **Nombre** | Recuperación de contraseña |
| **Descripción** | El usuario que olvida su contraseña podrá solicitar un enlace de recuperación en su correo electrónico. Al hacer clic en el enlace, podrá establecer una nueva contraseña. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario anónimo o registrado |
| **Precondición** | El usuario debe tener una cuenta registrada en el sistema. |
| **Postcondición** | La contraseña del usuario es actualizada. |
| **Criterio de aceptación** | ✓ Se envía enlace de recuperación al email<br>✓ El enlace es válido solo por 30 minutos<br>✓ Se requiere nueva contraseña que cumpla requisitos de seguridad<br>✓ El usuario puede iniciar sesión con la nueva contraseña |

---

### RF-005: Gestión de perfil de usuario

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-005 |
| **Nombre** | Gestión de perfil de usuario |
| **Descripción** | El usuario autenticado podrá visualizar y editar su información de perfil (nombre, apellido, teléfono, foto de perfil, ubicación). |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe estar autenticado en el sistema. |
| **Postcondición** | Los cambios en el perfil son guardados y reflejados inmediatamente. |
| **Criterio de aceptación** | ✓ El usuario puede visualizar todos sus datos de perfil<br>✓ Los datos se pueden editar y guardar<br>✓ Se puede actualizar la foto de perfil<br>✓ Se muestra confirmación de cambios guardados<br>✓ Los datos se actualizan en tiempo real en toda la aplicación |

---

## **MÓDULO 2: GESTIÓN DE ÁRBOLES**

### RF-006: Registrar nuevo árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-006 |
| **Nombre** | Registrar nuevo árbol |
| **Descripción** | El usuario podrá registrar un nuevo árbol proporcionando especie, ubicación geográfica, altura, diámetro, fotos y características de salud. El sistema asignará un ID único y almacenará la información. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe estar autenticado en el sistema. |
| **Postcondición** | El árbol es creado en el sistema con estado "Activo" y puede ser visualizado. |
| **Criterio de aceptación** | ✓ Se captura especie, ubicación, altura y diámetro<br>✓ Se pueden subir mínimo 1 y máximo 5 fotos del árbol<br>✓ Se valida que la ubicación sea válida<br>✓ Se genera ID único para el árbol<br>✓ El árbol aparece en el mapa inmediatamente<br>✓ Se muestra confirmación de creación exitosa |

---

### RF-007: Editar información de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-007 |
| **Nombre** | Editar información de árbol |
| **Descripción** | El usuario que registró el árbol podrá editar su información (especie, altura, diámetro, estado de salud, fotos). Los cambios se reflejan inmediatamente. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado (propietario del registro) |
| **Precondición** | El árbol debe existir en el sistema. El usuario debe ser el propietario del registro. |
| **Postcondición** | La información del árbol está actualizada y los cambios son visibles en el sistema. |
| **Criterio de aceptación** | ✓ Todos los campos pueden ser editados<br>✓ Se pueden agregar o eliminar fotos<br>✓ Los cambios se reflejan inmediatamente en el mapa<br>✓ Se registra la fecha y hora de la última actualización<br>✓ Se muestra confirmación de cambios guardados |

---

### RF-008: Eliminar árbol del sistema

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-008 |
| **Nombre** | Eliminar árbol del sistema |
| **Descripción** | El usuario propietario del registro podrá eliminar un árbol del sistema. El registro será archivado (soft delete) manteniéndose el historial de datos. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado (propietario del registro) |
| **Precondición** | El árbol debe existir en el sistema. El usuario debe ser el propietario. |
| **Postcondición** | El árbol es marcado como eliminado y no aparece en las vistas normales. |
| **Criterio de aceptación** | ✓ Se solicita confirmación antes de eliminar<br>✓ El árbol no desaparece del mapa de forma abrupta<br>✓ Se registra quién eliminó y cuándo<br>✓ El historial se mantiene para auditoría<br>✓ Se muestra confirmación de eliminación |

---

### RF-009: Visualizar lista de árboles

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-009 |
| **Nombre** | Visualizar lista de árboles |
| **Descripción** | El usuario podrá visualizar una lista de todos los árboles registrados en el sistema con filtros por especie, ubicación, estado de salud y propietario. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | Debe haber árboles registrados en el sistema. |
| **Postcondición** | Se muestra la lista con los árboles según los criterios de filtrado. |
| **Criterio de aceptación** | ✓ La lista es paginada (máximo 20 árboles por página)<br>✓ Se pueden filtrar por especie, ubicación, estado<br>✓ Se muestra información básica: ID, especie, ubicación, propietario<br>✓ Se permite ordenar por fecha de creación, salud, ubicación<br>✓ Se puede hacer clic en un árbol para ver detalles completos |

---

### RF-010: Visualizar detalles de un árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-010 |
| **Nombre** | Visualizar detalles de un árbol |
| **Descripción** | El usuario podrá visualizar toda la información detallada de un árbol específico incluyendo fotos, ubicación en mapa, datos de seguimiento, predicción de salud y recomendaciones. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe existir en el sistema. |
| **Postcondición** | Se muestra la vista detallada con toda la información disponible del árbol. |
| **Criterio de aceptación** | ✓ Se muestran todas las fotos del árbol<br>✓ Se visualiza la ubicación exacta en el mapa<br>✓ Se muestran datos de seguimiento histórico<br>✓ Se muestra predicción de supervivencia (%)<br>✓ Se muestran recomendaciones de cuidado<br>✓ Se muestra información del propietario/registrador |

---

## **MÓDULO 3: GEOLOCALIZACIÓN Y MAPA**

### RF-011: Visualizar mapa interactivo de árboles

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-011 |
| **Nombre** | Visualizar mapa interactivo de árboles |
| **Descripción** | El usuario podrá visualizar un mapa interactivo que muestra la ubicación de todos los árboles registrados. El mapa permitirá zoom, pan y visualización de información básica al pasar el cursor. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | Debe haber árboles registrados con ubicación geográfica. |
| **Postcondición** | Se visualiza el mapa con marcadores de todos los árboles. |
| **Criterio de aceptación** | ✓ El mapa se centra en la ciudad de Piura<br>✓ Se muestran marcadores para cada árbol<br>✓ Los marcadores tienen diferentes colores según estado de salud<br>✓ Se puede hacer zoom y pan libremente<br>✓ Al pasar el cursor sobre un marcador se muestra información básica<br>✓ Al hacer clic en un marcador se abre la vista detallada del árbol |

---

### RF-012: Filtrar árboles en el mapa

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-012 |
| **Nombre** | Filtrar árboles en el mapa |
| **Descripción** | El usuario podrá filtrar los árboles mostrados en el mapa por criterios como especie, estado de salud, rango de edad y propietario. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El mapa debe estar visible con árboles. |
| **Postcondición** | Solo se muestran en el mapa los árboles que cumplen los criterios de filtro. |
| **Criterio de aceptación** | ✓ Se pueden seleccionar múltiples filtros simultáneamente<br>✓ Los filtros se aplican en tiempo real<br>✓ Se muestra el número de árboles mostrados vs totales<br>✓ Se pueden limpiar todos los filtros de una vez<br>✓ Se mantienen los filtros activos al navegar |

---

### RF-013: Seleccionar ubicación en mapa para nuevo árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-013 |
| **Nombre** | Seleccionar ubicación en mapa para nuevo árbol |
| **Descripción** | Al registrar un nuevo árbol, el usuario podrá hacer clic en un punto del mapa para seleccionar automáticamente las coordenadas geográficas. El sistema mostrará las coordenadas precisas. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario está en el formulario de registro de árbol. |
| **Postcondición** | Las coordenadas geográficas se capturan automáticamente. |
| **Criterio de aceptación** | ✓ Se puede hacer clic en cualquier punto del mapa<br>✓ Se muestran las coordenadas (latitud, longitud) con precisión de 6 decimales<br>✓ El punto seleccionado se marca visualmente en el mapa<br>✓ Se puede cambiar la ubicación haciendo clic en otro punto<br>✓ Se puede ingresar coordenadas manualmente |

---

### RF-014: Obtener ubicación actual del dispositivo

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-014 |
| **Nombre** | Obtener ubicación actual del dispositivo |
| **Descripción** | El usuario podrá autorizar que el sistema acceda a la ubicación GPS del dispositivo para establecer automáticamente la ubicación al registrar o editar un árbol. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El dispositivo debe tener GPS habilitado y el usuario debe otorgar permisos. |
| **Postcondición** | Las coordenadas del dispositivo se capturan y se usan como ubicación del árbol. |
| **Criterio de aceptación** | ✓ Se solicita permiso al usuario antes de acceder a GPS<br>✓ La precisión es de ±10 metros<br>✓ Se muestra un indicador de precisión GPS<br>✓ Se puede usar esta ubicación como punto de partida<br>✓ Se permite ajustar la ubicación después de capturarla |

---

## **MÓDULO 4: DATOS AMBIENTALES Y CLIMA**

### RF-015: Obtener datos climáticos de ubicación

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-015 |
| **Nombre** | Obtener datos climáticos de ubicación |
| **Descripción** | El sistema obtendrá automáticamente datos climáticos reales de la ubicación del árbol consumiendo la API de Open-Meteo. Se capturan: temperatura actual, humedad, precipitación, velocidad del viento y radiación solar. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Sistema |
| **Precondición** | El árbol debe tener ubicación geográfica válida. |
| **Postcondición** | Los datos climáticos se almacenan y están disponibles para análisis. |
| **Criterio de aceptación** | ✓ Se obtienen datos de temperatura, humedad, precipitación<br>✓ Los datos se actualizan cada 6 horas<br>✓ Se maneja correctamente el caso de error en API<br>✓ Se almacena histórico de datos climáticos<br>✓ Los datos se muestran con unidades de medida claras (°C, %) |

---

### RF-016: Visualizar datos climáticos en detalle de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-016 |
| **Nombre** | Visualizar datos climáticos en detalle de árbol |
| **Descripción** | En la vista detallada de un árbol, el usuario podrá visualizar los datos climáticos actuales y el histórico en gráficos para analizar tendencias. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe tener datos climáticos disponibles. |
| **Postcondición** | Se visualizan datos climáticos en formato de tablas y gráficos. |
| **Criterio de aceptación** | ✓ Se muestra la temperatura actual y promedio<br>✓ Se muestra humedad y precipitación<br>✓ Se muestran gráficos de tendencias (últimos 7, 30, 90 días)<br>✓ Se puede descargar un reporte de datos climáticos<br>✓ Los gráficos son responsivos |

---

### RF-017: Página de clima general del sistema

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-017 |
| **Nombre** | Página de clima general del sistema |
| **Descripción** | El usuario podrá acceder a una página que muestra datos climáticos generales de la ciudad de Piura incluyendo temperatura, humedad, precipitación, índice UV y pronóstico. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El sistema debe tener acceso a la API de clima. |
| **Postcondición** | Se visualiza la información climática actualizada de Piura. |
| **Criterio de aceptación** | ✓ Se muestra clima actual con icono representativo<br>✓ Se muestra pronóstico de 7 días<br>✓ Se muestran alertas de clima extremo<br>✓ Se actualiza cada 30 minutos<br>✓ Se muestra la fuente de datos (Open-Meteo) |

---

## **MÓDULO 5: INTELIGENCIA ARTIFICIAL Y PREDICCIONES**

### RF-018: Predecir supervivencia de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-018 |
| **Nombre** | Predecir supervivencia de árbol |
| **Descripción** | El sistema utilizará un modelo de IA para predecir el porcentaje de supervivencia de un árbol basándose en especie, condiciones climáticas, datos de seguimiento histórico y características del entorno. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Sistema |
| **Precondición** | El árbol debe tener datos suficientes (especie, ubicación, clima). |
| **Postcondición** | Se calcula y almacena un índice de supervivencia (0-100%). |
| **Criterio de aceptación** | ✓ La predicción considera: especie, clima, edad, datos de seguimiento<br>✓ La predicción se actualiza cada vez que hay nuevos datos<br>✓ Se muestra con indicador visual (verde/amarillo/rojo)<br>✓ Se muestra el nivel de confianza del modelo<br>✓ Se permite ver los factores que más influyen en la predicción |

---

### RF-019: Generar recomendaciones de cuidado

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-019 |
| **Nombre** | Generar recomendaciones de cuidado |
| **Descripción** | El sistema generará recomendaciones personalizadas para el cuidado de cada árbol basándose en su especie, estado de salud, datos climáticos y predicciones de IA. Las recomendaciones incluyen: frecuencia de riego, exposición al sol, plagas comunes y tratamientos. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Sistema |
| **Precondición** | El árbol debe tener especie y ubicación definidas. |
| **Postcondición** | Se generan recomendaciones que están disponibles en la vista del árbol. |
| **Criterio de aceptación** | ✓ Se recomiendan frecuencias de riego según clima<br>✓ Se recomiendan niveles óptimos de luz solar<br>✓ Se alertan sobre plagas comunes de la especie<br>✓ Se recomiendan tratamientos preventivos<br>✓ Las recomendaciones se actualizan semanalmente<br>✓ Se pueden marcar recomendaciones como completadas |

---

### RF-020: Identificar especie de árbol por foto

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-020 |
| **Nombre** | Identificar especie de árbol por foto |
| **Descripción** | El usuario podrá cargar una foto de un árbol o sus hojas. El sistema utilizará un modelo de visión computacional para identificar automáticamente la especie. El usuario podrá confirmar o corregir la identificación. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe proporcionar una foto clara del árbol u hojas. |
| **Postcondición** | La especie se identifica automáticamente con una confianza asociada. |
| **Criterio de aceptación** | ✓ Se pueden cargar fotos en JPG, PNG o WebP<br>✓ Se retorna la especie más probable con % de confianza<br>✓ Se retornan 3 opciones alternativas<br>✓ El usuario puede confirmar o corregir la identificación<br>✓ Los errores se usan para mejorar el modelo<br>✓ El tiempo de respuesta es menor a 5 segundos |

---

## **MÓDULO 6: SEGUIMIENTO Y MONITOREO**

### RF-021: Registrar seguimiento de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-021 |
| **Nombre** | Registrar seguimiento de árbol |
| **Descripción** | El usuario podrá registrar seguimientos periódicos de un árbol registrando: fotos del estado actual, medidas (altura, diámetro), observaciones, estado de salud, presencia de plagas y acciones de mantenimiento realizadas. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe existir en el sistema. |
| **Postcondición** | El seguimiento es registrado y almacenado en el historial del árbol. |
| **Criterio de aceptación** | ✓ Se captura fecha, hora y ubicación del seguimiento<br>✓ Se pueden cargar mínimo 1 foto del estado actual<br>✓ Se registran medidas: altura, diámetro<br>✓ Se selecciona estado de salud (excelente/bueno/regular/malo)<br>✓ Se pueden registrar observaciones libres<br>✓ Se pueden indicar acciones de mantenimiento<br>✓ El seguimiento se muestra en el historial del árbol |

---

### RF-022: Visualizar historial de seguimientos

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-022 |
| **Nombre** | Visualizar historial de seguimientos |
| **Descripción** | El usuario podrá visualizar todos los seguimientos registrados de un árbol en orden cronológico inverso (más reciente primero), con opción de ver detalles, fotos y comparar cambios en el tiempo. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe tener al menos un seguimiento registrado. |
| **Postcondición** | Se visualiza el historial con todos los detalles de cada seguimiento. |
| **Criterio de aceptación** | ✓ Los seguimientos se muestran en orden cronológico<br>✓ Se muestran fotos en miniatura para cada seguimiento<br>✓ Se puede expandir cada seguimiento para ver detalles completos<br>✓ Se muestra evolución de medidas (gráficos)<br>✓ Se puede descargar reporte de seguimientos |

---

### RF-023: Programar recordatorios de mantenimiento

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-023 |
| **Nombre** | Programar recordatorios de mantenimiento |
| **Descripción** | El usuario podrá programar recordatorios automáticos para tareas de mantenimiento del árbol (riego, poda, aplicación de tratamientos). El sistema enviará notificaciones según la frecuencia establecida. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe estar registrado en el sistema. |
| **Postcondición** | Los recordatorios están programados y se envían según lo especificado. |
| **Criterio de aceptación** | ✓ Se pueden crear recordatorios con descripción<br>✓ Se puede establecer frecuencia (única, diaria, semanal, mensual)<br>✓ Se puede fijar una hora específica para el recordatorio<br>✓ Se envían notificaciones por email y dentro del sistema<br>✓ El usuario puede editar o eliminar recordatorios<br>✓ Se puede marcar una tarea como completada |

---

## **MÓDULO 7: ANALÍTICA Y REPORTES**

### RF-024: Dashboard con estadísticas generales

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-024 |
| **Nombre** | Dashboard con estadísticas generales |
| **Descripción** | El usuario verá un dashboard al iniciar sesión que muestre estadísticas generales del sistema: total de árboles, árboles por estado de salud, especies más comunes, cobertura geográfica, salud promedio del sistema. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | Debe haber datos en el sistema. |
| **Postcondición** | Se visualiza el dashboard con todas las métricas. |
| **Criterio de aceptación** | ✓ Se muestran tarjetas con KPIs principales<br>✓ Se muestran gráficos de distribución por especie<br>✓ Se muestra mapa de distribución geográfica<br>✓ Se muestran tendencias (últimos 30 días)<br>✓ Los datos se actualizan en tiempo real<br>✓ El dashboard es responsivo |

---

### RF-025: Reportes personalizados por usuario

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-025 |
| **Nombre** | Reportes personalizados por usuario |
| **Descripción** | El usuario podrá generar reportes personalizados de sus árboles registrados con filtros por especie, ubicación, período de tiempo y métricas específicas. Los reportes pueden exportarse en PDF o Excel. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe tener árboles registrados. |
| **Postcondición** | Se genera y descarga un reporte con el formato solicitado. |
| **Criterio de aceptación** | ✓ Se pueden seleccionar filtros: especie, ubicación, período<br>✓ Se generan reportes en PDF y Excel<br>✓ Los reportes incluyen: lista de árboles, métricas de salud, seguimientos, recomendaciones<br>✓ Se incluyen gráficos y visualizaciones<br>✓ Los reportes tienen encabezado y pie profesionales |

---

### RF-026: Análisis de tendencias de salud

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-026 |
| **Nombre** | Análisis de tendencias de salud |
| **Descripción** | El sistema mostrará análisis de tendencias en la salud de los árboles a nivel individual y agregado, identificando patrones, factores de riesgo y oportunidades de mejora mediante gráficos interactivos. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | Debe haber datos históricos de seguimiento. |
| **Postcondición** | Se visualizan gráficos de tendencias y análisis. |
| **Criterio de aceptación** | ✓ Se muestran gráficos de evolución de salud (30, 90, 365 días)<br>✓ Se identifican patrones estacionales<br>✓ Se correlaciona salud con datos climáticos<br>✓ Se muestran factores de riesgo principales<br>✓ Los gráficos son interactivos (zoom, hover) |

---

## **MÓDULO 8: NOTIFICACIONES Y ALERTAS**

### RF-027: Sistema de alertas de salud crítica

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-027 |
| **Nombre** | Sistema de alertas de salud crítica |
| **Descripción** | El sistema generará alertas automáticas cuando un árbol alcance estado crítico (supervivencia < 30%), presencia confirmada de plagas graves o cambios drásticos en las medidas. Las alertas se enviarán por email y notificación dentro del sistema. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Sistema |
| **Precondición** | El árbol debe alcanzar una condición de alerta. |
| **Postcondición** | Se envía alerta al propietario del árbol. |
| **Criterio de aceptación** | ✓ Las alertas se envían en tiempo real<br>✓ Se envían notificaciones por email y en sistema<br>✓ Las alertas incluyen razón específica del problema<br>✓ Las alertas incluyen recomendaciones de acción<br>✓ El usuario puede configurar nivel de sensibilidad de alertas |

---

### RF-028: Notificaciones de tareas programadas

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-028 |
| **Nombre** | Notificaciones de tareas programadas |
| **Descripción** | El usuario recibirá notificaciones (email y en sistema) antes de tareas programadas de mantenimiento (riego, poda, inspección) según la configuración establecida. Las notificaciones pueden ser enviadas 1 día antes, 1 hora antes o el mismo día. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Sistema |
| **Precondición** | Debe haber recordatorios programados en el sistema. |
| **Postcondición** | Se envían notificaciones según la programación. |
| **Criterio de aceptación** | ✓ Las notificaciones se envían en el momento correcto<br>✓ El usuario puede configurar preferencias de notificación<br>✓ Se pueden silenciar notificaciones temporalmente<br>✓ Las notificaciones incluyen detalles de la tarea |

---

## **MÓDULO 9: BENEFICIOS AMBIENTALES**

### RF-029: Calcular beneficios ambientales de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-029 |
| **Nombre** | Calcular beneficios ambientales de árbol |
| **Descripción** | El sistema calculará automáticamente los beneficios ambientales que proporciona cada árbol incluyendo: CO2 capturado anualmente, oxígeno producido, agua infiltrada en suelo, y valor económico aproximado del árbol. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Sistema |
| **Precondición** | El árbol debe tener especie definida. |
| **Postcondición** | Se calculan y almacenan beneficios ambientales del árbol. |
| **Criterio de aceptación** | ✓ Se calcula CO2 capturado (kg/año)<br>✓ Se calcula O2 producido (kg/año)<br>✓ Se calcula agua infiltrada (litros/año)<br>✓ Se calcula valor económico aproximado<br>✓ Los valores se actualizan anualmente<br>✓ Se pueden comparar beneficios entre árboles |

---

### RF-030: Visualizar página de beneficios

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-030 |
| **Nombre** | Visualizar página de beneficios |
| **Descripción** | El usuario podrá acceder a una página que visualiza de forma clara y atractiva los beneficios ambientales acumulados de todos sus árboles con comparativas y visualizaciones impactantes. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe tener árboles registrados. |
| **Postcondición** | Se visualiza la página con beneficios agregados. |
| **Criterio de aceptación** | ✓ Se muestra CO2 total capturado<br>✓ Se muestra O2 total producido<br>✓ Se muestra agua total infiltrada<br>✓ Se muestran equivalencias impactantes (ej: "equivalente a X viajes en auto")<br>✓ Se comparan beneficios con otros usuarios (anónimo)<br>✓ Se muestra el impacto acumulado año a año |

---

## **MÓDULO 10: ADMINISTRACIÓN DEL SISTEMA**

### RF-031: Panel administrativo

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-031 |
| **Nombre** | Panel administrativo |
| **Descripción** | Un usuario con rol de administrador podrá acceder a un panel administrativo exclusivo que permita: gestionar usuarios (crear, editar, eliminar, cambiar roles), ver estadísticas del sistema, gestionar contenido (especies, tratamientos), y auditar actividades. |
| **Prioridad (MoSCoW)** | Must Have |
| **Actor principal** | Administrador del sistema |
| **Precondición** | El usuario debe tener rol de administrador. |
| **Postcondición** | Se accede al panel administrativo con todas las funcionalidades. |
| **Criterio de aceptación** | ✓ Solo usuarios admin pueden acceder<br>✓ Se puede gestionar usuarios (CRUD)<br>✓ Se muestra log de auditoría de cambios<br>✓ Se pueden cambiar roles de usuarios<br>✓ Se puede ver estadísticas del sistema<br>✓ Se puede gestionar contenido (especies, tratamientos) |

---

### RF-032: Gestión de roles y permisos

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-032 |
| **Nombre** | Gestión de roles y permisos |
| **Descripción** | El administrador podrá crear, editar y eliminar roles de usuario con permisos específicos. Los roles predefinidos serán: Administrador, Usuario Regular, Especialista Ambiental. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Administrador del sistema |
| **Precondición** | El usuario debe ser administrador. |
| **Postcondición** | Los roles y permisos son configurados según necesidad. |
| **Criterio de aceptación** | ✓ Se pueden crear roles personalizados<br>✓ Se pueden asignar permisos granulares<br>✓ Se pueden reasignar roles a usuarios<br>✓ Los cambios de permisos se aplican inmediatamente<br>✓ Se mantiene auditoría de cambios de roles |

---

### RF-033: Auditoría del sistema

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-033 |
| **Nombre** | Auditoría del sistema |
| **Descripción** | El administrador podrá visualizar un log de auditoría completo de todas las acciones importantes del sistema: creación/edición/eliminación de árboles, cambios de datos de usuario, cambios de acceso y generación de reportes. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Administrador del sistema |
| **Precondición** | El usuario debe ser administrador. |
| **Postcondición** | Se visualiza el log de auditoría filtrable. |
| **Criterio de aceptación** | ✓ Se registra: acción, usuario, fecha, hora, objeto afectado<br>✓ Se pueden filtrar por usuario, tipo de acción, fecha<br>✓ Se pueden exportar logs en CSV<br>✓ Se mantienen logs por mínimo 1 año<br>✓ Se muestra cambio antes y después de ediciones |

---

## **MÓDULO 11: CARACTERÍSTICAS AVANZADAS**

### RF-034: Sistema de búsqueda avanzada

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-034 |
| **Nombre** | Sistema de búsqueda avanzada |
| **Descripción** | El usuario podrá realizar búsquedas avanzadas en el sistema combinando múltiples criterios: especie, rango de edad, rango de medidas, estado de salud, ubicación geográfica (por radio), propietario y otros metadatos. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | Debe haber árboles en el sistema. |
| **Postcondición** | Se retornan resultados que coinciden con todos los criterios. |
| **Criterio de aceptación** | ✓ Se pueden combinar múltiples filtros<br>✓ La búsqueda es rápida (< 2 segundos)<br>✓ Se muestra número de resultados<br>✓ Se pueden guardar búsquedas frecuentes<br>✓ Se puede ordenar resultados por relevancia |

---

### RF-035: Exportar datos de árbol

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-035 |
| **Nombre** | Exportar datos de árbol |
| **Descripción** | El usuario podrá exportar los datos completos de un árbol (información básica, seguimientos, fotos, datos climáticos) en formatos JSON o CSV para análisis externo. |
| **Prioridad (MoSCoW)** | Should Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El árbol debe existir y tener datos. |
| **Postcondición** | Se genera y descarga archivo con los datos. |
| **Criterio de aceptación** | ✓ Se pueden exportar en JSON y CSV<br>✓ Se incluyen todos los datos disponibles<br>✓ Se incluyen URLs de fotos<br>✓ El archivo es bien estructurado<br>✓ La descarga es segura (HTTPS) |

---

### RF-036: Integración con redes sociales

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-036 |
| **Nombre** | Integración con redes sociales |
| **Descripción** | El usuario podrá compartir información de sus árboles en redes sociales (Facebook, Twitter, Instagram) con una foto y descripción atractiva que incluya beneficios ambientales. |
| **Prioridad (MoSCoW)** | Could Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe estar autenticado. |
| **Postcondición** | Se abre la aplicación de red social para compartir. |
| **Criterio de aceptación** | ✓ Se genera preview atractivo del árbol<br>✓ Se incluyen hashtags relevantes<br>✓ Se incluye enlace al árbol en el sistema<br>✓ Se registra el compartido en auditoría<br>✓ Se cuentan compartidos en estadísticas del árbol |

---

### RF-037: Gamificación - Sistema de logros

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-037 |
| **Nombre** | Gamificación - Sistema de logros |
| **Descripción** | El usuario acumulará logros por actividades (registrar 5 árboles, mantener un árbol saludable por 6 meses, identificar 10 especies diferentes, etc.). Los logros se mostrarán en su perfil y se asignarán insignias. |
| **Prioridad (MoSCoW)** | Could Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe realizar acciones en el sistema. |
| **Postcondición** | Se desbloquean logros y se muestran insignias. |
| **Criterio de aceptación** | ✓ Se definen 15+ logros diferentes<br>✓ Los logros se desbloquean automáticamente<br>✓ Se muestran en el perfil del usuario<br>✓ Se comparten en redes sociales<br>✓ Se otorgan puntos por cada logro |

---

### RF-038: Sistema de puntos y ranking

| Campo | Descripción |
|-------|-------------|
| **ID** | RF-038 |
| **Nombre** | Sistema de puntos y ranking |
| **Descripción** | El sistema asignará puntos a los usuarios por actividades (registrar árboles, hacer seguimientos, identificaciones correctas). Se mantendrá un ranking público de "guardianes del árbol" mostrando top 10 usuarios. |
| **Prioridad (MoSCoW)** | Could Have |
| **Actor principal** | Usuario autenticado |
| **Precondición** | El usuario debe realizar actividades en el sistema. |
| **Postcondición** | Se acumulan puntos y se actualiza el ranking. |
| **Criterio de aceptación** | ✓ Se asignan puntos por: registros, seguimientos, identificaciones<br>✓ Se muestra tabla de ranking top 10<br>✓ Se muestra posición del usuario actual<br>✓ El ranking se actualiza diariamente<br>✓ Se pueden ver detalles de puntuación por actividad |

---

## 📊 RESUMEN DE REQUERIMIENTOS

### Distribución por Módulo

| Módulo | Cantidad de RF | Criticidad |
|--------|---|---|
| Autenticación y Usuarios | 5 | ALTA |
| Gestión de Árboles | 5 | ALTA |
| Geolocalización y Mapa | 4 | ALTA |
| Datos Ambientales | 3 | ALTA |
| IA y Predicciones | 3 | MEDIA |
| Seguimiento y Monitoreo | 3 | ALTA |
| Analítica y Reportes | 3 | MEDIA |
| Notificaciones y Alertas | 2 | MEDIA |
| Beneficios Ambientales | 2 | MEDIA |
| Administración | 3 | MEDIA |
| Características Avanzadas | 5 | BAJA |
| **TOTAL** | **38 REQUERIMIENTOS** | **-** |

---

### Distribución por Prioridad (MoSCoW)

| Prioridad | Cantidad | % |
|-----------|----------|---|
| **Must Have** | 20 | 52.6% |
| **Should Have** | 12 | 31.6% |
| **Could Have** | 5 | 13.2% |
| **Won't Have** | 1 | 2.6% |
| **TOTAL** | **38** | **100%** |

---

## 📝 NOTAS IMPORTANTES

1. **Fases de Implementación**:
   - **FASE 1**: RF-001 a RF-014 (Core del sistema)
   - **FASE 2**: RF-015 a RF-023 (Datos e Inteligencia)
   - **FASE 3**: RF-024 a RF-033 (Analítica y Admin)
   - **FASE 4**: RF-034 a RF-038 (Características Avanzadas)

2. **Actores del Sistema**:
   - Usuario Anónimo
   - Usuario Registrado
   - Usuario Autenticado
   - Especialista Ambiental
   - Administrador del Sistema

3. **Consideraciones de Seguridad**:
   - Todos los accesos deben validar autenticación con JWT
   - Implementar control de acceso por roles (RBAC)
   - Auditar todas las acciones críticas
   - Encriptar datos sensibles

4. **Consideraciones de Performance**:
   - Los reportes deben generarse asincronamente
   - Las predicciones de IA deben cachearse
   - El mapa debe cargar dinamáticamente solo árboles visibles
   - Las notificaciones deben usar sistema de colas

---

# 🔧 FASE 05: ANÁLISIS DE REQUERIMIENTOS NO FUNCIONALES

## 📋 REQUERIMIENTOS NO FUNCIONALES

### TABLA CONSOLIDADA DE RNF

| Categoría | ID | Descripción | Criterio de aceptación |
|-----------|-----|-------------|----------|
| **Rendimiento** | RNF-001 | El sistema deberá procesar el inicio de sesión en un tiempo menor o igual a 2 segundos con hasta 500 usuarios concurrentes. | En pruebas de carga, el tiempo de respuesta promedio del login no supera los 2 segundos con 500 usuarios simultáneos. |
| **Rendimiento** | RNF-002 | La carga del mapa interactivo con 500 árboles no deberá exceder 3 segundos. | El tiempo de carga inicial del mapa está entre 1.5 y 3 segundos, medido desde la solicitud hasta la renderización completa. |
| **Rendimiento** | RNF-003 | La generación de predicciones de IA deberá completarse en máximo 5 segundos por árbol. | Las predicciones se entregan al usuario dentro del tiempo especificado con modelo de confianza > 85%. |
| **Rendimiento** | RNF-004 | Las búsquedas avanzadas deberán retornar resultados en máximo 2 segundos incluso con 10,000 registros. | Las consultas a base de datos se optimizan mediante índices y caché, garantizando respuestas rápidas. |
| **Rendimiento** | RNF-005 | El envío de notificaciones deberá procesarse dentro de 30 segundos después del evento que las genera. | Las notificaciones llegan al usuario máximo 30 segundos después de que ocurra el evento disparador. |
| **Disponibilidad** | RNF-006 | El sistema deberá estar disponible al menos el 99.5% del tiempo mensual, excluyendo mantenimientos programados. | El tiempo total de inactividad no supera las 3.6 horas al mes. Se monitorea mediante uptime checking cada 5 minutos. |
| **Disponibilidad** | RNF-007 | El sistema deberá soportar mantenimiento preventivo con máximo 4 horas de inactividad programada por mes. | Los mantenimientos se realizan con preaviso de al menos 1 semana a los usuarios. |
| **Disponibilidad** | RNF-008 | El tiempo de recuperación ante fallos (RTO) deberá ser menor a 15 minutos. | Ante un fallo crítico, el sistema se recupera automáticamente en máximo 15 minutos sin intervención manual. |
| **Disponibilidad** | RNF-009 | El objetivo de punto de recuperación (RPO) deberá ser máximo 1 hora. | La pérdida de datos en caso de fallo crítico no superará 1 hora de actividad. |
| **Seguridad** | RNF-010 | Las contraseñas de los usuarios deberán almacenarse utilizando bcrypt con salt de al menos 12 rondas. | No existen contraseñas almacenadas en texto plano en la base de datos. Auditoría confirma uso de bcrypt. |
| **Seguridad** | RNF-011 | Todas las comunicaciones entre cliente y servidor deberán usar HTTPS con certificado SSL/TLS válido. | El certificado SSL/TLS es válido y reconocido por navegadores modernos. Se fuerza HTTPS en todas las conexiones. |
| **Seguridad** | RNF-012 | El sistema deberá implementar autenticación multifactor (MFA) opcional para todos los usuarios. | Los usuarios pueden habilitar MFA usando autenticadores de tiempo (TOTP) o email. |
| **Seguridad** | RNF-013 | Los tokens JWT deberán expirar automáticamente después de 24 horas sin actividad. | El token se invalida tras 24 horas. El usuario debe autenticarse nuevamente. |
| **Seguridad** | RNF-014 | Las fotos y documentos de usuarios deberán almacenarse en almacenamiento cifrado. | Los archivos se almacenan con cifrado AES-256 en servidor o cloud storage seguro. |
| **Seguridad** | RNF-015 | El sistema deberá validar y sanitizar todas las entradas del usuario para prevenir inyecciones SQL y XSS. | Las pruebas de seguridad confirman resistencia a ataques comunes (OWASP Top 10). |
| **Seguridad** | RNF-016 | El sistema deberá registrar todos los accesos y cambios críticos en un log de auditoría inmutable. | Se registra: usuario, acción, fecha, hora, IP, resultado. Los logs no pueden ser eliminados. |
| **Seguridad** | RNF-017 | Cada rol de usuario tendrá permisos específicos granulares siguiendo principio de menor privilegio. | Los permisos se validan en backend. Un usuario solo accede a datos autorizados. |
| **Usabilidad** | RNF-018 | Un usuario con conocimientos básicos de informática deberá poder registrar un árbol en menos de 5 minutos sin asistencia. | En pruebas de usabilidad, al menos el 85% de usuarios completa el registro en el tiempo establecido. |
| **Usabilidad** | RNF-019 | La interfaz del sistema deberá ser responsive y funcionar correctamente en dispositivos móviles (celulares y tablets). | Se verifica funcionamiento en pantallas desde 320px (celular) hasta 1920px (desktop). |
| **Usabilidad** | RNF-020 | El sistema deberá tener un tiempo de aprendizaje máximo de 2 horas para un usuario nuevo. | Tutoriales interactivos y documentación guían al usuario. El 90% se siente cómodo tras 2 horas. |
| **Usabilidad** | RNF-021 | La aplicación deberá cumplir con estándares de accesibilidad WCAG 2.1 nivel AA. | Auditoría de accesibilidad confirma cumplimiento con navegación por teclado, contraste adecuado, etc. |
| **Usabilidad** | RNF-022 | El sistema deberá soportar idiomas: Español, Inglés y Portugués. | La interfaz completa está disponible en los tres idiomas con traducción contextual. |
| **Mantenibilidad** | RNF-023 | El código fuente deberá tener cobertura de pruebas unitarias de al menos el 80%. | Herramientas de análisis (Jest, Codecov) reportan cobertura igual o superior al 80%. |
| **Mantenibilidad** | RNF-024 | El sistema deberá contar con pruebas de integración que cubran todos los flujos críticos. | Se ejecutan pruebas automatizadas en cada commit. La cobertura de integración es ≥ 70%. |
| **Mantenibilidad** | RNF-025 | El código deberá seguir estándares de codificación documentados y validarse mediante linters (ESLint, Prettier). | El CI/CD rechaza commits que no cumplan estándares. Se realiza code review antes de merge. |
| **Mantenibilidad** | RNF-026 | La documentación del sistema deberá actualizarse con cada cambio significativo en el código. | Se mantiene documentación de API, arquitectura y procedimientos de deployment actualizados. |
| **Mantenibilidad** | RNF-027 | El sistema deberá usar control de versiones Git con ramificación clara (main, develop, feature/*). | El repositorio sigue el flujo de trabajo gitflow. Historial es completo y trazable. |
| **Portabilidad** | RNF-028 | El sistema deberá ser accesible desde navegadores web modernos: Chrome ≥110, Firefox ≥109, Safari ≥16, Edge ≥110. | Todas las funcionalidades operan correctamente en los navegadores y versiones especificadas. |
| **Portabilidad** | RNF-029 | El backend deberá ejecutarse en plataformas Linux, Windows y macOS. | Se prueba deployment en los tres sistemas operativos. |
| **Portabilidad** | RNF-030 | El sistema deberá ser deployable en arquitecturas cloud (AWS, Google Cloud, Azure) y on-premise. | Se documentan procesos de deployment para múltiples plataformas. Se realiza prueba mínima en 2 plataformas. |
| **Confiabilidad** | RNF-031 | El sistema deberá realizar copias de seguridad automáticas de la base de datos cada 12 horas. | Se generan y almacenan backups verificables dos veces al día en almacenamiento redundante. |
| **Confiabilidad** | RNF-032 | Los backups deberán verificarse automáticamente y alertar si fallan. | Cada backup se valida. Se envía alerta a administrador si verificación falla. |
| **Confiabilidad** | RNF-033 | Se deberá realizar prueba de recuperación de backup mensualmente. | Cada mes se restaura un backup en ambiente de prueba para confirmar integridad. |
| **Confiabilidad** | RNF-034 | El sistema deberá detectar y notificar errores o anomalías en menos de 5 minutos. | Monitoreo continuo. Alertas se envían automáticamente a equipo técnico ante errores. |
| **Confiabilidad** | RNF-035 | La tasa de error del sistema no deberá superar el 0.1% de transacciones. | Se monitorean métricas. Los errores se investigan y corrigen rápidamente. |
| **Escalabilidad** | RNF-036 | El sistema deberá soportar al menos 1,000 usuarios registrados simultáneamente sin degradación significativa. | En pruebas de carga con 1,000 usuarios, tiempos de respuesta permanecen ≤ 3 segundos. |
| **Escalabilidad** | RNF-037 | La arquitectura deberá permitir crecimiento horizontal: agregar servidores sin redesign. | La aplicación usa load balancing y base de datos distribuida para escalabilidad. |
| **Escalabilidad** | RNF-038 | El sistema deberá soportar almacenamiento de al menos 100,000 registros de árboles. | Base de datos optimizada con índices. Consultas mantienen performance con datasets grandes. |
| **Escalabilidad** | RNF-039 | El almacenamiento de fotos deberá usar CDN para distribución global y caché. | Las fotos se sirven desde CDN. Tiempo de descarga optimizado globalmente. |
| **Compatibilidad** | RNF-040 | El sistema deberá integrarse con APIs externas (Open-Meteo, Google Maps, servicios de identificación). | Las integraciones funcionan correctamente. Se manejan errores de API externos gracefully. |
| **Compatibilidad** | RNF-041 | El sistema deberá ser compatible con servicios de autenticación OAuth 2.0 (Google, Facebook, GitHub). | Los usuarios pueden autenticarse usando proveedores OAuth. Se sincroniza perfil correctamente. |
| **Compatibilidad** | RNF-042 | El sistema deberá generar reportes exportables en formatos: PDF, Excel (XLSX), CSV. | Los reportes se generan correctamente en todos los formatos con formato y estructura completa. |
| **Internacionalización** | RNF-043 | El sistema deberá soportar diferentes monedas según la ubicación del usuario (USD, PEN, EUR, BRL). | Los cálculos de beneficios ambientales se muestran en la moneda local del usuario. |
| **Internacionalización** | RNF-044 | Las fechas y horas deberán adaptarse a la zona horaria del usuario. | El sistema detecta o permite seleccionar zona horaria. Fechas se muestran en formato local. |
| **Internacionalización** | RNF-045 | El contenido deberá ser culturalmente apropiado y evitar sesgos respecto a especies de árboles locales. | Revisión de contenido por especialistas locales. Se respetan convenciones locales. |
| **Recuperación ante Desastres** | RNF-046 | Deberá existir un plan documentado de recuperación ante desastres (DRP) con procedimientos claros. | El DRP está documentado, versionado y comunicado al equipo. Se revisa trimestralmente. |
| **Recuperación ante Desastres** | RNF-047 | Se deberán realizar simulacros de recuperación ante desastres al menos semestralmente. | Se ejecutan drills programados. Tiempo de recuperación real se prueba y documenta. |
| **Compliance y Regulación** | RNF-048 | El sistema deberá cumplir con normativas de protección de datos: GDPR, CCPA, LGPD (Ley General de Protección de Datos). | Se implementan derechos de usuario: acceso, portabilidad, eliminación. Auditoría confirma cumplimiento. |
| **Compliance y Regulación** | RNF-049 | El sistema deberá permitir a usuarios solicitar y descargar todos sus datos personales en formato estándar. | Existe opción "Descargar mis datos" en perfil. Se genera archivo JSON con toda la información. |
| **Compliance y Regulación** | RNF-050 | El sistema deberá permitir a usuarios solicitar eliminación de datos (derecho al olvido). | Existe opción para eliminar permanentemente cuenta y datos asociados con confirmación. |

---

## 📊 RESUMEN DE REQUERIMIENTOS NO FUNCIONALES

### Distribución por Categoría

| Categoría | Cantidad | % |
|-----------|----------|---|
| **Rendimiento** | 5 | 10.0% |
| **Disponibilidad** | 4 | 8.0% |
| **Seguridad** | 8 | 16.0% |
| **Usabilidad** | 5 | 10.0% |
| **Mantenibilidad** | 5 | 10.0% |
| **Portabilidad** | 3 | 6.0% |
| **Confiabilidad** | 5 | 10.0% |
| **Escalabilidad** | 4 | 8.0% |
| **Compatibilidad** | 3 | 6.0% |
| **Internacionalización** | 3 | 6.0% |
| **Recuperación ante Desastres** | 2 | 4.0% |
| **Compliance y Regulación** | 3 | 6.0% |
| **TOTAL** | **50 REQUERIMIENTOS** | **100%** |

---

### Críticos por Impacto

| Nivel de Criticidad | RNF | Justificación |
|-------------------|-----|---|
| **CRÍTICO** | RNF-006, RNF-010, RNF-011, RNF-031 | Disponibilidad del sistema, seguridad de datos y continuidad del negocio |
| **ALTO** | RNF-001, RNF-002, RNF-015, RNF-023, RNF-036 | Performance, seguridad del código y escalabilidad |
| **MEDIO** | RNF-018, RNF-019, RNF-028, RNF-040 | Experiencia del usuario y compatibilidad |
| **BAJO** | RNF-022, RNF-043, RNF-044 | Características de conveniencia |

---

## 📋 MÉTRICAS Y MONITOREO

### Indicadores de Desempeño (KPI)

| KPI | Métrica | Herramienta |
|-----|--------|-----------|
| Disponibilidad | 99.5% uptime | UptimeRobot, DataDog |
| Tiempo de respuesta | P95 < 2s | New Relic, CloudWatch |
| Cobertura de pruebas | ≥ 80% | Jest, Codecov |
| Error rate | < 0.1% | Sentry, ELK Stack |
| Page Load Time | < 3s (inicio) | Google Lighthouse, WebPageTest |
| CPU/Memoria | < 80% promedio | Prometheus, Grafana |

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Fases de Implementación de RNF

1. **FASE 1 (Sprint 1-2)**: Implementar seguridad (RNF-010, RNF-011, RNF-015, RNF-016) y disponibilidad básica
2. **FASE 2 (Sprint 3-4)**: Optimizar rendimiento (RNF-001 a RNF-005) y escalabilidad
3. **FASE 3 (Sprint 5-6)**: Implementar backup/recuperación (RNF-031 a RNF-035)
4. **FASE 4 (Sprint 7-8)**: Usabilidad, portabilidad, internacionalización
5. **FASE 5 (Ongoing)**: Compliance, monitoreo, mejora continua

### Stack Tecnológico Recomendado

- **Backend**: Node.js + Express / Next.js API Routes
- **Database**: PostgreSQL (confiabilidad) + Redis (cache)
- **Storage**: AWS S3 / Azure Blob Storage con CDN
- **Monitoring**: Datadog, New Relic o ELK Stack
- **CI/CD**: GitHub Actions, Jenkins o GitLab CI
- **Load Testing**: Apache JMeter, k6
- **Security**: OWASP ZAP, SonarQube

---

**Documento actualizado**: 19 de mayo de 2026  
**Versión**: 1.1  
**Estado**: Análisis Completo de Requerimientos Funcionales + No Funcionales
