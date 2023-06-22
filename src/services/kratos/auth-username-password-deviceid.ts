import { CreateIdentityBody } from "@ory/client"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { isAxiosError } from "axios"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, kratosPublic } from "./private"
import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"

export const AuthWithUsernamePasswordDeviceIdService =
  (): IAuthWithUsernamePasswordDeviceIdService => {
    const createIdentityWithSession = async ({
      username,
      password,
    }: {
      username: IdentityUsername
      password: IdentityPassword
    }): Promise<CreateIdentityWithSessionResult | KratosError> => {
      let newEntity = true
      const traits = { username }
      const method = "password"
      const identifier = username

      try {
        const createIdentityBody: CreateIdentityBody = {
          credentials: { password: { config: { password } } },
          state: "active",
          traits,
          schema_id: "username_password_deviceid_v0",
        }

        await kratosAdmin.createIdentity({ createIdentityBody })
      } catch (err) {
        // we continue if there is 409/Conflit,
        // because it means the identity already exists
        if (isAxiosError(err) && err.response?.status !== 409) {
          return new UnknownKratosError(
            `Impossible to create identity: ${err.message || err}`,
          )
        }

        newEntity = false
      }

      try {
        const flow = await kratosPublic.createNativeLoginFlow()
        const result = await kratosPublic.updateLoginFlow({
          flow: flow.data.id,
          updateLoginFlowBody: {
            identifier,
            method,
            password,
          },
        })
        const sessionToken = result.data.session_token as SessionToken

        // note: this only works when whoami: required_aal = aal1
        const kratosUserId = result.data.session.identity.id as UserId

        return { sessionToken, kratosUserId, newEntity }
      } catch (err) {
        if (err instanceof Error) {
          return new UnknownKratosError(
            `Impossible to get sessionToken: ${err.message || err}`,
          )
        }
        return new UnknownKratosError(err)
      }
    }

    const upgradeToPhoneSchema = async ({
      phone,
      userId,
    }: {
      phone: PhoneNumber
      userId: UserId
    }): Promise<true | KratosError> => {
      const authService = AuthWithPhonePasswordlessService()
      const kratosResult = await authService.updateIdentityFromDeviceAccount({
        phone,
        userId,
      })
      if (kratosResult instanceof Error) return kratosResult
      return true
    }

    return wrapAsyncFunctionsToRunInSpan({
      namespace: "services.kratos.auth-username-password-deviceid",
      fns: {
        createIdentityWithSession,
        upgradeToPhoneSchema,
      },
    })
  }
