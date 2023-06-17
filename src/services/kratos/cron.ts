import { UnknownKratosError } from "./errors"
import { kratosAdmin } from "./private"

export const extendSession = async (
  sessionId: SessionId,
): Promise<boolean | KratosError> => {
  try {
    const res = await kratosAdmin.extendSession({
      id: sessionId,
    })
    return res.data?.active ? true : false
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
