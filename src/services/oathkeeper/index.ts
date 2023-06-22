import { decisionsApi } from "@config"
import {
  OathkeeperUnauthorizedServiceError,
  OathkeeperError,
  OathkeeperForbiddenServiceError,
  UnknownOathkeeperServiceError,
  OathkeeperMissingAuthorizationHeaderError,
} from "@domain/oathkeeper/errors"
import axios, { isAxiosError } from "axios"

export const sendOathkeeperRequestGraphql = async (
  token: SessionToken | undefined,
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
    if (isAxiosError(err) && err.response?.status === 401) {
      return new OathkeeperUnauthorizedServiceError(err.message)
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      return new OathkeeperForbiddenServiceError(err.message)
    }
    return new UnknownOathkeeperServiceError(err)
  }
}
