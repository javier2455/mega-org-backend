-- Crear la tabla de usuarios
CREATE TABLE "user" (
    "id" SERIAL PRIMARY KEY,
    "user" VARCHAR UNIQUE NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" ENUM('user', 'admin', 'maintainer') DEFAULT 'user',
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Crear los tipos ENUM para las tareas
CREATE TYPE "task_status_enum" AS ENUM('new', 'pending', 'in_progress', 'completed', 'in_review', 'done');
CREATE TYPE "task_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent');

-- Crear la tabla de tareas
CREATE TABLE "task" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "dueDate" DATE NOT NULL,
    "status" task_status_enum DEFAULT 'new',
    "priority" task_priority_enum DEFAULT 'medium',
    "assignedToId" INTEGER REFERENCES "user"("id"),
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
); 