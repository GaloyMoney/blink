import { GT } from "@graphql/index"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import LnPaymentRequest from "../scalar/ln-payment-request"
import OnChainAddress from "../scalar/on-chain-address"

const InitiationViaIntraLedger = new GT.Object({
  name: "InitiationViaIntraLedger",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
    },
    counterPartyUsername: {
      type: Username,
    },
  }),
})

const InitiationViaLn = new GT.Object({
  name: "InitiationViaIntraLn",
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
    },
  }),
})

const InitiationViaOnChain = new GT.Object({
  name: "InitiationViaOnChain",
  fields: () => ({
    address: {
      type: GT.NonNull(OnChainAddress),
    },
  }),
})

const InitiationVia = new GT.Union({
  name: "InitiationVia",
  types: () => [InitiationViaIntraLedger, InitiationViaLn, InitiationViaOnChain],
})

export default InitiationVia
