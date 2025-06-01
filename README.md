# Trading Platform Frontend

A modern, responsive trading platform frontend built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Built with Radix UI components and Tailwind CSS
- **Real-time Trading**: Live order management and strategy monitoring
- **Authentication**: Secure user authentication with NextAuth.js
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Type Safety**: Full TypeScript support for better development experience
- **Database Integration**: Prisma ORM with PostgreSQL support

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database
- Trading backend API running

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trading-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .sample.env .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="your-postgresql-connection-string"
   
   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # API Configuration
   API_BASE_URL="http://your-backend-api:8000"
   
   # Environment
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 🚀 Deployment

The project includes a comprehensive deployment script that supports multiple environments:

### Development
```bash
./deploy.sh development
```

### Production
```bash
./deploy.sh production
```

### Docker
```bash
./deploy.sh docker
```

### Docker Compose
```bash
./deploy.sh docker-compose
```

## 📁 Project Structure

```
trading-frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── components/        # Page-specific components
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── app-sidebar.tsx   # Application sidebar
│   └── nav-user.tsx      # User navigation
├── contexts/             # React contexts
│   └── user-context.tsx  # User state management
├── lib/                  # Utility libraries
│   └── backend_api.ts    # API client
├── pages/                # Next.js pages (legacy)
│   └── api/              # API routes
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── deploy.sh             # Deployment script
└── package.json          # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 UI Components

The project uses a modern component library built on:

- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful & consistent icons
- **Custom Components**: Tailored for trading workflows

### Key Components

- **StrategyTable**: Manage trading strategies
- **OrderTable**: View and manage orders
- **AppSidebar**: Navigation sidebar
- **UserProvider**: User state management

## 🔐 Authentication

Authentication is handled by NextAuth.js with support for:

- JWT tokens
- Session management
- Protected routes
- User context

## 📊 API Integration

The frontend communicates with the trading backend through:

- RESTful API calls
- Automatic token management
- Error handling and retry logic
- Real-time data updates

### API Client Features

- **Automatic Authentication**: Handles token refresh and storage
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Retry Logic**: Automatic retry for failed requests
- **Type Safety**: Full TypeScript support for API responses

## 🐳 Docker Support

The project includes Docker support for easy deployment:

### Dockerfile
- Multi-stage build for optimized image size
- Node.js 18 Alpine base image
- Production-ready configuration

### Docker Compose
- Frontend service
- PostgreSQL database
- Environment variable management
- Volume persistence

## 🌍 Environment Configuration

The deployment script supports multiple environments:

- **Development**: `.env.local`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT secret key | `your-secret-key` |
| `API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `NODE_ENV` | Environment mode | `development` |

## 🔧 Development

### Getting Started

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. The page auto-updates as you edit files

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

### Component Development

Components follow these patterns:

- **Functional Components**: Using React hooks
- **TypeScript**: Full type definitions
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation

## 🚀 Production Deployment

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Automated Deployment

Use the deployment script for automated deployment:

```bash
./deploy.sh production
```

This will:
- Load environment variables
- Check requirements
- Install dependencies
- Set up database
- Build the application
- Start the production server

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Clear `.next` directory and rebuild
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Database Connection**: Verify `DATABASE_URL` in environment variables

3. **API Connection**: Check `API_BASE_URL` and backend server status

4. **Authentication Issues**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=1
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the deployment logs
