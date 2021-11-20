interface IPhoneCodesRepository {
  findRecent: (arg: {
    phone: PhoneNumber
    code: PhoneCode
  }) => Promise<true | RepositoryError>
}
