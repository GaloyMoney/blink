import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import { Payments } from "@app"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { InputValidationError } from "@graphql/error"
import CentAmount from "@graphql/types/scalar/cent-amount"
import { WalletCurrency } from "@domain/shared"
import { WalletsRepository } from "@services/mongoose"
import dedent from "dedent"

const LnNoAmountUsdInvoicePaymentInput = GT.Input({
  name: "LnNoAmountUsdInvoicePaymentInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description:
        "Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user.",
    },
    paymentRequest: {
      type: GT.NonNull(LnIPaymentRequest),
      description: "Payment request representing the invoice which is being paid.",
    },
    amount: { type: GT.NonNull(CentAmount), description: "Amount to pay in USD cents." },
    memo: {
      type: Memo,
      description: "Optional memo to associate with the lightning invoice.",
    },
  }),
})

const LnNoAmountUsdInvoicePaymentSendMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: EncodedPaymentRequest | InputValidationError
      amount: Satoshis | InputValidationError
      memo?: string | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
  Provided wallet must be USD and have sufficient balance to cover amount specified in mutation request.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(LnNoAmountUsdInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount, logger }) => {
    const { walletId, paymentRequest, amount, memo } = args.input

    if (walletId instanceof InputValidationError) {
      return { errors: [{ message: walletId.message }] }
    }
    if (paymentRequest instanceof InputValidationError) {
      return { errors: [{ message: paymentRequest.message }] }
    }
    if (amount instanceof InputValidationError) {
      return { errors: [{ message: amount.message }] }
    }
    if (memo instanceof InputValidationError) {
      return { errors: [{ message: memo.message }] }
    }

    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error)
      return { errors: [{ message: mapError(wallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (wallet.currency === WalletCurrency.Btc) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const status = await Payments.payNoAmountInvoiceByWalletId({
      senderWalletId: walletId,
      paymentRequest,
      memo: memo ?? null,
      amount,
      senderAccount: domainAccount,
      logger,
    })

    if (status instanceof Error) {
      const appErr = mapError(status)
      return { status: "failed", errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default LnNoAmountUsdInvoicePaymentSendMutation
