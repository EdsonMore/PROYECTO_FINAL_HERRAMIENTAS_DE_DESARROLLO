'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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

export function SpeciesIdentifier() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpeciesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleImageCapture = async (file: File) => {
    try {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImage(base64);
        setCameraActive(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al procesar la imagen');
    }
  };

  const handleCameraClick = async () => {
    try {
      if (cameraActive) {
        // Capturar foto desde video
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

  const handleIdentify = async () => {
    if (!image) {
      setError('Por favor captura o sube una imagen');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/identify-species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error('Error al identificar la especie');
      }

      const data = await response.json();
      setResult(data);
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

  return (
    <div className="w-full space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Identificador de Especies</CardTitle>
          <CardDescription>
            Toma una foto o sube una imagen para identificar la especie del árbol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview o Cámara */}
          <div className="space-y-4">
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
              <div className="w-full bg-gradient-to-b from-blue-50 to-green-50 rounded-lg aspect-video flex items-center justify-center border-2 border-dashed">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aquí aparecerá la foto</p>
                </div>
              </div>
            )}

            {/* Botones de captura */}
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleCameraClick}
                variant={cameraActive ? 'destructive' : 'default'}
                className="flex-1 min-w-[150px]"
              >
                <Camera className="h-4 w-4 mr-2" />
                {cameraActive ? 'Capturar Foto' : 'Usar Cámara'}
              </Button>
              <Button
                onClick={() => fileRef.current?.click()}
                variant="outline"
                className="flex-1 min-w-[150px]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Errores */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botón identificar */}
          {image && !result && (
            <Button
              onClick={handleIdentify}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Identificando...' : 'Identificar Especie'}
            </Button>
          )}

          {/* Resultado */}
          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <CardTitle className="text-green-900">
                      {result.commonName}
                    </CardTitle>
                    <CardDescription className="text-green-700 italic">
                      {result.scientificName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Confianza: {Math.round(result.confidence * 100)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>

                {result.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-600">{result.description}</p>
                  </div>
                )}

                {result.careInstructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Cuidados Recomendados
                    </p>
                    <p className="text-sm text-gray-600">
                      {result.careInstructions}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Identificar Otra Especie
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
