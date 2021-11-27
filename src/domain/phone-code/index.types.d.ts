interface IPhoneCodesRepository {
  existNewerThan: (arg: {
    phone: PhoneNumber
    code: PhoneCode
    age: Seconds
  }) => Promise<true | RepositoryError>

  persistNew: (arg: {
    phone: PhoneNumber
    code: PhoneCode
  }) => Promise<true | RepositoryError>
}
