interface IPhoneCodesRepository {
  checkRecentEntry: (arg: {
    phone: PhoneNumber
    code: PhoneCode
  }) => Promise<true | RepositoryError>

  persistNew: (arg: {
    phone: PhoneNumber
    code: PhoneCode
  }) => Promise<true | RepositoryError>
}
