interface ILnPaymentsRepository {
  update(lnPayment: LnPaymentLookup): Promise<LnPayment | RepositoryError>
}
