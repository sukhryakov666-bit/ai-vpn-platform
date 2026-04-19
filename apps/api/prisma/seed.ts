import * as bcrypt from "bcryptjs";
import { NodeProtocol, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = "admin@ai-vpn.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    // keep existing admin and continue seeding connectivity baseline
  } else {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        isActive: true
      }
    });
  }

  const nodeName = "wg-eu-1";
  const node = await prisma.node.findUnique({ where: { name: nodeName } });
  if (node) {
    return;
  }

  await prisma.node.create({
    data: {
      name: nodeName,
      region: "eu-central",
      protocol: NodeProtocol.wireguard,
      endpointHost: "wg-eu-1.example.internal",
      endpointPort: 51820,
      publicKey: "REPLACE_WITH_REAL_SERVER_PUBLIC_KEY",
      allowedIps: "0.0.0.0/0",
      dns: "1.1.1.1",
      addressPoolCidr: "10.8.0.0/24",
      score: 100,
      isActive: true
    }
  });
}

main()
  .catch(async (error) => {
    // Keep seed failures explicit for CI and local setup.
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
