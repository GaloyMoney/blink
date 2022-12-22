import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { ChannelType } from "@domain/phone-provider"
import PhoneCodeChannelType from "@graphql/types/scalar/phone-code-channel-type"
import { InputValidationError } from "@graphql/error"

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

const CaptchaRequestAuthCodeMutation = GT.Field<{
  input: {
    phone: PhoneNumber | InputValidationError
    challengeCode: string | InputValidationError
    validationCode: string | InputValidationError
    secCode: string | InputValidationError
    channel: string | InputValidationError
  }
}>({
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
      channel: channelInput,
    } = args.input

    if (phone instanceof Error) return { errors: [{ message: phone.message }] }
    if (geetestChallenge instanceof Error)
      return { errors: [{ message: geetestChallenge.message }] }
    if (geetestValidate instanceof Error)
      return { errors: [{ message: geetestValidate.message }] }
    if (geetestSeccode instanceof Error)
      return { errors: [{ message: geetestSeccode.message }] }
    if (channelInput instanceof Error)
      return { errors: [{ message: channelInput.message }] }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    let channel: ChannelType = ChannelType.Sms
    if (channelInput === "WHATSAPP") channel = ChannelType.Whatsapp

    const result = await Auth.requestPhoneCodeWithCaptcha({
      phone,
      geetest,
      geetestChallenge,
      geetestValidate,
      geetestSeccode,
      logger,
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
