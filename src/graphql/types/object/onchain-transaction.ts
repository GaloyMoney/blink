import { GT } from "@graphql/index"

import ITransaction, { transactionInterfaceFields } from "../abstract/transaction"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentHash from "../scalar/payment-hash"

import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"

const OnChainTransaction = new GT.Object({
  name: "OnChainTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementVia === DomainSettlementMethod.OnChain,
  fields: () => ({
    ...transactionInterfaceFields,

    // Non-interface fields
    addresses: {
      type: GT.NonNullList(OnChainAddress),
    },

    transactionHash: {
      type: GT.NonNull(PaymentHash),
    },
  }),
})

export default OnChainTransaction
