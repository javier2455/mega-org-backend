import { User } from "../entities/user";
import { Task } from "../entities/task";
import { Issue } from "../entities/issues";

export interface IProject {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  users: User[];
  tasks: Task[];
  issues: Issue[]; // <-- NUEVO
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProjectTask {
  title: string;
  description?: string;
  notes?: string;
  dueDate: Date;
  status?: "new" | "in_progress" | "completed" | "in_review" | "done";
  priority?: "low" | "medium" | "high" | "critical";
  assignedToId?: number;
}

export interface ICreateProjectIssue {
  title: string;
  description?: string;
  notes?: string;
  dueDate: Date;
  status?: "new" | "in_progress" | "completed" | "in_review" | "closed";
  priority?: "low" | "medium" | "high" | "critical";
  assignedToId?: number;
}

export interface ICreateProject {
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  userIds?: number[];
  tasks?: ICreateProjectTask[];
  issues?: ICreateProjectIssue[];
}

export interface IUpdateProject {
  title?: string;
  description?: string;
  startDate?: Date;
  dueDate?: Date;
  userIds?: number[];
}
