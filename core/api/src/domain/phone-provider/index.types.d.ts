type PhoneProviderServiceError = import("./errors").PhoneProviderServiceError
type UnknownPhoneProviderServiceError =
  import("@/domain/phone-provider").UnknownPhoneProviderServiceError
type PhoneCodeInvalidError = import("./errors").PhoneCodeInvalidError

interface IPhoneProviderService {
  getCarrier(phone: PhoneNumber): Promise<PhoneMetadata | PhoneProviderServiceError>
  initiateVerify({
    to,
    channel,
  }: {
    to: PhoneNumber
    channel: ChannelType
  }): Promise<true | PhoneProviderServiceError>
  validateVerify({
    to,
    code,
  }: {
    to: PhoneNumber
    code: PhoneCode
  }): Promise<true | PhoneProviderServiceError>
}
