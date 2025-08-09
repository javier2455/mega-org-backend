import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { TaskPriority, TaskStatus } from '../interfaces/task';
import { Project } from './project';


@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;
    
    @Column({ nullable: true })
    notes: string;

    @Column({ type: 'date' })
    dueDate: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.NEW
    })
    status: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM
    })
    priority: TaskPriority;

    @ManyToOne(() => User)
    @JoinColumn({ name: "assigned_to_id" })
    assignedTo: User;

    @ManyToOne(() => Project, project => project.tasks)
    @JoinColumn({ name: "project_id" })
    project: Project;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 