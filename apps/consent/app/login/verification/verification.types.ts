import { ServerActionResponse } from "../../types/index.types"

interface VerificationCodeBody {
  totpRequired: boolean
  authToken: string | null
}

export interface VerificationCodeResponse
  extends ServerActionResponse<VerificationCodeBody | null> {}

type VerificationTotpBody = null
export interface VerificationTotpResponse
  extends ServerActionResponse<VerificationTotpBody> {}
