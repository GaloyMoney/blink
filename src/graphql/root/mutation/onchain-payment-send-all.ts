import { GT } from "@graphql/index"

import Memo from "@graphql/types/scalar/memo"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"

const OnChainPaymentSendAllInput = new GT.Input({
  name: "OnChainPaymentSendAllInput",
  fields: () => ({
    address: { type: GT.NonNull(OnChainAddress) },
    memo: { type: Memo },
  }),
})

const OnChainPaymentSendAllMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendAllInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { address, memo } = args.input

    for (const input of [memo, address]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await wallet.onChainPay({ address, amount: 0, memo, sendAll: true })
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

export default OnChainPaymentSendAllMutation
