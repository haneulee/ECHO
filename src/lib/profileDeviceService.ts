import { echoDeviceRowToDto, echoEvolutionRowToDto } from "@/lib/dbSerializers";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode } from "@/lib/localMockMode";
import { mockEchoDevice, mockEvolutions } from "@/lib/mockData";
import { prisma } from "@/lib/prisma";
import type { EchoDevice, EchoEvolution } from "@/lib/types";

export async function getProfileDeviceContext(
  userId: string,
): Promise<{
  device: EchoDevice;
  evolutions: EchoEvolution[];
} | null> {
  if (isLocalMockMode()) {
    return {
      device: mockEchoDevice,
      evolutions: mockEvolutions,
    };
  }
  let row = null;
  try {
    row = await prisma.echoDevice.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
      include: { evolutions: { orderBy: { createdAt: "desc" } } },
    });
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      return {
        device: mockEchoDevice,
        evolutions: mockEvolutions,
      };
    }
    throw e;
  }
  if (!row) return null;
  return {
    device: echoDeviceRowToDto(row),
    evolutions: row.evolutions.map(echoEvolutionRowToDto),
  };
}
