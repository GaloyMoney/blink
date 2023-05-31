import * as jose from "node-jose"

import { getAppCheckConfig, getJwksArgs, isCI, isDev } from "@config"

import jwksRsa from "jwks-rsa"
import jsonwebtoken from "jsonwebtoken"

import { KratosError } from "./errors"

import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"

export const AuthWithDeviceAccountService = () => {
  const upgradeToPhoneSchema = async ({
    phone,
    deviceId,
  }: {
    phone: PhoneNumber
    deviceId: UserId
  }): Promise<SessionToken | KratosError> => {
    // 1. create kratos account
    // 2. kratos webhook calls /kratos/registration to update mongo
    //    account/user collection to ref kratos uuid instead of device id
    const authService = AuthWithPhonePasswordlessService()
    const kratosResult = await authService.createIdentityWithDeviceId({ phone, deviceId })
    if (kratosResult instanceof Error) return kratosResult
    return kratosResult.sessionToken
  }

  const verifyJwt = async (token: string) => {
    const audience = getAppCheckConfig().audience
    const issuer = getAppCheckConfig().issuer
    const jwksUri = getAppCheckConfig().jwksUri

    // Get the JSON web keys (JWKS)
    let client = await jwksRsa({
      jwksUri,
    })
    let jwkJson
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwkJson = (await client.getKeys()) as Array<any>

    // Decode the token
    const decodedToken = jsonwebtoken.decode(token, { complete: true })
    if (!decodedToken) return Error("problem with jwt")

    // Find the kid (Key Id) used to sign the token
    const kid = decodedToken.header.kid
    let kidJwk = jwkJson.find((j) => j.kid === kid)

    // if in dev environment, use local jwks.json if you dont have access to firebase appcheck debug
    if (!kidJwk && (isDev || isCI)) {
      client = await jwksRsa({
        jwksUri: getJwksArgs().jwksUri,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jwkJson = (await client.getKeys()) as Array<any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kidJwk = jwkJson.find((j: any) => j.kid === kid)
    }

    // Create a Key object from the JWK and to PEM format
    const jwtAskey = await jose.JWK.asKey(kidJwk)
    const pem = jwtAskey.toPEM(false)

    // Verify the token
    const verifiedToken = jsonwebtoken.verify(token, pem, {
      algorithms: ["RS256"],
      audience,
      issuer,
    })

    return verifiedToken
  }

  return {
    upgradeToPhoneSchema,
    verifyJwt,
  }
}
