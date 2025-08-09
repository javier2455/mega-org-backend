import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Project } from "../entities/project";
import { User } from "../entities/user";
import { Task } from "../entities/task";
import { TaskPriority, TaskStatus } from "../interfaces/task";

function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    // Asumimos formato YYYY-MM-DD
    return value.slice(0, 10);
  }
  const d = value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeDateInput(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function serializeProject(project: Project): any {
  return {
    ...project,
    startDate: toDateString(project.startDate),
    dueDate: toDateString(project.dueDate),
    tasks: project.tasks
      ? project.tasks.map((t) => ({
          ...t,
          dueDate: toDateString(t.dueDate),
        }))
      : [],
  };
}
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projects = await projectRepository.find({
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: ['users', 'tasks']
    });

    res.status(200).json({ success: true, data: projects.map(serializeProject) });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los proyectos",
    });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const projectRepository = AppDataSource.getRepository(Project);

    const project = await projectRepository.findOne({
      where: { id: Number(id) },
      relations: ['users', 'tasks', 'tasks.assignedTo']
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      });
    }

    res.status(200).json({ success: true, data: serializeProject(project) });
  } catch (error) {
    console.error("Error al obtener el proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el proyecto",
    });
  }
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      startDate,
      dueDate,
      userIds,
      tasks
    } = req.body;

    // Validar campos requeridos
    if (!title || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha de inicio y fecha límite son requeridos",
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);
    const taskRepository = AppDataSource.getRepository(Task);

    // Verificar que los usuarios existan si se proporcionan
    let users: User[] = [];
    if (userIds && userIds.length > 0) {
      users = await userRepository.findByIds(userIds);
      if (users.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: "Algunos usuarios no existen",
        });
      }
    }

    // Crear el proyecto
    const newProject = projectRepository.create({
      title,
      description,
      startDate: normalizeDateInput(startDate),
      dueDate: normalizeDateInput(dueDate),
      users,
    });

    const savedProject = await projectRepository.save(newProject);

    // Crear las tareas si se proporcionan
    if (tasks && tasks.length > 0) {
      for (const taskData of tasks) {
        // Validar campos requeridos de la tarea
        if (!taskData.title || !taskData.dueDate) {
          return res.status(400).json({
            success: false,
            message: "Título y fecha límite son requeridos para cada tarea",
          });
        }

        // Verificar que el usuario asignado esté en el proyecto
        if (taskData.assignedToId && !userIds.includes(taskData.assignedToId)) {
          return res.status(400).json({
            success: false,
            message: `El usuario ${taskData.assignedToId} no está asignado al proyecto`,
          });
        }

        const assignedUser = taskData.assignedToId 
          ? await userRepository.findOne({ where: { id: taskData.assignedToId } })
          : null;

        const newTask = taskRepository.create({
          title: taskData.title,
          description: taskData.description,
          notes: taskData.notes,
          dueDate: normalizeDateInput(taskData.dueDate),
          status: taskData.status || TaskStatus.NEW,
          priority: taskData.priority || TaskPriority.MEDIUM,
          ...(assignedUser && { assignedTo: assignedUser }),
          project: savedProject,
        });

        await taskRepository.save(newTask);
      }
    }

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations = await projectRepository.findOne({
      where: { id: savedProject.id },
      relations: ['users', 'tasks', 'tasks.assignedTo']
    });

    return res.status(201).json({ success: true, message: "Proyecto creado exitosamente", data: projectWithRelations ? serializeProject(projectWithRelations) : null });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el proyecto",
    });
  }
}; 

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, dueDate, userIds } = req.body;

    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);

    const project = await projectRepository.findOne({ where: { id: Number(id) }, relations: ["users"] });
    if (!project) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
    }

    if (!title && !description && !startDate && !dueDate && !userIds) {
      return res.status(400).json({ success: false, message: "Debe proporcionar al menos un campo para actualizar" });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = normalizeDateInput(startDate);
    if (dueDate) project.dueDate = normalizeDateInput(dueDate);

    if (Array.isArray(userIds)) {
      const users = await userRepository.findByIds(userIds);
      if (users.length !== userIds.length) {
        return res.status(400).json({ success: false, message: "Algunos usuarios no existen" });
      }
      project.users = users;
    }

    await projectRepository.save(project);

    const projectWithRelations = await projectRepository.findOne({
      where: { id: project.id },
      relations: ["users", "tasks", "tasks.assignedTo"],
    });

    return res.status(200).json({ success: true, message: "Proyecto actualizado", data: projectWithRelations ? serializeProject(projectWithRelations) : null });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    res.status(500).json({ success: false, message: "Error al actualizar el proyecto" });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const projectRepository = AppDataSource.getRepository(Project);
    const taskRepository = AppDataSource.getRepository(Task);

    const project = await projectRepository.findOne({ where: { id: Number(id) } });
    if (!project) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
    }

    // Eliminar tareas del proyecto primero para evitar conflictos de FK
    const tasks = await taskRepository.find({ where: { project: { id: Number(id) } } });
    if (tasks.length > 0) {
      await taskRepository.remove(tasks);
    }

    await projectRepository.remove(project);

    return res.status(200).json({ success: true, message: "Proyecto eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ success: false, message: "Error al eliminar el proyecto" });
  }
};

export const createProjectTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      notes,
      dueDate,
      status,
      priority,
      assignedToId,
    } = req.body;

    // Validaciones básicas
    if (!title || !dueDate || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha límite y usuario asignado son requeridos",
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);
    const taskRepository = AppDataSource.getRepository(Task);

    // Cargar proyecto con usuarios para validar pertenencia
    const project = await projectRepository.findOne({
      where: { id: Number(id) },
      relations: ["users"],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      });
    }

    // Verificar que el usuario exista
    const assignedUser = await userRepository.findOne({
      where: { id: Number(assignedToId) },
    });

    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: "El usuario asignado no existe",
      });
    }

    // Validar que el usuario asignado pertenezca al proyecto
    const projectUserIds = project.users.map((u) => u.id);
    if (!projectUserIds.includes(Number(assignedToId))) {
      return res.status(400).json({
        success: false,
        message: `El usuario ${assignedToId} no está asignado al proyecto`,
      });
    }

    // Crear la tarea
    const newTask = taskRepository.create({
      title,
      description,
      notes,
      dueDate: normalizeDateInput(dueDate),
      status: status || TaskStatus.NEW,
      priority: priority || TaskPriority.MEDIUM,
      assignedTo: assignedUser,
      project,
    });

    const savedTask = await taskRepository.save(newTask);

    // Recuperar con relaciones útiles
    const taskWithRelations = await taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ["assignedTo"],
    });

    return res.status(201).json({ success: true, message: "Tarea creada exitosamente en el proyecto", data: taskWithRelations ? { ...taskWithRelations, dueDate: toDateString(taskWithRelations.dueDate) } : null });
  } catch (error) {
    console.error("Error al crear tarea en proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la tarea en el proyecto",
    });
  }
};