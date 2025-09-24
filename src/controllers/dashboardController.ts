import { RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Project } from '../entities/project';
import { Task } from '../entities/task';
import { User } from '../entities/user';
import { TaskStatus } from '../interfaces/task';

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const taskRepo = AppDataSource.getRepository(Task);
    const userRepo = AppDataSource.getRepository(User);

    const [projectsCount, pendingTasksCount, completedTasksCount, usersCount] =
      await Promise.all([
        projectRepo.count(),
        taskRepo.count({
          where: [
            { status: TaskStatus.NEW },
            { status: TaskStatus.IN_PROGRESS },
            { status: TaskStatus.IN_REVIEW },
          ],
        }),
        taskRepo.count({ where: [{ status: TaskStatus.COMPLETED }, { status: TaskStatus.CLOSED }] }),
        userRepo.count(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        activeProjects: projectsCount,
        pendingTasks: pendingTasksCount,
        teamMembers: usersCount,
        completedTasks: completedTasksCount,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error getting dashboard stats' });
  }
};