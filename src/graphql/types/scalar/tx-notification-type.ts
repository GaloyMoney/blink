import { GT } from "@graphql/index"

const TxNotificationType = new GT.Enum({
  name: "TxNotificationType",
  values: {
    OnchainReceipt: { value: "onchain_receipt" },
    OnchainReceiptPending: { value: "onchain_receipt_pending" },
    OnchainPayment: { value: "onchain_payment" },
    LnInvoicePaid: { value: "paid-invoice" },
  },
})

export default TxNotificationType
