type LnurlError = import("@/domain/bitcoin/lnurl/errors").LnurlError
interface ILnurlPayService {
  fetchInvoiceFromLnAddressOrLnurl(args: {
    amount: BtcPaymentAmount
    lnAddressOrLnurl: string
  }): Promise<string | LnurlError>
}
