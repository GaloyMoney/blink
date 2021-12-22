interface ILnPaymentsRepository {
  findByPaymentHash(paymentHash: PaymentHash): Promise<LnPaymentLookup | RepositoryError>
  update(lnPayment: LnPaymentLookup): Promise<LnPaymentLookup | RepositoryError>
}
