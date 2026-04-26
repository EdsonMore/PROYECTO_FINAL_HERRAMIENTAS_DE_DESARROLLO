"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, MessageCircle, X } from "lucide-react";

const welcomeMessages = [
  "🌱 ¡Bienvenido! Soy EcoAssistant, tu guía experto en cuidado de árboles.",
  "💚 Aquí puedes hacer preguntas sobre cómo cuidar, regar y mantener tus árboles saludables.",
  "🌍 Reverdecer Piura: Un árbol plantado hoy, es un futuro verde mañana.",
  "🌳 ¿Nuevo árbol? ¡Perfecto! Cuéntame sobre él y te daré recomendaciones personalizadas.",
  "💧 ¿Dudas sobre riego? ¿Plagas? ¿Fertilización? Estoy aquí para ayudarte.",
];

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const handleNextMessage = () => {
    setMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700 shadow-lg animate-pulse"
          size="icon"
        >
          <Leaf className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-xs">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* Silueta de Árbol - Copa */}
              <div className="relative w-8 h-8">
                {/* Copa del árbol (círculo) */}
                <div className="absolute inset-0 bg-green-300 rounded-full opacity-80" />
                <div className="absolute inset-1 bg-green-400 rounded-full opacity-90" />
                {/* Tronco del árbol */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-3 bg-amber-700 rounded" />
                {/* Hojas decorativas */}
                <Leaf className="absolute top-0 right-0 w-3 h-3 text-green-700 animate-bounce" style={{ animationDuration: "2s" }} />
              </div>
            </div>
            <span className="text-white font-bold text-sm">EcoAssistant</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-green-700"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Árbol grande decorativo */}
          <div className="flex justify-center py-4">
            <div className="relative w-24 h-32">
              {/* Copa del árbol - 3 capas para efecto 3D */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-16 bg-gradient-to-b from-green-400 to-green-500 rounded-full shadow-lg" />
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-14 bg-gradient-to-b from-green-300 to-green-400 rounded-full" />
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-300 rounded-full" />

              {/* Tronco del árbol */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2.5 h-12 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm" />

              {/* Raíces */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                <div className="w-1 h-3 bg-amber-700 rounded-sm transform -rotate-30" />
                <div className="w-1 h-3 bg-amber-700 rounded-sm" />
                <div className="w-1 h-3 bg-amber-700 rounded-sm transform rotate-30" />
              </div>

              {/* Hojas flotantes animadas */}
              <div className="absolute top-2 left-2 text-green-600 text-lg animate-bounce" style={{ animationDuration: "3s" }}>
                🍃
              </div>
              <div className="absolute top-4 right-1 text-green-500 text-lg animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}>
                🌿
              </div>
            </div>
          </div>

          {/* Mensaje de bienvenida */}
          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {welcomeMessages[messageIndex]}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleNextMessage}
              variant="outline"
              className="w-full border-green-300 hover:bg-green-50 text-green-700 text-xs"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Ver más consejos
            </Button>

            <div className="text-center text-xs text-gray-500 py-2">
              💡 <strong>Próximamente:</strong> Chat inteligente con IA
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              <p className="font-semibold mb-1">✨ ¿Cómo funciona?</p>
              <ol className="space-y-0.5 list-decimal list-inside text-amber-700">
                <li>Identifica tu árbol con la IA</li>
                <li>Pregunta aquí sobre su cuidado</li>
                <li>Recibe recomendaciones personalizadas</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer decorativo */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 text-center text-xs text-green-700 border-t border-green-200">
          🌍 Reverdecer Piura - Un árbol, un futuro
        </div>
      </Card>
    </div>
  );
}
