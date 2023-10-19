import { env } from "../../env";
import axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.CORE_AUTH_URL,
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
