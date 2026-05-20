export function isLocalMockMode(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ECHO_MOCK_TODAY === "1";
}

export function logDatabaseUnavailable(context: string, error?: unknown): void {
  const detail =
    error instanceof Error
      ? ` ${error.name}: ${error.message}`
      : "";
  console.warn(
    `[ECHO] Database access unavailable; using mock data for ${context}.${detail}`,
  );
}
