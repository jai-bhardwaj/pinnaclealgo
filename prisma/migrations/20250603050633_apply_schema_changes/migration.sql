/*
  Warnings:

  - The values [SETTINGS_CHANGED,PASSWORD_CHANGED,API_KEY_CREATED,API_KEY_DELETED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [ORDER_EXECUTED,ORDER_CANCELLED,STRATEGY_STARTED,STRATEGY_STOPPED,SYSTEM_ALERT,PRICE_ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [UNKNOWN] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [NORMAL,CARRYFORWARD,BO,CO] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BACKTESTING] on the enum `StrategyStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPER_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_VERIFICATION] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isPaperTrade` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `parentOrderId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `variety` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `isLive` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `isPaperTrading` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `margin` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `marginType` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `nextExecutionAt` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `sharpeRatio` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `investmentGoals` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lockedUntil` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `loginAttempts` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorEnabled` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorSecret` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `alerts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `backtests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StrategyConfigStatus" AS ENUM ('ACTIVE', 'STOPPED', 'ERROR', 'PAUSED');

-- CreateEnum
CREATE TYPE "StrategyCommandType" AS ENUM ('START', 'STOP', 'RESTART', 'PAUSE', 'RESUME', 'UPDATE_CONFIG');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN', 'LOGOUT', 'ORDER_PLACED', 'ORDER_CANCELLED', 'ORDER_MODIFIED', 'STRATEGY_STARTED', 'STRATEGY_STOPPED', 'STRATEGY_CREATED', 'STRATEGY_UPDATED', 'STRATEGY_DELETED', 'POSITION_OPENED', 'POSITION_CLOSED', 'RISK_LIMIT_CHANGED', 'BROKER_CONNECTED', 'BROKER_DISCONNECTED', 'SYSTEM_ERROR');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('RISK_VIOLATION', 'ACCOUNT_SECURITY', 'REGULATORY_NOTICE', 'SYSTEM_MAINTENANCE', 'STRATEGY_PERFORMANCE_SUMMARY', 'ACCOUNT_STATEMENT', 'COMPLIANCE_ALERT');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PLACED', 'OPEN', 'COMPLETE', 'CANCELLED', 'REJECTED', 'ERROR');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('DELIVERY', 'INTRADAY', 'MARGIN');
ALTER TABLE "orders" ALTER COLUMN "productType" TYPE "ProductType_new" USING ("productType"::text::"ProductType_new");
ALTER TABLE "trades" ALTER COLUMN "productType" TYPE "ProductType_new" USING ("productType"::text::"ProductType_new");
ALTER TABLE "positions" ALTER COLUMN "productType" TYPE "ProductType_new" USING ("productType"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StrategyStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'ERROR');
ALTER TABLE "strategies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "strategies" ALTER COLUMN "status" TYPE "StrategyStatus_new" USING ("status"::text::"StrategyStatus_new");
ALTER TYPE "StrategyStatus" RENAME TO "StrategyStatus_old";
ALTER TYPE "StrategyStatus_new" RENAME TO "StrategyStatus";
DROP TYPE "StrategyStatus_old";
ALTER TABLE "strategies" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_userId_fkey";

-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_userId_fkey";

-- DropForeignKey
ALTER TABLE "backtests" DROP CONSTRAINT "backtests_strategyId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_parentOrderId_fkey";

-- DropForeignKey
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "isPaperTrade",
DROP COLUMN "parentOrderId",
DROP COLUMN "variety";

-- AlterTable
ALTER TABLE "strategies" DROP COLUMN "basePrice",
DROP COLUMN "isLive",
DROP COLUMN "isPaperTrading",
DROP COLUMN "margin",
DROP COLUMN "marginType",
DROP COLUMN "nextExecutionAt",
DROP COLUMN "sharpeRatio";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "bio",
DROP COLUMN "investmentGoals",
DROP COLUMN "language";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLoginAt",
DROP COLUMN "lockedUntil",
DROP COLUMN "loginAttempts",
DROP COLUMN "phoneVerified",
DROP COLUMN "twoFactorEnabled",
DROP COLUMN "twoFactorSecret",
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "alerts";

-- DropTable
DROP TABLE "api_keys";

-- DropTable
DROP TABLE "backtests";

-- DropTable
DROP TABLE "user_sessions";

-- CreateTable
CREATE TABLE "strategy_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT,
    "name" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "modulePath" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "status" "StrategyConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoStart" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_commands" (
    "id" TEXT NOT NULL,
    "strategyConfigId" TEXT NOT NULL,
    "command" "StrategyCommandType" NOT NULL,
    "parameters" JSONB,
    "status" "CommandStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "strategy_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_metrics" (
    "id" TEXT NOT NULL,
    "strategyConfigId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "positionsCount" INTEGER NOT NULL DEFAULT 0,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metricsJson" JSONB,

    CONSTRAINT "strategy_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderExecution" BOOLEAN NOT NULL DEFAULT true,
    "strategyStatus" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "riskViolations" BOOLEAN NOT NULL DEFAULT true,
    "smsRiskViolations" BOOLEAN NOT NULL DEFAULT true,
    "smsOrderFailures" BOOLEAN NOT NULL DEFAULT true,
    "smsAccountSecurity" BOOLEAN NOT NULL DEFAULT true,
    "smsSystemDowntime" BOOLEAN NOT NULL DEFAULT true,
    "emailDailySummary" BOOLEAN NOT NULL DEFAULT false,
    "emailWeeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "emailMonthlyStatement" BOOLEAN NOT NULL DEFAULT true,
    "emailRegulatory" BOOLEAN NOT NULL DEFAULT true,
    "maxAlertsPerMinute" INTEGER NOT NULL DEFAULT 10,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategy_configs_name_key" ON "strategy_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- AddForeignKey
ALTER TABLE "strategy_configs" ADD CONSTRAINT "strategy_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_configs" ADD CONSTRAINT "strategy_configs_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_commands" ADD CONSTRAINT "strategy_commands_strategyConfigId_fkey" FOREIGN KEY ("strategyConfigId") REFERENCES "strategy_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_metrics" ADD CONSTRAINT "strategy_metrics_strategyConfigId_fkey" FOREIGN KEY ("strategyConfigId") REFERENCES "strategy_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_templates" ADD CONSTRAINT "alert_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
