import { onchainBlockEventhandler, onInvoiceUpdate } from "@servers/trigger"
import { baseLogger } from "@services/logger"
import {
  getUserWallet,
  bitcoindClient,
  bitcoindOutside,
  lnd1,
  subscribeToBlocks,
  waitUntilSyncAll,
  amountAfterFeeDeduction,
  waitFor,
  mineBlockAndSyncAll,
  lndOutside1,
  pay,
  getInvoice,
  RANDOM_ADDRESS,
} from "test/helpers"
import * as Wallets from "@app/wallets"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { addInvoice } from "@app/wallets"
import { getHash } from "@core/utils"
import { ledger } from "@services/mongodb"
import { getTitle } from "@services/notifications/payment"
import { getCurrentPrice } from "@services/realtime-price"
import { TxStatus } from "@domain/wallets"

jest.mock("@services/notifications/notification")
jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })
})

beforeEach(() => {
  jest.resetAllMocks()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ wallet_name: "outside" })
})

const getWalletState = async (wallet) => {
  const { BTC: balance } = await wallet.getBalances()
  const { result: transactions, error } = await Wallets.getTransactionsForWalletId({
    walletId: wallet.user.id as WalletId,
  })
  if (error instanceof Error || transactions === null) {
    throw error
  }
  return {
    balance,
    transactions,
  }
}

describe("onchainBlockEventhandler", () => {
  it("should process block for incoming transactions", async () => {
    const amount = 0.0001
    const amount2 = 0.0002
    const blocksToMine = 6
    const wallet0 = await getUserWallet(0)
    const wallet3 = await getUserWallet(3)

    await mineBlockAndSyncAll()
    const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
    if (result instanceof Error) {
      throw result
    }

    const initWallet0State = await getWalletState(wallet0)
    const initWallet3State = await getWalletState(wallet3)

    const address = await wallet0.getOnChainAddress()

    let isFinalBlock = false
    let lastHeight = 0
    const initialBlock = await bitcoindClient.getBlockCount()
    const subBlocks = subscribeToBlocks({ lnd: lnd1 })
    subBlocks.on("block", async ({ height }) => {
      await onchainBlockEventhandler({ height })
      lastHeight = height > lastHeight ? height : lastHeight
      isFinalBlock = lastHeight >= initialBlock + blocksToMine
    })

    const output0 = {}
    output0[address] = amount

    const address2 = await wallet3.getOnChainAddress()
    const output1 = {}
    output1[address2] = amount2

    const outputs = [output0, output1]

    const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({ inputs: [], outputs })
    const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
    const finalizedPsbt = await bitcoindOutside.finalizePsbt({
      psbt: walletProcessPsbt.psbt,
    })
    await bitcoindOutside.sendRawTransaction({ hexstring: finalizedPsbt.hex })
    await bitcoindOutside.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })

    await Promise.all([waitFor(() => isFinalBlock), waitUntilSyncAll()])

    subBlocks.removeAllListeners()

    const validateWalletState = async (wallet, initialState, amount, address) => {
      const { balance, transactions } = await getWalletState(wallet)
      const { depositFeeRatio } = wallet.user
      const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })
      const lastTransaction = transactions[0]

      expect(transactions.length).toBe(initialState.transactions.length + 1)
      expect(lastTransaction.deprecated.type).toBe(LedgerTransactionType.OnchainReceipt)
      expect(lastTransaction.status).toBe(TxStatus.Success)
      expect(lastTransaction.settlementFee).toBe(
        Math.round(lastTransaction.settlementFee),
      )
      expect(lastTransaction.settlementAmount).toBe(finalAmount)
      expect((lastTransaction as WalletOnChainTransaction).addresses[0]).toBe(address)
      expect(balance).toBe(initialState.balance + finalAmount)
    }

    await validateWalletState(wallet0, initWallet0State, amount, address)
    await validateWalletState(wallet3, initWallet3State, amount2, address2)
  })

  it("should process pending invoices on invoice update event", async () => {
    const sats = 500
    const wallet = await getUserWallet(12)
    const lnInvoice = await addInvoice({
      walletId: wallet.user.id as WalletId,
      amount: toSats(sats),
    })
    expect(lnInvoice).not.toBeInstanceOf(Error)

    const { paymentRequest: request } = lnInvoice as LnInvoice
    await pay({ lnd: lndOutside1, request })

    const hash = getHash(request)
    const invoice = await getInvoice({ id: hash, lnd: lnd1 })
    await onInvoiceUpdate(invoice)

    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.pending).toBe(false)

    const satsPrice = (await getCurrentPrice()) || 1
    const usd = (sats * satsPrice).toFixed(2)
    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle["paid-invoice"]({ usd, amount: sats }),
    )
    expect(sendNotification.mock.calls[0][0].user._id).toStrictEqual(wallet.user._id)
    expect(sendNotification.mock.calls[0][0].data.type).toBe("paid-invoice")
  })
})
