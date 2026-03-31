-- ─── ENUMS ────────────────────────────────────────────────────────────────

CREATE TYPE "GoalStatus" AS ENUM ('COMPLETED', 'MISSED', 'PENDING');
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "TripCategory" AS ENUM ('TRAVEL', 'STAY', 'FOOD', 'ACTIVITIES', 'SHOPPING', 'OTHER');
CREATE TYPE "RewardSource" AS ENUM ('DAILY_GOAL', 'STREAK_7', 'STREAK_30', 'STREAK_100', 'RESOLUTION_MILESTONE', 'RESOLUTION_COMPLETE', 'MOVIE_MILESTONE_50', 'MOVIE_MILESTONE_100', 'FINANCE_DISCIPLINE', 'LEVEL_UP', 'MANUAL');
CREATE TYPE "NotificationType" AS ENUM ('MISSED_GOAL', 'STREAK_MILESTONE', 'OVERSPENDING', 'RESOLUTION_DEADLINE', 'REWARD_UNLOCKED', 'LEVEL_UP', 'GENERAL');

-- ─── USER ─────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "level"         INTEGER NOT NULL DEFAULT 1,
  "totalPoints"   INTEGER NOT NULL DEFAULT 0
);

-- ─── NEXTAUTH ─────────────────────────────────────────────────────────────

CREATE TABLE "Account" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  UNIQUE("provider", "providerAccountId")
);

CREATE TABLE "Session" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires"      TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMP(3) NOT NULL,
  UNIQUE("identifier", "token")
);

-- ─── GOALS ────────────────────────────────────────────────────────────────

CREATE TABLE "Goal" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "isScheduled"  BOOLEAN NOT NULL DEFAULT false,
  "scheduleDays" TEXT[] NOT NULL DEFAULT '{}',
  "reward"       TEXT,
  "pointValue"   INTEGER NOT NULL DEFAULT 10,
  "color"        TEXT DEFAULT '#06b6d4',
  "icon"         TEXT DEFAULT 'Target',
  "isArchived"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "GoalLog" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "goalId"    TEXT NOT NULL REFERENCES "Goal"("id") ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date"      DATE NOT NULL,
  "status"    "GoalStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("goalId", "date")
);
CREATE INDEX "GoalLog_userId_date_idx" ON "GoalLog"("userId", "date");

-- ─── RESOLUTIONS ──────────────────────────────────────────────────────────

CREATE TABLE "Resolution" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "targetValue"  DOUBLE PRECISION NOT NULL,
  "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit"         TEXT,
  "deadline"     TIMESTAMP(3) NOT NULL,
  "milestones"   JSONB,
  "reward"       TEXT,
  "pointValue"   INTEGER NOT NULL DEFAULT 50,
  "isCompleted"  BOOLEAN NOT NULL DEFAULT false,
  "category"     TEXT DEFAULT 'Personal',
  "color"        TEXT DEFAULT '#8b5cf6',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── FINANCE ──────────────────────────────────────────────────────────────

CREATE TABLE "FinanceAccount" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "accountName" TEXT NOT NULL,
  "accountType" TEXT DEFAULT 'savings',
  "balance"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "color"       TEXT DEFAULT '#10b981',
  "icon"        TEXT DEFAULT 'Wallet',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Transaction" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL REFERENCES "FinanceAccount"("id") ON DELETE CASCADE,
  "amount"    DOUBLE PRECISION NOT NULL,
  "category"  TEXT NOT NULL,
  "type"      "TransactionType" NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL,
  "note"      TEXT,
  "tags"      TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
CREATE INDEX "Transaction_userId_type_idx" ON "Transaction"("userId", "type");

-- ─── MOVIES ───────────────────────────────────────────────────────────────

CREATE TABLE "Movie" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "movieName"   TEXT NOT NULL,
  "genre"       TEXT,
  "rating"      DOUBLE PRECISION,
  "watchedDate" TIMESTAMP(3) NOT NULL,
  "notes"       TEXT,
  "posterUrl"   TEXT,
  "tmdbId"      TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Movie_userId_watchedDate_idx" ON "Movie"("userId", "watchedDate");

-- ─── TRIPS ────────────────────────────────────────────────────────────────

CREATE TABLE "Trip" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "destination" TEXT NOT NULL,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3) NOT NULL,
  "totalCost"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"       TEXT,
  "coverImage"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "TripExpense" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "tripId"    TEXT NOT NULL REFERENCES "Trip"("id") ON DELETE CASCADE,
  "category"  "TripCategory" NOT NULL DEFAULT 'OTHER',
  "amount"    DOUBLE PRECISION NOT NULL,
  "note"      TEXT,
  "date"      TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── REWARDS ──────────────────────────────────────────────────────────────

CREATE TABLE "Reward" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sourceType"  "RewardSource" NOT NULL,
  "sourceId"    TEXT,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "pointValue"  INTEGER NOT NULL DEFAULT 0,
  "badge"       TEXT,
  "unlockedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Reward_userId_unlockedAt_idx" ON "Reward"("userId", "unlockedAt");

-- ─── GAMIFICATION ────────────────────────────────────────────────────────

CREATE TABLE "PointEvent" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "points"     INTEGER NOT NULL,
  "reason"     TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId"   TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PointEvent_userId_createdAt_idx" ON "PointEvent"("userId", "createdAt");

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────

CREATE TABLE "Notification" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"       "NotificationType" NOT NULL,
  "title"      TEXT NOT NULL,
  "message"    TEXT NOT NULL,
  "readStatus" BOOLEAN NOT NULL DEFAULT false,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Notification_userId_readStatus_idx" ON "Notification"("userId", "readStatus");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
