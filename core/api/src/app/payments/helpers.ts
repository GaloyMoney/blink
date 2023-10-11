import { btcFromUsdMidPriceFn, usdFromBtcMidPriceFn } from "@/app/prices"
import { addNewContact } from "@/app/accounts/add-new-contact"
import { getValuesToSkipProbe, MIN_SATS_FOR_PRICE_RATIO_PRECISION } from "@/config"
import { AlreadyPaidError } from "@/domain/errors"
import { LightningPaymentFlowBuilder, WalletPriceRatio } from "@/domain/payments"
import { WalletCurrency } from "@/domain/shared"
import { LndService } from "@/services/lnd"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"

export const constructPaymentFlowBuilder = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWallet,
  invoice,
  uncheckedAmount,
  hedgeBuyUsd,
  hedgeSellUsd,
}: {
  senderWallet: WalletDescriptor<S>
  invoice: LnInvoice
  uncheckedAmount?: number
  hedgeBuyUsd: ConversionFns
  hedgeSellUsd: ConversionFns
}): Promise<LPFBWithConversion<S, R> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    skipProbe: getValuesToSkipProbe(),
  })
  const builderWithInvoice = uncheckedAmount
    ? (paymentBuilder.withNoAmountInvoice({
        invoice,
        uncheckedAmount,
      }) as LPFBWithInvoice<S>)
    : (paymentBuilder.withInvoice(invoice) as LPFBWithInvoice<S>)

  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)

  let builderAfterRecipientStep: LPFBWithRecipientWallet<S, R> | LPFBWithError
  if (builderWithSenderWallet.isIntraLedger()) {
    const recipientDetails = await recipientDetailsFromInvoice<R>(invoice)
    if (recipientDetails instanceof Error) return recipientDetails

    addAttributesToCurrentSpan({
      "payment.originalRecipient": JSON.stringify(
        recipientDetails.recipientWalletDescriptors[
          recipientDetails.defaultWalletCurrency
        ],
      ),
    })

    builderAfterRecipientStep =
      builderWithSenderWallet.withRecipientWallet<R>(recipientDetails)
  } else {
    builderAfterRecipientStep = builderWithSenderWallet.withoutRecipientWallet()
  }

  return builderAfterRecipientStep.withConversion({
    mid: { usdFromBtc: usdFromBtcMidPriceFn, btcFromUsd: btcFromUsdMidPriceFn },
    hedgeBuyUsd,
    hedgeSellUsd,
  })
}

const recipientDetailsFromInvoice = async <R extends WalletCurrency>(
  invoice: LnInvoice,
): Promise<
  | {
      defaultWalletCurrency: R
      recipientWalletDescriptors: AccountWalletDescriptors
      pubkey: Pubkey
      usdPaymentAmount: UsdPaymentAmount | undefined
      username: Username | undefined
      userId: UserId
    }
  | ApplicationError
> => {
  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(invoice.paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  if (walletInvoice.paid) return new AlreadyPaidError(walletInvoice.paymentHash)

  const {
    recipientWalletDescriptor: {
      id: recipientWalletId,
      currency: recipientsWalletCurrency,
    },
    pubkey: recipientPubkey,
    usdAmount: usdPaymentAmount,
  } = walletInvoice

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet
  const { accountId } = recipientWallet

  const accountWallets =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWallets instanceof Error) return accountWallets

  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount
  const { username: recipientUsername, kratosUserId: recipientUserId } = recipientAccount

  return {
    defaultWalletCurrency: recipientsWalletCurrency as R,
    recipientWalletDescriptors: accountWallets,
    pubkey: recipientPubkey,
    usdPaymentAmount,
    username: recipientUsername,
    userId: recipientUserId,
  }
}

export const getPriceRatioForLimits = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "getPriceRatioForLimits",
  fn: async (paymentAmounts: PaymentAmountInAllCurrencies) => {
    const amount = MIN_SATS_FOR_PRICE_RATIO_PRECISION

    if (paymentAmounts.btc.amount < amount) {
      const btcPaymentAmountForRatio = {
        amount,
        currency: WalletCurrency.Btc,
      }
      const usdPaymentAmountForRatio = await usdFromBtcMidPriceFn(
        btcPaymentAmountForRatio,
      )
      if (usdPaymentAmountForRatio instanceof Error) return usdPaymentAmountForRatio

      return WalletPriceRatio({
        usd: usdPaymentAmountForRatio,
        btc: btcPaymentAmountForRatio,
      })
    }

    return WalletPriceRatio(paymentAmounts)
  },
})

export const addContactsAfterSend = async ({
  senderAccount,
  recipientAccount,
}: {
  senderAccount: Account
  recipientAccount: Account
}): Promise<true | ApplicationError> => {
  if (!(senderAccount.contactEnabled && recipientAccount.contactEnabled)) {
    return true
  }

  if (recipientAccount.username) {
    const addContactToPayerResult = await addNewContact({
      accountId: senderAccount.id,
      contactUsername: recipientAccount.username,
    })
    if (addContactToPayerResult instanceof Error) return addContactToPayerResult
  }

  if (senderAccount.username) {
    const addContactToPayeeResult = await addNewContact({
      accountId: recipientAccount.id,
      contactUsername: senderAccount.username,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return true
}
