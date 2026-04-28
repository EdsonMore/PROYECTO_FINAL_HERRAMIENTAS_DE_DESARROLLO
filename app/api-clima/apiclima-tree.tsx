import { useEffect, useState } from "react";

// 👇 Define el tipo de datos que devuelve tu backend
interface Clima {
  temperatura: number;
  viento: number;
  fecha: string;
  lat: number;
  lon: number;
}

export default function ClimaTree() {
  const [clima, setClima] = useState<Clima | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://localhost:8080/clima?lat=-5.26&lon=-80.68")
      .then((res) => res.json())
      .then((data: Clima) => {
        setClima(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando clima...</p>;

  if (!clima) return <p>No se pudo obtener el clima</p>;

  return (
    <div style={styles.container}>
      <h2>🌳 Clima del Árbol</h2>

      <div style={styles.card}>
        <p>
          📍 Coordenadas: {clima.lat}, {clima.lon}
        </p>
        <p>🌡️ Temperatura: {clima.temperatura}°C</p>
        <p>🌬️ Viento: {clima.viento} km/h</p>
        <p>📅 Fecha: {clima.fecha}</p>
      </div>
    </div>
  );
}

// 👇 Tipado para estilos
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    fontFamily: "Arial",
    background: "#f4f6f8",
  },
  card: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
};
