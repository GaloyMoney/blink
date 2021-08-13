import { LndOfflineError } from "@core/error"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
} from "@domain/bitcoin/lightning"
import { createInvoice } from "lightning"
import { getActiveLnd } from "./utils"

export const LndService = (): ILightningService => {
  let lndAuth: AuthenticatedLnd, pubkey: string
  try {
    ;({ lnd: lndAuth, pubkey } = getActiveLnd())
  } catch (err) {
    throw new LndOfflineError("no active lnd to create an invoice")
  }

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
      return { invoice: returnedInvoice, pubkey } as RegisteredInvoice
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  return {
    registerInvoice,
  }
}
