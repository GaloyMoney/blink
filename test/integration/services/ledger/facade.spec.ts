import crypto from "crypto"

import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@domain/shared"
import * as LedgerFacade from "@services/ledger/facade"

import {
  recordLnIntraLedgerPayment,
  recordReceiveLnPayment,
  recordSendLnPayment,
} from "./helpers"

describe("Facade", () => {
  const receiveAmount = {
    usd: { amount: 100n, currency: WalletCurrency.Usd },
    btc: { amount: 200n, currency: WalletCurrency.Btc },
  }
  const sendAmount = {
    usd: { amount: 20n, currency: WalletCurrency.Usd },
    btc: { amount: 40n, currency: WalletCurrency.Btc },
  }
  const bankFee = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 20n, currency: WalletCurrency.Btc },
  }
  const walletDescriptor1 = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
  const walletDescriptor2 = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

  describe("recordReceive", () => {
    it("receives to btc wallet", async () => {
      await recordReceiveLnPayment({
        walletDescriptor: walletDescriptor1,
        paymentAmount: receiveAmount,
        bankFee,
      })

      const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (balance instanceof Error) throw balance
      expect(balance).toEqual(
        expect.objectContaining({
          amount: receiveAmount.btc.amount,
          currency: WalletCurrency.Btc,
        }),
      )
    })
  })

  describe("recordSend", () => {
    it("sends from btc wallet", async () => {
      const startingBalance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (startingBalance instanceof Error) throw startingBalance

      await recordSendLnPayment({
        walletDescriptor: walletDescriptor1,
        paymentAmount: sendAmount,
        bankFee,
      })

      const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (balance instanceof Error) throw balance
      expect(balance).toEqual(
        expect.objectContaining({
          amount: startingBalance.amount - sendAmount.btc.amount,
          currency: WalletCurrency.Btc,
        }),
      )
    })
  })

  describe("recordIntraledger", () => {
    it("sends from btc wallet to usd wallet", async () => {
      const startingBalanceSender = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (startingBalanceSender instanceof Error) throw startingBalanceSender

      await recordLnIntraLedgerPayment({
        senderWalletDescriptor: walletDescriptor1,
        recipientWalletDescriptor: walletDescriptor2,
        paymentAmount: sendAmount,
      })

      const finishBalanceSender = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (finishBalanceSender instanceof Error) throw finishBalanceSender
      expect(finishBalanceSender).toEqual(
        expect.objectContaining({
          amount: startingBalanceSender.amount - sendAmount.btc.amount,
          currency: WalletCurrency.Btc,
        }),
      )

      const finishBalanceReceiver = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor2,
      )
      if (finishBalanceReceiver instanceof Error) throw finishBalanceReceiver
      expect(finishBalanceReceiver).toEqual(
        expect.objectContaining({
          amount: sendAmount.usd.amount,
          currency: WalletCurrency.Usd,
        }),
      )
    })
  })
})
