import { NextRequest, NextResponse } from 'next/server';

interface PlantNetResult {
  results: Array<{
    species: {
      commonNames: string[];
      scientificName: string;
    };
    score: number;
    images: Array<{
      url: string;
    }>;
  }>;
}

async function identifyWithPlantNet(imageBase64: string): Promise<any> {
  const apiKey = process.env.PLANTNET_API_KEY;
  
  if (!apiKey) {
    throw new Error('PLANTNET_API_KEY no configurada');
  }

  // Convertir base64 a blob
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const formData = new FormData();
  formData.append('images', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpg');
  formData.append('organs', 'auto');

  try {
    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`PlantNet API error: ${response.statusText}`);
    }

    const data: PlantNetResult = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No se pudo identificar la especie');
    }

    const topResult = data.results[0];
    const commonName = topResult.species.commonNames?.[0] || 'Especie desconocida';
    const scientificName = topResult.species.scientificName || 'Nombre científico desconocido';
    const confidence = topResult.score || 0;

    // Información adicional basada en la especie identificada
    const careInfo = getCareInstructions(scientificName, commonName);

    return {
      commonName,
      scientificName,
      confidence: Math.min(confidence, 1),
      description: `Identificada con ${Math.round(confidence * 100)}% de confianza`,
      careInstructions: careInfo,
      image: topResult.images?.[0]?.url,
    };
  } catch (error) {
    console.error('Error in PlantNet identification:', error);
    throw error;
  }
}

// Base de datos simple de cuidados de árboles comunes en Piura
function getCareInstructions(scientificName: string, commonName: string): string {
  const careDatabase: Record<string, string> = {
    // Árboles comunes en Piura
    'Algarrobus prosopis': 'Árbol resistente a la sequía. Riego ocasional. Tolera suelos secos. Perfecto para zonas áridas como Piura.',
    'Prosopis pallida': 'Algarrobo blanco. Muy resistente a sequía. Requiere riego esporádico después de plantación. Excelente para reforestación.',
    'Cercidium': 'Árbol de palo verde. Tolera climas cálidos y secos. Riega regularmente el primer año. Resiste salinidad del suelo.',
    'Capparis': 'Matorral adaptado a desiertos. Planta nativa. Requiere riego moderado. Atrae fauna local.',
    'Mangifera indica': 'Mango. Requiere sol directo y buen drenaje. Riega regularmente en primeras estaciones. Poda anual.',
    'Citrus': 'Cítricos. Necesita luz solar abundante. Riego regular pero no encharcamiento. Fertiliza mensualmente.',
    'Tabebuia': 'Árbol tropical. Prefiere climas cálidos. Riego moderado. Florece en primavera.',
    'Schinus molle': 'Pimienta. Muy rústica. Tolera sequía. Ideal para paisajismo. Poco mantenimiento.',
  };

  // Buscar coincidencias
  for (const [key, value] of Object.entries(careDatabase)) {
    if (
      scientificName.toLowerCase().includes(key.toLowerCase()) ||
      commonName.toLowerCase().includes(key.toLowerCase())
    ) {
      return value;
    }
  }

  // Información genérica por defecto
  return `Árbol identificado como ${commonName}. Proporciona riego regular durante el establecimiento. Asegura buen drenaje del suelo. Expón a luz solar según su tipo. Realiza podas de mantenimiento cuando sea necesario.`;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen requerida' },
        { status: 400 }
      );
    }

    const result = await identifyWithPlantNet(image);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al identificar la especie',
      },
      { status: 500 }
    );
  }
}
