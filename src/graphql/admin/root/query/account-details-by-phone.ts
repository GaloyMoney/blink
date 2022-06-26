import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import Phone from "@graphql/types/scalar/phone"

import { Admin } from "@app"

const AccountDetailsByUserPhoneQuery = GT.Field<{
  // FIXME: doesn't respect the input: {} pattern
  phone: PhoneNumber | ValidationError
}>({
  type: GT.NonNull(GraphQLAccount),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      throw phone
    }

    const account = await Admin.getAccountByUserPhone(phone)
    if (account instanceof Error) {
      throw account
    }

    return account
  },
})

export default AccountDetailsByUserPhoneQuery
