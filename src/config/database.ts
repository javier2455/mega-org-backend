import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Configuración de la base de datos
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "mega_org",
  // synchronize: true, // Para desarrollo
  synchronize: false, // En producción debe ser false
  logging: true,
  // entities: ['src/entities/**/*.ts'],    // Para desarrollo
  // migrations: ['src/migrations/**/*.ts'],    // Para desarrollo
  // subscribers: ['src/subscribers/**/*.ts'],  // Para desarrollo
  entities: ["dist/entities/**/*.js"],
  migrations: ["dist/migrations/**/*.js"],
  subscribers: ["dist/subscribers/**/*.js"],
});
