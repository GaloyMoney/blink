import { GT } from "@graphql/index"
import IError from "../abstract/error"

const CaptchaChallengeResult = new GT.Object({
  name: "CaptchaChallengeResult",
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

const CaptchaChallengePayload = new GT.Object({
  name: "CaptchaChallengePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    result: { type: CaptchaChallengeResult },
  }),
})

export default CaptchaChallengePayload
