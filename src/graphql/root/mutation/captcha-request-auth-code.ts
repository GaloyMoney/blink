import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"
import { Users } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const CaptchaRequestAuthCodeInput = GT.Input({
  name: "CaptchaRequestAuthCodeInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    challengeCode: { type: GT.NonNull(GT.String) },
    validationCode: { type: GT.NonNull(GT.String) },
    secCode: { type: GT.NonNull(GT.String) },
  }),
})

const CaptchaRequestAuthCodeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
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

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const result = await Users.requestPhoneCodeWithCaptcha({
      phone,
      geetest,
      geetestChallenge,
      geetestValidate,
      geetestSeccode,
      logger,
      ip,
    })

    if (result instanceof Error) {
      return {
        errors: [mapAndParseErrorForGqlResponse(result)],
        success: false,
      }
    }

    return {
      errors: [],
      success: true,
    }
  },
})

export default CaptchaRequestAuthCodeMutation
