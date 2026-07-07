export interface ClusterMarker {
  lat: number;
  lng: number;
  popup?: string;
  healthStatus?: string;
  indice_supervivencia?: number | null;
  recomendaciones?: string[];
}

export interface ClusteringConfig {
  maxClusterRadius?: number;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  disableClusteringAtZoom?: number;
  spiderfyOnMaxZoom?: boolean;
  spiderLegPolylineOptions?: any;
}
