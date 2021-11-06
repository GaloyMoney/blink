interface ILnPaymentsRepository {
  findById(paymentId: PaymentId): Promise<LnPayment | RepositoryError>
  update(lnPayment: LnPaymentLookup): Promise<LnPayment | RepositoryError>
}
