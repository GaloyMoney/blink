import { toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
  LightningServiceError,
  InvoiceNotFoundError,
  PaymentNotFoundError,
} from "@domain/bitcoin/lightning"
import { createInvoice, getInvoice, getPayment } from "lightning"
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

  const lookupPayment = async ({
    pubkey,
    paymentHash,
    logger,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
    logger: Logger
  }): Promise<LnPaymentLookup | LightningServiceError> => {
    const lightningLogger = logger.child({
      topic: "payment",
      protocol: "lightning",
      transactionType: "payment",
      onUs: false,
    })

    let lnd
    try {
      ;({ lnd } = getLndFromPubkey({ pubkey }))
    } catch (err) {
      lightningLogger.warn(
        { paymentHash },
        "node is offline. skipping payment verification for now",
      )
      return new UnknownLightningServiceError(err)
    }

    try {
      const { is_confirmed, is_failed } = await getPayment({
        lnd,
        id: paymentHash,
      })
      return { isSettled: !!is_confirmed, isFailed: !!is_failed }
    } catch (err) {
      const paymentNotFound = "issue fetching payment"
      lightningLogger.error({ lnd, err }, paymentNotFound)
      return new PaymentNotFoundError()
    }
  }

  return {
    registerInvoice,
    lookupInvoice,
    lookupPayment,
  }
}
