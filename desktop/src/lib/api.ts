import axios from "axios";
import { fetch } from "@tauri-apps/plugin-http";

// const localEndpoint = "http://localhost:3000";
const productionEndpoint = "https://timetrack.gass.co.id";

const api = axios.create({
  baseURL: productionEndpoint,
  // baseURL: localEndpoint,
});

api.defaults.adapter = async (config) => {
  const isFormData = config.data instanceof FormData;

  const headers = { ...config.headers } as Record<string, string>;
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const response = await fetch(config.url ?? "", {
    method: config.method?.toUpperCase(),
    headers,
    body: isFormData
      ? config.data
      : config.data
        ? typeof config.data === "string"
          ? config.data
          : JSON.stringify(config.data)
        : undefined,
  });

  const data = await response.json();

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    data,
    status: response.status,
    headers: responseHeaders,
    config,
    statusText: response.statusText,
  };
};

export default api;
