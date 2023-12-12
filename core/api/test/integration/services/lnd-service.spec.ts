import {
  createInvoice,
  getChannel,
  getChannels,
  deleteForwardingReputations,
} from "lightning"

import { LND1_PUBKEY } from "@/config"

import { WalletCurrency } from "@/domain/shared"
import { toSats } from "@/domain/bitcoin"
import {
  LnAlreadyPaidError,
  PaymentNotFoundError,
  PaymentRejectedByDestinationError,
  PaymentStatus,
  RouteNotFoundError,
  decodeInvoice,
} from "@/domain/bitcoin/lightning"
import { LnFees } from "@/domain/payments"

import { LndService } from "@/services/lnd"

import { sleep } from "@/utils"

import {
  bitcoindClient,
  fundLnd,
  lnd1,
  lndOutside1,
  lndOutside2,
  mineAndConfirm,
  openChannelTestingNoAccounting,
  resetIntegrationLnds,
  setChannelFees,
} from "test/helpers"
import { BitcoindWalletClient } from "test/helpers/bitcoind"

const amountInvoice = toSats(1000)
const btcPaymentAmount = { amount: BigInt(amountInvoice), currency: WalletCurrency.Btc }
const ROUTE_PPM_RATE = 10_000
const ROUTE_PPM_PERCENT = ROUTE_PPM_RATE / 1_000_000

const loadBitcoindWallet = async (walletName: string) => {
  const wallets = await bitcoindClient.listWallets()
  if (!wallets.includes(walletName)) {
    try {
      await bitcoindClient.createWallet({ walletName })
    } catch (err) {
      const error = err as Error
      if (error.message.includes("Database already exists")) {
        await bitcoindClient.loadWallet({ filename: walletName })
      }
    }
  }
}

const fundOnChainWallets = async () => {
  // Setup outside bitcoind
  const walletName = "outside"
  const bitcoindOutside = new BitcoindWalletClient(walletName)

  // Fund outside bitcoind
  const numOfBlocks = 10
  const bitcoindAddress = await bitcoindOutside.getNewAddress()
  await mineAndConfirm({
    walletClient: bitcoindOutside,
    numOfBlocks,
    address: bitcoindAddress,
  })

  // Fund lnd1
  const btc = 1
  await fundLnd(lnd1, btc)
}

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
const getChannelWithRetry = async ({ lnd, id }) => {
  const countMax = 9

  let channel
  let errMsg: string | undefined = "FullChannelDetailsNotFound"
  let count = 0
  while (count < countMax && errMsg === "FullChannelDetailsNotFound") {
    count++
    await sleep(250)
    try {
      channel = await getChannel({ id, lnd })
      errMsg = undefined
    } catch (err) {
      if (Array.isArray(err)) errMsg = err[1]
    }
  }
  if (!(count < countMax && errMsg !== "FullChannelDetailsNotFound")) {
    throw new Error("Could find updated channel details")
  }
  // @ts-ignore-next-line no-implicit-any error
  if (!(channel.policies && channel.policies.length)) {
    throw new Error("No channel policies found")
  }

  return channel
}

// @ts-ignore-next-line no-implicit-any error
const setFeesOnChannel = async ({ localLnd, partnerLnd, base, rate }) => {
  const countMax = 9

  // Get routing channel details
  const { channels } = await getChannels({ lnd: partnerLnd })
  const { id: chanId } = channels[0]
  const channel = await getChannelWithRetry({ id: chanId, lnd: localLnd })

  // Set channel policy
  let setOnChannel
  let count = 0
  while (count < countMax && setOnChannel !== true) {
    if (count > 0) await sleep(500)
    count++

    setOnChannel = await setChannelFees({
      lnd: localLnd,
      // @ts-ignore-next-line no-implicit-any error
      channel,
      base,
      rate,
    })
  }
  if (!(count < countMax && setOnChannel)) {
    throw new Error("Could not update channel fees")
  }

  // Verify policy change
  // @ts-ignore-next-line no-implicit-any error
  const { policies } = await getChannelWithRetry({ id: channel.id, lnd: localLnd })
  const { base_fee_mtokens, fee_rate } = policies[0]
  if (!(base_fee_mtokens === `${base * 1000}` && fee_rate === rate)) {
    throw new Error("Incorrect policy on channel")
  }

  return chanId
}

const setupLndRoute = async () => {
  // Setup route from lnd1 -> lndOutside1 -> lndOutside2
  const btc = 1
  await fundLnd(lndOutside1, btc)

  await openChannelTestingNoAccounting({
    lnd: lndOutside1,
    lndPartner: lndOutside2,
    socket: `lnd-outside-2:9735`,
    is_private: true,
  })

  await setFeesOnChannel({
    localLnd: lndOutside1,
    partnerLnd: lndOutside2,
    base: 0,
    rate: ROUTE_PPM_RATE,
  })
}

const createPrivateInvoice = async ({
  lnd,
  tokens,
}: {
  lnd: AuthenticatedLnd
  tokens?: number
}): Promise<LnInvoice> => {
  let lnInvoice: LnInvoice | undefined = undefined
  let tries = 0
  let routeHints: Hop[][] = []
  while (routeHints.length === 0 && tries < 20) {
    tries++

    const { request } = await createInvoice({
      lnd,
      tokens,
      is_including_private_channels: true,
    })
    const invoice = decodeInvoice(request)
    if (invoice instanceof Error) throw invoice

    lnInvoice = invoice
    ;({ routeHints } = lnInvoice)
    await sleep(500)
  }
  if (lnInvoice === undefined) throw new Error("lnInvoice is undefined")

  return lnInvoice
}

beforeAll(async () => {
  // Seed lnd1 & lndOutside1
  await loadBitcoindWallet("outside")
  await resetIntegrationLnds()
  await fundOnChainWallets()
  await openChannelTestingNoAccounting({
    lnd: lnd1,
    lndPartner: lndOutside1,
    socket: `lnd-outside-1:9735`,
  })
  await setupLndRoute()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Lnd", () => {
  describe("LndService", () => {
    const lndService = LndService()
    if (lndService instanceof Error) throw lndService

    it("fails when repaying invoice", async () => {
      // Create invoice
      const { request } = await createInvoice({
        lnd: lndOutside1,
        tokens: amountInvoice,
      })
      const lnInvoice = decodeInvoice(request)
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      if (paid instanceof Error) throw paid
      expect(paid.revealedPreImage).toHaveLength(64)

      const retryPaid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      expect(retryPaid).toBeInstanceOf(LnAlreadyPaidError)
    })

    it("fails to pay when channel capacity exceeded", async () => {
      const { request } = await createInvoice({ lnd: lndOutside1, tokens: 1500000 })
      const lnInvoice = decodeInvoice(request)
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      expect(paid).toBeInstanceOf(PaymentRejectedByDestinationError)
    })

    it("pay invoice with High CLTV Delta", async () => {
      // Create invoice
      const { request } = await createInvoice({
        lnd: lndOutside1,
        tokens: amountInvoice,
        cltv_delta: 200,
      })
      const lnInvoice = decodeInvoice(request)
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      if (paid instanceof Error) throw paid
      expect(paid.revealedPreImage).toHaveLength(64)
    })

    it("pays high fee route with no max limit", async () => {
      const lnInvoice = await createPrivateInvoice({
        lnd: lndOutside2,
      })

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      if (paid instanceof Error) throw paid
      expect(paid.revealedPreImage).toHaveLength(64)
      expect(paid.roundedUpFee).toEqual(
        Number(btcPaymentAmount.amount) * ROUTE_PPM_PERCENT,
      )
    })

    it("fails to pay high fee route with max limit set", async () => {
      const lnInvoice = await createPrivateInvoice({
        lnd: lndOutside2,
      })

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: LnFees().maxProtocolAndBankFee(btcPaymentAmount),
      })
      expect(paid).toBeInstanceOf(RouteNotFoundError)
    })

    it("probes across route with fee higher than payment amount", async () => {
      const amountInvoice = 1

      // Change channel policy
      await setFeesOnChannel({
        localLnd: lndOutside1,
        partnerLnd: lndOutside2,
        base: 10,
        rate: ROUTE_PPM_RATE,
      })

      // Create invoice
      const lnInvoice = await createPrivateInvoice({
        lnd: lndOutside2,
        tokens: amountInvoice,
      })

      // Execute probe and check result
      const probed = await lndService.findRouteForInvoice({
        invoice: lnInvoice,
      })
      expect(probed).toBeInstanceOf(RouteNotFoundError)

      // Reset lnd mission control
      await deleteForwardingReputations({ lnd: lnd1 })
    })

    it("deletes payment", async () => {
      const { request, secret } = await createInvoice({ lnd: lndOutside1 })
      const revealedPreImage = secret as RevealedPreImage
      const lnInvoice = decodeInvoice(request)
      if (lnInvoice instanceof Error) throw lnInvoice
      const { paymentHash } = lnInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice: lnInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      if (paid instanceof Error) throw paid

      // Confirm payment exists in lnd
      const retrievedPayment = await lndService.lookupPayment({ paymentHash })
      expect(retrievedPayment).not.toBeInstanceOf(Error)
      if (retrievedPayment instanceof Error) return retrievedPayment
      expect(retrievedPayment.status).toBe(PaymentStatus.Settled)
      if (retrievedPayment.status !== PaymentStatus.Settled) return
      expect(retrievedPayment.confirmedDetails?.revealedPreImage).toBe(revealedPreImage)

      // Delete payment
      const deleted = await lndService.deletePaymentByHash({
        paymentHash,
        pubkey: LND1_PUBKEY,
      })
      expect(deleted).not.toBeInstanceOf(Error)

      // Check that payment no longer exists
      const retrievedDeletedPayment = await lndService.lookupPayment({ paymentHash })
      expect(retrievedDeletedPayment).toBeInstanceOf(PaymentNotFoundError)

      // Check that deleting missing payment doesn't return error
      const deletedAttempt = await lndService.deletePaymentByHash({
        paymentHash,
        pubkey: LND1_PUBKEY,
      })
      expect(deletedAttempt).not.toBeInstanceOf(Error)
    })
  })
})
