import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { PaymentsRepository } from "@services/redis"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  LightningPaymentFlowBuilder,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"

const dealer = NewDealerPriceService()

export const getLightningFeeEstimation = async ({
  walletId,
  paymentRequest,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  if (decodedInvoice.paymentAmount === null) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  }).withInvoice(decodedInvoice)

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    decodedInvoice,
    paymentBuilder,
  })
}

export const getNoAmountLightningFeeEstimation = async ({
  walletId,
  paymentRequest,
  amount,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
  amount: number
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  if (decodedInvoice.paymentAmount === null) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const paymentBuilder: LPFBWithInvoice<WalletCurrency> = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  }).withNoAmountInvoice({ invoice: decodedInvoice, uncheckedAmount: amount })

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    decodedInvoice,
    paymentBuilder,
  })
}

const estimateLightningFee = async ({
  uncheckedSenderWalletId,
  decodedInvoice,
  paymentBuilder,
}: {
  uncheckedSenderWalletId: string
  decodedInvoice: LnInvoice
  paymentBuilder: LPFBWithInvoice<WalletCurrency>
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const withSenderPaymentBuilder = paymentBuilder.withSenderWallet(senderWallet)

  if (!withSenderPaymentBuilder.isIntraledger()) {
    const invoicesRepo = WalletInvoicesRepository()
    const walletInvoice = await invoicesRepo.findByPaymentHash(decodedInvoice.paymentHash)
    if (walletInvoice instanceof Error) return walletInvoice

    const { walletId: recipientWalletId } = walletInvoice
    const recipientWallet = await WalletsRepository().findById(recipientWalletId)
    if (recipientWallet instanceof Error) return recipientWallet

    const payment = await withSenderPaymentBuilder
      .withRecipientWallet(recipientWallet)
      .withConversion({
        usdFromBtc,
        btcFromUsd,
      })
      .withoutRoute()
    if (payment instanceof Error) return payment

    const persistedPayment = await PaymentsRepository().persistNew(payment)
    if (persistedPayment instanceof Error) return persistedPayment

    return persistedPayment.protocolFeeInSenderWalletCurrency()
  }

  const afterConversionPaymentBuilder = withSenderPaymentBuilder
    .withoutRecipientWallet()
    .withConversion({
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    })

  const btcPaymentAmount = await afterConversionPaymentBuilder.btcPaymentAmount()
  if (btcPaymentAmount instanceof Error) return btcPaymentAmount

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const routeResult = await lndService.findRouteForInvoiceNew({
    decodedInvoice,
    amount: btcPaymentAmount,
  })
  if (routeResult instanceof Error) return routeResult
  const { rawRoute } = routeResult

  const payment = await afterConversionPaymentBuilder.withRoute({
    pubkey: lndService.defaultPubkey(),
    rawRoute,
  })
  if (payment instanceof Error) return payment

  const persistedPayment = await PaymentsRepository().persistNew(payment)
  if (persistedPayment instanceof Error) return persistedPayment

  return persistedPayment.protocolFeeInSenderWalletCurrency()
}
