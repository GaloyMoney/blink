import { getServerSession } from "next-auth"

import {
  convertCentsToSats,
  createMemo,
  getWalletDetails,
  getWalletDetailsFromWalletId,
} from "@/utils/helpers"
import {
  createWithdrawLinkMutation,
  updateWithdrawLink,
  updateWithdrawLinkStatus,
} from "@/services/db"

import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { PaymentSendResult, Status, WalletCurrency } from "@/lib/graphql/generated"
import { getRealtimePriceQuery } from "@/services/galoy/query/get-real-time-price"
import { intraLedgerBtcPaymentSend } from "@/services/galoy/mutation/send-payment-intraledger/btc"
import { fetchUserData } from "@/services/galoy/query/me"
import { intraLedgerUsdPaymentSend } from "@/services/galoy/mutation/send-payment-intraledger/usd"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { amountCalculator } from "@/lib/amount-calculator"

import { env } from "@/env"
import { convertCurrency } from "@/lib/utils"

export const createWithdrawLink = async (
  _: undefined,
  args: {
    input: {
      salesAmountInCents: number
      walletId: string
      commissionPercentage: number
      displayVoucherPrice: string
      displayCurrency: string
    }
  },
) => {
  const { commissionPercentage, salesAmountInCents, walletId } = args.input
  const platformFeesInPpm = env.PLATFORM_FEES_IN_PPM
  const session = await getServerSession(authOptions)
  const userData = session?.userData
  if (!userData || !userData?.me?.defaultAccount?.wallets) {
    return new Error("Unauthorized")
  }

  if (salesAmountInCents <= 0) return new Error("Invalid sales amount")

  // amount that would be sent to escrow
  const voucherAmountAfterCommission = Number(
    amountCalculator
      .voucherAmountAfterCommission({
        voucherPrice: salesAmountInCents,
        commissionPercentage,
      })
      .toFixed(0),
  )

  // amount that would be sent to user
  const voucherAmountAfterPlatformFeesAndCommission = Number(
    amountCalculator.voucherAmountAfterPlatformFeesAndCommission
      .fromPrice({
        voucherPrice: salesAmountInCents,
        commissionPercentage,
        platformFeesInPpm,
      })
      .toFixed(0),
  )

  const platformFeeInCents = Number(
    amountCalculator
      .platformFeesAmount({
        voucherPrice: salesAmountInCents,
        platformFeesInPpm,
      })
      .toFixed(0),
  )

  if (
    voucherAmountAfterPlatformFeesAndCommission <= 0 ||
    voucherAmountAfterCommission <= 0
  )
    return new Error("Invalid Voucher Amount")

  if (commissionPercentage && commissionPercentage < 0)
    return new Error("Invalid commission percentage")

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

  const userWalletDetails = getWalletDetailsFromWalletId({
    wallets: userData.me?.defaultAccount.wallets,
    walletId,
  })

  if (!userWalletDetails) return new Error("Wallet not found")

  if (userWalletDetails.walletCurrency === WalletCurrency.Btc) {
    const realtimePrice = await getRealtimePriceQuery({ client: escrowClient })
    if (realtimePrice instanceof Error) return realtimePrice

    const voucherAmountAfterCommissionInSats = convertCentsToSats({
      response: realtimePrice,
      cents: voucherAmountAfterCommission,
    })
    return handleBtcWalletPayment({
      voucherAmountAfterPlatformFeesAndCommission,
      userWalletBalance: userWalletDetails.balance,
      voucherAmountAfterCommissionInSats,
      salesAmountInCents,
      commissionPercentage,
      platformFeeInCents,
      userId: userData.me?.id,
      escrowUsdWalletId: escrowUsdWallet.id,
      walletId,
      displayVoucherPrice: args.input.displayVoucherPrice,
      displayCurrency: args.input.displayCurrency,
      accessToken: session.accessToken,
    })
  } else if (userWalletDetails.walletCurrency === WalletCurrency.Usd) {
    return handleUsdWalletPayment({
      voucherAmountAfterPlatformFeesAndCommission,
      userWalletBalance: userWalletDetails.balance,
      voucherAmountAfterCommission,
      salesAmountInCents,
      commissionPercentage,
      platformFeeInCents,
      accessToken: session.accessToken,
      escrowUsdWalletId: escrowUsdWallet.id,
      walletId,
      userId: userData.me?.id,
      displayVoucherPrice: args.input.displayVoucherPrice,
      displayCurrency: args.input.displayCurrency,
    })
  } else {
    return new Error("Invalid wallet Id for user")
  }
}

export const handleUsdWalletPayment = async ({
  voucherAmountAfterPlatformFeesAndCommission,
  userWalletBalance,
  voucherAmountAfterCommission,
  salesAmountInCents,
  commissionPercentage,
  platformFeeInCents,
  accessToken,
  escrowUsdWalletId,
  walletId,
  userId,
  displayVoucherPrice,
  displayCurrency,
}: {
  voucherAmountAfterPlatformFeesAndCommission: number
  userWalletBalance: number
  voucherAmountAfterCommission: number
  salesAmountInCents: number
  commissionPercentage: number
  platformFeeInCents: number
  accessToken: string
  escrowUsdWalletId: string
  walletId: string
  userId: string
  displayVoucherPrice: string
  displayCurrency: string
}) => {
  if (voucherAmountAfterCommission > userWalletBalance)
    return new Error("amount is more than wallet balance")

  const createWithdrawLinkResponse = await createWithdrawLinkMutation({
    commissionPercentage,
    voucherAmountInCents: voucherAmountAfterPlatformFeesAndCommission,
    salesAmountInCents,
    userId,
    platformFee: platformFeeInCents,
    displayVoucherPrice,
    displayCurrency,
  })
  if (createWithdrawLinkResponse instanceof Error) return createWithdrawLinkResponse

  const usdPaymentResponse = await intraLedgerUsdPaymentSend({
    token: accessToken,
    amount: voucherAmountAfterCommission,
    memo: createMemo({
      voucherAmountInCents: voucherAmountAfterPlatformFeesAndCommission,
      commissionPercentage,
      identifierCode: createWithdrawLinkResponse.identifierCode,
    }),
    recipientWalletId: escrowUsdWalletId,
    walletId,
  })
  if (usdPaymentResponse instanceof Error) return usdPaymentResponse
  if (usdPaymentResponse.intraLedgerUsdPaymentSend.errors.length > 0)
    return new Error(usdPaymentResponse.intraLedgerUsdPaymentSend.errors[0].message)

  if (usdPaymentResponse.intraLedgerUsdPaymentSend.status === PaymentSendResult.Success) {
    const response = await updateWithdrawLinkStatus({
      id: createWithdrawLinkResponse.id,
      status: Status.Active,
    })
    return response
  }

  return new Error("Payment failed")
}

export const handleBtcWalletPayment = async ({
  voucherAmountAfterPlatformFeesAndCommission,
  userWalletBalance,
  voucherAmountAfterCommissionInSats,
  salesAmountInCents,
  commissionPercentage,
  platformFeeInCents,
  userId,
  escrowUsdWalletId,
  walletId,
  displayVoucherPrice,
  displayCurrency,
  accessToken,
}: {
  voucherAmountAfterPlatformFeesAndCommission: number
  userWalletBalance: number
  voucherAmountAfterCommissionInSats: number
  salesAmountInCents: number
  commissionPercentage: number
  platformFeeInCents: number
  userId: string
  escrowUsdWalletId: string
  walletId: string
  displayVoucherPrice: string
  displayCurrency: string
  accessToken: string
}) => {
  if (voucherAmountAfterCommissionInSats > userWalletBalance)
    return new Error("amount is more than wallet balance")

  const createWithdrawLinkResponse = await createWithdrawLinkMutation({
    commissionPercentage,
    voucherAmountInCents: voucherAmountAfterPlatformFeesAndCommission,
    salesAmountInCents,
    userId,
    platformFee: platformFeeInCents,
    displayVoucherPrice,
    displayCurrency,
  })

  if (createWithdrawLinkResponse instanceof Error) return createWithdrawLinkResponse

  const btcPaymentResponse = await intraLedgerBtcPaymentSend({
    token: accessToken,
    amount: voucherAmountAfterCommissionInSats,
    memo: createMemo({
      voucherAmountInCents: voucherAmountAfterPlatformFeesAndCommission,
      commissionPercentage,
      identifierCode: createWithdrawLinkResponse.identifierCode,
    }),
    recipientWalletId: escrowUsdWalletId,
    walletId,
  })
  if (btcPaymentResponse instanceof Error) return btcPaymentResponse
  if (btcPaymentResponse.intraLedgerPaymentSend.errors.length > 0)
    return new Error(btcPaymentResponse.intraLedgerPaymentSend.errors[0].message)

  // TODO handle case if settlementDisplayCurrency is changed for some reason
  if (
    !btcPaymentResponse.intraLedgerPaymentSend.transaction?.settlementDisplayAmount ||
    btcPaymentResponse.intraLedgerPaymentSend.transaction.settlementDisplayCurrency !==
      "USD"
  ) {
    console.error("error while verifying Settlement Amount and Settlement Currency")
    return new Error("Something went wrong, please contact support if error persists")
  }

  const amountPaidToEscrowInCents = convertCurrency.usdToCents({
    usd: Math.abs(
      btcPaymentResponse.intraLedgerPaymentSend.transaction?.settlementDisplayAmount,
    ),
  })

  const voucherAmountInCents = Number(
    amountCalculator.voucherAmountAfterPlatformFeesAndCommission
      .fromCommission({
        voucherPrice: salesAmountInCents,
        platformFeesInPpm: env.PLATFORM_FEES_IN_PPM,
        voucherAmountAfterCommission: amountPaidToEscrowInCents,
      })
      .toFixed(0),
  )

  if (btcPaymentResponse.intraLedgerPaymentSend.status === PaymentSendResult.Success) {
    const response = await updateWithdrawLink({
      id: createWithdrawLinkResponse.id,
      updates: {
        status: Status.Active,
        voucherAmountInCents: voucherAmountInCents,
      },
    })
    return response
  }

  return new Error("Payment failed")
}
