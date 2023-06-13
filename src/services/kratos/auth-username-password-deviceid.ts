import { CreateIdentityBody } from "@ory/client"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, kratosPublic } from "./private"
import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"

export const AuthWithUsernamePasswordDeviceIdService =
  (): IAuthWithUsernamePasswordDeviceIdService => {
    const createIdentityWithSession = async ({
      username,
      password,
      deviceId,
    }: {
      username: IdentityUsername
      password: IdentityPassword
      deviceId: DeviceId
    }): Promise<WithSessionResponse | KratosError> => {
      const traits = { username }
      const method = "password"
      const identifier = username

      deviceId // FIXME

      try {
        const createIdentityBody: CreateIdentityBody = {
          credentials: { password: { config: { password } } },
          state: "active",
          traits,
          schema_id: "username_password_deviceid_v0",
        }

        await kratosAdmin.createIdentity({ createIdentityBody })
      } catch (err) {
        return new UnknownKratosError(
          `Impossible to create identity: ${err.message || err}`,
        )
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

        return { sessionToken, kratosUserId }
      } catch (err) {
        return new UnknownKratosError(
          `Impossible to get sessionToken: ${err.message || err}`,
        )
      }
    }

    const upgradeToPhoneSchema = async ({
      phone,
      userId,
    }: {
      phone: PhoneNumber
      userId: UserId
    }): Promise<boolean | KratosError> => {
      const authService = AuthWithPhonePasswordlessService()
      const kratosResult = await authService.updateIdentityFromDeviceAccount({
        phone,
        userId,
      })
      // TODO: manage UnknownKratosError: Request failed with status code 409
      // when phone already exist
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
