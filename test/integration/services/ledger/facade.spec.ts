import crypto from "crypto"

import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@domain/shared"
import * as LedgerFacade from "@services/ledger/facade"

describe("Facade", () => {
  const receiveAmount = {
    usdWithFee: { amount: 100n, currency: WalletCurrency.Usd },
    btcWithFee: { amount: 200n, currency: WalletCurrency.Btc },
  }
  const sendAmount = {
    usdWithFee: { amount: 20n, currency: WalletCurrency.Usd },
    btcWithFee: { amount: 40n, currency: WalletCurrency.Btc },
  }
  const fee = {
    usdProtocolFee: { amount: 10n, currency: WalletCurrency.Usd },
    btcProtocolFee: { amount: 20n, currency: WalletCurrency.Btc },
  }
  const walletDescriptor1 = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
  const walletDescriptor2 = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

  describe("recordReceive", () => {
    it("receives to btc wallet", async () => {
      const metadata = LedgerFacade.LnReceiveLedgerMetadata({
        paymentHash: crypto.randomUUID() as PaymentHash,
        fee: fee.btcProtocolFee,
        feeDisplayCurrency: Number(
          fee.usdProtocolFee.amount,
        ) as DisplayCurrencyBaseAmount,
        amountDisplayCurrency: Number(
          receiveAmount.usdWithFee.amount,
        ) as DisplayCurrencyBaseAmount,
        pubkey: crypto.randomUUID() as Pubkey,
      })

      await LedgerFacade.recordReceive({
        description: "receives bitcoin",
        amount: receiveAmount,
        receiverWalletDescriptor: walletDescriptor1,
        fee,
        metadata,
      })

      const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )

      if (balance instanceof Error) throw balance
      expect(balance).toEqual(
        expect.objectContaining({
          amount: receiveAmount.btcWithFee.amount - fee.btcProtocolFee.amount,
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

      const metadata = LedgerFacade.LnSendLedgerMetadata({
        paymentHash: crypto.randomUUID() as PaymentHash,
        fee: fee.btcProtocolFee,
        feeDisplayCurrency: Number(
          fee.usdProtocolFee.amount,
        ) as DisplayCurrencyBaseAmount,
        amountDisplayCurrency: Number(
          receiveAmount.usdWithFee.amount,
        ) as DisplayCurrencyBaseAmount,
        pubkey: crypto.randomUUID() as Pubkey,
        feeKnownInAdvance: true,
      })

      await LedgerFacade.recordSend({
        description: "sends bitcoin",
        amount: sendAmount,
        senderWalletDescriptor: walletDescriptor1,
        fee,
        metadata,
      })

      const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )

      if (balance instanceof Error) throw balance
      expect(balance).toEqual(
        expect.objectContaining({
          amount: startingBalance.amount - sendAmount.btcWithFee.amount,
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

      const { metadata, debitAccountAdditionalMetadata } =
        LedgerFacade.LnIntraledgerLedgerMetadata({
          paymentHash: crypto.randomUUID() as PaymentHash,
          amountDisplayCurrency: Number(
            receiveAmount.usdWithFee.amount,
          ) as DisplayCurrencyBaseAmount,
          pubkey: crypto.randomUUID() as Pubkey,
        })

      await LedgerFacade.recordIntraledger({
        description: "sends bitcoin",
        amount: sendAmount,
        senderWalletDescriptor: walletDescriptor1,
        receiverWalletDescriptor: walletDescriptor2,
        metadata,
        additionalDebitMetadata: debitAccountAdditionalMetadata,
      })

      const finishBalanceSender = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor1,
      )
      if (finishBalanceSender instanceof Error) throw finishBalanceSender
      const finishBalanceReceiver = await LedgerFacade.getLedgerAccountBalanceForWalletId(
        walletDescriptor2,
      )
      if (finishBalanceReceiver instanceof Error) throw finishBalanceReceiver

      expect(finishBalanceSender).toEqual(
        expect.objectContaining({
          amount: startingBalanceSender.amount - sendAmount.btcWithFee.amount,
          currency: WalletCurrency.Btc,
        }),
      )
      expect(finishBalanceReceiver).toEqual(
        expect.objectContaining({
          amount: sendAmount.usdWithFee.amount,
          currency: WalletCurrency.Usd,
        }),
      )
    })
  })
})
