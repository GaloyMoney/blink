import { UnknownKratosError } from "./errors"
import { kratosAdmin } from "./private"

// TODO: should be a param in yaml
const schemaIdsToExtend = ["phone_no_password_v0", "phone_or_email_password_v0"]

// not all identities need to be extended
// a schemaId attached to an itentity with Phone may need to be
// because login back with a phone number + code is both costly and have variable delivery time
// whereas a schemasId attached to an email + password may not need to have long session time
export const extendSession = async ({
  session,
}: {
  session: KratosSession
}): Promise<boolean | KratosError> => {
  try {
    if (!schemaIdsToExtend.includes(session.identity.schema_id)) return false

    const res = await kratosAdmin.extendSession({
      id: session.id,
    })
    return res.data?.active ? true : false
  } catch (err) {
    return new UnknownKratosError(err.message || err)
  }
}
