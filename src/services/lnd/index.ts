import { toMilliSats, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  CouldNotDecodeReturnedPaymentRequest,
  UnknownLightningServiceError,
  LightningServiceError,
  InvoiceNotFoundError,
  PaymentStatus,
  LnPaymentPendingError,
  LnAlreadyPaidError,
  NoValidNodeForPubkeyError,
} from "@domain/bitcoin/lightning"
import { isInvoiceAlreadyPaidError, timeout } from "@core/utils"
import {
  createInvoice,
  getInvoice,
  getPayment,
  cancelHodlInvoice,
  payViaRoutes,
  payViaPaymentDetails,
  GetPaymentResult,
  PayViaPaymentDetailsArgs,
  PayViaRoutesResult,
  PayViaPaymentDetailsResult,
} from "lightning"
import { TIMEOUT_PAYMENT } from "./auth"
import { getActiveLnd, getLndFromPubkey, getLnds } from "./utils"
import { LndOfflineError } from "@core/error"

export const LndService = (): ILightningService | LightningServiceError => {
  let lndAuth: AuthenticatedLnd, defaultPubkey: Pubkey
  try {
    const { lnd, pubkey } = getActiveLnd()
    lndAuth = lnd
    defaultPubkey = pubkey as Pubkey
  } catch (err) {
    return new UnknownLightningServiceError(err)
  }

  const isLocal = (pubkey: Pubkey): boolean | LightningServiceError => {
    let offchainLnds: LndParamsAuthed[]
    try {
      offchainLnds = getLnds({ type: "offchain" })
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
    return !!offchainLnds
      .map((item) => item.pubkey as Pubkey)
      .find((item) => item == pubkey)
  }

  const hasValidLnClientForPubkey = (pubkey: Pubkey): boolean | LightningServiceError => {
    try {
      const { lnd: lndAuth } = getLndFromPubkey({ pubkey })
      return !!lndAuth
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
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
      const result = await createInvoice(input)
      const request = result.request as EncodedPaymentRequest
      const returnedInvoice = decodeInvoice(request)
      if (returnedInvoice instanceof Error) {
        return new CouldNotDecodeReturnedPaymentRequest(returnedInvoice.message)
      }
      return { invoice: returnedInvoice, pubkey: defaultPubkey } as RegisteredInvoice
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
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnPaymentLookup | LightningServiceError> => {
    let lnd: AuthenticatedLnd
    try {
      ;({ lnd } = getLndFromPubkey({ pubkey }))
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }

    try {
      const result: GetPaymentResult = await getPayment({
        lnd,
        id: paymentHash,
      })
      const { is_confirmed, is_failed, payment } = result

      const status = is_confirmed
        ? PaymentStatus.Settled
        : is_failed
        ? PaymentStatus.Failed
        : PaymentStatus.Pending

      let paymentLookup: LnPaymentLookup = {
        amount: toSats(0),
        createdAt: new Date(0),
        confirmedAt: undefined,
        destination: "" as Pubkey,
        roundedUpFee: toSats(0),
        milliSatsAmount: toMilliSats(0),
        secret: "" as PaymentSecret,
        request: undefined,
        status,
      }

      if (payment) {
        paymentLookup = Object.assign(payment, {
          amount: toSats(payment.tokens),
          createdAt: new Date(payment.created_at),
          confirmedAt: payment.confirmed_at ? new Date(payment.confirmed_at) : undefined,
          destination: payment.destination as Pubkey,
          request: payment.request,
          roundedUpFee: toSats(payment.safe_fee),
          milliSatsAmount: toMilliSats(parseInt(payment.mtokens)),
          secret: payment.secret as PaymentSecret,
          status,
        })
      }

      return paymentLookup
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  const cancelInvoice = async ({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<void | LightningServiceError> => {
    try {
      const { lnd } = getLndFromPubkey({ pubkey })
      await cancelHodlInvoice({ lnd, id: paymentHash })
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  const payInvoiceViaRoutes = async ({
    paymentHash,
    rawRoute,
    pubkey,
  }: {
    paymentHash: PaymentHash
    rawRoute: RawRoute
    pubkey: Pubkey
  }): Promise<PayInvoiceResult | LightningServiceError> => {
    let lndAuthForRoute: AuthenticatedLnd | LightningServiceError
    try {
      ;({ lnd: lndAuthForRoute } = getLndFromPubkey({ pubkey }))
      if (lndAuthForRoute instanceof LndOfflineError)
        return new NoValidNodeForPubkeyError()
    } catch (err) {
      return new NoValidNodeForPubkeyError(err)
    }

    try {
      const paymentPromise = payViaRoutes({
        lnd: lndAuthForRoute,
        routes: [rawRoute],
        id: paymentHash,
      })
      const timeoutPromise = timeout(TIMEOUT_PAYMENT, "Timeout")
      const paymentResult = (await Promise.race([
        paymentPromise,
        timeoutPromise,
      ])) as PayViaRoutesResult
      return {
        roundedUpFee: toSats(paymentResult.safe_fee),
      }
    } catch (err) {
      if (err.message === "Timeout") return new LnPaymentPendingError()
      if (isInvoiceAlreadyPaidError(err)) return new LnAlreadyPaidError()
      return new UnknownLightningServiceError(err)
    }
  }

  const payInvoiceViaPaymentDetails = async ({
    decodedInvoice,
    milliSatsAmount,
    maxFee,
  }: {
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis
    maxFee: Satoshis
  }): Promise<PayInvoiceResult | LightningServiceError> => {
    const paymentDetailsArgs: PayViaPaymentDetailsArgs = {
      lnd: lndAuth,
      id: decodedInvoice.paymentHash,
      destination: decodedInvoice.destination,
      mtokens: milliSatsAmount.toString(),
      payment: decodedInvoice.paymentSecret as string,
      max_fee: maxFee,
      cltv_delta: decodedInvoice.cltvDelta || undefined,
      features: decodedInvoice.features
        ? decodedInvoice.features.map((f) => ({
            bit: f.bit,
            is_required: f.isRequired,
            type: f.type,
          }))
        : undefined,
      routes: [],
    }

    if (decodedInvoice.routeHints) {
      decodedInvoice.routeHints.forEach((route) => {
        const rawRoute: RawHopWithStrings[] = []
        route.forEach((hop) =>
          rawRoute.push({
            base_fee_mtokens: hop.baseFeeMTokens,
            channel: hop.channel,
            cltv_delta: hop.cltvDelta,
            fee_rate: hop.feeRate,
            public_key: hop.nodePubkey,
          }),
        )
        paymentDetailsArgs.routes.push(rawRoute)
      })
    }

    try {
      const paymentPromise = payViaPaymentDetails(paymentDetailsArgs)
      const timeoutPromise = timeout(TIMEOUT_PAYMENT, "Timeout")
      const paymentResult = (await Promise.race([
        paymentPromise,
        timeoutPromise,
      ])) as PayViaPaymentDetailsResult
      return {
        roundedUpFee: toSats(paymentResult.safe_fee),
      }
    } catch (err) {
      if (err.message === "Timeout") return new LnPaymentPendingError()
      if (isInvoiceAlreadyPaidError(err)) return new LnAlreadyPaidError()
      return new UnknownLightningServiceError(err)
    }
  }

  return {
    isLocal,
    defaultPubkey: (): Pubkey => defaultPubkey,
    hasValidLnClientForPubkey,
    registerInvoice,
    lookupInvoice,
    lookupPayment,
    cancelInvoice,
    payInvoiceViaRoutes,
    payInvoiceViaPaymentDetails,
  }
}
