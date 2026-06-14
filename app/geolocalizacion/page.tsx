"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const GeolocalizacionContent = dynamicImport(
  () => import("./geolocalizacion-content").then((mod) => ({ default: mod.GeolocalizacionContent })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen">Cargando...</div>,
  }
);

export default function GeolocalizacionPage() {
  return <GeolocalizacionContent />;
}
