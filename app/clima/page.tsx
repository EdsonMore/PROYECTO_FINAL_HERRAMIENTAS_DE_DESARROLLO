import React from "react";

export default function TreeClimatePage() {
  const data = {
    location: "Piura - Catacaos",
    lat: -5.266,
    lon: -80.682,
    clima: {
      temperatura: 32,
      humedad: 65,
      viento: 12,
      precipitacion: 0,
      estado: "FAVORABLE",
    },
    indicadores: {
      estres: "MEDIO",
      sequedad: "BAJO",
      confort: "ALTO",
      indice: 78,
    },
    alertas: "No se detectan anomalías",
    recomendaciones: [
      "Regar el árbol en horas de la mañana",
      "Proporcionar sombra parcial",
      "Aplicar fertilizante ligero",
    ],
  };

  return (
    <div style={styles.container}>
      <h1>🌳 EcoDataAI - Clima del Árbol</h1>

      {/* Ubicación */}
      <div style={styles.card}>
        <h2>📍 Ubicación</h2>
        <p>{data.location}</p>
        <small>
          Lat: {data.lat} | Lon: {data.lon}
        </small>
      </div>

      {/* Clima */}
      <div style={styles.card}>
        <h2>🌦️ Clima Actual</h2>
        <p>🌡️ {data.clima.temperatura}°C</p>
        <p>💧 {data.clima.humedad}%</p>
        <p>🌬️ {data.clima.viento} km/h</p>
        <p>🌧️ {data.clima.precipitacion} mm</p>
        <strong>Estado: {data.clima.estado}</strong>
      </div>

      {/* Indicadores */}
      <div style={styles.card}>
        <h2>📊 Indicadores</h2>
        <p>🔥 Estrés térmico: {data.indicadores.estres}</p>
        <p>🌵 Sequedad: {data.indicadores.sequedad}</p>
        <p>🌿 Confort: {data.indicadores.confort}</p>
        <h3>Índice: {data.indicadores.indice}/100</h3>
      </div>

      {/* Alertas */}
      <div style={styles.card}>
        <h2>⚠️ Alertas</h2>
        <p>{data.alertas}</p>
      </div>

      {/* Recomendaciones */}
      <div style={styles.card}>
        <h2>🤖 Recomendaciones</h2>
        <ul>
          {data.recomendaciones.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      {/* Acciones */}
      <div style={styles.actions}>
        <button>Actualizar clima</button>
        <button>Ver dashboard</button>
        <button>Ver árboles</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial",
    padding: "20px",
    background: "#f5f7fa",
  },
  card: {
    background: "#fff",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
};
