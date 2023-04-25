import { LikelyUserAlreadyExistError } from "@domain/authentication/errors"
import { Identity, UpdateIdentityBody } from "@ory/client"

import { getKratosPasswords } from "@config"

import { IncompatibleSchemaUpgradeError, KratosError, UnknownKratosError } from "./errors"

import { kratosAdmin, toDomainIdentityPhone } from "./private"

// login with device account

export const AuthWithDeviceAccountService = () => {
  const password = getKratosPasswords().masterUserPassword

  const upgradeToPhoneSchema = async ({
    kratosUserId,
    phone,
  }: {
    kratosUserId: UserId
    phone: PhoneNumber
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "device_account_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    identity.traits = { phone }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "phone_no_password_v0",
    }

    const { data: newIdentity } = await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: adminIdentity,
    })

    return toDomainIdentityPhone(newIdentity)
  }

  return {
    upgradeToPhoneSchema,
  }
}
