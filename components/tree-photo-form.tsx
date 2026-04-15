"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Camera, Upload, Loader2, CheckCircle, X, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface TreePhotoFormResult {
  photo: string; // base64
  species: string; // nombre común
  scientificName: string; // nombre científico
  confidence: number; // 0-1
  careInstructions?: string;
}

interface TreePhotoFormProps {
  onPhotoIdentified: (result: TreePhotoFormResult) => void;
  initialPhoto?: string;
  initialSpecies?: string;
}

export function TreePhotoForm({
  onPhotoIdentified,
  initialPhoto,
  initialSpecies,
}: TreePhotoFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string>(initialPhoto || "");
  const [species, setSpecies] = useState<string>(initialSpecies || "");
  const [scientificName, setScientificName] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [careInstructions, setCareInstructions] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  // En edición: si hay foto inicial, mostrar como identificado (pero sin confianza)
  const [identified, setIdentified] = useState(!!initialPhoto && !!initialSpecies);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      console.error(err);
    }
  };

  // Capturar foto de la cámara
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setImage(imageData);
        stopCamera();
        autoIdentify(imageData);
      }
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setImage(imageData);
        autoIdentify(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-identificar especie
  const autoIdentify = async (base64: string) => {
    setLoading(true);
    setError("");
    setIdentified(false);

    try {
      const response = await fetch("/api/identify-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error("Error al identificar la especie");
      }

      const data = await response.json();
      
      if (data.commonName) {
        setSpecies(data.commonName);
        setScientificName(data.scientificName || "");
        setConfidence(data.confidence || 0);
        setCareInstructions(data.careInstructions || "");
        setIdentified(true);

        // Auto-aplicar resultado
        onPhotoIdentified({
          photo: base64,
          species: data.commonName,
          scientificName: data.scientificName || "",
          confidence: data.confidence || 0,
          careInstructions: data.careInstructions,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al identificar la especie"
      );
      setIdentified(false);
    } finally {
      setLoading(false);
    }
  };

  // Resetear todo
  const handleReset = () => {
    setImage("");
    setSpecies("");
    setScientificName("");
    setConfidence(0);
    setCareInstructions("");
    setError("");
    setIdentified(false);
    stopCamera();
  };

  // Si ya está identificado, mostrar tarjeta compacta
  if (identified && image) {
    return (
      <div className="space-y-2">
        <Label>Foto y Especie</Label>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 space-y-2">
            {/* Foto preview - Circular PERFECTA */}
            <div className="flex justify-center">
              <div className="relative w-32 aspect-square rounded-full overflow-hidden bg-gray-100 border-4 border-green-200 flex-shrink-0">
                <Image
                  src={image}
                  alt="Árbol capturado"
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Información de especie identificada - Compacta */}
            <div className="bg-white rounded-lg p-2 border border-green-200 text-center">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="font-semibold text-green-900 text-sm break-words">
                  ✓ {species}
                </p>
                {scientificName && (
                  <p className="text-xs text-green-700 italic break-words">
                    {scientificName}
                  </p>
                )}
                {confidence > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    {Math.round(confidence * 100)}% confianza
                  </p>
                )}
                {careInstructions && (
                  <p className="text-xs text-green-700 mt-1 line-clamp-2">
                    💧 {careInstructions}
                  </p>
                )}
              </div>
            </div>

            {/* Botón reset */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Cambiar foto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay foto pero no se identificó (error o usuario continúa sin identificar)
  if (image && !identified && !loading) {
    return (
      <div className="space-y-2">
        <Label>Foto y Especie</Label>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 space-y-2">
            {/* Foto preview */}
            <div className="flex justify-center">
              <div className="relative w-32 aspect-square rounded-full overflow-hidden bg-gray-100 border-4 border-amber-200 flex-shrink-0">
                <Image
                  src={image}
                  alt="Árbol capturado"
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Mensaje de error o información */}
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {!error && (
              <div className="bg-white rounded-lg p-2 border border-amber-200 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  📸 Foto capturada correctamente
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Completa los campos manualmente si lo necesitas
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-2">
              {error && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => autoIdentify(image)}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Intentar identificar de nuevo
                </Button>
              )}

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setIdentified(true);
                  onPhotoIdentified({
                    photo: image,
                    species: species || "",
                    scientificName: scientificName || "",
                    confidence: 0,
                    careInstructions: careInstructions || "",
                  });
                }}
                className="w-full gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Continuar con esta foto
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Cambiar foto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Foto y Especie</Label>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-blue-700 font-medium">Identificando especie...</p>
            <p className="text-sm text-blue-600">Esto puede tomar 2-5 segundos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interfaz principal - captura/upload
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Foto y Especie *</Label>
        <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
          <Zap className="h-3 w-3" />
          Auto-identificación IA
        </div>
      </div>

      <div className="space-y-2">
        {/* Vista previa si hay imagen capturada pero no identificada */}
        {image && !identified && !loading && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
            <Image
              src={image}
              alt="Vista previa"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Vista de cámara en vivo */}
        {cameraActive && !image && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black border-2 border-primary">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              className="hidden"
            />
            <Button
              type="button"
              size="lg"
              onClick={capturePhoto}
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 rounded-full gap-2"
            >
              <Camera className="h-5 w-5" />
              Capturar
            </Button>
          </div>
        )}

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Botones de control */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={cameraActive ? "destructive" : "outline"}
            onClick={cameraActive ? stopCamera : startCamera}
            disabled={!!image}
            className="gap-2 text-sm"
          >
            <Camera className="h-4 w-4" />
            {cameraActive ? "Cancelar" : "Cámara"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!image}
            className="gap-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            Subir
          </Button>
        </div>

        {/* Descripción de auto-identificación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700 space-y-0.5">
          <p className="font-semibold">✨ Cómo funciona:</p>
          <ol className="list-decimal list-inside text-xs space-y-0">
            <li>Captura o sube foto</li>
            <li>IA identifica especie</li>
            <li>Campos se rellenan solos</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
