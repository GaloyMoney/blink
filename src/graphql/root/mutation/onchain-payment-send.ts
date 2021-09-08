import { GT } from "@graphql/index"

import Memo from "@graphql/types/scalar/memo"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import SatAmount from "@graphql/types/scalar/sat-amount"

const OnChainPaymentSendInput = new GT.Input({
  name: "OnChainPaymentSendInput",
  fields: () => ({
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const OnChainPaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { address, amount, memo } = args.input

    for (const input of [memo, amount, address]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await wallet.onChainPay({ address, amount, memo })
      return {
        errors: [],
        status,
      }
    } catch (err) {
      return {
        status: "failed",
        errors: [{ message: err.message }],
      }
    }
  },
})

export default OnChainPaymentSendMutation
