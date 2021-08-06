type LightningServiceErrorType =
  | "UnknownLightningServiceError"
  | "CouldNotDecodeReturnedPaymentRequest"
type LightningServiceError = ErrorWithMessage<LightningServiceErrorType>

type RegisterInvoiceArgs = {
  description: string
  satoshis: Satoshis
  expiresAt: InvoiceExpiration
}

type RegisteredInvoice = {
  invoice: LnInvoice
}

interface ILightningService {
  registerInvoice(
    registerInvoiceArgs: RegisterInvoiceArgs,
  ): ResultAsync<RegisteredInvoice, LightningServiceError>
}
