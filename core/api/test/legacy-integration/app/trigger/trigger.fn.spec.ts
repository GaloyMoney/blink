import { getFeesConfig, ONCHAIN_MIN_CONFIRMATIONS } from "@/config"

import { Wallets } from "@/app"

import { TxStatus } from "@/domain/wallets"
import { sat2btc, toSats } from "@/domain/bitcoin"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"

import { onchainBlockEventHandler } from "@/servers/trigger"

import { baseLogger } from "@/services/logger"

import { sleep } from "@/utils"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  createMandatoryUsers,
  lndCreateOnChainAddress,
  createUserAndWalletFromPhone,
  getDefaultWalletIdByPhone,
  lnd1,
  mineBlockAndSyncAll,
  RANDOM_ADDRESS,
  randomPhone,
  subscribeToBlocks,
  waitFor,
  waitUntilSyncAll,
} from "test/helpers"
import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"

let walletIdA: WalletId
let walletIdD: WalletId
let walletIdF: WalletId

const phoneA = randomPhone()
const phoneD = randomPhone()
const phoneF = randomPhone()

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phoneA)
  await createUserAndWalletFromPhone(phoneD)
  await createUserAndWalletFromPhone(phoneF)

  walletIdA = await getDefaultWalletIdByPhone(phoneA)
  walletIdD = await getDefaultWalletIdByPhone(phoneD)
  walletIdF = await getDefaultWalletIdByPhone(phoneF)
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
  const result = await getTransactionsForWalletId(walletId)
  if (result instanceof Error) {
    throw result
  }
  const onchainAddress = await Wallets.getLastOnChainAddress(walletId)
  if (onchainAddress instanceof Error) {
    throw onchainAddress
  }
  return {
    balance,
    transactions: result.edges.map((edge) => edge.node),
    onchainAddress,
  }
}

describe("onchainBlockEventHandler", () => {
  it("should process block for incoming transactions from lnd", async () => {
    const amount = toSats(10_000)
    const amount2 = toSats(20_000)
    const amountBria = toSats(21_000)
    const blocksToMine = ONCHAIN_MIN_CONFIRMATIONS
    const scanDepth = (ONCHAIN_MIN_CONFIRMATIONS + 1) as ScanDepth

    await mineBlockAndSyncAll()
    const result = await Wallets.updateLegacyOnChainReceipt({
      scanDepth,
      logger: baseLogger,
    })
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

    const address = await lndCreateOnChainAddress(walletIdA)
    if (address instanceof Error) throw address

    const output0: Record<string, number> = {}
    output0[address] = sat2btc(amount)

    const address2 = await lndCreateOnChainAddress(walletIdD)
    if (address2 instanceof Error) throw address2

    const output1: Record<string, number> = {}
    output1[address2] = sat2btc(amount2)

    const addressBria = await Wallets.createOnChainAddress({
      walletId: walletIdF,
    })
    if (addressBria instanceof Error) throw addressBria

    const outputBria = { [addressBria]: sat2btc(amountBria) }

    const outputs = [output0, output1, outputBria]

    const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({ inputs: [], outputs })
    const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
    const finalizedPsbt = await bitcoindOutside.finalizePsbt({
      psbt: walletProcessPsbt.psbt,
    })

    const initWalletAState = await getWalletState(walletIdA)
    const initWalletDState = await getWalletState(walletIdD)
    const initWalletFState = await getWalletState(walletIdF)
    await bitcoindOutside.sendRawTransaction({ hexstring: finalizedPsbt.hex })
    await bitcoindOutside.generateToAddress({
      nblocks: blocksToMine,
      address: RANDOM_ADDRESS,
    })

    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    await Promise.all([waitFor(() => isFinalBlock), waitUntilSyncAll()])

    // this sleep seems necessary on the CI server. otherwise all the events may not have propagated
    // also some event are being trigger asynchronously without an awaitt, ie the notifications
    await sleep(500)

    subBlocks.removeAllListeners()

    const validateWalletState = async ({
      walletId,
      initialState,
      amount,
      address,
    }: {
      walletId: WalletId
      initialState: WalletState
      amount: Satoshis
      address: string
    }) => {
      const btcAmount = paymentAmountFromNumber({
        amount,
        currency: WalletCurrency.Btc,
      })
      if (btcAmount instanceof Error) throw btcAmount

      const { balance, transactions, onchainAddress } = await getWalletState(walletId)
      const feeConfig = getFeesConfig()
      const minBankFee = feeConfig.depositDefaultMin
      const minBankFeeThreshold = feeConfig.depositThreshold
      const depositFeeRatio = feeConfig.depositRatioAsBasisPoints
      const finalAmount = amountAfterFeeDeduction({
        amount: btcAmount,
        minBankFee,
        minBankFeeThreshold,
        depositFeeRatio,
      })
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
      initialState: initWalletAState,
      amount: amount,
      address: address,
    })
    await validateWalletState({
      walletId: walletIdD,
      initialState: initWalletDState,
      amount: amount2,
      address: address2,
    })

    // Wallet with bria address should not be processed by onchainBlockEventHandler
    const { balance, transactions, onchainAddress } = await getWalletState(walletIdF)
    expect(balance).toBe(initWalletFState.balance)
    expect(onchainAddress).toBe(initWalletFState.onchainAddress)
    expect(transactions.length).toBe(initWalletFState.transactions.length)
  })
})
