// Puede reutilizar los enums de task
import { TaskStatus, TaskPriority } from "./task";

// Esta interfaz es idéntica a la de Task, pero separada por claridad
export interface IIssue {
  id: number;
  title: string;
  description?: string;
  notes?: string;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: any; // o User si importas la entidad
  project?: any; // o Project si importas la entidad
  createdAt: Date;
  updatedAt: Date;
}
