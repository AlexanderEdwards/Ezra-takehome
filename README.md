# Todo Management System - Full Stack Application

A comprehensive todo management application built with .NET Core Web API backend and React TypeScript frontend. This project demonstrates modern full-stack development practices with authentication, data persistence, and a responsive user interface.

## 🏗️ Architecture Overview

### Backend (.NET Core 9.0)
- **Framework**: ASP.NET Core Web API
- **Database**: SQLite with Entity Framework Core
- **Authentication**: JWT Bearer tokens with ASP.NET Core Identity
- **Logging**: Serilog with console and file sinks
- **Validation**: FluentValidation
- **Documentation**: Swagger/OpenAPI

### Frontend (React 18 + TypeScript)
- **Framework**: React with TypeScript
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) + Context API
- **UI Framework**: Tailwind CSS
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## 🚀 Features

### Core Functionality
- ✅ User registration and authentication
- ✅ JWT-based secure API access
- ✅ CRUD operations for todos and categories
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Due dates with overdue detection
- ✅ Category-based organization
- ✅ Search and filtering capabilities
- ✅ Pagination for large datasets
- ✅ Responsive design

### Production MVP Features
- ✅ User dashboard with statistics
- ✅ Advanced filtering (by status, priority, category, date range)
- ✅ Sorting capabilities
- ✅ Real-time form validation
- ✅ Error handling and user feedback
- ✅ Loading states and optimistic updates
- ✅ Secure authentication flow
- ✅ Database seeding with demo data

## ⚡ Quick Start

1. **Trust HTTPS Certificate**: `dotnet dev-certs https --trust`
2. **Start API**: `cd TodoApi && dotnet run`
3. **Start Frontend**: `cd todo-frontend && npm install && npm start`
4. **Login**: Use `admin@todoapp.com` / `Admin123!`

## 🛠️ Detailed Setup Instructions

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+ and npm
- Git

### Backend Setup

1. **Navigate to the API directory**:
   ```bash
   cd TodoApi
   ```

2. **Restore dependencies**:
   ```bash
   dotnet restore
   ```

3. **Trust the HTTPS development certificate** (Required for HTTPS):
   ```bash
   dotnet dev-certs https --trust
   ```
   This will install the .NET development certificate in your system's trusted certificate store.

4. **Run the application**:
   ```bash
   dotnet run
   ```

   The API will be available at:
   - HTTPS: `https://localhost:7001` (Primary - Secure)
   - HTTP: `http://localhost:5001` (Fallback)
   - Swagger UI: `https://localhost:7001` (in development)

4. **Database**: SQLite database (`todoapp.db`) will be created automatically with demo data:
   - Demo user: `admin@todoapp.com` / `Admin123!`
   - Sample categories: Work, Personal

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd todo-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Backend Configuration (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=todoapp.db"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForProduction",
    "Issuer": "TodoApi",
    "Audience": "TodoApp",
    "ExpirationHours": "24"
  }
}
```

### Frontend Configuration
The application automatically uses HTTP for development and HTTPS for production. 

For custom configuration, create a `.env` file in the `todo-frontend` directory:
```env
# For development (optional - defaults to HTTP)
REACT_APP_API_URL=http://localhost:5001/api

# For production (use HTTPS)
REACT_APP_API_URL=https://your-api-domain.com/api
```

**SSL Certificate Setup for Development:**
The application uses HTTPS by default. To avoid certificate errors:
```bash
dotnet dev-certs https --trust
```

**Troubleshooting Certificate Issues:**
- **macOS/Linux**: Run the trust command above and enter your password when prompted
- **Windows**: Run as Administrator: `dotnet dev-certs https --trust`
- **Still having issues?**: Clear and recreate certificates:
  ```bash
  dotnet dev-certs https --clean
  dotnet dev-certs https --trust
  ```

## 🧪 Testing HTTP Fallback

To test the HTTP fallback functionality:

### **Method 1: Environment Variable**
```bash
# Test HTTP fallback
cp .env.http .env
npm start

# Test HTTPS (normal)
cp .env.https .env
npm start
```

### **Method 2: Direct URL Override**
```bash
# Start with HTTP
REACT_APP_API_URL=http://localhost:5001/api npm start

# Start with HTTPS
REACT_APP_API_URL=https://localhost:7001/api npm start
```

### **Method 3: Browser Testing**
1. Start API with both endpoints: `dotnet run --urls="https://localhost:7001;http://localhost:5001"`
2. Test HTTPS: Open `https://localhost:7001` in browser
3. Test HTTP: Open `http://localhost:5001` in browser
4. Frontend automatically uses HTTPS by default, HTTP when specified

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/validate-token` - Validate JWT token

### Todos
- `GET /api/todo` - Get paginated todos with filtering
- `GET /api/todo/{id}` - Get specific todo
- `POST /api/todo` - Create new todo
- `PUT /api/todo/{id}` - Update todo
- `DELETE /api/todo/{id}` - Delete todo
- `PATCH /api/todo/{id}/toggle` - Toggle completion status
- `GET /api/todo/stats` - Get user statistics

### Categories
- `GET /api/categories` - Get user categories
- `GET /api/categories/{id}` - Get specific category
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

## 🏛️ Database Schema

### Users (ASP.NET Core Identity)
- Standard Identity fields + FirstName, LastName, CreatedAt, UpdatedAt

### Categories
- Id, Name, Description, Color, UserId, CreatedAt, UpdatedAt

### TodoItems
- Id, Title, Description, IsCompleted, Priority, DueDate, UserId, CategoryId
- CreatedAt, UpdatedAt, CompletedAt

## 🎯 Design Decisions & Trade-offs

### Technology Choices

**Backend: .NET Core**
- ✅ Strong typing and performance
- ✅ Excellent tooling and debugging
- ✅ Built-in dependency injection
- ✅ Comprehensive security features
- ❌ Larger deployment footprint than Node.js

**Frontend: React + TypeScript**
- ✅ Strong ecosystem and community
- ✅ Type safety with TypeScript
- ✅ Component reusability
- ✅ Excellent developer experience
- ❌ Bundle size larger than vanilla JS

**Database: SQLite**
- ✅ Zero-config, file-based database
- ✅ Perfect for development and demos
- ✅ ACID compliance
- ❌ Limited concurrent writes
- ❌ Not suitable for high-traffic production

### Architecture Patterns

**Repository Pattern**: Not implemented to keep the codebase simple. Services directly use Entity Framework contexts.

**CQRS**: Not implemented due to application simplicity. Could be beneficial for complex business logic.

**Clean Architecture**: Partially implemented with clear separation between models, services, and controllers.

## 🚀 Scalability Considerations

### Current Limitations
1. **Database**: SQLite is not suitable for high-concurrency production environments
2. **Authentication**: Simple JWT without refresh tokens
3. **File Storage**: No file upload capabilities
4. **Real-time**: No WebSocket/SignalR implementation
5. **Caching**: No Redis or memory caching

### Recommended Production Improvements

#### Backend
1. **Database Migration**: 
   - Move to PostgreSQL or SQL Server
   - Implement database migrations
   - Add connection pooling

2. **Authentication Enhancements**:
   - Implement refresh tokens
   - Add OAuth2/OpenID Connect
   - Multi-factor authentication

3. **Performance Optimizations**:
   - Add Redis caching
   - Implement CQRS for complex queries
   - Add background job processing (Hangfire)

4. **Monitoring & Observability**:
   - Application Insights or similar
   - Health checks
   - Distributed tracing

#### Frontend
1. **State Management**: 
   - Consider Redux Toolkit for complex state
   - Implement optimistic updates

2. **Performance**:
   - Code splitting and lazy loading
   - Virtual scrolling for large lists
   - Service worker for offline support

3. **User Experience**:
   - Progressive Web App (PWA) features
   - Push notifications
   - Dark mode support

#### Infrastructure
1. **Containerization**: Docker containers for consistent deployments
2. **CI/CD**: GitHub Actions or Azure DevOps
3. **Cloud Deployment**: Azure App Service or AWS ECS
4. **CDN**: CloudFlare or Azure CDN for static assets

## 🧪 Future Feature Roadmap

### Phase 1 (Immediate)
- [ ] Complete todo dashboard with full CRUD
- [ ] Advanced filtering and search
- [ ] Drag-and-drop todo reordering
- [ ] Bulk operations (mark all complete, delete multiple)

### Phase 2 (Short-term)
- [ ] Real-time updates with SignalR
- [ ] File attachments for todos
- [ ] Todo templates and recurring tasks
- [ ] Team collaboration features

### Phase 3 (Long-term)
- [ ] Mobile app (React Native or Flutter)
- [ ] Integration with calendar applications
- [ ] AI-powered task suggestions
- [ ] Analytics and productivity insights

## 🔒 Security Considerations

### Implemented
- JWT authentication with proper expiration
- Input validation and sanitization
- CORS configuration
- HTTPS enforcement
- SQL injection prevention (Entity Framework)

### Production Recommendations
- Rate limiting
- Input sanitization middleware
- Security headers (HSTS, CSP, etc.)
- Regular security audits
- Dependency vulnerability scanning

## 🧪 Testing Strategy

### Current State
- Basic compilation and build tests

### Recommended Testing Approach
1. **Unit Tests**: Business logic and services
2. **Integration Tests**: API endpoints and database operations
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: Load testing for API endpoints

## 📝 Development Notes

### Code Style
- C# follows Microsoft naming conventions
- TypeScript uses ESLint and Prettier (recommended)
- Consistent error handling patterns
- Comprehensive logging throughout the application

### Key Assumptions
1. Single-tenant application (each user sees only their data)
2. English-only interface (no internationalization)
3. Desktop-first design (mobile-responsive but not mobile-first)
4. Moderate user load (< 1000 concurrent users)

This application demonstrates a solid foundation for a production todo management system with room for extensive enhancement and scaling.
