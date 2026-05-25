"use client";

import dynamic from "next/dynamic";

const MapClusteringComponentInternal = dynamic(
  () => import("./MapClusteringComponentInternal").then((mod) => ({ default: mod.MapClusteringComponent })),
  {
    ssr: false,
    loading: () => <div className="h-[500px] w-full rounded-lg border-2 border-primary/20 bg-gray-100 animate-pulse" />,
  }
);

interface MapClusteringComponentProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; popup?: string; healthStatus?: string }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  clusteringConfig?: {
    maxClusterRadius?: number;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    disableClusteringAtZoom?: number;
  };
  className?: string;
}

export function MapClusteringComponent(props: MapClusteringComponentProps) {
  return <MapClusteringComponentInternal {...props} />;
}
