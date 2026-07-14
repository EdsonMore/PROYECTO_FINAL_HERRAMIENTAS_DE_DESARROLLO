const { Client } = require('/Users/dz/Documents/PROYECTO_FINAL_HERRAMIENTAS_DE_DESARROLLO/node_modules/pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://dz:12345@localhost:5432/Reverdecer_BD";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Conectado a PostgreSQL...");

  try {
    // 1. Ejecutar EcoDataBase_FINAL.sql
    console.log("Ejecutando EcoDataBase_FINAL.sql...");
    const dbFinalPath = path.join(__dirname, 'EcoDataBase_FINAL.sql');
    const dbFinalSql = fs.readFileSync(dbFinalPath, 'utf8');
    await client.query(dbFinalSql);
    console.log("EcoDataBase_FINAL.sql ejecutado correctamente.");

    // 2. Ejecutar ARBOLES DE EDSON.sql
    console.log("Ejecutando ARBOLES DE EDSON.sql...");
    const edsonPath = path.join(__dirname, 'ARBOLES DE EDSON.sql');
    const edsonSql = fs.readFileSync(edsonPath, 'utf8');
    await client.query(edsonSql);
    console.log("ARBOLES DE EDSON.sql ejecutado correctamente.");

    console.log("Base de datos configurada y poblada con éxito.");
  } catch (err) {
    console.error("Error al configurar la base de datos:", err);
  } finally {
    await client.end();
  }
}

run();
