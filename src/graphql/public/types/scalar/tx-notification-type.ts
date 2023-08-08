import { GT } from "@graphql/index"

const TxNotificationType = GT.Enum({
  name: "TxNotificationType",
  values: {
    OnchainReceipt: { value: "onchain_receipt" },
    OnchainReceiptPending: { value: "onchain_receipt_pending" },
    OnchainPayment: { value: "onchain_payment" },
    LnInvoicePaid: { value: "paid-invoice" },
    IntraLedgerReceipt: { value: "intra_ledger_receipt" },
    IntraLedgerPayment: { value: "intra_ledger_payment" },
  },
})

export default TxNotificationType
