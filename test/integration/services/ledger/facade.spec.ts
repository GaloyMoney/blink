import crypto from "crypto"

import { getDisplayCurrencyConfig } from "@config"
import {
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
} from "@domain/shared"
import * as LedgerFacade from "@services/ledger/facade"
import { DisplayCurrency } from "@domain/fiat"

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
      const paymentHash = crypto.randomUUID() as PaymentHash

      const metadata = LedgerFacade.LnReceiveLedgerMetadata({
        paymentHash,
        fee: bankFee.btc,
        feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
        amountDisplayCurrency: Number(
          receiveAmount.usd.amount,
        ) as DisplayCurrencyBaseAmount,
        pubkey: crypto.randomUUID() as Pubkey,
      })

      await LedgerFacade.recordReceive({
        description: "receives bitcoin",
        amountToCreditReceiver: receiveAmount,
        recipientWalletDescriptor: walletDescriptor1,
        bankFee,
        metadata,
        txMetadata: { hash: paymentHash },
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

      const metadata = LedgerFacade.LnSendLedgerMetadata({
        paymentHash: crypto.randomUUID() as PaymentHash,
        feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
        amountDisplayCurrency: Number(
          receiveAmount.usd.amount,
        ) as DisplayCurrencyBaseAmount,
        displayCurrency: getDisplayCurrencyConfig().code,
        pubkey: crypto.randomUUID() as Pubkey,
        feeKnownInAdvance: true,
        paymentFlow: {
          btcPaymentAmount: receiveAmount.btc,
          usdPaymentAmount: receiveAmount.usd,
          btcProtocolFee: bankFee.btc,
          usdProtocolFee: bankFee.usd,
        } as PaymentFlowState<WalletCurrency, WalletCurrency>,
      })

      await LedgerFacade.recordSend({
        description: "sends bitcoin",
        amountToDebitSender: sendAmount,
        senderWalletDescriptor: walletDescriptor1,
        bankFee,
        metadata,
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

      const { metadata, debitAccountAdditionalMetadata } =
        LedgerFacade.LnIntraledgerLedgerMetadata({
          paymentHash: crypto.randomUUID() as PaymentHash,
          amountDisplayCurrency: Number(
            receiveAmount.usd.amount,
          ) as DisplayCurrencyBaseAmount,
          feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
          displayCurrency: DisplayCurrency.Usd,
          pubkey: crypto.randomUUID() as Pubkey,
          paymentFlow: {
            btcPaymentAmount: receiveAmount.btc,
            usdPaymentAmount: receiveAmount.usd,
            btcProtocolFee: ZERO_SATS,
            usdProtocolFee: ZERO_CENTS,
          } as PaymentFlowState<WalletCurrency, WalletCurrency>,
        })

      await LedgerFacade.recordIntraledger({
        description: "sends bitcoin",
        amount: sendAmount,
        senderWalletDescriptor: walletDescriptor1,
        recipientWalletDescriptor: walletDescriptor2,
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
          amount: startingBalanceSender.amount - sendAmount.btc.amount,
          currency: WalletCurrency.Btc,
        }),
      )
      expect(finishBalanceReceiver).toEqual(
        expect.objectContaining({
          amount: sendAmount.usd.amount,
          currency: WalletCurrency.Usd,
        }),
      )
    })
  })
})
