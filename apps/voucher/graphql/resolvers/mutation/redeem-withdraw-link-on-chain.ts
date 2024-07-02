import { createMemo, getWalletDetails, isValidVoucherSecret } from "@/utils/helpers"
import { updateWithdrawLinkStatus, getWithdrawLinkBySecret } from "@/services/db"

import {
  RedeemWithdrawLinkOnChainResultStatus,
  PaymentSendResult,
  PayoutSpeed,
  Status,
} from "@/lib/graphql/generated"
import { fetchUserData } from "@/services/galoy/query/me"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { onChainUsdTxFee } from "@/services/galoy/query/on-chain-usd-tx-fee"
import { onChainUsdPaymentSend } from "@/services/galoy/mutation/on-chain-payment-sned"

export const redeemWithdrawLinkOnChain = async (
  _: undefined,
  args: {
    input: {
      voucherSecret: string
      onChainAddress: string
    }
  },
) => {
  const { voucherSecret, onChainAddress } = args.input
  if (!isValidVoucherSecret(voucherSecret)) {
    return new Error("Invalid voucher secret")
  }

  const escrowClient = escrowApolloClient()
  const escrowData = await fetchUserData({ client: escrowClient })

  if (escrowData instanceof Error) return escrowData
  if (!escrowData.me?.defaultAccount.wallets) {
    return new Error("Internal Server Error")
  }

  const { usdWallet: escrowUsdWallet } = getWalletDetails({
    wallets: escrowData.me?.defaultAccount.wallets,
  })
  if (!escrowUsdWallet || !escrowUsdWallet.id) return new Error("Internal Server Error")

  const getWithdrawLinkBySecretResponse = await getWithdrawLinkBySecret({
    voucherSecret,
  })
  if (getWithdrawLinkBySecretResponse instanceof Error)
    return getWithdrawLinkBySecretResponse

  if (!getWithdrawLinkBySecretResponse) {
    return new Error("Withdraw link not found")
  }

  if (getWithdrawLinkBySecretResponse.status === Status.Paid) {
    return new Error("Withdraw link claimed")
  }

  const onChainUsdTxFeeResponse = await onChainUsdTxFee({
    client: escrowClient,
    input: {
      address: onChainAddress,
      amount: getWithdrawLinkBySecretResponse.voucherAmountInCents,
      walletId: escrowUsdWallet?.id,
      speed: PayoutSpeed.Fast,
    },
  })

  if (onChainUsdTxFeeResponse instanceof Error) return onChainUsdTxFeeResponse
  const totalAmountToBePaid =
    getWithdrawLinkBySecretResponse.voucherAmountInCents -
    onChainUsdTxFeeResponse.onChainUsdTxFee.amount

  if (totalAmountToBePaid <= 0)
    return new Error("This Voucher Cannot Withdraw On Chain amount is less than fees")

  const response = await updateWithdrawLinkStatus({
    id: getWithdrawLinkBySecretResponse.id,
    status: Status.Paid,
  })

  if (response instanceof Error) return response

  const onChainUsdPaymentSendResponse = await onChainUsdPaymentSend({
    client: escrowClient,
    input: {
      address: onChainAddress,
      amount: totalAmountToBePaid,
      memo: createMemo({
        voucherAmountInCents: getWithdrawLinkBySecretResponse.voucherAmountInCents,
        commissionPercentage: getWithdrawLinkBySecretResponse.commissionPercentage,
        identifierCode: getWithdrawLinkBySecretResponse.identifierCode,
      }),
      speed: PayoutSpeed.Fast,
      walletId: escrowUsdWallet?.id,
    },
  })

  if (onChainUsdPaymentSendResponse instanceof Error) {
    await updateWithdrawLinkStatus({
      id: getWithdrawLinkBySecretResponse.id,
      status: Status.Active,
    })
    return onChainUsdPaymentSendResponse
  }

  if (onChainUsdPaymentSendResponse.onChainUsdPaymentSend.errors.length > 0) {
    await updateWithdrawLinkStatus({
      id: getWithdrawLinkBySecretResponse.id,
      status: Status.Active,
    })
    return new Error(
      onChainUsdPaymentSendResponse.onChainUsdPaymentSend.errors[0].message,
    )
  }

  if (
    onChainUsdPaymentSendResponse.onChainUsdPaymentSend.status !==
    PaymentSendResult.Success
  ) {
    await updateWithdrawLinkStatus({
      id: getWithdrawLinkBySecretResponse.id,
      status: Status.Active,
    })
    return new Error(
      `Transaction not successful got status ${onChainUsdPaymentSendResponse.onChainUsdPaymentSend.status}`,
    )
  }

  if (
    onChainUsdPaymentSendResponse.onChainUsdPaymentSend.status ===
    PaymentSendResult.Success
  ) {
    return {
      status: RedeemWithdrawLinkOnChainResultStatus.Success,
      message: "Payment successful",
    }
  }
}
