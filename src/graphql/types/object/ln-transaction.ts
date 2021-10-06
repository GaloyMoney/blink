import { GT } from "@graphql/index"

import ITransaction, { transactionInterfaceFields } from "../abstract/transaction"
import PaymentHash from "../scalar/payment-hash"

import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"

const LnTransaction = new GT.Object({
  name: "LnTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementVia === DomainSettlementMethod.Lightning,
  fields: () => ({
    ...transactionInterfaceFields,

    // Non-interface fields
    paymentHash: {
      type: GT.NonNull(PaymentHash),
    },
  }),
})

export default LnTransaction
