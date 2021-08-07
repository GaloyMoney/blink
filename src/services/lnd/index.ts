import { decodeInvoice } from "@domain/ln-invoice"
import { toTypedError } from "@domain/utils"
import { createInvoice } from "lightning"
import { fromPromise, ResultAsync } from "neverthrow"

const toUnknownLightningServiceError = toTypedError<LightningServiceErrorType>({
  _type: "UnknownLightningServiceError",
  unknownMessage: "Unknown Lightning Service Error",
})

export const MakeLndService = (lndAuth: AuthenticatedLnd): ILightningService => {
  const registerInvoice = ({
    satoshis,
    description,
    expiresAt,
  }: RegisterInvoiceArgs): ResultAsync<RegisteredInvoice, LightningServiceError> => {
    const input = {
      lnd: lndAuth,
      description,
      tokens: satoshis.inner,
      expires_at: expiresAt.toISOString(),
    }

    return fromPromise(createInvoice(input), toUnknownLightningServiceError)
      .andThen(({ request }) =>
        decodeInvoice(request).mapErr(({ message }) => {
          return {
            _type: "CouldNotDecodeReturnedPaymentRequest" as LightningServiceErrorType,
            message: "DecodeInvoice - " + message,
          }
        }),
      )
      .map((invoice) => {
        return { invoice } as RegisteredInvoice
      })
  }

  return {
    registerInvoice,
  }
}
