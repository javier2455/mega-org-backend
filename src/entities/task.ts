import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user';
import { TaskPriority, TaskStatus } from '../interfaces/task';


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
    dueDate: Date;

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

    @ManyToOne(() => User, user => user.tasks)
    assignedTo: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 