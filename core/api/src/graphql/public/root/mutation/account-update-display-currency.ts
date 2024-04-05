import { Accounts } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import DisplayCurrency from "@/graphql/shared/types/scalar/display-currency"
import AccountUpdateDisplayCurrencyPayload from "@/graphql/public/types/payload/account-update-display-currency"

const AccountUpdateDisplayCurrencyInput = GT.Input({
  name: "AccountUpdateDisplayCurrencyInput",
  fields: () => ({
    currency: { type: GT.NonNull(DisplayCurrency) },
  }),
})

const AccountUpdateDisplayCurrencyMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdateDisplayCurrencyPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateDisplayCurrencyInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { currency } = args.input

    if (currency instanceof Error) {
      return { errors: [{ message: currency.message }] }
    }

    const result = await Accounts.updateDisplayCurrency({
      accountId: domainAccount.id,
      currency,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      account: result,
    }
  },
})

export default AccountUpdateDisplayCurrencyMutation
