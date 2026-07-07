"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Navigation,
  Loader2,
  TreePine,
  Compass,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthFilter } from "@/components/health-filter";
import { getHealthLabel } from "@/lib/health-utils";
import { MapClusteringComponent } from "./modulo-geolocalizacion-clustering/components/MapClusteringComponent";
import type { Arbol } from "@/types";

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
