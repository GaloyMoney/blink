type PhoneProviderServiceError = import("./errors").PhoneProviderServiceError
type UnknownPhoneProviderServiceError =
  import("@domain/phone-provider").UnknownPhoneProviderServiceError

type SendTextArguments = {
  body: string
  to: PhoneNumber
  logger: Logger
}

interface IPhoneProviderService {
  getCarrier(phone: PhoneNumber): Promise<PhoneMetadata | PhoneProviderServiceError>
  sendText({
    body,
    to,
    logger,
  }: SendTextArguments): Promise<true | PhoneProviderServiceError>
}
