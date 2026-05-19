"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, MessageCircle, X, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SpeciesResult } from "./species-identifier";

interface ChatbotPanelProps {
  speciesData?: SpeciesResult | null;
}

interface ChatMessage {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: number;
}

const welcomeMessages = [
  "🌱 ¡Bienvenido! Soy EcoAssistant, tu guía experto en cuidado de árboles.",
  "💚 Aquí puedes hacer preguntas sobre cómo cuidar, regar y mantener tus árboles saludables.",
  "🌍 Reverdecer Piura: Un árbol plantado hoy, es un futuro verde mañana.",
  "🌳 ¿Nuevo árbol? ¡Perfecto! Cuéntame sobre él y te daré recomendaciones personalizadas.",
  "💧 ¿Dudas sobre riego? ¿Plagas? ¿Fertilización? Estoy aquí para ayudarte.",
];

export function ChatbotPanel({ speciesData }: ChatbotPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNextMessage = () => {
    setMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
  };

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Enviar mensaje al chatbot
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      texto: inputValue,
      esUsuario: true,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje: inputValue,
          contexto: speciesData
            ? {
                especie: speciesData.commonName,
                nombreCientifico: speciesData.scientificName,
              }
            : {},
        }),
      });

      if (!response.ok) {
        throw new Error("Error al conectar con el servidor");
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        texto: data.respuesta,
        esUsuario: false,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        texto: "❌ Error: No puedo conectar con el servidor de IA. Verifica que el servidor esté activo.",
        esUsuario: false,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
          {/* Árbol grande decorativo - solo en bienvenida */}
          {!speciesData && (
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
          )}

          {/* Contenido: Especie Identificada o Bienvenida */}
          {speciesData ? (
            <>
              {/* Información de la especie identificada */}
              <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm space-y-3">
                <div>
                  <p className="text-sm font-bold text-green-900">
                    🌳 {speciesData.commonName}
                  </p>
                  <p className="text-xs italic text-green-700">
                    {speciesData.scientificName}
                  </p>
                </div>

                {/* Confianza */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Confianza: {Math.round(speciesData.confidence * 100)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${speciesData.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="text-xs text-gray-700">
                    <strong>Resumen:</strong> {speciesData.description}
                  </p>
                </div>
              </div>

              {/* Cuidados Recomendados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-blue-900">💧 Cuidados Recomendados</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {speciesData.careInstructions}
                </p>
              </div>

              {/* Chat con el bot */}
              <div className="bg-white rounded-lg border border-green-200 overflow-hidden flex flex-col h-72">
                {/* Header del chat */}
                <div className="bg-green-600 text-white px-3 py-2 text-xs font-semibold">
                  💬 Pregunta sobre tu {speciesData.commonName}
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-green-50 to-white">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-gray-500 text-center">
                        👋 ¡Hola! Soy EcoAssistant. <br />
                        Pregunta sobre el cuidado de tu árbol.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.esUsuario ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-xs leading-relaxed ${
                            msg.esUsuario
                              ? "bg-green-600 text-white rounded-br-none"
                              : "bg-gray-100 text-gray-800 rounded-bl-none"
                          }`}
                        >
                          {msg.texto}
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 px-3 py-2 rounded-lg rounded-bl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-green-200 bg-white p-2 flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputValue.trim()}
                    className="h-auto p-1.5 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8">
                  🌱 Guardar este árbol
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(true)}
                  className="w-full border-green-300 text-green-700 text-xs h-8"
                >
                  📝 Ver más detalles
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Mensaje de bienvenida por defecto */}
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

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                  <p className="font-semibold mb-1">✨ ¿Cómo funciona?</p>
                  <ol className="space-y-0.5 list-decimal list-inside text-amber-700">
                    <li>Identifica tu árbol con la IA</li>
                    <li>Pregunta aquí sobre su cuidado</li>
                    <li>Recibe recomendaciones personalizadas</li>
                  </ol>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer decorativo */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 text-center text-xs text-green-700 border-t border-green-200">
          🌍 Reverdecer Piura - Un árbol, un futuro
        </div>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-900">
              🌳 {speciesData?.commonName}
            </DialogTitle>
            <DialogDescription className="italic text-green-700">
              {speciesData?.scientificName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Confianza */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Confianza de Identificación
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(speciesData?.confidence || 0) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {Math.round((speciesData?.confidence || 0) * 100)}% de confianza
              </p>
            </div>

            {/* Descripción */}
            {speciesData?.description && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Descripción
                </p>
                <p className="text-sm text-gray-600">
                  {speciesData.description}
                </p>
              </div>
            )}

            {/* Cuidados Detallados */}
            {speciesData?.detailedCare && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 text-sm">
                  📋 Guía Completa de Cuidados
                </h3>

                <div>
                  <p className="font-medium text-blue-900 text-xs">💧 Riego</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.riego}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 text-xs">☀️ Luz Solar</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.luz}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 text-xs">🌡️ Temperatura</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.temperatura}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 text-xs">🌱 Suelo</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.suelo}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 text-xs">🐛 Plagas Comunes</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.plagas}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 text-xs">✂️ Poda</p>
                  <p className="text-xs text-blue-800 mt-1">
                    {speciesData.detailedCare.poda}
                  </p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9"
              >
                🌱 Guardar este árbol
              </Button>
              <Button
                variant="outline"
                onClick={() => setDetailsOpen(false)}
                className="flex-1 text-xs h-9"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
