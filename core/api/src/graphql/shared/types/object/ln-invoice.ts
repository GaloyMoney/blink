import IInvoice from "../abstract/invoice"

import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"
import SatAmount from "../scalar/sat-amount"
import InvoicePaymentStatus from "../scalar/invoice-payment-status"
import Timestamp from "../scalar/timestamp"
import TxExternalId from "../scalar/tx-external-id"

import { GT } from "@/graphql/index"
import { WalletInvoiceStatusChecker } from "@/domain/wallet-invoices/wallet-invoice-status-checker"

const LnInvoice = GT.Object<WalletInvoice>({
  name: "LnInvoice",
  interfaces: () => [IInvoice],
  isTypeOf: (source) => !!source.lnInvoice.amount,
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
      resolve: (source) => source.lnInvoice.paymentRequest,
    },
    paymentHash: {
      type: GT.NonNull(PaymentHash),
      resolve: (source) => source.lnInvoice.paymentHash,
    },
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
      resolve: (source) => source.lnInvoice.paymentSecret,
    },
    satoshis: {
      type: GT.NonNull(SatAmount),
      resolve: (source) => source.lnInvoice.amount,
    },
    paymentStatus: {
      type: GT.NonNull(InvoicePaymentStatus),
      resolve: (source) => {
        const statusChecker = WalletInvoiceStatusChecker(source)
        const status = statusChecker.status(new Date())
        return status
      },
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
    externalId: {
      type: GT.NonNull(TxExternalId),
    },
  }),
})

export default LnInvoice
