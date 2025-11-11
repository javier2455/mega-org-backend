-- Script de migración para agregar user_id a la tabla project
-- Ejecutar este script manualmente en la base de datos antes de reiniciar el servidor

-- Paso 1: Agregar la columna user_id como nullable
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;

-- Paso 2: Migrar datos existentes
-- Asignar todos los proyectos existentes al primer usuario disponible
-- Si tienes proyectos sin usuarios asignados, esto los asignará al primer usuario
UPDATE "project" 
SET "user_id" = (SELECT id FROM "user" ORDER BY id LIMIT 1)
WHERE "user_id" IS NULL;

-- Paso 3: Si no hay usuarios en la tabla, puedes eliminar los proyectos sin usuario
-- o asignarles un valor por defecto. Descomenta la siguiente línea si quieres eliminar proyectos sin usuario:
-- DELETE FROM "project" WHERE "user_id" IS NULL;

-- Paso 4: Hacer user_id NOT NULL después de migrar los datos
ALTER TABLE "project" ALTER COLUMN "user_id" SET NOT NULL;

-- Paso 5: Eliminar columnas assigned_to_id de tasks e issues si existen
ALTER TABLE "task" DROP COLUMN IF EXISTS "assigned_to_id";
ALTER TABLE "issue" DROP COLUMN IF EXISTS "assigned_to_id";

-- Paso 6: Eliminar tabla de relación project_users si existe
DROP TABLE IF EXISTS "project_users";

