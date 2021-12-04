import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/account"
import Phone from "@graphql/types/scalar/phone"

import { getAccountByUserPhone } from "@app/admin"

const AccountDetailsByUserPhoneQuery = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      throw phone
    }

    const account = await getAccountByUserPhone(phone)
    if (account instanceof Error) {
      throw account
    }

    return account
  },
})

export default AccountDetailsByUserPhoneQuery
