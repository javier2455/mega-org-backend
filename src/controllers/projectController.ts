import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Project } from "../entities/project";
import { User } from "../entities/user";
import { Task } from "../entities/task";
import { In } from "typeorm";

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
      taskIds
    } = req.body;

    // Validar campos requeridos
    if (!title || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha de inicio y fecha de entrega son requeridos",
      });
    }

    // Validar fechas
    if (new Date(startDate) > new Date(dueDate)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de inicio debe ser anterior a la fecha de entrega",
      });
    }

    // Crear el proyecto
    const projectRepository = AppDataSource.getRepository(Project);
    const newProject = projectRepository.create({
      title,
      description,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate)
    });

    // Manejar usuarios si se proporcionan
    if (userIds && userIds.length > 0) {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.findBy({ id: In(userIds) });
      
      if (users.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: "Algunos usuarios no existen",
        });
      }
      
      newProject.users = users;
    }

    // Manejar tareas si se proporcionan
    if (taskIds && taskIds.length > 0) {
      const taskRepository = AppDataSource.getRepository(Task);
      const tasks = await taskRepository.find({
        where: { id: In(taskIds) },
        relations: ['project']
      });
      
      if (tasks.length !== taskIds.length) {
        return res.status(400).json({
          success: false,
          message: "Algunas tareas no existen",
        });
      }

      // Verificar que las tareas no estén en otro proyecto
      const tasksInOtherProjects = tasks.filter(task => task.project);
      if (tasksInOtherProjects.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Algunas tareas ya están asignadas a otros proyectos",
        });
      }

      newProject.tasks = tasks;
    }

    const savedProject = await projectRepository.save(newProject);

    return res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      data: savedProject,
    });

  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el proyecto",
    });
  }
}; 