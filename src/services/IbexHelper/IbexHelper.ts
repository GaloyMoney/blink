import axios, { isAxiosError, AxiosError, AxiosRequestConfig } from "axios"

// import IBEX_TOKEN from .env file
const IBEX_TOKEN = process.env.IBEX_TOKEN
const IBexPluginBaseURL = "http://api-development.flashapp.me:8760/api/v1"
const token = IBEX_TOKEN

const defaultHeaders: AxiosRequestConfig["headers"] = {
  "Authorization": token,
  "Content-Type": "application/json",
}

export async function requestIBexPlugin(
  methodType: string,
  endpoint: string,
  params: object,
  body: object,
) {
  const result = {
    status: 400,
    data: null,
    error: "",
  }

  try {
    let response = { status: 200, data: null, error: "" }
    const requestOptions: AxiosRequestConfig = {
      headers: defaultHeaders,
    }

    if (methodType === "GET") {
      response = await axios.get(`${IBexPluginBaseURL}${endpoint}`, requestOptions)
    } else if (methodType === "PUT") {
      response = await axios.put(`${IBexPluginBaseURL}${endpoint}`, body, requestOptions)
    } else if (methodType === "POST") {
      response = await axios.post(`${IBexPluginBaseURL}${endpoint}`, body, requestOptions)
    } else if (methodType === "DELETE") {
      response = await axios.delete(`${IBexPluginBaseURL}${endpoint}`, requestOptions)
    }

    result.status = response.status
    result.data = response.data
  } catch (error) {
    console.log("error>>>", error)
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError
      if (axiosError.response) {
        result.status = axiosError.response.status
        result.error = axiosError.message
      }
    }
  }

  console.log(result)
  return result
}
