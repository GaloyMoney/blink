import dotenv from "dotenv"
dotenv.config({ path: "../../../.env.local" })

import axios, { isAxiosError, AxiosError, AxiosRequestConfig } from "axios"
// FLASH FORK: IBEX_TOKEN and IBEX_PLUGIN_BASE_URL are hardcoded for now
const IBEX_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTc5Mjc0MTIsImp0aSI6ImQ0YzhhZjMyLTI0M2ItNDhkZi1hZTZlLTAwODcwOGMxMzI3OCIsImlhdCI6MTY5NzkyMzgxMiwiaXNzIjoiSUJFWF9IVUIiLCJzdWIiOiIxZGQ3MWZmYS01MThlLTQyY2UtOWRlZC1mZTI1NGM5YjQ0YmIiLCJ0cGUiOiJhY2Nlc3MiLCJwcm0iOnsiYWNjIjoxNSwiY3VyIjoxNSwibG5hIjoxNSwibG5wIjoxNSwibG5yIjoxNSwibG5zIjoxNSwibG53IjoxNSwibWV0IjoxNSwib25yIjoxNSwib25zIjoxNSwidHhzIjoxNSwidXNyIjoxNX19.FTpkn3oPgZkKoh-5X8DppTo0VRJMwXGAtEf8zHaM4vS5hkcFx0czyO2IBsNet9VQ689Gw_U-8cODAwlPjuVrRos_oy_WDtHu9MZDlHdi_uisLawiGItt_AIKvzOWqk1FUyjF7PO3q31liEXB1hKZYe9KD1Eh-6tob6hdw7Jp-Iabv_ZCeZr8QXGQjaGMG7LsHEaf3BVoaN1o3sMEZR5YYaDmPgcykDzf2uFgU92iZ7emPIyh4IqLSuMGkBDTgKl7Ph-DCVtrnSOhW9R637lSuJnjwgsCtlxN7ThfwkxVGhn4id3tmrY7HezLLid4J-I1CqVfUBv-PpK7C678GdkzqBsUDQQe0FZYi-JCAIhdHSDEDm7guPwvNw5Wf7qD07W13m3ADzniNxXvPHCJNlbETB5QX9RXMFfCZ_tD3rYYbOqNLbgnihHL7utpOy6KnIqiE4PRfjbEmju_nCZRTz4QwkZ60aro0Lmz0lbDta9WKxcrjucfoCyRASXnKUvfa4faggc2FXoSzFFae1G8E5XwsNdBwHbhQkBcP9EHA9aLRg2IzQPhPly1lKDP3deXsilJC_vmBCZwdrCnzoCllFTsEMDiArbPOIlJ831v-ereafhwZmqP9l1SOQy65_5ZhlgF98mmlaSvp078PsHmVzU2p6IEFK-76o_FY4-EkEDEs64"
const IBexPluginBaseURL = "http://development.flashapp.me:8760/api/v1"

// import IBEX_TOKEN from .env file
// const IBEX_TOKEN = process.env.IBEX_TOKEN
// const IBexPluginBaseURL = process.env.IBEX_PLUGIN_BASE_URL
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
