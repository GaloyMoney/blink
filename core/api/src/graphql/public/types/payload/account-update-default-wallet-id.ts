import ConsumerAccount from "../object/consumer-account"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

const AccountUpdateDefaultWalletIdPayload = GT.Object({
  name: "AccountUpdateDefaultWalletIdPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateDefaultWalletIdPayload
