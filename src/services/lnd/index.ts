import { timeout } from "@core/utils"
import { toMSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
  LightningServiceError,
} from "@domain/bitcoin/lightning"
import { createInvoice, payViaRoutes, payViaPaymentDetails } from "lightning"
import { FEECAP, FEEMIN, TIMEOUT_PAYMENT } from "./auth"
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

  const payRequest = async ({
    decodedRequest,
    timeoutMSecs = TIMEOUT_PAYMENT as TimeoutMSecs,
  }: {
    decodedRequest: LnInvoice
    timeoutMSecs?: TimeoutMSecs
  }): Promise<PaymentResult | LightningServiceError> => {
    let paymentResult

    const {
      paymentHash: id,
      amount: satoshis,
      destination,
      routeHints,
      paymentSecret: payment,
      cltvDelta,
      features,
    } = decodedRequest

    const max_fee =
      satoshis && satoshis > 0 ? Math.floor(Math.max(FEECAP * satoshis, FEEMIN)) : FEEMIN

    try {
      const paymentPromise = payViaPaymentDetails({
        lnd: lndAuth,
        id,
        cltv_delta: cltvDelta,
        destination,
        features,
        max_fee,
        tokens: satoshis || 0,
        payment,
        routes: routeHints,
      })
      const timeoutPromise = timeout(timeoutMSecs, "Timeout")
      paymentResult = await Promise.race([paymentPromise, timeoutPromise])
    } catch (err) {
      return handlePaymentError(err)
    }
    return {
      safe_fee: paymentResult.safe_fee as Satoshis,
      paymentSecret: paymentResult.secret as PaymentSecret,
    }
  }

  const payToRoute = async ({
    route,
    id,
    timeoutMSecs = TIMEOUT_PAYMENT as TimeoutMSecs,
  }: {
    route: PaymentRoute
    id: Pubkey
    timeoutMSecs?: TimeoutMSecs
  }): Promise<PaymentResult | LightningServiceError> => {
    let paymentResult
    try {
      const paymentPromise = payViaRoutes({ lnd: lndAuth, routes: [route], id })
      const timeoutPromise = timeout(timeoutMSecs, "Timeout")
      paymentResult = await Promise.race([paymentPromise, timeoutPromise])
    } catch (err) {
      return handlePaymentError(err)
    }
    return {
      safe_fee: paymentResult.safe_fee as Satoshis,
      paymentSecret: paymentResult.secret as PaymentSecret,
    }
  }

  return {
    registerInvoice,
    payRequest,
    payToRoute,
  }
}

const handlePaymentError = (err): LightningServiceError => {
  if (err.message === "Timeout")
    return new LightningServiceError("Paying invoice timed out")

  if (
    "invoice is already paid" ===
    (err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details)
  )
    return new LightningServiceError("Invoice already paid")

  return new UnknownLightningServiceError()
}
