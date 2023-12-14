import { ServerActionResponse } from "@/app/index.types"

type TotpRegisterBody = {
  totpRegistrationId: string | undefined | null
  totpSecret: string | undefined | null
}
export interface TotpRegisterResponse
  extends ServerActionResponse<TotpRegisterBody | null> {}

type TotpValidateBody = null
export interface TotpValidateResponse
  extends ServerActionResponse<TotpValidateBody | null> {}
