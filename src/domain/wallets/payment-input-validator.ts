import { checkedToSats } from "@domain/bitcoin"
import { checkedToWalletId } from "@domain/wallets"
import {
  SelfPaymentError,
  InvalidWalletId,
  InvalidAccountStatusError,
} from "@domain/errors"
import { AccountStatus } from "@domain/accounts"

export const PaymentInputValidator = (
  getWalletFn: PaymentInputValidatorConfig,
): PaymentInputValidator => {
  const validateSender = async ({
    amount,
    senderWalletId: uncheckedSenderWalletId,
    senderAccount,
  }: ValidatePaymentInputSenderArgs) => {
    const validAmount = checkedToSats(amount)
    if (validAmount instanceof Error) return validAmount

    if (senderAccount.status !== AccountStatus.Active) {
      return new InvalidAccountStatusError()
    }

    const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
    if (senderWalletId instanceof Error) return senderWalletId

    const senderWallet = await getWalletFn(senderWalletId)
    if (senderWallet instanceof Error) return senderWallet

    if (senderWallet.accountId !== senderAccount.id) return new InvalidWalletId()

    return {
      amount: validAmount,
      senderWallet,
    }
  }

  const validateRecipient = async ({
    recipientWalletId: uncheckedRecipientWalletId,
    senderWallet,
  }: ValidatePaymentInputRecipientArgs) => {
    const recipientWalletId = checkedToWalletId(uncheckedRecipientWalletId)
    if (recipientWalletId instanceof Error) return recipientWalletId

    const recipientWallet = await getWalletFn(recipientWalletId)
    if (recipientWallet instanceof Error) return recipientWallet
    if (recipientWallet.id === senderWallet.id) return new SelfPaymentError()
    return { recipientWallet }
  }

  return {
    validateSender,
    validateRecipient,
  }
}
