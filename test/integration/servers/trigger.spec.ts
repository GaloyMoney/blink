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
  sendToAddressAndConfirm,
  mineBlockAndSyncAll,
  lndOutside1,
  pay,
  getInvoice,
} from "test/helpers"
import * as Wallets from "@app/wallets"
import { toSats } from "@domain/bitcoin"
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
const { sendNotification } = require("@core/notifications/notification")

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

describe("onchainBlockEventhandler", () => {
  it("should process block for incoming transactions", async () => {
    const amount = 0.0001
    const blocksToMine = 6
    const wallet = await getUserWallet(0)

    await mineBlockAndSyncAll()
    const result = await Wallets.updateOnChainReceipt(wallet.user.id, baseLogger)
    if (result instanceof Error) {
      throw result
    }

    const { BTC: initialBalance } = await wallet.getBalances()
    const initialBlock = await bitcoindClient.getBlockCount()
    const { result: initTransactions, error } = await Wallets.getTransactionsForWalletId({
      walletId: wallet.user.id as WalletId,
    })
    if (error instanceof Error || initTransactions === null) {
      throw error
    }

    const address = await wallet.getOnChainAddress()

    let isFinalBlock = false
    let lastHeight = 0
    const subBlocks = subscribeToBlocks({ lnd: lnd1 })
    subBlocks.on("block", async ({ height }) => {
      await onchainBlockEventhandler({ lnd: lnd1, height })
      lastHeight = height > lastHeight ? height : lastHeight
      isFinalBlock = lastHeight >= initialBlock + blocksToMine
    })

    await sendToAddressAndConfirm({ walletClient: bitcoindOutside, address, amount })

    await Promise.all([waitFor(() => isFinalBlock), waitUntilSyncAll()])

    subBlocks.removeAllListeners()

    const { result: transactions, error: error2 } =
      await Wallets.getTransactionsForWalletId({
        walletId: wallet.user.id,
      })
    if (error2 instanceof Error || transactions === null) {
      throw error2
    }
    const lastTransaction = transactions[0]
    const { depositFeeRatio } = wallet.user
    const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })

    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(lastTransaction.deprecated.type).toBe("onchain_receipt")
    expect(lastTransaction.status).toBe(TxStatus.Success)
    expect(lastTransaction.settlementFee).toBe(Math.round(lastTransaction.settlementFee))
    expect(lastTransaction.settlementAmount).toBe(finalAmount)
    expect((lastTransaction as WalletOnChainTransaction).addresses[0]).toBe(address)

    const { BTC: balance } = await wallet.getBalances()
    expect(balance).toBe(initialBalance + finalAmount)
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
