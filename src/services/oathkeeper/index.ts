import { decisionsApi, getJwksArgs } from "@config"
import {
  OathkeeperError,
  OathkeeperForbiddenServiceError,
  OathkeeperMissingAuthorizationHeaderError,
  OathkeeperUnauthorizedServiceError,
  UnknownOathkeeperServiceError,
} from "@domain/oathkeeper/errors"
import axios from "axios"

import { JwtVerifyTokenError } from "@domain/authentication/errors"

import jsonwebtoken from "jsonwebtoken"
import jwksRsa from "jwks-rsa"

export const sendOathkeeperRequest = async (
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
    if (err.response?.status === 401) {
      return new OathkeeperUnauthorizedServiceError(err.message || err)
    }

    if (err.response?.status === 403) {
      return new OathkeeperForbiddenServiceError(err.message || err)
    }

    return new UnknownOathkeeperServiceError(err.message || err)
  }
}

export const verifyJwt = async (token: string) => {
  const newToken = await sendOathkeeperRequest(token as SessionToken)
  if (newToken instanceof Error) return newToken
  const keyJwks = await jwksRsa(getJwksArgs()).getSigningKey()
  const verifiedToken = jsonwebtoken.verify(newToken, keyJwks.getPublicKey(), {
    algorithms: ["RS256"],
  })
  if (typeof verifiedToken === "string") {
    return new JwtVerifyTokenError("tokenPayload should be an object")
  }
  return verifiedToken
}
