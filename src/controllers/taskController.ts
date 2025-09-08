import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Task } from "../entities/task";
import { User } from "../entities/user";
import { Project } from "../entities/project";
function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
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
      relations: ['assignedTo', 'project']
    });
    res.status(200).json({ success: true, data: tasks.map((t) => ({ ...t, dueDate: toDateString(t.dueDate) })) });
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
      relations: ['assignedTo', 'project']
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    return res.status(200).json({ success: true, data: task ? { ...task, dueDate: toDateString(task.dueDate) } : null });
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
      projectId,
    } = req.body;

    // Validar campos requeridos
    if (!title || !dueDate || !assignedToId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Título, fecha límite, usuario asignado y proyecto son requeridos",
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
    
    // Validar proyecto y pertenencia del usuario al proyecto
    const projectRepository = AppDataSource.getRepository(Project);
    const project = await projectRepository.findOne({ where: { id: Number(projectId) }, relations: ["users"] });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      });
    }

    const projectUserIds = project.users.map((u) => u.id);
    if (!projectUserIds.includes(Number(assignedToId))) {
      return res.status(400).json({
        success: false,
        message: `El usuario ${assignedToId} no está asignado al proyecto`,
      });
    }

    // Crear la tarea con vínculo al proyecto
    const taskRepository = AppDataSource.getRepository(Task);
    const newTask = taskRepository.create({
      description,
      dueDate: normalizeDateInput(dueDate),
      status: status,
      priority: priority,
      title,
      notes: notes || "",
      assignedTo: assignedUser,
      project,
    });

    const savedTask = await taskRepository.save(newTask);
    return res.status(201).json({ success: true, message: "Tarea creada exitosamente", data: savedTask });
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
      relations: ["project"],
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
    if (dueDate) task.dueDate = normalizeDateInput(dueDate);
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
      // Validar pertenencia del usuario al proyecto de la tarea
      const projectRepository = AppDataSource.getRepository(Project);
      const project = await projectRepository.findOne({ where: { id: task.project.id }, relations: ["users"] });
      if (!project) {
        return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
      }
      const projectUserIds = project.users.map((u) => u.id);
      if (!projectUserIds.includes(Number(assignedToId))) {
        return res.status(400).json({
          success: false,
          message: `El usuario ${assignedToId} no está asignado al proyecto de esta tarea`,
        });
      }
      task.assignedTo = assignedUser;
    }

    const updatedTask = await taskRepository.save(task);
    return res.status(200).json({ success: true, message: "Tarea actualizada exitosamente", data: updatedTask });
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




