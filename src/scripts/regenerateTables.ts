import { DataSource } from "typeorm";
import dotenv from "dotenv";
import "reflect-metadata";
import { Project } from "../entities/project";
import { Task } from "../entities/task";
import { Issue } from "../entities/issues";

// Cargar variables de entorno
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const dbType = process.env.DB_TYPE || (isProd ? "mysql" : "postgres");

/**
 * Script para regenerar las tablas de la base de datos usando TypeORM
 * Este script sincroniza el esquema de la base de datos con las entidades definidas
 */
async function regenerateTables() {
  // Crear un DataSource temporal con synchronize habilitado explícitamente
  const dataSource = new DataSource({
    type: dbType as "mysql" | "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || (dbType === "mysql" ? "3306" : "5432")),
    username: process.env.DB_USER || (dbType === "mysql" ? "root" : "postgres"),
    password: process.env.DB_PASSWORD || (dbType === "mysql" ? "" : "postgres"),
    database: process.env.DB_NAME || "mega_org",
    synchronize: true, // Habilitar sincronización explícitamente
    logging: true,
    entities: [Project, Task, Issue],
  });

  try {
    console.log("🔄 Iniciando regeneración de tablas...");
    console.log(`📊 Base de datos: ${process.env.DB_NAME || "mega_org"}`);
    console.log(`🔌 Tipo: ${dbType}`);
    
    // Inicializar la conexión a la base de datos
    // Con synchronize: true, TypeORM creará/actualizará las tablas automáticamente
    await dataSource.initialize();
    console.log("✅ Conexión a la base de datos establecida");
    console.log("📊 Sincronizando esquema de base de datos...");
    console.log("✅ Tablas regeneradas exitosamente");
    
    console.log("\n📋 Tablas creadas/actualizadas:");
    console.log("  ✓ project (con campo user_id para identificar al propietario)");
    console.log("  ✓ task (relacionada con project mediante project_id)");
    console.log("  ✓ issue (relacionada con project mediante project_id)");
    
    // Cerrar la conexión
    await dataSource.destroy();
    console.log("\n✅ Conexión cerrada");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al regenerar las tablas:", error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Ejecutar el script
regenerateTables();

