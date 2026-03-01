const localEndpoint ="http://localhost:3000"
// const productionEndpoint ="https://time-tracker-demo-virid.vercel.app"

export function buildUrl(
  endpoint: string = "",
  baseUrl: string = localEndpoint,
) {
  return `${baseUrl}/${endpoint}`;
}
