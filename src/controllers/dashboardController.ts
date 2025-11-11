import { RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Project } from '../entities/project';
import { Task } from '../entities/task';
import { TaskStatus } from '../interfaces/task';

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    // Obtener el userId del query parameter
    const userId = req.query.userId ? Number(req.query.userId) : null;
    
    const projectRepo = AppDataSource.getRepository(Project);
    const taskRepo = AppDataSource.getRepository(Task);

    let projectsCount, pendingTasksCount, completedTasksCount;

    if (userId) {
      // Filtrar por proyectos del usuario
      [projectsCount, pendingTasksCount, completedTasksCount] = await Promise.all([
        projectRepo.count({ where: { userId } }),
        taskRepo
          .createQueryBuilder('task')
          .leftJoin('task.project', 'project')
          .where('project.userId = :userId', { userId })
          .andWhere('task.status IN (:...statuses)', {
            statuses: [TaskStatus.NEW, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW],
          })
          .getCount(),
        taskRepo
          .createQueryBuilder('task')
          .leftJoin('task.project', 'project')
          .where('project.userId = :userId', { userId })
          .andWhere('task.status IN (:...statuses)', {
            statuses: [TaskStatus.COMPLETED, TaskStatus.CLOSED],
          })
          .getCount(),
      ]);
    } else {
      // Si no se proporciona userId, retornar todos (compatibilidad hacia atrás)
      [projectsCount, pendingTasksCount, completedTasksCount] = await Promise.all([
        projectRepo.count(),
        taskRepo.count({
          where: [
            { status: TaskStatus.NEW },
            { status: TaskStatus.IN_PROGRESS },
            { status: TaskStatus.IN_REVIEW },
          ],
        }),
        taskRepo.count({ where: [{ status: TaskStatus.COMPLETED }, { status: TaskStatus.CLOSED }] }),
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        activeProjects: projectsCount,
        pendingTasks: pendingTasksCount,
        teamMembers: 1, // Ya no hay múltiples usuarios, siempre es 1
        completedTasks: completedTasksCount,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error getting dashboard stats' });
  }
};