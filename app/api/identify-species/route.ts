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
    const careInfo = getCareInfo(scientificName, commonName);

    return {
      commonName,
      scientificName,
      confidence: Math.min(confidence, 1),
      description: `Identificada con ${Math.round(confidence * 100)}% de confianza`,
      careInstructions: careInfo.summary,
      image: topResult.images?.[0]?.url,
      detailedCare: careInfo,
    };
  } catch (error) {
    console.error('Error in PlantNet identification:', error);
    throw error;
  }
}

// Base de datos enriquecida de cuidados de árboles comunes en Piura
interface TreeCareInfo {
  summary: string;
  riego: string;
  luz: string;
  temperatura: string;
  suelo: string;
  plagas: string;
  poda: string;
}

function getCareInfo(scientificName: string, commonName: string): TreeCareInfo {
  const careDatabase: Record<string, TreeCareInfo> = {
    'Algarrobus prosopis': {
      summary: 'Árbol resistente a la sequía, nativo de zonas áridas. Perfecto para Piura.',
      riego: 'Ocasional. Una vez establecido, tolera sequía. En primavera-verano riego cada 2-3 semanas.',
      luz: 'Requiere pleno sol. Mínimo 6-8 horas diarias.',
      temperatura: 'Tolera temperaturas entre 15°C y 45°C. Ideal para clima árido.',
      suelo: 'Prefiere suelos secos, arenosos o rocosos. Buen drenaje es esencial.',
      plagas: 'Resistente. Ocasionalmente hormigas o trips, pero raramente afecta el árbol.',
      poda: 'Mínima requerida. Poda solo ramas dañadas o para dar forma.',
    },
    'Prosopis pallida': {
      summary: 'Algarrobo blanco. Especie nativa muy valiosa para reforestación en zonas áridas.',
      riego: 'Mínimo. Riego esporádico el primer año. Después tolera sequía extrema.',
      luz: 'Pleno sol obligatorio. No sobrevive en sombra.',
      temperatura: 'Muy tolerante. De 10°C a 50°C.',
      suelo: 'Tolera suelos pobres, salinos y compactados. Ideal para zonas degradadas.',
      plagas: 'Muy resistente. Pocas plagas lo afectan.',
      poda: 'No requiere poda regular. Solo elimina ramas muertas.',
    },
    'Mangifera indica': {
      summary: 'Mango. Árbol frutal tropical que produce excelentes frutos.',
      riego: 'Regular durante crecimiento. 2-3 veces por semana en verano. Reduce en seco.',
      luz: 'Pleno sol. Mínimo 6-8 horas. Mayor luz = mejor producción de frutos.',
      temperatura: 'Tropical. Óptimo 25-30°C. No tolera heladas.',
      suelo: 'Fértil, bien drenado, pH 5.5-7.5. Enriquece con compost.',
      plagas: 'Mosca de la fruta, ácaros, antracnosis. Monitorear regularmente.',
      poda: 'Poda anual después de cosecha para dar forma y mejorar producción.',
    },
    'Citrus': {
      summary: 'Cítricos (naranja, limón, etc.). Frutal muy productivo en climas cálidos.',
      riego: 'Regular. 2-3 veces por semana en calor. Sin encharcamiento.',
      luz: 'Pleno sol obligatorio. Mínimo 8 horas diarias.',
      temperatura: 'Tropical-subtropical. 15-30°C. Sensible a heladas.',
      suelo: 'Fértil, pH 6-8, buen drenaje. Enriquece mensualmente con fertilizante.',
      plagas: 'Ácaros, cochinillas, mosca blanca. Inspecciona hojas regularmente.',
      poda: 'Poda anual ligera. Elimina ramas cruzadas y enfermas.',
    },
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
  return {
    summary: `${commonName} es un árbol adaptado a diversos ambientes.`,
    riego: 'Riego regular durante el establecimiento (primeras 2-4 semanas). Después, según condiciones de sequía local.',
    luz: 'Requiere luz solar. La mayoría necesita mínimo 4-6 horas diarias.',
    temperatura: 'Depende de la especie. Preferiblemente 15-30°C.',
    suelo: 'Buen drenaje es crítico. Evita encharcamiento. Enriquece con compost.',
    plagas: 'Inspecciona regularmente hojas, tallos y base. Actúa ante primeras plagas.',
    poda: 'Poda de formación el primer año. Después poda de mantenimiento anual.',
  };
}

// Función auxiliar para obtener solo el resumen (para compatibilidad anterior)
function getCareInstructions(scientificName: string, commonName: string): string {
  const info = getCareInfo(scientificName, commonName);
  return info.summary;
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
