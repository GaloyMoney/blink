import { env } from "../../env";
import axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.CORE_AUTH_URL,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const xRealIp = config.headers["x-real-ip"];
    const xForwardedFor = config.headers["x-forwarded-for"];
    if (xRealIp) {
      config.headers["x-real-ip"] = xRealIp;
    }
    if (xForwardedFor) {
      config.headers["x-forwarded-for"] = xForwardedFor;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
