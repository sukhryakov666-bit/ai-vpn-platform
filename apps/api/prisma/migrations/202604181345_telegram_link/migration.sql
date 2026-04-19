-- AlterTable
ALTER TABLE "User"
ADD COLUMN "telegramUserId" TEXT,
ADD COLUMN "telegramUsername" TEXT,
ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");
