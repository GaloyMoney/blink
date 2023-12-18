type LnurlServiceError = import("@/domain/bitcoin/lnurl/errors").LnurlServiceError
interface ILnurlPayService {
  fetchInvoiceFromLnAddressOrLnurl(args: {
    amount: BtcPaymentAmount
    lnAddressOrLnurl: string
  }): Promise<string | LnurlServiceError>
}
