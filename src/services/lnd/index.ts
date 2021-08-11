import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
} from "@domain/bitcoin/lightning"
import { createInvoice } from "lightning"

export const MakeLndService = (lndAuth: AuthenticatedLnd): ILightningService => {
  const registerInvoice = async ({
    satoshis,
    description,
    expiresAt,
  }: RegisterInvoiceArgs): Promise<RegisteredInvoice | LightningServiceError> => {
    const input = {
      lnd: lndAuth,
      description,
      tokens: satoshis as number,
      expires_at: expiresAt.toISOString(),
    }

    try {
      const { request } = await createInvoice(input)
      const returnedInvoice = decodeInvoice(request)
      if (returnedInvoice instanceof Error) {
        return returnedInvoice
      }
      return { invoice: returnedInvoice } as RegisteredInvoice
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  return {
    registerInvoice,
  }
}
