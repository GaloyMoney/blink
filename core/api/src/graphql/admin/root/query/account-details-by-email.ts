import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"
import EmailAddress from "@/graphql/shared/types/scalar/email-address"

const AccountDetailsByUserEmailQuery = GT.Field<
  null,
  GraphQLAdminContext,
  {
    // FIXME: doesn't respect the input: {} pattern
    email: EmailAddress | ValidationError
  }
>({
  type: GT.NonNull(AuditedAccount),
  args: {
    email: { type: GT.NonNull(EmailAddress) },
  },
  resolve: async (parent, { email }) => {
    if (email instanceof Error) {
      throw email
    }

    const account = await Admin.getAccountByUserEmail(email)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByUserEmailQuery
