import { Prices, Wallets } from "@app"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
import { sat2btc, toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { TxStatus } from "@domain/wallets"
import { onchainBlockEventhandler, onInvoiceUpdate } from "@servers/trigger"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"
import { getTitle } from "@services/notifications/payment"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  createUserWallet,
  getDefaultWalletIdByTestUserIndex,
  getHash,
  getInvoice,
  getUserTypeByTestUserIndex,
  lnd1,
  lndOutside1,
  mineBlockAndSyncAll,
  pay,
  RANDOM_ADDRESS,
  subscribeToBlocks,
  waitFor,
  waitUntilSyncAll,
} from "test/helpers"
import { getBTCBalance } from "test/helpers/wallet"

jest.mock("@services/notifications/notification")

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

let walletId0: WalletId
let walletId3: WalletId
let walletId12: WalletId

let userType0: UserType
let userType3: UserType

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserWallet(0)
  await createUserWallet(3)
  await createUserWallet(12)

  walletId0 = await getDefaultWalletIdByTestUserIndex(0)
  walletId3 = await getDefaultWalletIdByTestUserIndex(3)
  walletId12 = await getDefaultWalletIdByTestUserIndex(12)

  userType0 = await getUserTypeByTestUserIndex(0)
  userType3 = await getUserTypeByTestUserIndex(3)
})

beforeEach(() => {
  jest.resetAllMocks()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

type WalletState = {
  balance: Satoshis
  transactions: WalletTransaction[]
}

const getWalletState = async (walletId: WalletId): Promise<WalletState> => {
  const balance = await getBTCBalance(walletId)
  const { result: transactions, error } = await Wallets.getTransactionsForWalletId({
    walletId,
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
    const amount = toSats(10_000)
    const amount2 = toSats(20_000)
    const blocksToMine = ONCHAIN_MIN_CONFIRMATIONS
    const scanDepth = ONCHAIN_MIN_CONFIRMATIONS + 1

    await mineBlockAndSyncAll()
    const result = await Wallets.updateOnChainReceipt({ scanDepth, logger: baseLogger })
    if (result instanceof Error) throw result

    const initWallet0State = await getWalletState(walletId0)
    const initWallet3State = await getWalletState(walletId3)

    const initialBlock = await bitcoindClient.getBlockCount()
    let isFinalBlock = false
    let lastHeight = initialBlock
    const subBlocks = subscribeToBlocks({ lnd: lnd1 })
    subBlocks.on("block", async ({ height }) => {
      if (height > lastHeight) {
        lastHeight = height
        await onchainBlockEventhandler({ height })
      }
      isFinalBlock = lastHeight >= initialBlock + blocksToMine
    })

    const address = await Wallets.createOnChainAddress(walletId0)
    if (address instanceof Error) throw address

    const output0 = {}
    output0[address] = sat2btc(amount)

    const address2 = await Wallets.createOnChainAddress(walletId3)
    if (address2 instanceof Error) throw address2

    const output1 = {}
    output1[address2] = sat2btc(amount2)

    const outputs = [output0, output1]

    const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({ inputs: [], outputs })
    const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
    const finalizedPsbt = await bitcoindOutside.finalizePsbt({
      psbt: walletProcessPsbt.psbt,
    })
    await bitcoindOutside.sendRawTransaction({ hexstring: finalizedPsbt.hex })
    await bitcoindOutside.generateToAddress({
      nblocks: blocksToMine,
      address: RANDOM_ADDRESS,
    })

    await Promise.all([waitFor(() => isFinalBlock), waitUntilSyncAll()])

    subBlocks.removeAllListeners()

    const validateWalletState = async ({
      walletId,
      userType,
      initialState,
      amount,
      address,
    }: {
      walletId: WalletId
      userType: UserType
      initialState: WalletState
      amount: Satoshis
      address: string
    }) => {
      const { balance, transactions } = await getWalletState(walletId)
      const depositFeeRatio = userType.depositFeeRatio as DepositFeeRatio
      const finalAmount = amountAfterFeeDeduction({ amount, depositFeeRatio })
      const lastTransaction = transactions[0]

      expect(transactions.length).toBe(initialState.transactions.length + 1)
      expect(lastTransaction.deprecated.type).toBe(LedgerTransactionType.OnchainReceipt)
      expect(lastTransaction.status).toBe(TxStatus.Success)
      expect(lastTransaction.settlementFee).toBe(
        Math.round(lastTransaction.settlementFee),
      )
      expect(lastTransaction.settlementAmount).toBe(finalAmount)
      expect((lastTransaction as WalletOnChainTransaction).initiationVia.address).toBe(
        address,
      )
      expect(balance).toBe(initialState.balance + finalAmount)
    }

    await validateWalletState({
      walletId: walletId0,
      userType: userType0,
      initialState: initWallet0State,
      amount: amount,
      address: address,
    })
    await validateWalletState({
      walletId: walletId3,
      userType: userType3,
      initialState: initWallet3State,
      amount: amount2,
      address: address2,
    })
  })

  it("should process pending invoices on invoice update event", async () => {
    const sats = 500

    const lnInvoice = await Wallets.addInvoice({
      walletId: walletId12,
      amount: toSats(sats),
    })
    expect(lnInvoice).not.toBeInstanceOf(Error)

    const { paymentRequest: request } = lnInvoice as LnInvoice
    await pay({ lnd: lndOutside1, request })

    const hash = getHash(request)
    const invoice = await getInvoice({ id: hash, lnd: lnd1 })
    await onInvoiceUpdate(invoice)

    const ledger = LedgerService()
    const ledgerTxs = await ledger.getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) throw ledgerTxs

    const ledgerTx = ledgerTxs[0]

    expect(ledgerTx.credit).toBe(sats)
    expect(ledgerTx.pendingConfirmation).toBe(false)

    const satsPrice = await Prices.getCurrentPrice()
    if (satsPrice instanceof Error) throw satsPrice
    const usd = (sats * satsPrice).toFixed(2)
    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle[NotificationType.LnInvoicePaid]({ usd, amount: sats }),
    )
    expect(sendNotification.mock.calls[0][0].user.walletId).toStrictEqual(walletId12)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.LnInvoicePaid,
    )
  })
})
