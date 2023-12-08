interface ILnurlPayService {
  fetchInvoiceFromLnAddressOrLnurl(args: {
    amount: BtcPaymentAmount
    lnAddressOrLnurl: string
  }): Promise<string | ApplicationError>
}
