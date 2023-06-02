import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { Wallets } from "@app"

import { TxStatus } from "@domain/wallets"
import { sat2btc, toSats } from "@domain/bitcoin"

import { onchainBlockEventHandler } from "@servers/trigger"

import { baseLogger } from "@services/logger"

import { sleep } from "@utils"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountRecordByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  lnd1,
  mineBlockAndSyncAll,
  RANDOM_ADDRESS,
  subscribeToBlocks,
  waitFor,
  waitUntilSyncAll,
} from "test/helpers"
import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"

let walletIdA: WalletId
let walletIdD: WalletId

let accountRecordA: AccountRecord
let accountRecordD: AccountRecord

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("D")
  await createUserAndWalletFromUserRef("F")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdD = await getDefaultWalletIdByTestUserRef("D")

  accountRecordA = await getAccountRecordByTestUserRef("A")
  accountRecordD = await getAccountRecordByTestUserRef("D")
})

beforeEach(() => {
  jest.resetAllMocks()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

type WalletState = {
  balance: CurrencyBaseAmount
  transactions: WalletTransaction[]
  onchainAddress: OnChainAddress
}

const getWalletState = async (walletId: WalletId): Promise<WalletState> => {
  const balance = await getBalanceHelper(walletId)
  const { result, error } = await getTransactionsForWalletId(walletId)
  if (error instanceof Error || !result?.slice) {
    throw error
  }
  const onchainAddress = await Wallets.getLastOnChainAddress(walletId)
  if (onchainAddress instanceof Error) {
    throw onchainAddress
  }
  return {
    balance,
    transactions: result.slice,
    onchainAddress,
  }
}

describe("onchainBlockEventHandler", () => {
  it("should process block for incoming transactions from lnd", async () => {
    const amount = toSats(10_000)
    const amount2 = toSats(20_000)
    const blocksToMine = ONCHAIN_MIN_CONFIRMATIONS
    const scanDepth = (ONCHAIN_MIN_CONFIRMATIONS + 1) as ScanDepth

    await mineBlockAndSyncAll()
    const result = await Wallets.updateOnChainReceipt({ scanDepth, logger: baseLogger })
    if (result instanceof Error) throw result

    const initialBlock = await bitcoindClient.getBlockCount()
    let isFinalBlock = false
    let lastHeight = initialBlock
    const subBlocks = subscribeToBlocks({ lnd: lnd1 })
    subBlocks.on("block", async ({ height }: { height: number }) => {
      if (height > lastHeight) {
        lastHeight = height
        await onchainBlockEventHandler(height)
      }
      isFinalBlock = lastHeight >= initialBlock + blocksToMine
    })

    const address = await Wallets.lndCreateOnChainAddress(walletIdA)
    if (address instanceof Error) throw address

    const output0 = {}
    output0[address] = sat2btc(amount)

    const address2 = await Wallets.lndCreateOnChainAddress(walletIdD)
    if (address2 instanceof Error) throw address2

    const output1 = {}
    output1[address2] = sat2btc(amount2)

    const outputs = [output0, output1]

    const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({ inputs: [], outputs })
    const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
    const finalizedPsbt = await bitcoindOutside.finalizePsbt({
      psbt: walletProcessPsbt.psbt,
    })

    const initWalletAState = await getWalletState(walletIdA)
    const initWalletDState = await getWalletState(walletIdD)
    await bitcoindOutside.sendRawTransaction({ hexstring: finalizedPsbt.hex })
    await bitcoindOutside.generateToAddress({
      nblocks: blocksToMine,
      address: RANDOM_ADDRESS,
    })

    await Promise.all([waitFor(() => isFinalBlock), waitUntilSyncAll()])

    // this sleep seems necessary on the CI server. otherwise all the events may not have propagated
    // also some event are being trigger asynchronously without an awaitt, ie the notifications
    await sleep(500)

    subBlocks.removeAllListeners()

    const validateWalletState = async ({
      walletId,
      userRecord,
      initialState,
      amount,
      address,
    }: {
      walletId: WalletId
      userRecord: AccountRecord
      initialState: WalletState
      amount: Satoshis
      address: string
    }) => {
      const { balance, transactions, onchainAddress } = await getWalletState(walletId)
      const depositFeeRatio = userRecord.depositFeeRatio as DepositFeeRatio
      const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })
      const lastTransaction = transactions[0]

      expect(transactions.length).toBe(initialState.transactions.length + 1)
      expect(lastTransaction.status).toBe(TxStatus.Success)
      expect(lastTransaction.settlementFee).toBe(
        Math.round(lastTransaction.settlementFee),
      )
      expect(lastTransaction.settlementAmount).toBe(finalAmount)
      expect((lastTransaction as WalletOnChainTransaction).initiationVia.address).toBe(
        address,
      )
      expect(balance).toBe(initialState.balance + finalAmount)
      expect(onchainAddress).not.toBe(initialState.onchainAddress)
    }

    await validateWalletState({
      walletId: walletIdA,
      userRecord: accountRecordA,
      initialState: initWalletAState,
      amount: amount,
      address: address,
    })
    await validateWalletState({
      walletId: walletIdD,
      userRecord: accountRecordD,
      initialState: initWalletDState,
      amount: amount2,
      address: address2,
    })
  })
})
