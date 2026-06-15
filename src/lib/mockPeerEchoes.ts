import type { EchoType } from "@/lib/types";

/** Stranger + registered units that appear as encounter peers (not user accounts). */
export type MockPeerEcho = {
  firmwareModelName: string;
  echoType: EchoType;
  echoName: string;
  echoColor: string;
};

export const MOCK_PEER_ECHOES: MockPeerEcho[] = [
  {
    firmwareModelName: "ECHO_SHY_001",
    echoType: "shy",
    echoName: "Namu",
    echoColor: "#8FE6C4",
  },
  {
    firmwareModelName: "ECHO_BOUNCE_001",
    echoType: "bounce",
    echoName: "Spring Sky",
    echoColor: "#FFE36E",
  },
  {
    firmwareModelName: "ECHO_MESSY_001",
    echoType: "messy",
    echoName: "Happy Spill",
    echoColor: "#FF9F6E",
  },
  {
    firmwareModelName: "ECHO_SHY_002",
    echoType: "shy",
    echoName: "Tiny Moth",
    echoColor: "#6ECDE8",
  },
  {
    firmwareModelName: "ECHO_SHY_003",
    echoType: "shy",
    echoName: "Soft Pebble",
    echoColor: "#9AD8FF",
  },
  {
    firmwareModelName: "ECHO_SHY_004",
    echoType: "shy",
    echoName: "Moss Whisper",
    echoColor: "#7ED4B5",
  },
  {
    firmwareModelName: "ECHO_SHY_005",
    echoType: "shy",
    echoName: "Quiet Bloom",
    echoColor: "#C4A8FF",
  },
  {
    firmwareModelName: "ECHO_BOUNCE_002",
    echoType: "bounce",
    echoName: "Skip Soda",
    echoColor: "#FFC45C",
  },
  {
    firmwareModelName: "ECHO_BOUNCE_003",
    echoType: "bounce",
    echoName: "Pogo Puff",
    echoColor: "#FFD56E",
  },
  {
    firmwareModelName: "ECHO_BOUNCE_004",
    echoType: "bounce",
    echoName: "Bop Bean",
    echoColor: "#FF9F6E",
  },
  {
    firmwareModelName: "ECHO_BOUNCE_005",
    echoType: "bounce",
    echoName: "Lemon Loop",
    echoColor: "#8FD4FF",
  },
  {
    firmwareModelName: "ECHO_MESSY_002",
    echoType: "messy",
    echoName: "Tangle Spark",
    echoColor: "#FF0080",
  },
  {
    firmwareModelName: "ECHO_MESSY_003",
    echoType: "messy",
    echoName: "Ink Splash",
    echoColor: "#D99AEF",
  },
  {
    firmwareModelName: "ECHO_MESSY_004",
    echoType: "messy",
    echoName: "Glitter Spill",
    echoColor: "#F39AC1",
  },
  {
    firmwareModelName: "ECHO_MESSY_005",
    echoType: "messy",
    echoName: "Chaos Puff",
    echoColor: "#AFA7FF",
  },
  {
    firmwareModelName: "ECHO_MESSY_006",
    echoType: "messy",
    echoName: "Puddle Pop",
    echoColor: "#E878FF",
  },
];

export function mockPeerByModelName(
  firmwareModelName: string,
): MockPeerEcho | undefined {
  return MOCK_PEER_ECHOES.find(
    (peer) => peer.firmwareModelName === firmwareModelName,
  );
}

/** Peers a device can meet — excludes the owner's own sticker code. */
export function peersForOwner(ownerFirmwareModelName: string): MockPeerEcho[] {
  return MOCK_PEER_ECHOES.filter(
    (peer) => peer.firmwareModelName !== ownerFirmwareModelName,
  );
}

export function peerEchoHash(firmwareModelName: string): string {
  let hash = 2166136261;
  for (const char of firmwareModelName) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `echo:${(hash >>> 0).toString(16).slice(0, 4)}`;
}
