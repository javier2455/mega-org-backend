import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Task } from "../entities/task";
import { User } from "../entities/user";
import { TaskPriority, TaskStatus } from "../interfaces/task";

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        dueDate: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: ['assignedTo']
    });
    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las tareas",
    });
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        dueDate: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: parseInt(id) },
      relations: ['assignedTo']
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      notes,
      dueDate,
      status,
      priority,
      assignedToId,
    } = req.body;

    // Validar campos requeridos
    if (!title || !dueDate || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha límite y usuario asignado son requeridos",
      });
    }

    // Verificar que el usuario exista
    const userRepository = AppDataSource.getRepository(User);
    const assignedUser = await userRepository.findOne({ where: { id: assignedToId } });

    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: "El usuario asignado no existe",
      });
    }
    
    // Crear la tarea
    const taskRepository = AppDataSource.getRepository(Task);
    const newTask = taskRepository.create({
      description,
      dueDate,
      status: status,
      priority: priority,
      title,
      notes: notes || "",
      assignedTo: assignedUser,
    });

    const savedTask = await taskRepository.save(newTask);

    return res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente",
      data: savedTask,
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la tarea",
    });
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    const { title, description, notes, dueDate, status, priority, assignedToId } = req.body;

    // Verificar que al menos un campo esté presente para actualizar
    if (!title && !description && !notes && !dueDate && !status && !priority && !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    // Actualizar solo los campos que se proporcionaron
    if (title) task.title = title;
    if (description) task.description = description;
    if (notes) task.notes = notes;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedToId) {
      const userRepository = AppDataSource.getRepository(User);
      const assignedUser = await userRepository.findOne({
        where: { id: parseInt(assignedToId) },
      });
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario asignado no encontrado",
        });
      }
      task.assignedTo = assignedUser;
    }

    const updatedTask = await taskRepository.save(task);

    return res.status(200).json({
      success: true,
      message: "Tarea actualizada exitosamente",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    await taskRepository.remove(task);

    return res.status(200).json({
      success: true,
      message: "Tarea eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};




