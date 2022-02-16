import { Prices, Wallets } from "@app"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"
import { sat2btc, toSats } from "@domain/bitcoin"
import { NotificationType } from "@domain/notifications"
import { TxStatus } from "@domain/wallets"
import { onchainBlockEventhandler, onInvoiceUpdate } from "@servers/trigger"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"
import { getTitle } from "@services/notifications/payment"
import { sleep } from "@utils"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  getDefaultWalletIdByTestUserRef,
  getHash,
  getInvoice,
  getUserIdByTestUserRef,
  getUserRecordByTestUserRef,
  lnd1,
  lndOutside1,
  mineBlockAndSyncAll,
  pay,
  RANDOM_ADDRESS,
  subscribeToBlocks,
  waitFor,
  waitUntilSyncAll,
  initializeTestingState,
  defaultStateConfig,
} from "test/helpers"
import { getBTCBalance } from "test/helpers/wallet"

jest.mock("@services/notifications/notification")

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

let walletIdA: WalletId
let walletIdD: WalletId
let walletIdF: WalletId

let userIdF: UserId

let userRecordA: UserRecord
let userRecordD: UserRecord

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdD = await getDefaultWalletIdByTestUserRef("D")
  walletIdF = await getDefaultWalletIdByTestUserRef("F")

  userIdF = await getUserIdByTestUserRef("F")

  userRecordA = await getUserRecordByTestUserRef("A")
  userRecordD = await getUserRecordByTestUserRef("D")
})

beforeEach(() => {
  jest.resetAllMocks()
})

afterAll(async () => {
  jest.restoreAllMocks()
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

    const initWalletAState = await getWalletState(walletIdA)
    const initWalletDState = await getWalletState(walletIdD)

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

    const address = await Wallets.createOnChainAddress(walletIdA)
    if (address instanceof Error) throw address

    const output0 = {}
    output0[address] = sat2btc(amount)

    const address2 = await Wallets.createOnChainAddress(walletIdD)
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
      userRecord: UserRecord
      initialState: WalletState
      amount: Satoshis
      address: string
    }) => {
      const { balance, transactions } = await getWalletState(walletId)
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
    }

    await validateWalletState({
      walletId: walletIdA,
      userRecord: userRecordA,
      initialState: initWalletAState,
      amount: amount,
      address: address,
    })
    await validateWalletState({
      walletId: walletIdD,
      userRecord: userRecordD,
      initialState: initWalletDState,
      amount: amount2,
      address: address2,
    })
  })

  it("should process pending invoices on invoice update event", async () => {
    const sats = 500

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdF,
      amount: toSats(sats),
    })
    expect(lnInvoice).not.toBeInstanceOf(Error)

    const { paymentRequest: request } = lnInvoice as LnInvoice
    await pay({ lnd: lndOutside1, request })

    const hash = getHash(request)
    const invoice = await getInvoice({ id: hash, lnd: lnd1 })
    await onInvoiceUpdate(invoice)

    // notification are not been awaited, so explicit sleep is necessary
    await sleep(250)

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
    expect(sendNotification.mock.calls[0][0].user.id).toStrictEqual(userIdF)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.LnInvoicePaid,
    )
  })
})
