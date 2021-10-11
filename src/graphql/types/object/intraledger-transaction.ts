import { GT } from "@graphql/index"

import ITransaction, { transactionInterfaceFields } from "../abstract/transaction"
import Username from "../scalar/username"

import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"

const IntraLedgerTransaction = new GT.Object({
  name: "IntraLedgerTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementVia === DomainSettlementMethod.IntraLedger,
  fields: () => ({
    ...transactionInterfaceFields,

    // Non-interface fields
    otherPartyUsername: {
      type: Username,
      description:
        "Settlement destination: Could be null when originalDestination is OnChain/LN" +
        " and the payee does not have a username",
    },
  }),
})

export default IntraLedgerTransaction
