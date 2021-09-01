import { GT } from "@graphql/index"

import WalletContactUpdateAliasPayload from "@graphql/types/payload/wallet-contact-update-alias"
import ContactAlias from "@graphql/types/scalar/contact-alias"
import WalletName from "@graphql/types/scalar/wallet-name"
import * as Users from "@app/users"

const WalletContactUpdateAliasInput = new GT.Input({
  name: "WalletContactUpdateAliasInput",
  fields: () => ({
    walletName: { type: GT.NonNull(WalletName) },
    alias: { type: GT.NonNull(ContactAlias) },
  }),
})

const WalletContactUpdateAliasMutation = GT.Field({
  type: GT.NonNull(WalletContactUpdateAliasPayload),
  args: {
    input: { type: GT.NonNull(WalletContactUpdateAliasInput) },
  },
  resolve: async (_, args, { uid }) => {
    const { walletName, alias } = args.input

    for (const input of [walletName, alias]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = Users.updateWalletContactAlias({
      userId: uid as UserId,
      walletName,
      alias,
    })

    if (user instanceof Error) {
      return { errors: [{ message: walletName.message }] }
    }

    return {
      errors: [],
      user,
    }
  },
})

export default WalletContactUpdateAliasMutation
