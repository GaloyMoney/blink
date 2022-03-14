import { WalletCurrency } from "@domain/shared"
import { WalletInvoicesRepository } from "@services/mongoose"
import { LightningPaymentFlowBuilder } from "@domain/payments"
import { NewDealerPriceService } from "@services/dealer-price"
import { LndService } from "@services/lnd"

const dealer = NewDealerPriceService()

export const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
  const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
  if (midPriceRatio instanceof Error) return midPriceRatio

  return {
    amount: BigInt(Math.ceil(Number(amount.amount) * midPriceRatio)),
    currency: WalletCurrency.Usd,
  }
}

export const btcFromUsdMidPriceFn = async (
  amount: UsdPaymentAmount,
): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
  const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
  if (midPriceRatio instanceof Error) return midPriceRatio

  return {
    amount: BigInt(Math.ceil(Number(amount.amount) / midPriceRatio)),
    currency: WalletCurrency.Btc,
  }
}

export const constructPaymentFlowBuilder = async ({
  senderWallet,
  invoice,
  uncheckedAmount,
}: {
  senderWallet: Wallet
  invoice: LnInvoice
  uncheckedAmount?: number
}): Promise<LPFBWithConversion<WalletCurrency, WalletCurrency> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  })
  let builderWithInvoice
  if (uncheckedAmount) {
    builderWithInvoice = paymentBuilder.withNoAmountInvoice({ invoice, uncheckedAmount })
  } else {
    builderWithInvoice = paymentBuilder.withInvoice(invoice)
  }
  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)
  if (builderWithSenderWallet.isIntraLedger()) {
    const invoicesRepo = WalletInvoicesRepository()
    const walletInvoice = await invoicesRepo.findByPaymentHash(invoice.paymentHash)
    if (walletInvoice instanceof Error) return walletInvoice

    const {
      walletId: recipientWalletId,
      currency: recipientsWalletCurrency,
      cents,
    } = walletInvoice
    const usdPaymentAmount =
      cents !== undefined
        ? { amount: BigInt(cents), currency: WalletCurrency.Usd }
        : undefined

    return builderWithSenderWallet
      .withRecipientWallet({
        id: recipientWalletId,
        currency: recipientsWalletCurrency,
        usdPaymentAmount,
      })
      .withConversion({
        usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
        btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
      })
  } else {
    return builderWithSenderWallet.withoutRecipientWallet().withConversion({
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    })
  }
}
