import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';

/**
 * Database Seed Script - Creates initial roles
 * Run: npm run seed
 */
export async function seedDatabase(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  // Create admin role
  const adminRole = roleRepository.create({
    name: 'admin',
    description: 'Administrator with full system access',
  });

  // Create user role
  const userRole = roleRepository.create({
    name: 'user',
    description: 'Regular user with upload and manage permissions',
  });

  // Create viewer role (optional, if needed)
  const viewerRole = roleRepository.create({
    name: 'viewer',
    description: 'View-only access to shared assets',
  });

  // Save roles if they don't exist
  await roleRepository
    .save(adminRole)
    .catch(() => console.log('Admin role already exists'));
  await roleRepository
    .save(userRole)
    .catch(() => console.log('User role already exists'));
  await roleRepository
    .save(viewerRole)
    .catch(() => console.log('Viewer role already exists'));

  console.log('Database seeded successfully!');
}
