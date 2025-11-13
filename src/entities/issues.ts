import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { TaskPriority, TaskStatus } from "../interfaces/task";
import { Project } from "./project";

@Entity()
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: "date" })
  dueDate: string;

  @Column({
    type: "enum",
    enum: TaskStatus,
    default: TaskStatus.NEW,
  })
  status: TaskStatus;

  @Column({
    type: "enum",
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
