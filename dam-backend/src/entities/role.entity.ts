import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

/**
 * Role Entity - Defines user roles in the system
 * Three roles: Admin, User, Viewer
 */
@Entity('roles')
export class Role {
  // Primary key: role name (admin, user, viewer)
  @PrimaryColumn({ type: 'varchar', length: 50 })
  name: string;

  // Role description
  @Column({ type: 'text', nullable: true })
  description: string;

  // One role can belong to many users
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  // Timestamps
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

