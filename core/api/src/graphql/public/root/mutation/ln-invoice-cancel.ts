import dedent from "dedent"

import { Wallets } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import PaymentHash from "@/graphql/shared/types/scalar/payment-hash"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

const LnInvoiceCancelInput = GT.Input({
  name: "LnInvoiceCancelInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a wallet associated with the current account.",
    },
    paymentHash: { type: GT.NonNull(PaymentHash) },
  }),
})

const LnInvoiceCancelMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  description: dedent`Cancel an unpaid lightning invoice for an associated wallet.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCancelInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentHash } = args.input

    for (const input of [walletId, paymentHash]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }], success: false }
      }
    }

    const result = await Wallets.cancelInvoiceForWallet({
      walletId,
      paymentHash,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)], success: false }
    }

    return { errors: [], success: true }
  },
})

export default LnInvoiceCancelMutation
