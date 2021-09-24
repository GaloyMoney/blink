import { GT } from "@graphql/index"
import verifyCaptchaAndReturnOTP from "@core/auth-code-request"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"

const CaptchaRequestAuthCodeInput = new GT.Input({
  name: "CaptchaRequestAuthCodeInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    challengeCode: { type: GT.NonNull(GT.String) },
    validationCode: { type: GT.NonNull(GT.String) },
    secCode: { type: GT.NonNull(GT.String) },
  }),
})

const CaptchaRequestAuthCodeMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(CaptchaRequestAuthCodeInput) },
  },
  resolve: async (_, args, { logger, ip, geetest }) => {
    const {
      phone,
      challengeCode: geetestChallenge,
      validationCode: geetestValidate,
      secCode: geetestSeccode,
    } = args.input

    for (const input of [phone, geetestChallenge, geetestValidate, geetestSeccode]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      // TODO: redo this with use-case and errors pattern
      await verifyCaptchaAndReturnOTP({
        phone,
        geetest,
        geetestChallenge,
        geetestValidate,
        geetestSeccode,
        logger,
        ip,
      })
      return {
        errors: [],
        success: true,
      }
    } catch (err) {
      return {
        errors: [{ message: err.message }],
        success: false,
      }
    }
  },
})

export default CaptchaRequestAuthCodeMutation
