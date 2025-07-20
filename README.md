# KD Family Chore System

A family chore scoring system web application built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Start the entire application
docker-compose up -d

# Start only database services
./start-database.bat  # Windows
# or
docker-compose up -d mysql phpmyadmin adminer  # Linux/Mac
```

### Manual Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
# Import schema/init.sql into your MySQL database

# Start the application
npm start
# or for development
npm run dev
```

## 📱 Application Access

- **Main Application**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **Adminer**: http://localhost:8081
- **Database**: localhost:3307

## 🏗️ Project Structure

```
├── config/              # Database configuration
├── public/              # Frontend static files
├── schema/              # Database schema
├── server/              # Backend application
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   └── services/        # Background services
├── test/                # Test files
├── uploads/             # File uploads (avatars)
└── docker-compose.yml   # Docker configuration
```

## 🧪 Testing

```bash
npm test
```

## 🔧 Development

```bash
# Development with auto-reload
npm run dev

# Run linting (if configured)
npm run lint

# Run type checking (if configured)
npm run typecheck
```

## 📦 Dependencies

### Production
- **express**: Web framework
- **mysql2**: MySQL client
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **joi**: Input validation
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling

### Development
- **jest**: Testing framework
- **supertest**: HTTP testing
- **nodemon**: Development auto-reload

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi

## 🐳 Docker Services

- **mysql**: MySQL 8.0 database
- **phpmyadmin**: Web-based MySQL administration
- **adminer**: Lightweight database management
- **app**: Main Node.js application

## 📝 License

MIT