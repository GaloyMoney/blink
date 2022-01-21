import { checkedToSats } from "@domain/bitcoin"
import {
  SelfPaymentError,
  InvalidWalletId,
  InvalidAccountStatusError,
} from "@domain/errors"
import { AccountStatus } from "@domain/accounts"

export const PaymentInputValidator = (
  getWalletFn: PaymentInputValidatorConfig,
): PaymentInputValidator => {
  const validatePaymentInput = async ({
    amount,
    senderWalletId,
    senderAccount,
    recipientWalletId,
  }) => {
    const validAmount = checkedToSats(amount)
    if (validAmount instanceof Error) return validAmount

    if (senderAccount.status !== AccountStatus.Active) {
      return new InvalidAccountStatusError()
    }
    const senderWallet = await getWalletFn(senderWalletId)
    if (senderWallet instanceof Error) return senderWallet

    if (senderWallet.accountId !== senderAccount.id) return new InvalidWalletId()

    if (recipientWalletId != null) {
      const recipientWallet = await getWalletFn(recipientWalletId)
      if (recipientWallet instanceof Error) return recipientWallet
      if (recipientWallet.id === senderWallet.id) return new SelfPaymentError()
      return {
        amount: validAmount,
        senderWallet,
        recipientWallet,
      }
    }

    return {
      amount: validAmount,
      senderWallet,
      recipientWallet: null,
    }
  }

  return {
    validatePaymentInput,
  }
}
