import { ServerActionResponse } from "./index.types"

interface GetCaptchaChallengeBody {
  id: string | null
  challenge: string | null
  formData: {
    login_challenge: string | null
    phone: string | null
    remember: boolean | null
    channel: string | null
  }
}

type SendPhoneCodeBody = null

export interface GetCaptchaChallengeResponse
  extends ServerActionResponse<GetCaptchaChallengeBody | null> {}

export interface SendPhoneCodeResponse
  extends ServerActionResponse<SendPhoneCodeBody | null> {}
