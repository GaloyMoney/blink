import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentRequest from "../scalar/ln-payment-request"

import { PaymentInitiationMethod } from "@/domain/wallets"

import { GT } from "@/graphql/index"
import { Lightning } from "@/app"
import { recordExceptionInCurrentSpan } from "@/services/tracing"
import { ErrorLevel } from "@/domain/shared"

const InitiationViaIntraLedger = GT.Object({
  name: "InitiationViaIntraLedger",
  isTypeOf: (source) => source.type === PaymentInitiationMethod.IntraLedger,
  fields: () => ({
    counterPartyWalletId: {
      // type: GT.NonNull(WalletId),
      type: WalletId,
    },
    counterPartyUsername: {
      type: Username,
    },
  }),
})

const InitiationViaLn = GT.Object({
  name: "InitiationViaLn",
  isTypeOf: (source) => source.type === PaymentInitiationMethod.Lightning,
  fields: () => ({
    paymentHash: {
      type: GT.NonNull(PaymentHash),
    },
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
      description: "Bolt11 invoice",
      resolve: async (source) => {
        const paymentRequest = await Lightning.getPaymentRequestByTransactionId({
          ledgerTransactionId: source.parent.id,
        })
        if (paymentRequest instanceof Error) {
          recordExceptionInCurrentSpan({
            error: paymentRequest,
            level: ErrorLevel.Critical,
            attributes: { ["error.parentId"]: source.parent.id },
          })
          return ""
        }
        return paymentRequest
      },
    },
  }),
})

const InitiationViaOnChain = GT.Object({
  name: "InitiationViaOnChain",
  isTypeOf: (source) => source.type === PaymentInitiationMethod.OnChain,
  fields: () => ({
    address: {
      type: GT.NonNull(OnChainAddress),
    },
  }),
})

const InitiationVia = GT.Union({
  name: "InitiationVia",
  types: () => [InitiationViaIntraLedger, InitiationViaLn, InitiationViaOnChain],
})

export default InitiationVia
