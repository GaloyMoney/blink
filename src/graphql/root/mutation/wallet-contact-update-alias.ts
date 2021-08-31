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

    if (walletName instanceof Error) {
      return { errors: [{ message: walletName.message }] }
    }

    const user = Users.updateWalletContactAlias({
      userId: uid as UserId,
      contact: walletName,
      alias,
    })
    if (user instanceof Error) {
      return { errors: [{ message: walletName.message }] }
    }

    // TODO: redo this with app use-case
    // try {
    //   const contact = user.contacts.find(
    //     (contact: UserContact) => contact.walletName === walletName,
    //   )
    //   if (!contact) {
    //     return { errors: [{ message: "Invalid request for contact update" }] }
    //   }
    //   contact.alias = alias
    //   await user.save()
    // } catch (err) {
    //   return { errors: [{ message: err.message }] }
    // }

    return {
      errors: [],
      user,
    }
  },
})

export default WalletContactUpdateAliasMutation
