import { GT } from "@/graphql/index"

import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import Phone from "@/graphql/shared/types/scalar/phone"
import AccountId from "@/graphql/shared/types/scalar/account-id"

const UserUpdatePhoneInput = GT.Input({
  name: "UserUpdatePhoneInput",
  fields: () => ({
    accountId: {
      type: GT.NonNull(AccountId),
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
    input: { accountId: string; phone: PhoneNumber | Error }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdatePhoneInput) },
  },
  resolve: async (_, args, { privilegedClientId }) => {
    const { accountId, phone } = args.input
    for (const input of [accountId, phone]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    if (phone instanceof Error) return { errors: [{ message: phone.message }] }

    const account = await Admin.updateUserPhone({
      accountId,
      phone,
      updatedByPrivilegedClientId: privilegedClientId,
    })
    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default UserUpdatePhoneMutation
