import * as Wallets from "@/app/wallets"

import { toSats } from "@/domain/bitcoin"

import { baseLogger } from "@/services/logger"

import { sleep } from "@/utils"

import {
  checkIsBalanced,
  createUserAndWalletFromPhone,
  getBalanceHelper,
  getDefaultWalletIdByPhone,
  lndOutside1,
  randomPhone,
  safePay,
} from "test/helpers"

let walletIdB: WalletId

const phoneB = randomPhone()
const phoneF = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneF)
  walletIdB = await getDefaultWalletIdByPhone(phoneB)
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("UserWallet - Lightning", () => {
  it("calls updateInvoice multiple times idempotently", async () => {
    // larger amount to not fall below the escrow limit
    const sats = 500_000
    const memo = "myMemo"

    const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdB,
      amount: toSats(sats),
      memo,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest, paymentHash } = invoice.lnInvoice

    const balanceBefore = await getBalanceHelper(walletIdB)
    const updateInvoice = async () => {
      // TODO: we could use event instead of a sleep to lower test latency
      await sleep(500)

      return Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash,
        logger: baseLogger,
      })
    }

    // first arg is the outsideLndpayResult
    const [, result] = await Promise.all([
      safePay({ lnd: lndOutside1, request: paymentRequest }),
      updateInvoice(),
    ])
    expect(result).not.toBeInstanceOf(Error)

    const balanceAfter = await getBalanceHelper(walletIdB)
    expect(balanceAfter).toBeGreaterThan(balanceBefore)

    // should be idempotent (not return error when called again)
    const resultRetry = await updateInvoice()
    expect(resultRetry).not.toBeInstanceOf(Error)

    const balanceAfterRetry = await getBalanceHelper(walletIdB)
    expect(balanceAfterRetry).toEqual(balanceAfter)
  })
})
