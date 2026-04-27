import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import { Providers } from "./providers"; // 👈 Asegúrate de importar esto
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoData IA - Cuida y sigue el crecimiento de tu árbol",
  description:
    "Plataforma para registrar, seguir y cuidar tus árboles plantados. Documenta su crecimiento con fotos y aprende consejos de cuidado.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <Providers>
            {" "}
            {/* ✅ Aquí envolvemos toda la app */}
            {children}
            <Toaster />
            <Analytics />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
