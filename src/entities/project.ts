import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, JoinTable } from "typeorm";
import { User } from "./user";
import { Task } from "./task";

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @ManyToMany(() => User)
  @JoinTable({
    name: "project_users",
    joinColumn: { name: "project_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" }
  })
  users: User[];

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 