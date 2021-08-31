import { GT } from "@graphql/index"

import ContactAlias from "../scalar/contact-alias"

const WalletContact = new GT.Object({
  name: "WalletContact",
  fields: () => ({
    walletName: { type: GT.NonNullID },
    alias: { type: ContactAlias },
    transactionsCount: {
      type: GT.NonNull(GT.Int),
    },
  }),
})

export default WalletContact
