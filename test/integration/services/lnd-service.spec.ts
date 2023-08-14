import { createInvoice } from "lightning"

import { WalletCurrency } from "@domain/shared"
import { toSats } from "@domain/bitcoin"
import { LnAlreadyPaidError, decodeInvoice } from "@domain/bitcoin/lightning"

import { LndService } from "@services/lnd"

import { sleep } from "@utils"

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

const loadBitcoindWallet = async (walletName) => {
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
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

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
})
