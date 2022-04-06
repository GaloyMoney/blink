import { toCents } from "@domain/fiat"
import {
  BtcPaymentAmount,
  paymentAmountFromCents,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
} from "@domain/shared"

import { dealerMidPriceFunctions } from "@domain/dealer-price"
import { WalletInvoiceAmounts } from "@domain/wallet-invoices/wallet-invoice-amounts"

import { NewDealerPriceService } from "../../../mocks/dealer-price"

describe("WalletInvoiceAmounts", () => {
  const dealer = NewDealerPriceService(0 as Seconds)
  const { usdFromBtcMidPriceFn } = dealerMidPriceFunctions(dealer)
  const receivedBtc = BtcPaymentAmount(1200n)

  describe("for btc invoice", () => {
    const btcInvoice: WalletInvoice = {
      paymentHash: "paymentHash" as PaymentHash,
      walletId: "toWalletId" as WalletId,
      selfGenerated: false,
      pubkey: "pubkey" as Pubkey,
      cents: undefined,
      paid: false,
      currency: WalletCurrency.Btc,
    }

    it("returns correct amounts", async () => {
      const walletInvoiceAmounts = await WalletInvoiceAmounts({
        walletInvoice: btcInvoice,
        receivedBtc,
        usdFromBtcMidPrice: usdFromBtcMidPriceFn,
        usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      })

      if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

      const usdToCreditReceiver = await usdFromBtcMidPriceFn(receivedBtc)

      if (usdToCreditReceiver instanceof Error) throw usdToCreditReceiver

      expect(walletInvoiceAmounts).toEqual(
        expect.objectContaining({
          usdBankFee: ZERO_CENTS,
          btcBankFee: ZERO_SATS,
          usdToCreditReceiver,
          btcToCreditReceiver: receivedBtc,
        }),
      )
    })
  })

  describe("for usd invoice", () => {
    describe("with cents amount", () => {
      const amountUsdInvoice: WalletInvoice = {
        paymentHash: "paymentHash" as PaymentHash,
        walletId: "toWalletId" as WalletId,
        selfGenerated: false,
        pubkey: "pubkey" as Pubkey,
        cents: toCents(120),
        paid: false,
        currency: WalletCurrency.Usd,
      }

      it("returns correct amounts", async () => {
        const walletInvoiceAmounts = await WalletInvoiceAmounts({
          walletInvoice: amountUsdInvoice,
          receivedBtc,
          usdFromBtcMidPrice: usdFromBtcMidPriceFn,
          usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
        })

        if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

        expect(walletInvoiceAmounts).toEqual(
          expect.objectContaining({
            usdBankFee: ZERO_CENTS,
            btcBankFee: ZERO_SATS,
            usdToCreditReceiver: paymentAmountFromCents(amountUsdInvoice.cents!),
            btcToCreditReceiver: receivedBtc,
          }),
        )
      })
    })
  })

  describe("for usd invoice", () => {
    describe("with no amount", () => {
      const noAmountUsdInvoice: WalletInvoice = {
        paymentHash: "paymentHash" as PaymentHash,
        walletId: "toWalletId" as WalletId,
        selfGenerated: false,
        pubkey: "pubkey" as Pubkey,
        cents: undefined,
        paid: false,
        currency: WalletCurrency.Usd,
      }

      it("returns correct amounts", async () => {
        const walletInvoiceAmounts = await WalletInvoiceAmounts({
          walletInvoice: noAmountUsdInvoice,
          receivedBtc,
          usdFromBtcMidPrice: usdFromBtcMidPriceFn,
          usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
        })

        if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

        const usdToCreditReceiver = await dealer.getCentsFromSatsForImmediateBuy(
          receivedBtc,
        )
        if (usdToCreditReceiver instanceof Error) throw usdToCreditReceiver

        expect(walletInvoiceAmounts).toEqual(
          expect.objectContaining({
            usdBankFee: ZERO_CENTS,
            btcBankFee: ZERO_SATS,
            usdToCreditReceiver,
            btcToCreditReceiver: receivedBtc,
          }),
        )
      })
    })
  })
})
