import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  mensaje: string;
  contexto?: Record<string, any>;
  historial?: Array<{ rol: "usuario" | "asistente"; contenido: string }>;
}

const SYSTEM_INSTRUCTIONS = `Eres un Experto Botánico y Asistente de Seguimiento Forestal del proyecto EcoAssistant.
Tu misión es ayudar a identificar árboles, dar consejos de riego, abono y control de plagas.

REGLAS CRÍTICAS:
- NO comiences con saludos como "¡Hola! Como Experto Botánico..."
- NO incluyas presentaciones personales en cada respuesta
- Responde directamente a la pregunta del usuario
- Solo si es la primera interacción, sé breve y amable

FORMATO DE RESPUESTAS:
1. Usa Markdown para estructurar
2. **negritas** para títulos y conceptos clave
3. Viñetas con - para listas
4. Subtítulos con ## para organizar
5. Máximo 250 palabras
6. Responde en español, profesional y educativo

Ejemplo:
## Recomendaciones para tu árbol
**Riego:**
- Riega cada 3 días en primavera
- Mantén suelo húmedo, no encharcado`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { mensaje, contexto = {}, historial = [] } = body;

    if (!mensaje?.trim()) {
      return NextResponse.json(
        { error: "Mensaje vacío" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY no configurada en .env");
      return NextResponse.json(
        { error: "API no configurada en servidor" },
        { status: 500 }
      );
    }

    // Construir prompt con contexto e historial
    let promptCompleto = SYSTEM_INSTRUCTIONS + "\n\n";

    if (Object.keys(contexto).length > 0) {
      const ctx = Object.entries(contexto)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      promptCompleto += `Contexto actual: ${ctx}\n`;
    }

    // Agregar historial de conversación si existe
    if (historial.length > 0) {
      promptCompleto += "\nHistorial de conversación:\n";
      historial.forEach((msg) => {
        const rol = msg.rol === "usuario" ? "Usuario" : "Asistente";
        promptCompleto += `${rol}: ${msg.contenido}\n`;
      });
      promptCompleto += "\n";
    }

    promptCompleto += `Nueva pregunta del usuario: ${mensaje}`;

    // Llamar a Google Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [{ text: promptCompleto }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData?.error?.message || "Error en API de Google";
      console.error("❌ Error Gemini:", errorMsg);
      return NextResponse.json(
        { error: `Error de IA: ${errorMsg}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!respuesta) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      respuesta,
      estado: "éxito",
    });
  } catch (error: any) {
    console.error("❌ Error en /api/chat:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
