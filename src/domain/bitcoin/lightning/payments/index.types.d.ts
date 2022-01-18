type LnPaymentPartial = {
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest
  readonly sentFromPubkey: Pubkey
}

type PersistedLnPaymentLookup = LnPaymentLookup & {
  readonly sentFromPubkey: Pubkey
  isCompleteRecord: boolean
}

interface ILnPaymentsRepository {
  findByPaymentHash(
    paymentHash: PaymentHash,
  ): Promise<PersistedLnPaymentLookup | RepositoryError>
  listIncomplete(): Promise<PersistedLnPaymentLookup[] | RepositoryError>
  persistNew(
    lnPaymentPartial: LnPaymentPartial,
  ): Promise<LnPaymentPartial | RepositoryError>
  update(
    lnPayment: PersistedLnPaymentLookup,
  ): Promise<PersistedLnPaymentLookup | RepositoryError>
}
