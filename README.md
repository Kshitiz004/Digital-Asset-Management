# Digital Asset Management & Notification System

A complete full-stack application for managing and sharing digital assets with cloud storage, webhook notifications, and role-based access control. Features a beautiful Next.js dashboard with interactive analytics charts.

## 🚀 Project Overview

This project demonstrates enterprise-grade backend development skills including:
- Multi-database architecture (PostgreSQL + MongoDB)
- JWT authentication with Google OAuth
- Role-based access control (RBAC)
- AWS S3 integration for cloud storage
- Webhook system with retry mechanisms
- Docker containerization
- CI/CD pipeline with GitHub Actions
- Modern frontend with Next.js and analytics charts

## 📁 Project Structure

```
project/
├── dam-backend/              # NestJS Backend API
│   ├── src/
│   │   ├── auth/            # Authentication (JWT, OAuth, Guards)
│   │   ├── assets/          # Asset management endpoints
│   │   ├── analytics/       # Analytics and dashboard endpoints
│   │   ├── users/           # User management (Admin only)
│   │   ├── services/        # S3, Logger, Webhook services
│   │   ├── entities/        # PostgreSQL entities (Users, Assets, Roles)
│   │   ├── schemas/         # MongoDB schemas (Activity logs)
│   │   └── config/          # Database configurations
│   ├── docker-compose.yml   # Docker services setup
│   ├── Dockerfile           # Production container
│   └── README.md            # Backend documentation
│
├── dam-frontend/            # Next.js Frontend Dashboard
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   │   ├── LoginForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AssetUpload.tsx
│   │   ├── AssetList.tsx
│   │   └── Analytics.tsx    # Charts and statistics
│   ├── lib/                 # API client
│   └── README.md            # Frontend documentation
│
└── README.md                # This file
```

## ✨ Key Features

### Backend
- **Authentication**: JWT tokens with email/password and Google OAuth
- **Authorization**: Role-based access control (Admin, User, Viewer)
- **Asset Management**: Upload to AWS S3, metadata in PostgreSQL
- **Webhooks**: Event notifications with exponential backoff retries
- **Logging**: MongoDB-based activity tracking
- **Analytics**: System-wide and personal statistics
- **Documentation**: Swagger/OpenAPI at `/api`

### Frontend
- **Dashboard**: Modern UI with Tailwind CSS
- **Analytics Charts**: 
  - Pie charts for asset distribution
  - Bar charts for system statistics
  - Activity timelines
- **Asset Management**: Upload, view, download, share, delete
- **Responsive**: Mobile and desktop support
- **Real-time Updates**: Auto-refresh on changes

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Databases**: PostgreSQL 15, MongoDB 7
- **Auth**: Passport.js, JWT, Google OAuth 2.0
- **Storage**: AWS S3
- **Deployment**: Docker, docker-compose, AWS EC2
- **CI/CD**: GitHub Actions

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP**: Axios
- **Language**: TypeScript

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- MongoDB 7+
- Docker (optional)
- AWS Account with S3 bucket

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd digital-asset-management
```

#### 2. Setup Backend
```bash
cd dam-backend
npm install

# Create .env file from example
cp .env.example .env
# Edit .env with your actual credentials:
# - Database credentials (PostgreSQL & MongoDB)
# - JWT secret key
# - Google OAuth credentials (from Google Cloud Console)
# - AWS S3 credentials (from AWS Console)
# - Application settings

# Start databases with Docker
docker-compose up -d postgres mongodb

# Seed database (creates roles)
npm run seed

# Start development server
npm run start:dev
```

Backend will be running at `http://localhost:3000`
Swagger docs: `http://localhost:3000/api`

#### 3. Setup Frontend
```bash
cd dam-frontend
npm install

# Create .env.local from example
cp .env.example .env.local
# Edit .env.local with your backend API URL (default: http://localhost:3000)

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:3001`

### Docker (Alternative)

```bash
# Start everything with Docker
cd dam-backend
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📚 API Documentation

### Swagger UI (Interactive)
Once backend is running, visit:
- **Swagger UI**: http://localhost:3000/api
- **API Base**: http://localhost:3000

Swagger provides interactive API documentation where you can:
- View all endpoints
- Test API calls directly from the browser
- See request/response schemas
- Authenticate with JWT tokens

### Postman Collection
Import the Postman collection for API testing:
- **Location**: `dam-backend/postman-collection.json`
- **How to import**: 
  1. Open Postman
  2. Click "Import"
  3. Select `postman-collection.json`
  4. Set `base_url` variable to your backend URL
  5. Use Login/Register endpoints to get `access_token` (automatically saved)

The collection includes:
- All authentication endpoints
- Asset management endpoints
- Analytics endpoints
- User management endpoints (Admin)
- Pre-configured bearer token authentication

### Key Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/google` - Google OAuth
- `GET /auth/profile` - Get current user

**Assets**
- `POST /assets` - Upload file
- `GET /assets` - Get user assets
- `GET /assets/all` - Get all assets (Admin)
- `GET /assets/:id/download` - Get download URL
- `PUT /assets/:id` - Update metadata
- `DELETE /assets/:id` - Delete asset
- `POST /assets/:id/share` - Share publicly

**Analytics**
- `GET /analytics/user` - User analytics
- `GET /analytics/admin` - System analytics (Admin)

**Users (Admin)**
- `GET /users` - List all users
- `DELETE /users/:id` - Delete user

## 👥 Roles & Permissions

### Admin
- Full system access
- View all users and assets
- Delete any asset
- System-wide analytics
- Manage users

### User
- Upload/manage own assets
- View own assets
- Delete own assets
- Personal analytics
- Share assets

### Viewer
- View/download shared assets only

## 📊 Analytics Dashboard

### User Analytics
- Storage usage statistics
- Asset type distribution (Pie chart)
- Recent activity timeline
- Upload/delete counts

### Admin Analytics
- System-wide storage usage
- Most active users (Bar chart)
- Total uploads/deletions
- Overall system health

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Webhook signature verification
- CORS configuration
- Input validation with DTOs
- SQL injection prevention (TypeORM)
- XSS protection

## 🧪 Testing

```bash
# Backend tests
cd dam-backend
npm run test
npm run test:e2e

# Frontend build
cd dam-frontend
npm run build
```

## 🚀 Deployment

### AWS EC2

1. **Setup EC2 Instance**
```bash
ssh -i key.pem ec2-user@your-ec2-ip
sudo yum install docker -y
sudo service docker start
```

2. **Deploy Backend**
```bash
cd dam-backend
docker-compose up -d
```

3. **Frontend** - Deploy to Vercel/Netlify or build and serve with Nginx

### CI/CD

GitHub Actions automatically:
- Runs tests on push/PR
- Builds Docker images on main branch
- Deploys to EC2 (configure secrets)

## 📖 Code Quality

- Clean, modular architecture
- Comprehensive code comments
- Type safety with TypeScript
- ESLint + Prettier
- Separation of concerns
- RESTful API design

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License

## 🙏 Acknowledgments

- NestJS team for amazing framework
- Next.js team for great React framework
- All open-source contributors

## 📧 Support

For issues or questions:
- Open an issue in the repository
- Check documentation in `dam-backend/README.md` and `dam-frontend/README.md`

---

**Built with ❤️ to demonstrate modern full-stack development practices**


