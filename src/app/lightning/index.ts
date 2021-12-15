import { wrapAsyncToRunInSpan, wrapToRunInSpan } from "@services/tracing"
import * as LookupInvoiceByHash from "./lookup-invoice-by-hash"
import * as LookupPaymentByHash from "./lookup-payment-by-hash"
import { PaymentStatusChecker as PaymentStatusCheckerFn } from "./payment-status-checker"

// creates an object with all the functions of imported modules
const dynamicWrapper = { ...LookupInvoiceByHash, ...LookupPaymentByHash }

for (const fn in dynamicWrapper) {
  // wrap with async span, we need to be careful with functions that don't return a promise like PaymentStatusChecker
  dynamicWrapper[fn] = wrapAsyncToRunInSpan({ fn: dynamicWrapper[fn] })
}

// Still we need to do a static export
export const { PaymentStatusChecker, lookupInvoiceByHash, lookupPaymentByHash } = {
  PaymentStatusChecker: wrapToRunInSpan({ fn: PaymentStatusCheckerFn }),
  ...dynamicWrapper,
}
