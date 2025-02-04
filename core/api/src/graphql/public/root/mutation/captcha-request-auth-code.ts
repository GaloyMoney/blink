import { GT } from "@/graphql/index"

import Phone from "@/graphql/shared/types/scalar/phone"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import PhoneCodeChannelType from "@/graphql/shared/types/scalar/phone-code-channel-type"
import { InputValidationError } from "@/graphql/error"

const CaptchaRequestAuthCodeInput = GT.Input({
  name: "CaptchaRequestAuthCodeInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    challengeCode: { type: GT.NonNull(GT.String) },
    validationCode: { type: GT.NonNull(GT.String) },
    secCode: { type: GT.NonNull(GT.String) },
    channel: { type: PhoneCodeChannelType },
  }),
})

const CaptchaRequestAuthCodeMutation = GT.Field<
  null,
  GraphQLPublicContext,
  {
    input: {
      phone: PhoneNumber | InputValidationError
      challengeCode: string | InputValidationError
      validationCode: string | InputValidationError
      secCode: string | InputValidationError
      channel: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(CaptchaRequestAuthCodeInput) },
  },
  resolve: async (_, args, { ip }) => {
    const {
      phone,
      challengeCode: geetestChallenge,
      validationCode: geetestValidate,
      secCode: geetestSeccode,
      channel,
    } = args.input

    if (phone instanceof Error) return { errors: [{ message: phone.message }] }
    if (geetestChallenge instanceof Error)
      return { errors: [{ message: geetestChallenge.message }] }
    if (geetestValidate instanceof Error)
      return { errors: [{ message: geetestValidate.message }] }
    if (geetestSeccode instanceof Error)
      return { errors: [{ message: geetestSeccode.message }] }
    if (channel instanceof Error) return { errors: [{ message: channel.message }] }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const result = await Authentication.requestPhoneCodeWithCaptcha({
      phone,
      geetestChallenge,
      geetestValidate,
      geetestSeccode,
      ip,
      channel,
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
