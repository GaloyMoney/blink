import { GT } from "@graphql/index"
import IError from "../abstract/error"

import { UserDetails } from "../object/user"

const WalletContactUpdateAliasPayload = new GT.Object({
  name: "WalletContactUpdateAliasPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: UserDetails,
    },
  }),
})

export default WalletContactUpdateAliasPayload
