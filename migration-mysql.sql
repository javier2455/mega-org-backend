-- Script de migración para MySQL
-- Ejecutar este script manualmente en la base de datos MySQL antes de reiniciar el servidor

-- Paso 1: Agregar la columna user_id como nullable (si no existe)
-- Nota: Si la columna ya existe, este comando fallará. Ejecuta solo si es necesario.
ALTER TABLE `project` ADD COLUMN `user_id` INT NULL;

-- Paso 2: Migrar datos existentes
-- Asignar todos los proyectos existentes al primer usuario disponible
UPDATE `project` 
SET `user_id` = (SELECT id FROM `user` ORDER BY id LIMIT 1)
WHERE `user_id` IS NULL;

-- Paso 3: Si no hay usuarios en la tabla, puedes eliminar los proyectos sin usuario
-- o asignarles un valor por defecto. Descomenta la siguiente línea si quieres eliminar proyectos sin usuario:
-- DELETE FROM `project` WHERE `user_id` IS NULL;

-- Paso 4: Hacer user_id NOT NULL después de migrar los datos
ALTER TABLE `project` MODIFY COLUMN `user_id` INT NOT NULL;

-- Paso 5: Eliminar columnas assigned_to_id de tasks e issues si existen
-- Nota: Si las columnas no existen, estos comandos fallarán. Ejecuta solo si es necesario.
ALTER TABLE `task` DROP COLUMN `assigned_to_id`;
ALTER TABLE `issue` DROP COLUMN `assigned_to_id`;

-- Paso 6: Eliminar tabla de relación project_users si existe
DROP TABLE IF EXISTS `project_users`;

