import { UnknownKratosError } from "./errors"
import { kratosAdmin } from "./private"

import { addAttributesToCurrentSpan } from "@/services/tracing"

export const extendSession = async (
  sessionId: SessionId,
): Promise<boolean | KratosError> => {
  try {
    const res = await kratosAdmin.extendSession({
      id: sessionId,
    })
    const newExpiresAt = res.data.expires_at
    addAttributesToCurrentSpan({ ["kratos.newExpiresAt"]: newExpiresAt })
    return res.data?.active ? true : false
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
