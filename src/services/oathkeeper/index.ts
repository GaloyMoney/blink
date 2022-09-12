import {
  OathkeeperUnauthorizedServiceError,
  OathkeeperError,
  OathkeeperForbiddenServiceError,
  UnknownOathkeeperServiceError,
} from "@domain/oathkeeper/errors"
import axios from "axios"

// import oathkeeper from "@ory/oathkeeper-client"

// note: decisions is the admin API
const decisionsPrefix = "http://oathkeeper:4456/decisions/"

export const sendOathkeeperRequest = async (
  token?: string,
): Promise<JwtToken | OathkeeperError> => {
  const requestUrl = `${decisionsPrefix}graphql`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const res = await axios({
      url: requestUrl,
      method: "POST",
      headers,
    })
    const jwt = res.headers.authorization
    return jwt.slice(7) as JwtToken
  } catch (err) {
    if (err.response?.status === 401) {
      return new OathkeeperUnauthorizedServiceError(err.message || err)
    }

    if (err.response?.status === 403) {
      return new OathkeeperForbiddenServiceError(err.message || err)
    }

    return new UnknownOathkeeperServiceError(err.message || err)
  }
}
