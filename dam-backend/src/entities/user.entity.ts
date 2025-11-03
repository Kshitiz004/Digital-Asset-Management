import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Asset } from './asset.entity';

/**
 * User Entity - Stores user information and authentication data
 */
@Entity('users')
export class User {
  // Primary key: auto-generated ID
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Email (unique) - used for login
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Password (hashed) - nullable for OAuth users
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  // User's full name
  @Column({ type: 'varchar', length: 255 })
  name: string;

  // Google OAuth ID - nullable for email/password users
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string;

  // Profile picture URL from Google
  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture: string;

  // Foreign key to roles table
  @Column({ type: 'varchar', length: 50 })
  roleName: string;

  // Relationship: Many users belong to one role
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleName' })
  role: Role;

  // Relationship: One user can have many assets
  @OneToMany(() => Asset, (asset) => asset.uploader)
  assets: Asset[];

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
