import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Activity Log Schema - MongoDB document for logging user activities
 * Stores: uploads, views, deletions, failed actions
 */
@Schema({ timestamps: true })
export class ActivityLog extends Document {
  // Type of activity: upload, view, delete, share, failed_upload, etc.
  @Prop({ type: String, required: true, index: true })
  activityType: string;

  // User ID who performed the action
  @Prop({ type: String, required: true, index: true })
  userId: string;

  // Username for easier queries
  @Prop({ type: String, required: true })
  userName: string;

  // Asset ID (if applicable)
  @Prop({ type: String, required: false, index: true })
  assetId: string;

  // Asset filename
  @Prop({ type: String, required: false })
  assetFilename: string;

  // IP address of the request
  @Prop({ type: String, required: false })
  ipAddress: string;

  // User agent (browser/client info)
  @Prop({ type: String, required: false })
  userAgent: string;

  // Additional metadata
  @Prop({ type: Object, required: false })
  metadata: Record<string, any>;

  // Error details if action failed
  @Prop({ type: String, required: false })
  errorMessage: string;

  // Duration in milliseconds (for performance tracking)
  @Prop({ type: Number, required: false })
  duration: number;

  // MongoDB auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Indexes for faster queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ activityType: 1, createdAt: -1 });
ActivityLogSchema.index({ assetId: 1, createdAt: -1 });
