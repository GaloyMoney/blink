import {
  getSecretAndPaymentHash,
  invoiceExpirationForCurrency,
} from "@domain/bitcoin/lightning"
import {
  WalletCurrency,
  ZERO_SATS,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
} from "@domain/shared"
import { toSeconds } from "@domain/primitives"

import { InvalidWalletInvoiceBuilderStateError } from "./errors"

export const WalletInvoiceBuilder = (
  config: WalletInvoiceBuilderConfig,
): WalletInvoiceBuilder => {
  const withDescription = ({
    description,
    descriptionHash,
  }: {
    description: string
    descriptionHash?: string
  }) => {
    return WIBWithDescription({
      ...config,
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
  const withAmount = async (uncheckedAmount: number) => {
    if (state.recipientWalletDescriptor.currency === WalletCurrency.Usd) {
      const usdAmount = checkedToUsdPaymentAmount(uncheckedAmount)
      if (usdAmount instanceof Error) return usdAmount
      const btcAmount = await state.dealerBtcFromUsd(usdAmount)
      if (btcAmount instanceof Error) return btcAmount

      return WIBWithAmount({
        ...state,
        hasAmount: true,
        btcAmount,
        usdAmount,
      })
    }
    const btcAmount = checkedToBtcPaymentAmount(uncheckedAmount)

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
    }
    return {
      walletInvoice,
      lnInvoice: registeredInvoice.invoice,
    }
  }

  return {
    registerInvoice,
  }
}
