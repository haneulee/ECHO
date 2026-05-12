import { echoDeviceRowToDto, echoEvolutionRowToDto } from "@/lib/dbSerializers";
import { prisma } from "@/lib/prisma";
import type { EchoDevice, EchoEvolution } from "@/lib/types";

export async function getProfileDeviceContext(
  userId: string,
): Promise<{
  device: EchoDevice;
  evolutions: EchoEvolution[];
} | null> {
  const row = await prisma.echoDevice.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    include: { evolutions: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) return null;
  return {
    device: echoDeviceRowToDto(row),
    evolutions: row.evolutions.map(echoEvolutionRowToDto),
  };
}
