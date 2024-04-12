import {
  InvalidWalletInvoiceBuilderStateError,
  SubOneCentSatAmountForUsdReceiveError,
} from "./errors"

import { checkedToLedgerExternalId } from "@/domain/ledger"
import {
  getSecretAndPaymentHash,
  invoiceExpirationForCurrency,
} from "@/domain/bitcoin/lightning"
import { WalletCurrency, ZERO_SATS } from "@/domain/shared"
import { toSeconds } from "@/domain/primitives"

export const WalletInvoiceBuilder = (
  config: WalletInvoiceBuilderConfig,
): WalletInvoiceBuilder => {
  const withExternalId = (externalId: LedgerExternalId | undefined) => {
    return WIBWithExternalId({
      ...config,
      externalId,
    })
  }

  return {
    withExternalId,
  }
}

export const WIBWithExternalId = (state: WIBWithExternalIdState): WIBWithExternalId => {
  const withDescription = ({
    description,
    descriptionHash,
  }: {
    description: string
    descriptionHash?: string
  }) => {
    return WIBWithDescription({
      ...state,
      description,
      descriptionHash,
    })
  }

  return {
    withDescription,
  }
}

export const WIBWithDescription = (
  state: WIBWithDescriptionState,
): WIBWithDescription => {
  const generatedForRecipient = (): WIBWithOrigin =>
    WIBWithOrigin({ ...state, selfGenerated: false })
  const generatedForSelf = (): WIBWithOrigin =>
    WIBWithOrigin({ ...state, selfGenerated: true })

  return {
    generatedForRecipient,
    generatedForSelf,
  }
}

export const WIBWithOrigin = (state: WIBWithOriginState): WIBWithOrigin => {
  const withRecipientWallet = (recipientWallet: WalletDescriptor<WalletCurrency>) =>
    WIBWithRecipient({ ...state, recipientWalletDescriptor: recipientWallet })

  return {
    withRecipientWallet,
  }
}

export const WIBWithRecipient = (state: WIBWithRecipientState): WIBWithRecipient => {
  const withExpiration = (minutes: Minutes): WIBWithExpiration => {
    const { currency } = state.recipientWalletDescriptor
    const invoiceExpiration = invoiceExpirationForCurrency(
      currency,
      new Date(),
      toSeconds(minutes * 60),
    )
    return WIBWithExpiration({ ...state, invoiceExpiration })
  }

  return { withExpiration }
}

export const WIBWithExpiration = (state: WIBWithExpirationState): WIBWithExpiration => {
  const withAmount = async (amount: PaymentAmount<WalletCurrency>) => {
    if (state.recipientWalletDescriptor.currency === WalletCurrency.Usd) {
      if (amount.currency === WalletCurrency.Usd) {
        const usdAmount = amount as UsdPaymentAmount
        const btcAmount = await state.dealerBtcFromUsd(usdAmount)
        if (btcAmount instanceof Error) return btcAmount
        return WIBWithAmount({
          ...state,
          hasAmount: true,
          btcAmount,
          usdAmount,
        })
      }

      const btcAmount = amount as BtcPaymentAmount
      const usdAmount = await state.dealerUsdFromBtc(btcAmount)
      if (usdAmount instanceof Error) return usdAmount
      if (usdAmount.amount === 0n) {
        return new SubOneCentSatAmountForUsdReceiveError(
          `${Number(btcAmount.amount)} sats`,
        )
      }
      return WIBWithAmount({
        ...state,
        hasAmount: true,
        btcAmount,
        usdAmount,
      })
    }

    if (amount.currency !== WalletCurrency.Btc) {
      return new InvalidWalletInvoiceBuilderStateError(
        JSON.stringify({
          recipientAmount: { amount: Number(amount.amount), currency: amount.currency },
          recipientWalletDescriptor: state.recipientWalletDescriptor,
        }),
      )
    }
    const btcAmount = amount as BtcPaymentAmount
    if (btcAmount instanceof Error) return btcAmount

    return WIBWithAmount({ ...state, hasAmount: true, btcAmount })
  }

  const withoutAmount = async () =>
    WIBWithAmount({
      ...state,
      hasAmount: false,
      btcAmount: ZERO_SATS,
    })

  return {
    withAmount,
    withoutAmount,
  }
}

export const WIBWithAmount = (state: WIBWithAmountState): WIBWithAmount => {
  const registerInvoice = async () => {
    const { secret, paymentHash } = getSecretAndPaymentHash()

    const defaultExternalId = checkedToLedgerExternalId(paymentHash)
    if (defaultExternalId instanceof Error) return defaultExternalId
    const externalId = state.externalId || defaultExternalId

    const registeredInvoice = await state.lnRegisterInvoice({
      paymentHash,
      description: state.description,
      descriptionHash: state.descriptionHash,
      btcPaymentAmount: state.btcAmount,
      expiresAt: state.invoiceExpiration,
    })
    if (registeredInvoice instanceof Error) return registeredInvoice
    if (paymentHash !== registeredInvoice.invoice.paymentHash) {
      return new InvalidWalletInvoiceBuilderStateError()
    }

    const walletInvoice: WalletInvoice = {
      paymentHash,
      secret,
      selfGenerated: state.selfGenerated,
      pubkey: registeredInvoice.pubkey,
      usdAmount: state.usdAmount,
      recipientWalletDescriptor: state.recipientWalletDescriptor,
      paid: false,
      createdAt: new Date(),
      lnInvoice: registeredInvoice.invoice,
      processingCompleted: false,
      externalId,
    }
    return walletInvoice
  }

  return {
    registerInvoice,
  }
}
