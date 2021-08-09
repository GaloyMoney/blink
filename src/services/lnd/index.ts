import {
  LightningServiceError,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
} from "@domain/errors"
import { decodeInvoice } from "@domain/ln-invoice"
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
        return new CouldNotDecodeReturnedPaymentRequest(returnedInvoice.message)
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
