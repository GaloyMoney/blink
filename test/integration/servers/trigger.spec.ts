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
    const initTransactions = await wallet.getTransactions()

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

    const transactions = await wallet.getTransactions()
    const lastTransaction = transactions[0]
    const { depositFeeRatio } = wallet.user
    const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })

    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(lastTransaction.type).toBe("onchain_receipt")
    expect(lastTransaction.pending).toBe(false)
    expect(lastTransaction.fee).toBe(Math.round(lastTransaction.fee))
    expect(lastTransaction.amount).toBe(finalAmount)
    expect(lastTransaction.addresses[0]).toBe(address)

    const { BTC: balance } = await wallet.getBalances()
    expect(balance).toBe(initialBalance + finalAmount)
  })
})
