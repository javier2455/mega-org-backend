import { User } from "../entities/user";
import { Task } from "../entities/task";

export interface IProject {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  users: User[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProjectTask {
  title: string;
  description?: string;
  notes?: string;
  dueDate: Date;
  status?: 'new' | 'pending' | 'in_progress' | 'completed' | 'in_review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedToId?: number;
}

export interface ICreateProject {
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  userIds?: number[];
  tasks?: ICreateProjectTask[];
}

export interface IUpdateProject {
  title?: string;
  description?: string;
  startDate?: Date;
  dueDate?: Date;
  userIds?: number[];
} 