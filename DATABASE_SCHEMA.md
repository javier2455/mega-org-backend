# 📊 Documentación del Esquema de Base de Datos

## Resumen

Este documento describe la estructura de las tablas de la base de datos generadas mediante TypeORM, las relaciones entre ellas y cómo funciona el sistema de gestión de proyectos, tareas e issues.

## Tablas de la Base de Datos

La base de datos contiene **3 tablas principales**:

1. **project** - Almacena los proyectos
2. **task** - Almacena las tareas asociadas a proyectos
3. **issue** - Almacena los issues (problemas/incidencias) asociados a proyectos

---

## 1. Tabla `project`

### Descripción
Almacena la información de los proyectos creados por los usuarios.

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL (INTEGER) | Identificador único del proyecto (clave primaria, autoincremental) |
| `title` | VARCHAR | Título del proyecto (requerido) |
| `description` | VARCHAR | Descripción del proyecto (opcional) |
| `startDate` | DATE | Fecha de inicio del proyecto (requerido) |
| `dueDate` | DATE | Fecha límite del proyecto (requerido) |
| `user_id` | INTEGER | Identificador del usuario propietario del proyecto (requerido) |
| `createdAt` | TIMESTAMP | Fecha y hora de creación (automático) |
| `updatedAt` | TIMESTAMP | Fecha y hora de última actualización (automático) |

### Relaciones
- **One-to-Many con `task`**: Un proyecto puede tener múltiples tareas
- **One-to-Many con `issue`**: Un proyecto puede tener múltiples issues

### Notas Importantes
- El campo `user_id` es **obligatorio** y se utiliza para identificar qué proyectos pertenecen a cada usuario
- Cuando un usuario crea un proyecto, el sistema guarda automáticamente su identificador en el campo `user_id`
- Las relaciones con `task` e `issue` se establecen mediante claves foráneas (`project_id`)

---

## 2. Tabla `task`

### Descripción
Almacena las tareas asociadas a proyectos específicos.

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL (INTEGER) | Identificador único de la tarea (clave primaria, autoincremental) |
| `title` | VARCHAR | Título de la tarea (requerido) |
| `description` | VARCHAR(500) | Descripción detallada de la tarea (opcional) |
| `notes` | VARCHAR | Notas adicionales sobre la tarea (opcional) |
| `dueDate` | DATE | Fecha límite de la tarea (requerido) |
| `status` | ENUM | Estado de la tarea (por defecto: 'new') |
| `priority` | ENUM | Prioridad de la tarea (por defecto: 'medium') |
| `project_id` | INTEGER | Identificador del proyecto al que pertenece (clave foránea, requerido) |
| `createdAt` | TIMESTAMP | Fecha y hora de creación (automático) |
| `updatedAt` | TIMESTAMP | Fecha y hora de última actualización (automático) |

### Valores del Enum `status`
- `new` - Nueva tarea
- `in_progress` - En progreso
- `completed` - Completada
- `in_review` - En revisión
- `closed` - Cerrada

### Valores del Enum `priority`
- `low` - Baja
- `medium` - Media (por defecto)
- `high` - Alta
- `critical` - Crítica

### Relaciones
- **Many-to-One con `project`**: Cada tarea pertenece a un proyecto específico

### Notas Importantes
- El campo `project_id` es **obligatorio** y establece la relación con el proyecto
- Si se elimina un proyecto, las tareas asociadas se eliminan automáticamente (CASCADE)
- La relación se establece mediante la clave foránea `project_id` que referencia a `project.id`

---

## 3. Tabla `issue`

### Descripción
Almacena los issues (problemas/incidencias) asociados a proyectos específicos.

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL (INTEGER) | Identificador único del issue (clave primaria, autoincremental) |
| `title` | VARCHAR | Título del issue (requerido) |
| `description` | VARCHAR | Descripción detallada del issue (opcional) |
| `notes` | VARCHAR | Notas adicionales sobre el issue (opcional) |
| `dueDate` | DATE | Fecha límite del issue (requerido) |
| `status` | ENUM | Estado del issue (por defecto: 'new') |
| `priority` | ENUM | Prioridad del issue (por defecto: 'medium') |
| `project_id` | INTEGER | Identificador del proyecto al que pertenece (clave foránea, requerido) |
| `createdAt` | TIMESTAMP | Fecha y hora de creación (automático) |
| `updatedAt` | TIMESTAMP | Fecha y hora de última actualización (automático) |

### Valores del Enum `status`
- `new` - Nuevo issue
- `in_progress` - En progreso
- `completed` - Completado
- `in_review` - En revisión
- `closed` - Cerrado

### Valores del Enum `priority`
- `low` - Baja
- `medium` - Media (por defecto)
- `high` - Alta
- `critical` - Crítica

### Relaciones
- **Many-to-One con `project`**: Cada issue pertenece a un proyecto específico

### Notas Importantes
- El campo `project_id` es **obligatorio** y establece la relación con el proyecto
- Si se elimina un proyecto, los issues asociados se eliminan automáticamente (CASCADE)
- La relación se establece mediante la clave foránea `project_id` que referencia a `project.id`

---

## Relaciones entre Tablas

### Diagrama de Relaciones

```
┌─────────────┐
│   project   │
│─────────────│
│ id (PK)     │◄────┐
│ title       │     │
│ description │     │
│ startDate   │     │
│ dueDate     │     │
│ user_id     │     │
│ createdAt   │     │
│ updatedAt   │     │
└─────────────┘     │
                    │
        ┌───────────┴───────────┐
        │                       │
        │                       │
┌───────▼───────┐      ┌────────▼──────┐
│     task      │      │     issue     │
│───────────────│      │───────────────│
│ id (PK)       │      │ id (PK)       │
│ title         │      │ title         │
│ description   │      │ description   │
│ notes         │      │ notes         │
│ dueDate       │      │ dueDate       │
│ status        │      │ status        │
│ priority      │      │ priority      │
│ project_id(FK)├──────┤ project_id(FK)│
│ createdAt     │      │ createdAt     │
│ updatedAt     │      │ updatedAt     │
└───────────────┘      └───────────────┘
```

### Descripción de las Relaciones

1. **Project → Task (One-to-Many)**
   - Un proyecto puede tener **cero o más** tareas
   - Cada tarea pertenece a **exactamente un** proyecto
   - Relación establecida mediante `task.project_id` → `project.id`

2. **Project → Issue (One-to-Many)**
   - Un proyecto puede tener **cero o más** issues
   - Cada issue pertenece a **exactamente un** proyecto
   - Relación establecida mediante `issue.project_id` → `project.id`

3. **Project → User (Many-to-One implícito)**
   - Un proyecto pertenece a **exactamente un** usuario
   - Un usuario puede tener **múltiples** proyectos
   - Relación establecida mediante `project.user_id` → `user.id` (tabla user no está en este esquema, pero se referencia)

---

## Gestión de Usuarios y Proyectos

### Asignación de Propietario

Cuando un usuario crea un proyecto:

1. El sistema obtiene el identificador del usuario logueado desde la sesión
2. Se crea el proyecto con el campo `user_id` establecido al identificador del usuario
3. Este campo es **obligatorio** y permite:
   - Filtrar proyectos por usuario
   - Mostrar solo los proyectos del usuario logueado
   - Controlar el acceso a proyectos

### Consultas por Usuario

Para obtener los proyectos de un usuario específico:

```typescript
const projects = await projectRepository.find({
  where: { userId: user.id },
  relations: ['tasks', 'issues']
});
```

---

## Generación de Tablas con TypeORM

### Método 1: Sincronización Automática (Desarrollo)

TypeORM puede generar automáticamente las tablas cuando `synchronize: true` está habilitado en la configuración. Esto ocurre automáticamente al iniciar la aplicación en modo desarrollo.

**Configuración en `src/config/database.ts`:**
```typescript
synchronize: isProd ? false : true
```

### Método 2: Script de Regeneración

Se ha creado un script dedicado para regenerar las tablas:

**Ejecutar el script:**
```bash
pnpm run regenerate-tables
```

**Ubicación del script:**
- `src/scripts/regenerateTables.ts`

Este script:
1. Inicializa la conexión a la base de datos
2. Sincroniza el esquema con las entidades TypeORM
3. Crea/actualiza las tablas según las definiciones de las entidades
4. Cierra la conexión

### Entidades TypeORM

Las tablas se generan basándose en las siguientes entidades:

- `src/entities/project.ts` - Define la tabla `project`
- `src/entities/task.ts` - Define la tabla `task`
- `src/entities/issues.ts` - Define la tabla `issue`

---

## Estructura de Archivos

```
mega-org-backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de TypeORM
│   ├── entities/
│   │   ├── project.ts           # Entidad Project
│   │   ├── task.ts              # Entidad Task
│   │   └── issues.ts            # Entidad Issue
│   ├── scripts/
│   │   └── regenerateTables.ts  # Script para regenerar tablas
│   └── sql/
│       └── tables.sql           # SQL de referencia (legacy)
└── DATABASE_SCHEMA.md           # Este documento
```

---

## Consideraciones Importantes

### ⚠️ Eliminación en Cascada

- Al eliminar un proyecto, todas sus tareas e issues asociados se eliminan automáticamente
- Esto está configurado mediante `ON DELETE CASCADE` en las relaciones

### 🔒 Seguridad y Validación

- El campo `user_id` en `project` es obligatorio para garantizar que cada proyecto tenga un propietario
- Las validaciones de campos requeridos se realizan tanto a nivel de base de datos como en el código de la aplicación

### 📝 Campos Automáticos

- `createdAt` y `updatedAt` se gestionan automáticamente por TypeORM
- No es necesario establecerlos manualmente al crear registros

### 🔄 Sincronización

- En desarrollo, TypeORM sincroniza automáticamente el esquema
- En producción, se recomienda usar migraciones en lugar de `synchronize: true`

---

## Ejemplos de Uso

### Crear un Proyecto

```typescript
const project = projectRepository.create({
  title: "Mi Proyecto",
  description: "Descripción del proyecto",
  startDate: "2024-01-01",
  dueDate: "2024-12-31",
  userId: 1  // ID del usuario logueado
});

await projectRepository.save(project);
```

### Crear una Tarea en un Proyecto

```typescript
const task = taskRepository.create({
  title: "Tarea importante",
  description: "Descripción de la tarea",
  dueDate: "2024-06-30",
  status: TaskStatus.NEW,
  priority: TaskPriority.HIGH,
  project: project  // Referencia al proyecto
});

await taskRepository.save(task);
```

### Obtener Proyectos de un Usuario con sus Tareas e Issues

```typescript
const projects = await projectRepository.find({
  where: { userId: 1 },
  relations: ['tasks', 'issues']
});
```

---

## Conclusión

Este esquema de base de datos proporciona una estructura sólida para gestionar proyectos, tareas e issues, con relaciones claras y un sistema de propiedad basado en usuarios. Las tablas se generan automáticamente mediante TypeORM basándose en las entidades definidas, lo que facilita el mantenimiento y la evolución del esquema.

