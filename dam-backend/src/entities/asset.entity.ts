import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Asset Entity - Stores digital asset metadata
 * Actual files are stored in AWS S3
 */
@Entity('assets')
export class Asset {
  // Primary key: auto-generated ID
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Original filename from upload
  @Column({ type: 'varchar', length: 255 })
  filename: string;

  // S3 bucket key (unique path in S3)
  @Column({ type: 'varchar', length: 500, unique: true })
  s3Key: string;

  // S3 bucket name
  @Column({ type: 'varchar', length: 255 })
  bucket: string;

  // File size in bytes
  @Column({ type: 'bigint' })
  size: number;

  // MIME type (e.g., image/jpeg, application/pdf)
  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  // Asset type categorization (image, document, video, audio, other)
  @Column({ type: 'varchar', length: 50, default: 'other' })
  assetType: string;

  // Comma-separated tags for search/filtering
  @Column({ type: 'text', nullable: true })
  tags: string;

  // Foreign key to users table (who uploaded this)
  @Column({ type: 'uuid' })
  uploaderId: string;

  // Relationship: Many assets belong to one user
  @ManyToOne(() => User, (user) => user.assets)
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;

  // Whether this asset is shared publicly
  @Column({ type: 'boolean', default: false })
  isShared: boolean;

  // Shared URL if asset is publicly accessible
  @Column({ type: 'varchar', length: 500, nullable: true })
  sharedUrl: string;

  // Description of the asset
  @Column({ type: 'text', nullable: true })
  description: string;

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
