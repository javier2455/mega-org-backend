import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Configuración de la base de datos
export const AppDataSource = new DataSource({
  type: isProd ? "mysql" : "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "mega_org",
  synchronize: isProd ? false : true, // En producción debe ser false
  logging: true,
  entities: isProd ? ["dist/entities/**/*.js"] : ["src/entities/**/*.ts"],
  migrations: isProd ? ["dist/migrations/**/*.js"] : ["src/migrations/**/*.ts"],
  subscribers: isProd
    ? ["dist/subscribers/**/*.js"]
    : ["src/subscribers/**/*.ts"],
});
