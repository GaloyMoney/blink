import { GT } from "@graphql/index"
import { RegisterCaptchaGeetest } from "@core/captcha-challenge-create"

import CaptchaCreateChallengePayload from "@graphql/types/payload/captcha-create-challenge"

const CaptchaCreateChallengeMutation = GT.Field({
  type: GT.NonNull(CaptchaCreateChallengePayload),
  resolve: async (_, __, { logger, ip, geetest }) => {
    // TODO: store the request and determine what to do if things fail here...
    const registerCaptchaGeetest = await RegisterCaptchaGeetest({
      logger,
      ip,
      geetest,
    })

    if (registerCaptchaGeetest instanceof Error) {
      return {
        errors: [{ message: registerCaptchaGeetest.message }],
      }
    }

    const { success, gt, challenge, newCaptcha } = registerCaptchaGeetest

    return {
      errors: [],
      result: {
        id: gt,
        challengeCode: challenge,
        newCaptcha,
        failbackMode: success === 0,
      },
    }
  },
})

export default CaptchaCreateChallengeMutation
