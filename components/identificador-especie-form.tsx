'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

interface SpeciesResult {
  commonName: string;
  scientificName: string;
  confidence: number;
  description: string;
  careInstructions?: string;
  image?: string;
}

interface IdentificadorEspecieFormProps {
  onSpeciesIdentified: (result: SpeciesResult) => void;
  initialSpecies?: string;
}

export function IdentificadorEspecieForm({
  onSpeciesIdentified,
  initialSpecies,
}: IdentificadorEspecieFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpeciesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = async (file: File) => {
    try {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImage(base64);
        setCameraActive(false);
        // AUTO-IDENTIFICAR inmediatamente
        handleIdentifyAuto(base64);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al procesar la imagen');
    }
  };

  const handleCameraClick = async () => {
    try {
      if (cameraActive) {
        // Capturar y automáticamente identificar
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.drawImage(videoRef.current, 0, 0);
          canvasRef.current.toBlob((blob) => {
            if (blob) {
              handleImageCapture(blob as File);
            }
          });
        }
        return;
      }

      // Iniciar cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Intenta subir una imagen.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const handleIdentifyAuto = async (imageBase64: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/identify-species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!response.ok) {
        throw new Error('Error al identificar la especie');
      }

      const data = await response.json();
      setResult(data);
      // AUTO-APLICAR inmediatamente
      onSpeciesIdentified(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setCameraActive(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Si ya identificó, muestra resultado compacto
  if (result) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">
                  ✓ {result.commonName}
                </p>
                <p className="text-xs text-green-700 italic">
                  {result.scientificName} • {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {result.careInstructions && (
            <div className="bg-white rounded p-2 border border-green-100">
              <p className="text-xs font-medium text-gray-700 mb-1">
                💡 Cuidados:
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {result.careInstructions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4" />
          Identificar Especie
        </CardTitle>
        <CardDescription className="text-xs">
          Toma una foto o sube imagen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Preview o Cámara */}
        {cameraActive ? (
          <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
            <canvas ref={canvasRef} className="hidden" width={640} height={480} />
            <div className="absolute inset-0 border-4 border-yellow-400 opacity-50"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded">
              📷 Presiona capturar
            </div>
          </div>
        ) : image ? (
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-video">
            <Image
              src={image}
              alt="Captura"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-full bg-gradient-to-b from-blue-50 to-green-50 rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-primary/30">
            <div className="text-center text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-1 opacity-50" />
              <p className="text-xs">Captura o sube foto</p>
            </div>
          </div>
        )}

        {/* Botones - SIMPLE Y DIRECTO */}
        <div className="flex gap-2">
          <Button
            onClick={handleCameraClick}
            disabled={loading}
            size="sm"
            className="flex-1"
            variant={cameraActive ? 'destructive' : 'default'}
          >
            {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            <Camera className="h-3 w-3 mr-1" />
            {cameraActive ? 'Capturar' : 'Cámara'}
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={loading || cameraActive}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-3 w-3 mr-1" />
            Subir
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Errores */}
        {error && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Identificando...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
