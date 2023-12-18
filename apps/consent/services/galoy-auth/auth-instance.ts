import axios, { AxiosInstance } from "axios"

import { env } from "../../env"

const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.CORE_AUTH_URL,
  headers: { "Content-Type": "application/json" },
})

export default axiosInstance
