const localEndpoint ="http://localhost:3000"
// const productionEndpoint ="https://timetrack.gass.co.id"

// const productionEndpoint ="http://172.232.249.173"

export function buildUrl(
  endpoint: string = "",
  baseUrl: string = localEndpoint,
) {
  return `${baseUrl}/${endpoint}`;
}