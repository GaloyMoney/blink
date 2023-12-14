import { GT } from "@/graphql/index"

import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import Phone from "@/graphql/shared/types/scalar/phone"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"
import { ChannelType } from "@/domain/phone-provider"

import PhoneCodeChannelType from "@/graphql/shared/types/scalar/phone-code-channel-type"

const UserPhoneRegistrationInitiateInput = GT.Input({
  name: "UserPhoneRegistrationInitiateInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    channel: { type: PhoneCodeChannelType },
  }),
})

const UserPhoneRegistrationInitiateMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      phone: PhoneNumber | InputValidationError
      channel: ChannelType | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(UserPhoneRegistrationInitiateInput) },
  },
  resolve: async (_, args, { ip, user }) => {
    const { phone, channel: channelInput } = args.input

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (channelInput instanceof Error)
      return { errors: [{ message: channelInput.message }] }

    let channel: ChannelType = ChannelType.Sms
    if (channelInput?.toLowerCase() === ChannelType.Whatsapp)
      channel = ChannelType.Whatsapp

    const success = await Authentication.requestPhoneCodeForAuthedUser({
      phone,
      ip,
      channel,
      user,
    })

    if (success instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(success)] }
    }

    return { errors: [], success }
  },
})

export default UserPhoneRegistrationInitiateMutation
