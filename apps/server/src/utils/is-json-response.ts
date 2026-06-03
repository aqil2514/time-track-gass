export function isJsonResponse(response: string) {
  try {
    JSON.parse(response);
    return true;
  } catch {
    return false;
  }
}
