# Trading Frontend

A modern Next.js trading platform for managing strategies, orders, and portfolio tracking.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Set up database
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📋 Default Login

- **Email**: `demo@trading.com`
- **Password**: `demo123`

## 🛠️ Built With

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **MobX** - State management

## 📂 Project Structure

```
├── app/              # Next.js app router pages
├── components/       # Reusable UI components
├── lib/             # Utilities and configurations
├── prisma/          # Database schema and migrations
├── services/        # API services
├── stores/          # MobX state stores
└── types/           # TypeScript type definitions
```

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. Key models:

- **Users** - Authentication and user management
- **Strategies** - Trading strategies
- **Orders** - Order management
- **Positions** - Portfolio positions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:seed` - Seed database with demo data
- `npx prisma studio` - Open database GUI

## 📦 Docker (Optional)

```bash
# Build and run with Docker
docker-compose up -d
```

## 📄 License

MIT License
