import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Project } from "../entities/project";
import { Task } from "../entities/task";
import { Issue } from "../entities/issues";
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
    issues: project.issues
      ? project.issues.map((i) => ({
          ...i,
          dueDate: toDateString(i.dueDate),
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
    // Obtener el userId del query parameter
    const userId = req.query.userId ? Number(req.query.userId) : null;
    
    const projectRepository = AppDataSource.getRepository(Project);
    
    let projects;
    if (userId) {
      // Filtrar proyectos por userId
      projects = await projectRepository.find({
        where: { userId },
        relations: ['tasks', 'issues']
      });
    } else {
      // Si no se proporciona userId, retornar todos (compatibilidad hacia atrás)
      projects = await projectRepository.find({
        relations: ['tasks', 'issues']
      });
    }

    res.status(200).json({ success: true, data: projects.map(serializeProject) });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los proyectos",
      message2: error instanceof Error ? error.message : "Error desconocido",
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
    const userId = req.query.userId ? Number(req.query.userId) : null;
    
    const projectRepository = AppDataSource.getRepository(Project);

    const project = await projectRepository.findOne({
      where: { id: Number(id) },
      relations: ['tasks', 'issues']
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      });
    }

    // Si se proporciona userId, verificar que el proyecto pertenezca al usuario
    if (userId && project.userId && project.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a este proyecto",
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
      userId,
      tasks,
      issues
    } = req.body;

    // Validar campos requeridos
    if (!title || !startDate || !dueDate || !userId) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha de inicio, fecha límite y userId son requeridos",
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const taskRepository = AppDataSource.getRepository(Task);
    const issueRepository = AppDataSource.getRepository(Issue);

    // Crear el proyecto
    const newProject = projectRepository.create({
      title,
      description,
      startDate: normalizeDateInput(startDate),
      dueDate: normalizeDateInput(dueDate),
      userId: Number(userId),
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

        const newTask = taskRepository.create({
          title: taskData.title,
          description: taskData.description,
          notes: taskData.notes,
          dueDate: normalizeDateInput(taskData.dueDate),
          status: taskData.status || TaskStatus.NEW,
          priority: taskData.priority || TaskPriority.MEDIUM,
          project: savedProject,
        });

        await taskRepository.save(newTask);
      }
    }

    // Crear las issues si se proporcionan
    if (issues && issues.length > 0) {
      for (const issueData of issues) {
        // Validar campos requeridos de la issue
        if (!issueData.title || !issueData.dueDate) {
          return res.status(400).json({
            success: false,
            message: "Título y fecha límite son requeridos para cada issue",
          });
        }

        const newIssue = issueRepository.create({
          title: issueData.title,
          description: issueData.description,
          notes: issueData.notes,
          dueDate: normalizeDateInput(issueData.dueDate),
          status: issueData.status || TaskStatus.NEW,
          priority: issueData.priority || TaskPriority.MEDIUM,
          project: savedProject,
        });

        await issueRepository.save(newIssue);
      }
    }

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations = await projectRepository.findOne({
      where: { id: savedProject.id },
      relations: ['tasks', 'issues']
    });

    return res.status(201).json({ success: true, message: "Proyecto creado exitosamente", data: projectWithRelations ? serializeProject(projectWithRelations) : null });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el proyecto",
      error: error instanceof Error ? error.message : "Error desconocido",
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
    const { title, description, startDate, dueDate } = req.body;

    const projectRepository = AppDataSource.getRepository(Project);

    const project = await projectRepository.findOne({ where: { id: Number(id) } });
    if (!project) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
    }

    if (!title && !description && !startDate && !dueDate) {
      return res.status(400).json({ success: false, message: "Debe proporcionar al menos un campo para actualizar" });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = normalizeDateInput(startDate);
    if (dueDate) project.dueDate = normalizeDateInput(dueDate);

    // No permitir modificar los usuarios del proyecto
    // Los proyectos son de un único usuario y no se pueden cambiar

    await projectRepository.save(project);

    const projectWithRelations = await projectRepository.findOne({
      where: { id: project.id },
      relations: ["tasks", "issues"],
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
    const issueRepository = AppDataSource.getRepository(Issue);

    const project = await projectRepository.findOne({ where: { id: Number(id) } });
    if (!project) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
    }

    // Eliminar tareas del proyecto primero para evitar conflictos de FK
    const tasks = await taskRepository.find({ where: { project: { id: Number(id) } } });
    if (tasks.length > 0) {
      await taskRepository.remove(tasks);
    }

    // Eliminar issues del proyecto para evitar conflictos de FK
    const issues = await issueRepository.find({ where: { project: { id: Number(id) } } });
    if (issues.length > 0) {
      await issueRepository.remove(issues);
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
    } = req.body;

    // Validaciones básicas
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Título y fecha límite son requeridos",
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const taskRepository = AppDataSource.getRepository(Task);

    // Verificar que el proyecto exista
    const project = await projectRepository.findOne({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
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
      project,
    });

    const savedTask = await taskRepository.save(newTask);

    // Recuperar la tarea
    const taskWithRelations = await taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ["project"],
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

export const createProjectIssue = async (
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
    } = req.body;

    // Validaciones básicas
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Título y fecha límite son requeridos",
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const issueRepository = AppDataSource.getRepository(Issue);

    // Verificar que el proyecto exista
    const project = await projectRepository.findOne({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      });
    }

    // Crear la issue
    const newIssue = issueRepository.create({
      title,
      description,
      notes,
      dueDate: normalizeDateInput(dueDate),
      status: status || TaskStatus.NEW,
      priority: priority || TaskPriority.MEDIUM,
      project,
    });

    const savedIssue = await issueRepository.save(newIssue);

    // Recuperar la issue
    const issueWithRelations = await issueRepository.findOne({
      where: { id: savedIssue.id },
      relations: ["project"],
    });

    return res.status(201).json({ success: true, message: "Issue creada exitosamente en el proyecto", data: issueWithRelations ? { ...issueWithRelations, dueDate: toDateString(issueWithRelations.dueDate) } : null });
  } catch (error) {
    console.error("Error al crear issue en proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la issue en el proyecto",
    });
  }
};