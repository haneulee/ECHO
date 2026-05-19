export function isLocalMockMode(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ECHO_MOCK_TODAY === "1";
}
