import { Lightning, Payments } from "@/app"

import { TWO_MONTHS_IN_MS } from "@/config"

import { toSats } from "@/domain/bitcoin"
import {
  PaymentNotFoundError,
  PaymentSendStatus,
  PaymentStatus,
} from "@/domain/bitcoin/lightning"

import { LndService } from "@/services/lnd"

import {
  bitcoindClient,
  checkIsBalanced,
  createInvoice,
  createUserAndWalletFromPhone,
  fundWalletIdFromOnchain,
  getAccountByPhone,
  getDefaultWalletIdByPhone,
  lnd1,
  lndOutside1,
  randomPhone,
} from "test/helpers"

let accountB: Account
let walletIdB: WalletId

const phone = randomPhone()

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phone)
  accountB = await getAccountByPhone(phone)
  walletIdB = await getDefaultWalletIdByPhone(phone)

  await fundWalletIdFromOnchain({
    walletId: walletIdB,
    amountInBitcoin: 0.02,
    lnd: lnd1,
  })
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Delete payments from Lnd - Lightning Pay", () => {
  it("runs delete-payment cronjob", async () => {
    // Create payment
    const { request, secret, id } = await createInvoice({ lnd: lndOutside1 })
    const paymentHash = id as PaymentHash
    const revealedPreImage = secret as RevealedPreImage
    const amount = toSats(1000)

    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: null,
      amount,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toEqual({
      status: PaymentSendStatus.Success,
      transaction: expect.objectContaining({
        walletId: walletIdB,
        status: "success",
        settlementAmount: (amount + paymentResult.transaction.settlementFee) * -1,
        settlementCurrency: "BTC",
        initiationVia: expect.objectContaining({
          type: "lightning",
          paymentHash,
        }),
        settlementVia: expect.objectContaining({
          type: "lightning",
        }),
      }),
    })

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    // Confirm payment exists in lnd
    let retrievedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedPayment).not.toBeInstanceOf(Error)
    if (retrievedPayment instanceof Error) return retrievedPayment
    expect(retrievedPayment.status).toBe(PaymentStatus.Settled)
    if (retrievedPayment.status !== PaymentStatus.Settled) return
    expect(retrievedPayment.confirmedDetails?.revealedPreImage).toBe(revealedPreImage)

    // Run delete-payments cronjob
    const timestamp2Months = new Date(Date.now() - TWO_MONTHS_IN_MS)
    expect(Number(timestamp2Months)).toBeLessThan(Number(retrievedPayment.createdAt))
    const deleteLnPayments1Hour = await Lightning.deleteLnPaymentsBefore(timestamp2Months)
    if (deleteLnPayments1Hour instanceof Error) throw deleteLnPayments1Hour

    // Confirm payment still exists
    retrievedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedPayment).not.toBeInstanceOf(Error)
    if (retrievedPayment instanceof Error) return retrievedPayment
    expect(retrievedPayment.status).toBe(PaymentStatus.Settled)
    if (retrievedPayment.status !== PaymentStatus.Settled) return
    expect(retrievedPayment.confirmedDetails?.revealedPreImage).toBe(revealedPreImage)

    // Run updateLnPayments task
    const lnPaymentUpdateOnPending = await Lightning.updateLnPayments()
    if (lnPaymentUpdateOnPending instanceof Error) throw lnPaymentUpdateOnPending

    // Run delete-payments cronjob again for payments before 2 weeks ago
    const deleteLnPayments1HourRetry =
      await Lightning.deleteLnPaymentsBefore(timestamp2Months)
    if (deleteLnPayments1HourRetry instanceof Error) throw deleteLnPayments1HourRetry

    // Confirm payment still exists
    retrievedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedPayment).not.toBeInstanceOf(Error)
    if (retrievedPayment instanceof Error) return retrievedPayment
    expect(retrievedPayment.status).toBe(PaymentStatus.Settled)
    if (retrievedPayment.status !== PaymentStatus.Settled) return
    expect(retrievedPayment.confirmedDetails?.revealedPreImage).toBe(revealedPreImage)

    // Run delete-payments cronjob again for all payments
    const timestampNow = new Date()
    expect(Number(timestampNow)).toBeGreaterThan(Number(retrievedPayment.createdAt))
    const deleteLnPayments = await Lightning.deleteLnPaymentsBefore(timestampNow)
    if (deleteLnPayments instanceof Error) throw deleteLnPayments

    // Confirm payment was deleted
    const retrievedDeletedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedDeletedPayment).toBeInstanceOf(PaymentNotFoundError)
  })
})
