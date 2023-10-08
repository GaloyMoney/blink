import axios, { isAxiosError, AxiosError, AxiosRequestConfig } from "axios"

// import IBEX_TOKEN from .env file
const IBEX_TOKEN = process.env.IBEX_TOKEN
const IBexPluginBaseURL = process.env.IBEX_PLUGIN_BASE_URL
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

    switch (methodType) {
      case "GET":
        response = await axios.get(`${IBexPluginBaseURL}${endpoint}`, requestOptions)
        break
      case "PUT":
        response = await axios.put(
          `${IBexPluginBaseURL}${endpoint}`,
          body,
          requestOptions,
        )
        break
      case "POST":
        response = await axios.post(
          `${IBexPluginBaseURL}${endpoint}`,
          body,
          requestOptions,
        )
        break
      case "DELETE":
        response = await axios.delete(`${IBexPluginBaseURL}${endpoint}`, requestOptions)
        break
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
