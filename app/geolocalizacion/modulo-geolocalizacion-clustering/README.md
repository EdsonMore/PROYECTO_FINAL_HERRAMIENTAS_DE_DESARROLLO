# Módulo de Geolocalización con Clustering

## Descripción
Este módulo proporciona funcionalidad de clustering para mapas interactivos de geolocalización. Agrupa marcadores cercanos en clusters visuales que se expanden al hacer zoom.

## Características
- ✅ Agrupamiento automático de marcadores
- ✅ Códigos de color por estado de salud
- ✅ Cálculo de distancias en tiempo real
- ✅ Iconos personalizados
- ✅ Soporte completo para popups
- ✅ Optimización de rendimiento

## Estructura
```
modulo-geolocalizacion-clustering/
├── components/
│   └── MapClusteringComponent.tsx  # Componente principal del mapa
├── hooks/                           # Hooks personalizados (opcional)
├── utils/
│   └── clusterUtils.ts            # Utilidades de clustering
├── types.ts                         # Tipos TypeScript
└── index.ts                         # Exportaciones públicas
```

## Uso

```tsx
import { MapClusteringComponent } from "@/app/geolocalizacion/modulo-geolocalizacion-clustering";

export function MiComponente() {
  return (
    <MapClusteringComponent
      center={[-5.1946, -80.6307]}
      zoom={13}
      markers={[
        {
          lat: -5.1946,
          lng: -80.6307,
          popup: "<strong>Mi ubicación</strong>",
          healthStatus: "excelente"
        }
      ]}
      clusteringConfig={{
        maxClusterRadius: 80,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 15
      }}
    />
  );
}
```

## Props

### MapClusteringComponent

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `center` | `[number, number]` | Requerido | Centro inicial del mapa [lat, lng] |
| `zoom` | `number` | 13 | Zoom inicial |
| `markers` | `ClusterMarker[]` | [] | Array de marcadores |
| `onLocationSelect` | `(lat, lng) => void` | - | Callback al hacer click en el mapa |
| `clusteringConfig` | `ClusteringConfig` | {} | Configuración del clustering |
| `className` | `string` | "" | Clases CSS adicionales |

### ClusteringConfig

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `maxClusterRadius` | `number` | 80 | Radio máximo de clustering en píxeles |
| `showCoverageOnHover` | `boolean` | true | Mostrar área de cobertura al pasar mouse |
| `zoomToBoundsOnClick` | `boolean` | true | Zoom a los límites al hacer click en cluster |
| `disableClusteringAtZoom` | `number` | 15 | Nivel de zoom donde se desactiva clustering |

## Estilos

Los estilos de clustering se cargan automáticamente desde `leaflet.markercluster`. Los colores se personalizan según:

- **Clusters**: Basados en cantidad de marcadores
  - 1-10: Azul (#3b82f6)
  - 11-50: Verde (#10b981)
  - 51-100: Naranja (#f97316)
  - 100+: Rojo (#dc2626)

- **Marcadores individuales**: Basados en `healthStatus`
  - Usa la función `getHealthColor()` del sistema

## Ejemplos

### Clustering básico
```tsx
<MapClusteringComponent
  center={[-5.1946, -80.6307]}
  markers={arboles.map(a => ({
    lat: a.latitud,
    lng: a.longitud,
    popup: `<strong>${a.nombre}</strong>`,
    healthStatus: a.estado_salud
  }))}
/>
```

### Con eventos
```tsx
<MapClusteringComponent
  center={[-5.1946, -80.6307]}
  markers={markers}
  onLocationSelect={(lat, lng) => {
    console.log(`Ubicación seleccionada: ${lat}, ${lng}`);
  }}
/>
```

## Notas
- El módulo maneja automáticamente la inicialización y limpieza del mapa
- Los cambios en marcadores se detectan automáticamente
- Optimizado para rendimiento con grandes cantidades de marcadores
