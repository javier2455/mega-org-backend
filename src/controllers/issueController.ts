import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Issue } from "../entities/issues";
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

export const getIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const issueRepository = AppDataSource.getRepository(Issue);
    const issues = await issueRepository.find({
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
    res.status(200).json({ success: true, data: issues.map((i) => ({ ...i, dueDate: toDateString(i.dueDate) })) });
  } catch (error) {
    console.error("Error al obtener issues:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las issues",
    });
  }
};

export const getIssueById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const issueRepository = AppDataSource.getRepository(Issue);
    const issue = await issueRepository.findOne({
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

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue no encontrada",
      });
    }

    return res.status(200).json({ success: true, data: issue ? { ...issue, dueDate: toDateString(issue.dueDate) } : null });
  } catch (error) {
    next(error);
  }
};

export const createIssue = async (
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

    // Crear la issue con vínculo al proyecto
    const issueRepository = AppDataSource.getRepository(Issue);
    const newIssue = issueRepository.create({
      description,
      dueDate: normalizeDateInput(dueDate),
      status: status,
      priority: priority,
      title,
      notes: notes || "",
      assignedTo: assignedUser,
      project,
    });

    const savedIssue = await issueRepository.save(newIssue);
    return res.status(201).json({ success: true, message: "Issue creada exitosamente", data: savedIssue });
  } catch (error) {
    console.error("Error al crear issue:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la issue",
    });
  }
};

export const updateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const issueRepository = AppDataSource.getRepository(Issue);
    const issue = await issueRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["project"],
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue no encontrada",
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
    if (title) issue.title = title;
    if (description) issue.description = description;
    if (notes) issue.notes = notes;
    if (dueDate) issue.dueDate = normalizeDateInput(dueDate);
    if (status) issue.status = status;
    if (priority) issue.priority = priority;
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
      // Validar pertenencia del usuario al proyecto de la issue
      const projectRepository = AppDataSource.getRepository(Project);
      const project = await projectRepository.findOne({ where: { id: issue.project.id }, relations: ["users"] });
      if (!project) {
        return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
      }
      const projectUserIds = project.users.map((u) => u.id);
      if (!projectUserIds.includes(Number(assignedToId))) {
        return res.status(400).json({
          success: false,
          message: `El usuario ${assignedToId} no está asignado al proyecto de esta issue`,
        });
      }
      issue.assignedTo = assignedUser;
    }

    const updatedIssue = await issueRepository.save(issue);
    return res.status(200).json({ success: true, message: "Issue actualizada exitosamente", data: updatedIssue });
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const issueRepository = AppDataSource.getRepository(Issue);
    const issue = await issueRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue no encontrada",
      });
    }

    await issueRepository.remove(issue);

    return res.status(200).json({
      success: true,
      message: "Issue eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

