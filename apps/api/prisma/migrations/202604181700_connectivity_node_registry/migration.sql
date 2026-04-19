-- CreateEnum
CREATE TYPE "NodeProtocol" AS ENUM ('wireguard', 'xray');

-- CreateEnum
CREATE TYPE "NodeHealth" AS ENUM ('healthy', 'degraded', 'unhealthy');

-- CreateEnum
CREATE TYPE "WireGuardProfileStatus" AS ENUM ('active', 'revoked');

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "protocol" "NodeProtocol" NOT NULL,
    "endpointHost" TEXT NOT NULL,
    "endpointPort" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "allowedIps" TEXT NOT NULL DEFAULT '0.0.0.0/0',
    "dns" TEXT NOT NULL DEFAULT '1.1.1.1',
    "addressPoolCidr" TEXT NOT NULL DEFAULT '10.8.0.0/24',
    "health" "NodeHealth" NOT NULL DEFAULT 'healthy',
    "score" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WireGuardProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "clientPrivateKey" TEXT NOT NULL,
    "clientPublicKey" TEXT NOT NULL,
    "preSharedKey" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "status" "WireGuardProfileStatus" NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WireGuardProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_name_key" ON "Node"("name");

-- CreateIndex
CREATE INDEX "Node_protocol_health_isActive_score_idx" ON "Node"("protocol", "health", "isActive", "score");

-- CreateIndex
CREATE INDEX "WireGuardProfile_userId_status_idx" ON "WireGuardProfile"("userId", "status");

-- CreateIndex
CREATE INDEX "WireGuardProfile_nodeId_status_idx" ON "WireGuardProfile"("nodeId", "status");

-- AddForeignKey
ALTER TABLE "WireGuardProfile" ADD CONSTRAINT "WireGuardProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WireGuardProfile" ADD CONSTRAINT "WireGuardProfile_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
