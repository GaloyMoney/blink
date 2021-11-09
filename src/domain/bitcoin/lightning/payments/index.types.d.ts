interface ILnPaymentsRepository {
  findByPaymentHash(paymentHash: PaymentHash): Promise<LnPayment | RepositoryError>
  update(lnPayment: LnPaymentLookup): Promise<LnPayment | RepositoryError>
}
