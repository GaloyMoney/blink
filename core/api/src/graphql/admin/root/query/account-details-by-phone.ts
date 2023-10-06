import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import Phone from "@/graphql/shared/types/scalar/phone"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"

const AccountDetailsByUserPhoneQuery = GT.Field<
  null,
  GraphQLAdminContext,
  {
    // FIXME: doesn't respect the input: {} pattern
    phone: PhoneNumber | ValidationError
  }
>({
  type: GT.NonNull(AuditedAccount),
  args: {
    phone: { type: GT.NonNull(Phone) },
  },
  resolve: async (parent, { phone }) => {
    if (phone instanceof Error) {
      throw phone
    }

    const account = await Admin.getAccountByUserPhone(phone)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByUserPhoneQuery
