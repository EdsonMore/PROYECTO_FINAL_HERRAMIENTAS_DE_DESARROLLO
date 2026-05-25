import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  mensaje: string;
  contexto?: Record<string, any>;
}

const SYSTEM_INSTRUCTIONS = `Eres un Experto Botánico y Asistente de Seguimiento Forestal del proyecto EcoAssistant.
Tu misión es ayudar a identificar árboles, dar consejos de riego, abono y control de plagas.

IMPORTANTE - Reglas de formato para las respuestas:
1. Usa Markdown para estructurar la respuesta
2. Usa **texto** para negritas en títulos y conceptos clave
3. Usa viñetas con - para listas de consejos
4. Separa temas con subtítulos en formato ## Subtítulo
5. Si hay múltiples puntos, úsalos con saltos de línea claros
6. NO escribas todo en un párrafo continuo

Responde siempre en español, de forma profesional y educativa.
Sé conciso pero informativo. Máximo 250 palabras.

Ejemplo de formato correcto:
## Recomendaciones para tu árbol

**Riego:**
- Riega cada 3 días en primavera
- Mantén el suelo húmedo, no encharcado
- Reduce en invierno a una vez por semana`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { mensaje, contexto = {} } = body;

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

    // Construir prompt con contexto
    let promptCompleto = SYSTEM_INSTRUCTIONS + "\n\n";
    if (Object.keys(contexto).length > 0) {
      const ctx = Object.entries(contexto)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      promptCompleto += `Contexto actual: ${ctx}\n`;
    }
    promptCompleto += `Usuario pregunta: ${mensaje}`;

    // Llamar a Google Gemini (usando el modelo más moderno disponible)
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
