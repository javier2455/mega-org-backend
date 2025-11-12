import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const dbType = process.env.DB_TYPE || (isProd ? "mysql" : "postgres");

// Configuración de la base de datos
export const AppDataSource = new DataSource({
  type: dbType as "mysql" | "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || (dbType === "mysql" ? "3306" : "5432")),
  username: process.env.DB_USER || (dbType === "mysql" ? "root" : "postgres"),
  password: process.env.DB_PASSWORD || (dbType === "mysql" ? "" : "postgres"),
  database: process.env.DB_NAME || "mega_org",
  synchronize: isProd ? false : true, // En producción debe ser false
  logging: true,
  entities: isProd ? ["dist/entities/**/*.js"] : ["src/entities/**/*.ts"],
  migrations: isProd ? ["dist/migrations/**/*.js"] : ["src/migrations/**/*.ts"],
  subscribers: isProd
    ? ["dist/subscribers/**/*.js"]
    : ["src/subscribers/**/*.ts"],
});
