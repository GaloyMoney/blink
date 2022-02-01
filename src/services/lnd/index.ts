import { toMilliSatsFromString, toSats } from "@domain/bitcoin"
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
  PaymentNotFoundError,
  RouteNotFoundError,
  UnknownRouteNotFoundError,
  InsufficientBalanceForRoutingError,
  BadPaymentDataError,
} from "@domain/bitcoin/lightning"
import lnService from "ln-service"
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
  GetInvoiceResult,
  getPayments,
  getFailedPayments,
} from "lightning"

import { LndOfflineError } from "@core/error"

import { timeout } from "@utils"

import { TIMEOUT_PAYMENT } from "./auth"
import { getActiveLnd, getLndFromPubkey, getLnds } from "./utils"

export const LndService = (): ILightningService | LightningServiceError => {
  let defaultLnd: AuthenticatedLnd, defaultPubkey: Pubkey
  try {
    const { lnd, pubkey } = getActiveLnd()
    defaultLnd = lnd
    defaultPubkey = pubkey as Pubkey
  } catch (err) {
    const errDetails = parseLndErrorDetails(err)
    switch (errDetails) {
      default:
        return new UnknownLightningServiceError(err)
    }
  }

  const isLocal = (pubkey: Pubkey): boolean | LightningServiceError =>
    getLnds({ type: "offchain" }).some((item) => item.pubkey === pubkey)

  const listActivePubkeys = (): Pubkey[] =>
    getLnds({ active: true, type: "offchain" }).map((lndAuth) => lndAuth.pubkey as Pubkey)

  const findRouteForInvoice = async ({
    decodedInvoice,
    maxFee,
  }: {
    decodedInvoice: LnInvoice
    maxFee: Satoshis
  }): Promise<RawRoute | LightningServiceError> => {
    if (!(decodedInvoice.amount && decodedInvoice.amount > 0))
      return new LightningServiceError(
        "No amount invoice passed to method. Expected a valid amount to be present.",
      )
    return probeForRoute({
      decodedInvoice,
      maxFee,
      amount: decodedInvoice.amount,
    })
  }

  const findRouteForNoAmountInvoice = async ({
    decodedInvoice,
    maxFee,
    amount,
  }: {
    decodedInvoice: LnInvoice
    maxFee: Satoshis
    amount: Satoshis
  }): Promise<RawRoute | LightningServiceError> => {
    if (!(amount && amount > 0))
      return new LightningServiceError(
        "Invalid amount passed to method for invoice with no amount. Expected a valid amount to be passed.",
      )
    return probeForRoute({
      decodedInvoice,
      maxFee,
      amount,
    })
  }

  const probeForRoute = async ({
    decodedInvoice,
    maxFee,
    amount,
  }: {
    decodedInvoice: LnInvoice
    maxFee: Satoshis
    amount: Satoshis
  }): Promise<RawRoute | LightningServiceError> => {
    try {
      const routes: RawHopWithNumbers[][] = decodedInvoice.routeHints.map((route) =>
        route.map((hop) => ({
          base_fee_mtokens: hop.baseFeeMTokens
            ? parseFloat(hop.baseFeeMTokens)
            : undefined,
          channel: hop.channel,
          cltv_delta: hop.cltvDelta,
          fee_rate: hop.feeRate,
          public_key: hop.nodePubkey,
        })),
      )

      const probeForRouteArgs: ProbeForRouteArgs = {
        lnd: defaultLnd,
        destination: decodedInvoice.destination,
        mtokens:
          decodedInvoice.milliSatsAmount > 0
            ? decodedInvoice.milliSatsAmount.toString()
            : (amount * 1000).toString(),
        routes,
        cltv_delta: decodedInvoice.cltvDelta || undefined,
        features: decodedInvoice.features
          ? decodedInvoice.features.map((f) => ({
              bit: f.bit,
              is_required: f.isRequired,
              type: f.type,
            }))
          : undefined,
        max_fee: maxFee,
        payment: decodedInvoice.paymentSecret || undefined,
        total_mtokens: decodedInvoice.paymentSecret
          ? decodedInvoice.milliSatsAmount > 0
            ? decodedInvoice.milliSatsAmount.toString()
            : (amount * 1000).toString()
          : undefined,
        tokens: amount,
      }
      const { route } = await lnService.probeForRoute(probeForRouteArgs)
      if (!route) return new RouteNotFoundError()
      return route
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        case KnownLndErrorDetails.InsufficientBalance:
          return new InsufficientBalanceForRoutingError()
        default:
          return new UnknownRouteNotFoundError(err)
      }
    }
  }

  const registerInvoice = async ({
    sats,
    description,
    descriptionHash,
    expiresAt,
  }: RegisterInvoiceArgs): Promise<RegisteredInvoice | LightningServiceError> => {
    const input = {
      lnd: defaultLnd,
      description,
      description_hash: descriptionHash,
      tokens: sats as number,
      expires_at: expiresAt.toISOString(),
    }

    try {
      const result = await createInvoice(input)
      const request = result.request as EncodedPaymentRequest
      const returnedInvoice = decodeInvoice(request)
      if (returnedInvoice instanceof Error) {
        return new CouldNotDecodeReturnedPaymentRequest(returnedInvoice.message)
      }
      const registerInvoice: RegisteredInvoice = {
        invoice: returnedInvoice,
        pubkey: defaultPubkey,
      }
      return registerInvoice
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        default:
          return new UnknownLightningServiceError(err)
      }
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
      const invoice: GetInvoiceResult = await getInvoice({
        lnd,
        id: paymentHash,
      })

      return {
        createdAt: new Date(invoice.created_at),
        confirmedAt: invoice.confirmed_at ? new Date(invoice.confirmed_at) : undefined,
        isSettled: !!invoice.is_confirmed,
        roundedDownReceived: toSats(invoice.received),
        milliSatsReceived: toMilliSatsFromString(invoice.received_mtokens),
        secretPreImage: invoice.secret as SecretPreImage,
        lnInvoice: {
          description: invoice.description,
          paymentRequest: (invoice.request as EncodedPaymentRequest) || undefined,
          expiresAt: new Date(invoice.expires_at),
          roundedDownAmount: toSats(invoice.tokens),
        },
      }
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        case KnownLndErrorDetails.InvoiceNotFound:
          return new InvoiceNotFoundError()
        default:
          return new UnknownLightningServiceError(err)
      }
    }
  }

  const lookupPayment = async ({
    pubkey,
    paymentHash,
  }: {
    pubkey?: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnPaymentLookup | LnFailedPartialPaymentLookup | LightningServiceError> => {
    if (pubkey) return lookupPaymentByPubkeyAndHash({ pubkey, paymentHash })

    const offchainLnds = getLnds({ type: "offchain" })
    for (const { pubkey } of offchainLnds) {
      const payment = await lookupPaymentByPubkeyAndHash({
        pubkey: pubkey as Pubkey,
        paymentHash,
      })
      if (payment instanceof Error) continue
      return payment
    }

    return new PaymentNotFoundError("Payment hash not found")
  }

  const listFailedPayments = async ({
    after,
    pubkey,
  }: {
    after: PagingStartToken | PagingContinueToken
    pubkey: Pubkey
  }): Promise<ListLnPaymentsResult | LightningServiceError> => {
    const { lnd } = getLndFromPubkey({ pubkey })
    const pagingArgs = after ? { token: after } : {}

    try {
      const { payments, next } = await getFailedPayments({ lnd, ...pagingArgs })
      return {
        lnPayments: payments
          .map(translateLnPaymentLookup)
          .map((p) => ({ ...p, status: PaymentStatus.Failed })),
        endCursor: (next as PagingContinueToken) || false,
      }
    } catch (err) {
      return new UnknownLightningServiceError(err)
    }
  }

  const listSettledPayments = async ({
    after,
    pubkey,
  }: {
    after: PagingStartToken | PagingContinueToken
    pubkey: Pubkey
  }): Promise<ListLnPaymentsResult | LightningServiceError> => {
    try {
      const { lnd } = getLndFromPubkey({ pubkey })
      const pagingArgs = after ? { token: after } : {}
      const { payments, next } = await getPayments({ lnd, ...pagingArgs })

      return {
        lnPayments: payments
          .map(translateLnPaymentLookup)
          .filter((p) => p.status === PaymentStatus.Settled),
        endCursor: (next as PagingStartToken) || false,
      }
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
      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        default:
          return new UnknownLightningServiceError(err)
      }
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
        sentFromPubkey: pubkey,
      }
    } catch (err) {
      if (err.message === "Timeout") return new LnPaymentPendingError()

      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        case KnownLndErrorDetails.InvoiceAlreadyPaid:
          return new LnAlreadyPaidError()
        default:
          return new UnknownLightningServiceError(err)
      }
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
      lnd: defaultLnd,
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
        sentFromPubkey: defaultPubkey,
      }
    } catch (err) {
      if (err.message === "Timeout") return new LnPaymentPendingError()

      const errDetails = parseLndErrorDetails(err)
      switch (errDetails) {
        case KnownLndErrorDetails.InvoiceAlreadyPaid:
          return new LnAlreadyPaidError()
        case KnownLndErrorDetails.UnableToFindRoute:
          return new RouteNotFoundError()
        default:
          return new UnknownLightningServiceError(err)
      }
    }
  }

  return {
    isLocal,
    defaultPubkey: (): Pubkey => defaultPubkey,
    listActivePubkeys,
    findRouteForInvoice,
    findRouteForNoAmountInvoice,
    registerInvoice,
    lookupInvoice,
    lookupPayment,
    listSettledPayments,
    listFailedPayments,
    cancelInvoice,
    payInvoiceViaRoutes,
    payInvoiceViaPaymentDetails,
  }
}

const lookupPaymentByPubkeyAndHash = async ({
  pubkey,
  paymentHash,
}: {
  pubkey: Pubkey
  paymentHash: PaymentHash
}): Promise<LnPaymentLookup | LnFailedPartialPaymentLookup | LightningServiceError> => {
  let lnd: AuthenticatedLnd
  try {
    ;({ lnd } = getLndFromPubkey({ pubkey }))
  } catch (err) {
    const errDetails = parseLndErrorDetails(err)
    switch (errDetails) {
      default:
        return new UnknownLightningServiceError(err)
    }
  }

  try {
    const result: GetPaymentResult = await getPayment({
      lnd,
      id: paymentHash,
    })
    const { is_confirmed, is_failed, payment, pending } = result

    const status = is_confirmed
      ? PaymentStatus.Settled
      : is_failed
      ? PaymentStatus.Failed
      : PaymentStatus.Pending

    if (payment) {
      return {
        createdAt: new Date(payment.created_at),
        status,
        paymentRequest: (payment.request as EncodedPaymentRequest) || undefined,
        paymentHash: payment.id as PaymentHash,
        milliSatsAmount: toMilliSatsFromString(payment.mtokens),
        roundedUpAmount: toSats(payment.safe_tokens),
        confirmedDetails: {
          confirmedAt: new Date(payment.confirmed_at),
          destination: payment.destination as Pubkey,
          revealedPreImage: payment.secret as RevealedPreImage,
          roundedUpFee: toSats(payment.safe_fee),
          milliSatsFee: toMilliSatsFromString(payment.fee_mtokens),
          hopPubkeys: undefined,
        },
        attempts: undefined,
      }
    } else if (pending) {
      return {
        createdAt: new Date(pending.created_at),
        status,
        paymentRequest: (pending.request as EncodedPaymentRequest) || undefined,
        paymentHash: pending.id as PaymentHash,
        milliSatsAmount: toMilliSatsFromString(pending.mtokens),
        roundedUpAmount: toSats(pending.safe_tokens),
        confirmedDetails: undefined,
        attempts: undefined,
      }
    } else if (status === PaymentStatus.Failed) {
      return { status: PaymentStatus.Failed }
    }

    return new BadPaymentDataError(JSON.stringify(result))
  } catch (err) {
    const errDetails = parseLndErrorDetails(err)
    switch (errDetails) {
      default:
        return new UnknownLightningServiceError(err)
    }
  }
}

// A rough description of the error type we get back from the
// 'lightning' library can be described as:
//
// [
//   0: <Error Classification Code Number>
//   1: <Error Type String>
//   2: {
//     err?: <Error Code Details Object>
//     failures?: [
//       [
//         0: <Error Code Number>
//         1: <Error Code Message String>
//         2: {
//           err?: <Error Code Details Object>
//         }
//       ]
//     ]
//   }
// ]
//
// where '<Error Code Details Object>' is an Error object with
// the usual 'message', 'stack' etc. properties and additional
// properties: 'code', 'details', 'metadata'.
export const parseLndErrorDetails = (err) =>
  err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details || err[1]

const KnownLndErrorDetails = {
  InsufficientBalance: "insufficient local balance",
  InvoiceNotFound: "unable to locate invoice",
  InvoiceAlreadyPaid: "invoice is already paid",
  UnableToFindRoute: "PaymentPathfindingFailedToFindPossibleRoute",
} as const

const translateLnPaymentLookup = (p): LnPaymentLookup => ({
  createdAt: new Date(p.created_at),
  status: p.is_confirmed ? PaymentStatus.Settled : PaymentStatus.Pending,
  paymentHash: p.id as PaymentHash,
  paymentRequest: p.request as EncodedPaymentRequest,
  milliSatsAmount: toMilliSatsFromString(p.mtokens),
  roundedUpAmount: toSats(p.safe_tokens),
  confirmedDetails: p.is_confirmed
    ? {
        confirmedAt: new Date(p.confirmed_at),
        destination: p.destination as Pubkey,
        revealedPreImage: p.secret as RevealedPreImage,
        roundedUpFee: toSats(p.safe_fee),
        milliSatsFee: toMilliSatsFromString(p.fee_mtokens),
        hopPubkeys: p.hops as Pubkey[],
      }
    : undefined,
  attempts: p.attempts,
})
