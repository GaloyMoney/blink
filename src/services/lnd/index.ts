import { toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
  LightningServiceError,
  InvoiceNotFoundError,
} from "@domain/bitcoin/lightning"
import { createInvoice, getInvoice } from "lightning"
import { getActiveLnd, getLndFromPubkey } from "./utils"

export const LndService = (): ILightningService | LightningServiceError => {
  let lndAuth: AuthenticatedLnd, pubkey: string
  try {
    ;({ lnd: lndAuth, pubkey } = getActiveLnd())
  } catch (err) {
    return new UnknownLightningServiceError(err)
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

  const lookupInvoice = async ({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnInvoiceLookup | LightningServiceError> => {
    try {
      const { lnd } = getLndFromPubkey({ pubkey })
      const { is_confirmed, description, received } = await getInvoice({
        lnd,
        id: paymentHash,
      })
      return { isSettled: !!is_confirmed, description, received: toSats(received) }
    } catch (err) {
      const invoiceNotFound = "unable to locate invoice"
      if (err.length === 3 && err[2]?.err?.details === invoiceNotFound) {
        return new InvoiceNotFoundError()
      }
      return new UnknownLightningServiceError(err)
    }
  }

  return {
    registerInvoice,
    lookupInvoice,
  }
}
