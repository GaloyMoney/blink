import { onchainBlockEventhandler } from "@servers/trigger"
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
} from "test/helpers"
import * as Wallets from "@app/wallets"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ wallet_name: "outside" })
})

describe("onchainBlockEventhandler", () => {
  it("should process block incoming transactions", async () => {
    const amount = 0.0001
    const blocksToMine = 6
    const wallet = await getUserWallet(0)

    await mineBlockAndSyncAll()
    await wallet.updateOnchainReceipt()

    const { BTC: initialBalance } = await wallet.getBalances()
    const initialBlock = await bitcoindClient.getBlockCount()
    const [initTransactions, error] = await Wallets.getTransactionsForWalletId({
      walletId: wallet.user.id as WalletId,
    })
    if (error instanceof Error) {
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

    const [transactions, error2] = await Wallets.getTransactionsForWalletId({
      walletId: wallet.user.id,
    })
    if (error2 instanceof Error) {
      throw error2
    }
    const lastTransaction = transactions[0]
    const { depositFeeRatio } = wallet.user
    const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })

    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(lastTransaction.deprecated.type).toBe("onchain_receipt")
    expect(lastTransaction.pendingConfirmation).toBe(false)
    expect(lastTransaction.settlementFee).toBe(Math.round(lastTransaction.settlementFee))
    expect(lastTransaction.settlementAmount).toBe(finalAmount)
    expect((lastTransaction as WalletOnChainTransaction).addresses[0]).toBe(address)

    const { BTC: balance } = await wallet.getBalances()
    expect(balance).toBe(initialBalance + finalAmount)
  })
})
