import { CreateIdentityBody } from "@ory/client"

import { LikelyUserAlreadyExistError } from "@domain/authentication/errors"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin } from "./private"

export const AuthWithUsernamePasswordDeviceIdService =
  (): IAuthWithUsernamePasswordDeviceIdService => {
    const createIdentityWithSession = async ({
      username,
      password,
    }: {
      username: Username
      password: IdentityPassword
    }): Promise<SessionToken | KratosError> => {
      const traits = { username }
      try {
        const createIdentityBody: CreateIdentityBody = {
          credentials: { password: { config: { password } } },
          state: "active",
          traits,
          schema_id: "username_password_deviceid_v0",
        }

        const { data } = await kratosAdmin.createIdentity({ createIdentityBody })
        const kratosUserId = data.id as UserId
        console.log(
          "AuthWithUsernamePasswordDeviceIdService - kratosUserId: ",
          kratosUserId,
        )

        // TODO need to return session token but kratosPublic sdk does not allow
        // settings the schema_id (only in kratosAdmin sdk), so need to
        // get a session token for the username/password
        const sessionToken = "NOT IMPLEMENTED" as SessionToken

        return sessionToken
      } catch (err) {
        if (err.message === "Request failed with status code 400") {
          return new LikelyUserAlreadyExistError(err.message || err)
        }

        return new UnknownKratosError(err.message || err)
      }
    }

    return wrapAsyncFunctionsToRunInSpan({
      namespace: "services.kratos.auth-username-password-deviceid",
      fns: {
        createIdentityWithSession,
      },
    })
  }
