import { GT } from "@graphql/index"

import { PaymentInitiationMethod } from "@domain/wallets"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentHash from "../scalar/payment-hash"

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
