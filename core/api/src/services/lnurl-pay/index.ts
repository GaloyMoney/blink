import { utils, requestInvoice } from "lnurl-pay"

import { wrapAsyncFunctionsToRunInSpan } from "../tracing"

import { toSats } from "@/domain/bitcoin"
import {
  ErrorFetchingLnurlInvoice,
  LnurlServiceError,
  UnknownLnurlServiceError,
} from "@/domain/bitcoin/lnurl/errors"

export const LnurlPayService = (): ILnurlPayService => {
  const fetchInvoiceFromLnAddressOrLnurl = async ({
    amount,
    lnAddressOrLnurl,
  }: {
    amount: BtcPaymentAmount
    lnAddressOrLnurl: string
  }): Promise<string | LnurlServiceError> => {
    try {
      const invoice = await requestInvoice({
        lnUrlOrAddress: lnAddressOrLnurl,
        tokens: utils.toSats(toSats(amount.amount)),
      })

      if (!invoice.hasValidAmount) {
        return new ErrorFetchingLnurlInvoice(
          "Lnurl service returned an invoice with an invalid amount",
        )
      }

      return invoice.invoice
    } catch (err) {
      if (err instanceof Error) {
        return new ErrorFetchingLnurlInvoice(err.message)
      }
      return new UnknownLnurlServiceError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.lnurl-pay",
    fns: {
      fetchInvoiceFromLnAddressOrLnurl,
    },
  })
}
