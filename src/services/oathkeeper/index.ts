import { decisionsApi } from "@config"
import {
  OathkeeperUnauthorizedServiceError,
  OathkeeperError,
  OathkeeperForbiddenServiceError,
  UnknownOathkeeperServiceError,
  OathkeeperMissingAuthorizationHeaderError,
} from "@domain/oathkeeper/errors"
import axios from "axios"

export const sendOathkeeperRequest = async (
  token: LegacyJwtToken | SessionToken | undefined,
): Promise<JwtToken | OathkeeperError> => {
  const requestUrl = `${decisionsApi()}graphql`

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

    if (!jwt) {
      return new OathkeeperMissingAuthorizationHeaderError()
    }

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
