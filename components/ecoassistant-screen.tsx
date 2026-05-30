"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SpeciesResult } from "./species-identifier";

interface ChatMessage {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: number;
}

export default function EcoassistantScreen({ speciesData }: { speciesData?: SpeciesResult | null }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      try {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        return;
      } catch (e) {
        // fallback
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: inputValue, contexto: speciesData || {} }),
      });

      if (!res.ok) throw new Error('Error al obtener respuesta');
      const data = await res.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        texto: data.respuesta,
        esUsuario: false,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (e) {
      setChatMessages((prev) => [...prev, { id: (Date.now()+1).toString(), texto: '❌ Error: no se pudo conectar con la IA.', esUsuario: false, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden shadow-xl border border-green-200 rounded-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Leaf className="text-green-700 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-white font-bold">EcoAssistant</h2>
                <p className="text-green-100 text-xs">Guía experta en cuidado de árboles</p>
              </div>
            </div>
            <div className="text-sm text-green-100">🌍 Reverdecer Piura</div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded border border-green-100">
                <h3 className="font-semibold text-green-900">¡Bienvenido! Soy EcoAssistant</h3>
                <p className="text-xs text-gray-700 mt-2">Tu guía experto en cuidado y bienestar de los árboles.</p>
              </div>

              <div className="bg-green-50 border border-green-100 p-4 rounded text-xs">
                <p className="font-semibold mb-2">¿Cómo funciona?</p>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>Identifica tu árbol con la IA</li>
                  <li>Pregunta aquí sobre su cuidado</li>
                  <li>Recibe recomendaciones personalizadas</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-green-600 text-white">Ver más consejos</Button>
                <Button variant="outline" className="w-full">Guardar árbol</Button>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col h-[50vh] md:h-[60vh] min-h-0">
              <div className="flex-1 bg-white rounded border border-green-100 flex flex-col overflow-hidden min-h-0">
                <div className="px-4 py-3 bg-green-600 text-white text-sm font-semibold">💬 Pregunta sobre tu árbol</div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-green-50 to-white min-h-0 chat-scroll">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">👋 ¡Hola! Empieza con una pregunta.</div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.esUsuario ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2 rounded-xl text-sm shadow-sm transition-all ${msg.esUsuario ? 'bg-green-600 text-white self-end rounded-br-2xl rounded-tl-2xl' : 'bg-white text-gray-800 border border-gray-100'}`}>
                          {msg.esUsuario ? msg.texto : <ReactMarkdown>{msg.texto}</ReactMarkdown>}
                        </div>
                      </div>
                    ))
                  )}
                  {loading && <div className="text-sm text-gray-500">Escribiendo...</div>}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-green-100 bg-white flex gap-3 items-center sticky bottom-0">
                  <input
                    className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe tu pregunta..."
                  />
                  <Button onClick={handleSendMessage} className="h-10 px-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-md text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
