import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { getCaptcha } from "@config"
import { ChannelType } from "@domain/phone-provider"
import PhoneCodeChannelType from "@graphql/types/scalar/phone-code-channel-type"

const UserRequestAuthCodeInput = GT.Input({
  name: "UserRequestAuthCodeInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    channel: { type: PhoneCodeChannelType },
  }),
})

const UserRequestAuthCodeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(UserRequestAuthCodeInput) },
  },
  resolve: async (_, args, { logger, ip }) => {
    const isCaptchaMandatory = getCaptcha().mandatory
    if (isCaptchaMandatory) {
      return { errors: [{ message: "use captcha endpoint to request auth code" }] }
    }

    const { phone, channel: channelInput } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (channelInput instanceof Error)
      return { errors: [{ message: channelInput.message }] }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    let channel: ChannelType = ChannelType.Sms
    if (channelInput === "WHATSAPP") channel = ChannelType.Whatsapp

    const status = await Auth.requestPhoneCode({
      phone,
      logger,
      ip,
      channel,
    })

    if (status instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return { errors: [], success: status }
  },
})

export default UserRequestAuthCodeMutation
