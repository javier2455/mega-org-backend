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

export interface ICreateProject {
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  userIds?: number[];
}

export interface IUpdateProject {
  title?: string;
  description?: string;
  startDate?: Date;
  dueDate?: Date;
  userIds?: number[];
} 