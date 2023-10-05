import IError from "../../../shared/types/abstract/error"
import ConsumerAccount from "../object/consumer-account"

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
