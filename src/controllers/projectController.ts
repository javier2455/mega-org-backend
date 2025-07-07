import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Project } from "../entities/project";
import { User } from "../entities/user";
import { Task } from "../entities/task";
import { TaskPriority, TaskStatus } from "../interfaces/task";

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

    res.status(200).json({
      success: true,
      data: projects,
    });
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

    res.status(200).json({
      success: true,
      data: project,
    });
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
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      users
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
          dueDate: new Date(taskData.dueDate),
          status: taskData.status || TaskStatus.NEW,
          priority: taskData.priority || TaskPriority.MEDIUM,
          ...(assignedUser && { assignedTo: assignedUser }),
          project: savedProject
        });

        await taskRepository.save(newTask);
      }
    }

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations = await projectRepository.findOne({
      where: { id: savedProject.id },
      relations: ['users', 'tasks', 'tasks.assignedTo']
    });

    return res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      data: projectWithRelations,
    });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el proyecto",
    });
  }
}; 