import { UnknownPhoneProviderServiceError } from "@domain/errors"
import { PhoneNumberInstance } from "twilio/lib/rest/lookups/v1/phoneNumber"

type PhoneProviderServiceError = import("./errors").PhoneProviderServiceError

declare const ipAddressSymbol: unique symbol
type IpAddress = string & { [ipAddressSymbol]: never }

type IPInfo = {
  provider: string
  country: string
  region: string
  city: string
  type: string
  status: string
}

interface IPhoneProviderService {
  getCarrier(
    phone: PhoneNumber,
  ): Promise<PhoneNumberInstance | UnknownPhoneProviderServiceError>
  sendText({
    body,
    to,
    logger,
  }: {
    body: string
    to: PhoneNumber
    logger: Logger
  }): Promise<true | UnknownPhoneProviderServiceError>
}
