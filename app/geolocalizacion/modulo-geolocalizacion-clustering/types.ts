export interface ClusterMarker {
  lat: number;
  lng: number;
  popup?: string;
  healthStatus?: string;
}

export interface ClusteringConfig {
  maxClusterRadius?: number;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  disableClusteringAtZoom?: number;
}
