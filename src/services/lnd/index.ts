import { toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
} from "@domain/bitcoin/lightning"
import { parsePaymentRequest } from "invoices"
import { createInvoice } from "lightning"
import { getActiveLnd } from "./utils"

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

  const decodeRequest = ({
    request,
  }: {
    request: EncodedPaymentRequest
  }): DecodedPaymentRequest | LightningServiceError => {
    try {
      const decoded = parsePaymentRequest({ request })
      return {
        id: decoded.id as PaymentHash,
        satoshis: toSats(decoded.safe_tokens),
        destination: decoded.destination as Pubkey,
        description: decoded.description,
        routeHint: decoded.routes,
        payment: decoded.payment,
        cltvDelta: decoded.cltv_delta,
        expiresAt: decoded.expires_at as InvoiceExpiration,
        features: decoded.features,
      }
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  return {
    registerInvoice,
    decodeRequest,
  }
}
