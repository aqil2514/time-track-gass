const localEndpoint ="http://localhost:3000"
// const productionEndpoint ="https://timetrack.gass.co.id"


export function buildUrl(
  endpoint: string = "",
  baseUrl: string = localEndpoint,
  // baseUrl: string = productionEndpoint,
) {
  return `${baseUrl}/${endpoint}`;
}