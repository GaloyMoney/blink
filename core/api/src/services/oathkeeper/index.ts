import axios, { isAxiosError } from "axios"

import { OATHKEEPER_DECISION_ENDPOINT } from "@/config"
import {
  OathkeeperError,
  OathkeeperForbiddenServiceError,
  OathkeeperMissingAuthorizationHeaderError,
  OathkeeperUnauthorizedServiceError,
  UnknownOathkeeperServiceError,
} from "@/domain/oathkeeper/errors"

export const sendOathkeeperRequestGraphql = async (
  token: AuthToken | undefined,
): Promise<JwtToken | OathkeeperError> => {
  const decisionsApi = `${OATHKEEPER_DECISION_ENDPOINT}/decisions`
  const requestUrl = `${decisionsApi}/graphql`

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
      timeout: 1000,
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
