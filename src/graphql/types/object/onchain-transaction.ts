import { GT } from "@graphql/index"

import ITransaction, { transactionInterfaceFields } from "../abstract/transaction"
import OnChainAddress from "../scalar/on-chain-address"
import OnChainTxHash from "../scalar/onchain-tx-hash"

import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"

const OnChainTransaction = new GT.Object({
  name: "OnChainTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementVia.type === DomainSettlementMethod.OnChain,
  fields: () => ({
    ...transactionInterfaceFields,

    // Non-interface fields
    address: {
      type: GT.NonNull(OnChainAddress),
      resolve: (source) => {
        // Required to support legacy data:
        // Domain expects a strict string type, but absence of property in legacy
        // data means that the incoming value can sometimes be undefined.
        if (source && source.address) return source.address
        return ""
      },
    },

    transactionHash: {
      type: GT.NonNull(OnChainTxHash),
    },
  }),
})

export default OnChainTransaction
