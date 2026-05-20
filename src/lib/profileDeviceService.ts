import { echoDeviceRowToDto, echoEvolutionRowToDto } from "@/lib/dbSerializers";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import {
  localMockEchoDevice,
  localMockEvolutions,
} from "@/lib/localMockData";
import { prisma } from "@/lib/prisma";
import type { EchoDevice, EchoEvolution } from "@/lib/types";

export async function getProfileDeviceContext(
  userId: string,
): Promise<{
  device: EchoDevice;
  evolutions: EchoEvolution[];
} | null> {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("profile device context local mock mode");
    return {
      device: localMockEchoDevice,
      evolutions: localMockEvolutions,
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
        evolutions: localMockEvolutions,
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
