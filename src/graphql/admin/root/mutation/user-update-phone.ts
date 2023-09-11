import { GT } from "@graphql/index"

import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import { Admin } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Phone from "@graphql/shared/types/scalar/phone"

const UserUpdatePhoneInput = GT.Input({
  name: "UserUpdatePhoneInput",
  fields: () => ({
    accountUuid: {
      type: GT.NonNullID,
    },
    phone: {
      type: GT.NonNull(Phone),
    },
  }),
})

const UserUpdatePhoneMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: { accountUuid: string; phone: PhoneNumber | Error }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdatePhoneInput) },
  },
  resolve: async (_, args, { auditorId }) => {
    const { accountUuid, phone } = args.input
    for (const input of [accountUuid, phone]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    if (phone instanceof Error) return { errors: [{ message: phone.message }] }

    const account = await Admin.updateUserPhone({
      accountUuid,
      phone,
      updatedByUserId: auditorId,
    })
    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default UserUpdatePhoneMutation
