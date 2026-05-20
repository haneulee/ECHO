import { echoDeviceRowToDto, echoEvolutionRowToDto } from "@/lib/dbSerializers";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { localMockEchoDevice } from "@/lib/localMockData";
import { mockEvolutions } from "@/lib/mockData";
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
      device: localMockEchoDevice,
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
      logDatabaseUnavailable("profile device context", e);
      return {
        device: localMockEchoDevice,
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
