import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import Phone from "@graphql/types/scalar/phone"

import { Admin } from "@app"
import { mapError } from "@graphql/error-map"

const AccountDetailsByUserPhoneQuery = GT.Field({
  type: GT.NonNull(GraphQLAccount),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    const account = await Admin.getAccountByUserPhone(phone)
    if (account instanceof Error) {
      return { errors: [{ message: mapError(account).message }] }
    }

    return account
  },
})

export default AccountDetailsByUserPhoneQuery
