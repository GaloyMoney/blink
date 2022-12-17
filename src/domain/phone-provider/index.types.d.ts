type PhoneProviderServiceError = import("./errors").PhoneProviderServiceError
type UnknownPhoneProviderServiceError =
  import("@domain/phone-provider").UnknownPhoneProviderServiceError
type PhoneCodeInvalidError = import("./errors").PhoneCodeInvalidError

interface IPhoneProviderService {
  getCarrier(phone: PhoneNumber): Promise<PhoneMetadata | PhoneProviderServiceError>
  initiateVerify(to: PhoneNumber): Promise<true | PhoneProviderServiceError>
  validateVerify({
    to,
    code,
  }: {
    to: PhoneNumber
    code: PhoneCode
  }): Promise<true | PhoneProviderServiceError>
}
