declare module 'leaflet.markercluster' {
  import * as L from 'leaflet';

  export interface MarkerClusterGroupOptions extends L.LayerOptions {
    maxClusterRadius?: number;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    disableClusteringAtZoom?: number;
    iconCreateFunction?: (cluster: L.MarkerCluster) => L.Icon | L.DivIcon;
  }

  export class MarkerClusterGroup extends L.FeatureGroup<L.Marker> {
    constructor(options?: MarkerClusterGroupOptions);
  }

  export default MarkerClusterGroup;
}

declare namespace L {
  interface MarkerCluster extends FeatureGroup<Marker> {
    getChildCount(): number;
    getAllChildMarkers(): Marker[];
    getLatLng(): LatLng;
  }
}
