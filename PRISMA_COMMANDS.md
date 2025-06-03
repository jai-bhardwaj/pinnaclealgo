# 🗄️ Prisma Migration Scripts Guide

## 🚀 **Main Migration Commands**

### **Development Workflow**

```bash
npm run prisma-migrate              # Create and apply migration (dev)
npm run prisma-migrate:create       # Create migration without applying
npm run db:migrate                  # Migrate + generate client
```

### **Production Deployment**

```bash
npm run prisma-migrate:deploy       # Apply pending migrations (prod safe)
npm run db:deploy                   # Deploy + generate client
```

### **Database Management**

```bash
npm run prisma-migrate:reset        # Reset DB and reapply all migrations ⚠️
npm run db:reset                    # Reset + generate client ⚠️
npm run db:setup                    # Deploy + generate + open studio
```

## 🔍 **Inspection & Validation**

### **Check Status**

```bash
npm run prisma-migrate:status       # Check migration status
npm run prisma-migrate:diff         # Check schema vs DB differences
npm run prisma:validate             # Validate schema syntax
```

### **Schema Management**

```bash
npm run prisma:format               # Format schema file
npm run prisma:pull                 # Pull DB schema to Prisma
npm run prisma:push                 # Push schema to DB (no migration)
```

### **Development Tools**

```bash
npm run prisma:generate             # Generate Prisma client
npm run prisma:studio               # Open Prisma Studio
```

## 📋 **Common Workflows**

### **1. Making Schema Changes (Development)**

```bash
# 1. Edit your schema.prisma file
# 2. Create and apply migration
npm run prisma-migrate

# Or step by step:
npm run prisma-migrate:create       # Review migration first
npm run prisma-migrate:deploy       # Then apply it
```

### **2. Production Deployment**

```bash
# Safe for production - only applies pending migrations
npm run db:deploy
```

### **3. Fresh Database Setup**

```bash
# Complete fresh setup
npm run db:setup
```

### **4. Troubleshooting**

```bash
# Check what's wrong
npm run prisma-migrate:status
npm run prisma-migrate:diff

# If needed, reset everything ⚠️ (DESTROYS DATA)
npm run db:reset
```

## ⚠️ **Important Notes**

### **Development vs Production**

- **Development**: Use `npm run prisma-migrate` or `npm run db:migrate`
- **Production**: Use `npm run db:deploy` (never use reset in production!)

### **Data Safety**

- ✅ **Safe**: `prisma-migrate:deploy`, `prisma:generate`, `prisma:studio`
- ⚠️ **Destructive**: `prisma-migrate:reset`, `db:reset` (deletes all data)

### **Best Practices**

1. Always run `prisma:validate` before migrations
2. Review migration files before applying
3. Use `prisma-migrate:create` to review migrations first
4. Test migrations on staging before production
5. Backup production data before major migrations

## 🛠️ **Quick Reference**

| Command                         | Purpose                  | Environment |
| ------------------------------- | ------------------------ | ----------- |
| `npm run prisma-migrate`        | Create & apply migration | Development |
| `npm run db:deploy`             | Apply pending migrations | Production  |
| `npm run db:reset`              | Reset & reapply all      | Development |
| `npm run prisma-migrate:status` | Check migration status   | Any         |
| `npm run prisma:studio`         | Open database browser    | Development |
