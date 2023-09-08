import {
  BtcPaymentAmount,
  UsdPaymentAmount,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
} from "@domain/shared"

import { WalletInvoiceReceiver } from "@domain/wallet-invoices/wallet-invoice-receiver"

describe("WalletInvoiceReceiver", () => {
  const midPriceRatio = 2n
  const usdFromBtcMidPrice = async (amount: BtcPaymentAmount) => {
    const finalAmount = amount.amount / midPriceRatio || 1n
    return Promise.resolve({
      amount: finalAmount,
      currency: WalletCurrency.Usd,
    })
  }

  const immediatePriceRation = 3n
  const usdFromBtc = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount / immediatePriceRation,
      currency: WalletCurrency.Usd,
    })
  }

  const receivedBtc = BtcPaymentAmount(1200n)

  const recipientAccountId = "recipientAccountId" as AccountId

  const partialRecipientBtcWalletDescriptor = {
    id: "recipientBtcWalletId" as WalletId,
    currency: WalletCurrency.Btc,
  }
  const recipientBtcWalletDescriptor = {
    ...partialRecipientBtcWalletDescriptor,
    accountId: recipientAccountId,
  }

  const partialRecipientUsdWalletDescriptor = {
    id: "recipientUsdWalletId" as WalletId,
    currency: WalletCurrency.Usd,
  }
  const recipientUsdWalletDescriptor = {
    ...partialRecipientUsdWalletDescriptor,
    accountId: recipientAccountId,
  }

  describe("for btc invoice", () => {
    const btcInvoice: WalletInvoice = {
      paymentHash: "paymentHash" as PaymentHash,
      secret: "secret" as SecretPreImage,
      selfGenerated: false,
      pubkey: "pubkey" as Pubkey,
      usdAmount: undefined,
      paid: false,
      recipientWalletDescriptor: partialRecipientBtcWalletDescriptor,
    }

    it("returns correct amounts", async () => {
      const walletInvoiceAmounts = await WalletInvoiceReceiver({
        walletInvoice: btcInvoice,
        receivedBtc,
        recipientAccountId,
        recipientWalletDescriptorsForAccount: [
          recipientBtcWalletDescriptor,
          recipientUsdWalletDescriptor,
        ],
      }).withConversion({
        mid: { usdFromBtc: usdFromBtcMidPrice },
        hedgeBuyUsd: { usdFromBtc },
      })

      if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

      const usdToCreditReceiver = await usdFromBtcMidPrice(receivedBtc)

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
        secret: "secret" as SecretPreImage,
        recipientWalletDescriptor: partialRecipientUsdWalletDescriptor,
        selfGenerated: false,
        pubkey: "pubkey" as Pubkey,
        usdAmount: UsdPaymentAmount(BigInt(100)),
        paid: false,
      }

      it("returns correct amounts", async () => {
        const walletInvoiceAmounts = await WalletInvoiceReceiver({
          walletInvoice: amountUsdInvoice,
          receivedBtc,
          recipientAccountId,
          recipientWalletDescriptorsForAccount: [
            recipientBtcWalletDescriptor,
            recipientUsdWalletDescriptor,
          ],
        }).withConversion({
          mid: { usdFromBtc: usdFromBtcMidPrice },
          hedgeBuyUsd: { usdFromBtc },
        })

        if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

        expect(walletInvoiceAmounts).toEqual(
          expect.objectContaining({
            usdBankFee: ZERO_CENTS,
            btcBankFee: ZERO_SATS,
            usdToCreditReceiver: amountUsdInvoice.usdAmount,
            btcToCreditReceiver: receivedBtc,
          }),
        )
      })
    })
    describe("with no amount", () => {
      const noAmountUsdInvoice: WalletInvoice = {
        paymentHash: "paymentHash" as PaymentHash,
        secret: "secret" as SecretPreImage,
        recipientWalletDescriptor: partialRecipientUsdWalletDescriptor,
        selfGenerated: false,
        pubkey: "pubkey" as Pubkey,
        paid: false,
      }

      it("returns correct amounts", async () => {
        const walletInvoiceAmounts = await WalletInvoiceReceiver({
          walletInvoice: noAmountUsdInvoice,
          receivedBtc,
          recipientAccountId,
          recipientWalletDescriptorsForAccount: [
            recipientBtcWalletDescriptor,
            recipientUsdWalletDescriptor,
          ],
        }).withConversion({
          mid: { usdFromBtc: usdFromBtcMidPrice },
          hedgeBuyUsd: { usdFromBtc },
        })

        if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

        const usdToCreditReceiver = await usdFromBtc(receivedBtc)
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

      it("credits amount less than 1 cent amount to recipient btc wallet", async () => {
        const walletInvoiceAmounts = await WalletInvoiceReceiver({
          walletInvoice: noAmountUsdInvoice,
          receivedBtc: BtcPaymentAmount(1n),
          recipientAccountId,
          recipientWalletDescriptorsForAccount: [
            recipientBtcWalletDescriptor,
            recipientUsdWalletDescriptor,
          ],
        }).withConversion({
          mid: { usdFromBtc: usdFromBtcMidPrice },
          hedgeBuyUsd: { usdFromBtc },
        })
        if (walletInvoiceAmounts instanceof Error) throw walletInvoiceAmounts

        const { recipientWalletDescriptor } = walletInvoiceAmounts
        expect(recipientWalletDescriptor).toStrictEqual(recipientBtcWalletDescriptor)
      })
    })
  })
})
