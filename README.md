# Email Management App

AI-powered email management web application with Claude API integration, AWS SES email functionality, and responsive design.

## 🚀 Features

- **User Authentication**: Secure registration and login system
- **Email Management**: Receive, view, and organize emails
- **AI-Powered Auto-Reply**: Generate intelligent email responses using Claude API
- **AWS SES Integration**: Send emails and notifications via Amazon SES
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live email status and notifications
- **Search & Filter**: Advanced email search and categorization
- **Settings Management**: Customizable user preferences and email templates

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **AWS SES** for email delivery
- **Claude API** for AI-powered features
- **Express Validator** for input validation
- **Helmet** & rate limiting for security

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Infrastructure
- **Docker** containerization
- **AWS ECS** for container orchestration
- **AWS DocumentDB** (MongoDB compatible)
- **AWS Application Load Balancer**
- **CloudFormation** for infrastructure as code

## 📋 Prerequisites

- Node.js 18+
- MongoDB (or AWS DocumentDB)
- AWS Account with SES configured
- Claude API key from Anthropic
- Docker (for containerized deployment)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd email-management-app
```

### 2. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Configure your environment variables
# Required variables:
MONGODB_URI=mongodb://localhost:27017/email-management
JWT_SECRET=your-super-secret-jwt-key
CLAUDE_API_KEY=your-claude-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
SES_FROM_EMAIL=your-verified-email@domain.com
```

### 3. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 4. Database Setup
Make sure MongoDB is running locally or configure your cloud MongoDB connection string.

### 5. AWS SES Configuration
1. Verify your sending email address in AWS SES
2. If in sandbox mode, verify recipient email addresses
3. Configure your AWS credentials

### 6. Run the Application

#### Development Mode
```bash
# Start both backend and frontend
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in client directory)
cd client && npm start
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🐳 Docker Deployment

### Local Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### AWS ECS Deployment

1. **Deploy Infrastructure**
```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name email-management-infrastructure \
  --template-body file://cloudformation/infrastructure.yaml \
  --parameters ParameterKey=ClaudeApiKey,ParameterValue=your-api-key \
               ParameterKey=JwtSecret,ParameterValue=your-jwt-secret \
               ParameterKey=SESFromEmail,ParameterValue=your-email@domain.com \
  --capabilities CAPABILITY_NAMED_IAM
```

2. **Build and Push Images**
```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -f Dockerfile.backend -t email-app-backend .
docker tag email-app-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-app-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-app-backend:latest

# Build and push frontend
docker build -f Dockerfile.frontend -t email-app-frontend .
docker tag email-app-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-app-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-app-frontend:latest
```

3. **Deploy ECS Services**
```bash
# Deploy ECS task definitions and services
aws cloudformation create-stack \
  --stack-name email-management-services \
  --template-body file://cloudformation/services.yaml \
  --parameters ParameterKey=InfrastructureStack,ParameterValue=email-management-infrastructure
```

## 📁 Project Structure

```
email-management-app/
├── server/                     # Backend Node.js application
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic services
│   └── index.js              # Main server file
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── cloudformation/           # AWS CloudFormation templates
├── nginx/                   # Nginx configuration
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile.backend       # Backend Docker configuration
├── Dockerfile.frontend      # Frontend Docker configuration
└── README.md               # This file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Emails
- `GET /api/emails` - Get user emails (with pagination)
- `GET /api/emails/:id` - Get specific email
- `POST /api/emails` - Create new email (demo)
- `POST /api/emails/:id/reply` - Reply to email
- `PUT /api/emails/:id` - Update email (mark read, archive, etc.)
- `DELETE /api/emails/:id` - Delete email
- `POST /api/emails/bulk-action` - Bulk email operations

### Claude AI
- `POST /api/claude/generate-reply` - Generate AI reply
- `POST /api/claude/analyze-email` - Analyze email content
- `GET /api/claude/health` - Check Claude API status

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **Environment Variables** for sensitive data

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** support
- **Loading States** and error handling
- **Toast Notifications** for user feedback
- **Keyboard Shortcuts** for power users
- **Accessibility** compliant components

## 📊 Monitoring & Logging

- **CloudWatch Logs** for application logging
- **Health Check Endpoints** for monitoring
- **Performance Metrics** tracking
- **Error Tracking** and alerting

## 🚀 Deployment Options

### 1. AWS ECS (Recommended)
- Fully managed container orchestration
- Auto-scaling capabilities
- Load balancer integration
- High availability across AZs

### 2. AWS EC2
- Direct server deployment
- More control over infrastructure
- Manual scaling and management

### 3. Vercel/Netlify (Frontend only)
- Static site deployment for frontend
- Serverless functions for API
- Global CDN distribution

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `CLAUDE_API_KEY` | Anthropic Claude API key | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `SES_FROM_EMAIL` | Verified SES email address | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 5000) | No |
| `CLIENT_URL` | Frontend URL for CORS | No |

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run e2e tests
npm run test:e2e
```

## 📈 Performance Optimization

- **Code Splitting** for faster load times
- **Image Optimization** and lazy loading
- **Caching Strategies** for API responses
- **Bundle Optimization** with Webpack
- **CDN Integration** for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔄 Changelog

### v1.0.0
- Initial release
- User authentication system
- Email management features
- Claude AI integration
- AWS SES integration
- Responsive design
- Docker containerization
- AWS deployment templates