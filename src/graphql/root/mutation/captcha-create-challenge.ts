import { GT } from "@graphql/index"

import CaptchaCreateChallengePayload from "@graphql/types/payload/captcha-create-challenge"

const CaptchaCreateChallengeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(CaptchaCreateChallengePayload),
  resolve: async (_, __, { geetest }) => {
    // TODO: store the request and determine what to do if things fail here...

    const registerCaptchaGeetest = await geetest.register()

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
