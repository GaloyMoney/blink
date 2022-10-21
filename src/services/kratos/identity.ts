import { UnknownKratosError } from "./errors"
import { kratosAdmin, toDomainIdentityPhone } from "./private"

export const listIdentities = async (): Promise<IdentityPhone[] | KratosError> => {
  try {
    const res = await kratosAdmin.adminListIdentities()
    return res.data.map(toDomainIdentityPhone)
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
