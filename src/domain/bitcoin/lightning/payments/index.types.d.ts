type LnPaymentPartial = {
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest
}

type PersistedLnPaymentLookup = LnPaymentLookup & {
  isCompleteRecord: boolean
}

interface ILnPaymentsRepository {
  findByPaymentHash(
    paymentHash: PaymentHash,
  ): Promise<PersistedLnPaymentLookup | RepositoryError>
  persist(lnPaymentPartial: LnPaymentPartial): Promise<LnPaymentPartial | RepositoryError>
  update(
    lnPayment: PersistedLnPaymentLookup,
  ): Promise<PersistedLnPaymentLookup | RepositoryError>
}
