"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  label?: string;
  accept?: string;
  initialImage?: string;
}

export function ImageUploader({
  onImageSelect,
  label = "Seleccionar Foto",
  accept = "image/*",
  initialImage,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialImage || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      onImageSelect(base64);
      toast({
        title: "Imagen cargada",
        description: "Foto seleccionada correctamente",
      });
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      
      // Intentar primero con cámara trasera (environment)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },  // Preferencia por cámara trasera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err) {
        // Fallback: Si no hay cámara trasera, usar cualquier cámara disponible
        console.log("Cámara trasera no disponible, usando cámara frontal");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara del dispositivo",
        variant: "destructive",
      });
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const base64 = canvasRef.current.toDataURL("image/jpeg", 0.9);
        setPreview(base64);
        onImageSelect(base64);

        stopCamera();
        setShowCameraModal(false);

        toast({
          title: "Foto capturada",
          description: "Tu foto ha sido capturada correctamente",
        });
      }
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCameraModal(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir Foto
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setShowCameraModal(true);
            setTimeout(() => startCamera(), 100);
          }}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Tomar Foto
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="mt-4 relative rounded-lg overflow-hidden border-2 border-primary/20">
          <img src={preview} alt="Vista previa" className="w-full h-auto max-h-64 object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Dialog open={showCameraModal} onOpenChange={closeCamera}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tomar Foto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {cameraActive ? (
              <>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto aspect-video object-cover"
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2 justify-center">
                  <Button onClick={takePicture} className="gap-2">
                    <Camera className="h-4 w-4" />
                    Capturar Foto
                  </Button>
                  <Button onClick={closeCamera} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  La cámara se abrirá cuando hagas clic en el botón
                </p>
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Abrir Cámara
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
