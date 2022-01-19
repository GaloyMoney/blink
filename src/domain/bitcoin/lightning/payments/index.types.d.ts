type LnPaymentPartial = {
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest
  readonly sentFromPubkey: Pubkey
}

type PersistedLnPaymentLookup = Omit<LnPaymentLookup, "paymentRequest"> & {
  readonly sentFromPubkey: Pubkey
  paymentRequest: EncodedPaymentRequest | undefined
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
