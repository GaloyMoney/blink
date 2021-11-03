interface ILnPaymentsRepository {
  update(lnPayment: LnPaymentLookup): Promise<LnPaymentLookup | RepositoryError>
}
