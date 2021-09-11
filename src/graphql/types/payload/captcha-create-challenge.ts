import { GT } from "@graphql/index"
import IError from "../abstract/error"

const CaptchaCreateChallengeResult = new GT.Object({
  name: "CaptchaCreateChallengeResult",
  fields: () => ({
    id: {
      type: GT.NonNull(GT.String),
    },
    challengeCode: {
      type: GT.NonNull(GT.String),
    },
    newCaptcha: {
      type: GT.NonNull(GT.Boolean),
    },
    failbackMode: {
      type: GT.NonNull(GT.Boolean),
    },
  }),
})

const CaptchaCreteChallengePayload = new GT.Object({
  name: "CaptchaCreteChallengePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    result: { type: CaptchaCreateChallengeResult },
  }),
})

export default CaptchaCreteChallengePayload
