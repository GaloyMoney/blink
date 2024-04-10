import { convertCentsToSats, createMemo, getWalletDetails } from "@/utils/helpers"
import {
  createWithdrawLinkMutation,
  getWithdrawLinksByUserIdQuery,
  updateWithdrawLinkStatus,
  getWithdrawLinkBySecret,
} from "@/services/db"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import {
  RedeemWithdrawLinkOnChainResultStatus,
  PaymentSendResult,
  PayoutSpeed,
  Status,
  Wallet,
  WalletCurrency,
} from "@/lib/graphql/generated"
import { getRealtimePriceQuery } from "@/services/galoy/query/get-real-time-price"
import { intraLedgerBtcPaymentSend } from "@/services/galoy/mutation/send-payment-intraledger/btc"
import { fetchUserData } from "@/services/galoy/query/me"
import { intraLedgerUsdPaymentSend } from "@/services/galoy/mutation/send-payment-intraledger/usd"
import { escrowApolloClient } from "@/services/galoy/client/escrow"
import { onChainUsdTxFee } from "@/services/galoy/query/on-chain-usd-tx-fee"
import { onChainUsdPaymentSend } from "@/services/galoy/mutation/on-chain-payment-sned"

const resolvers = {
  Query: {
    getWithdrawLink: async (_: undefined, args: { voucherSecret: string }) => {
      const { voucherSecret } = args
      if (!isValidVoucherSecret(voucherSecret)) {
        return new Error("Invalid voucher secret")
      }
      const res = await getWithdrawLinkBySecret({ voucherSecret })
      return res
    },

    getWithdrawLinksByUserId: async (
      _: undefined,
      args: {
        status?: string
        limit?: number
        offset?: number
      },
    ) => {
      const { status, limit, offset } = args

      const session = await getServerSession(authOptions)
      const userData = session?.userData
      if (!userData || !userData?.me?.defaultAccount?.wallets) {
        return new Error("Unauthorized")
      }

      const data = await getWithdrawLinksByUserIdQuery({
        userId: userData.me.id,
        status,
        limit,
        offset,
      })
      if (data instanceof Error) {
        return new Error("Internal server error")
      }
      return data
    },
  },

  Mutation: {
    createWithdrawLink: async (
      _: undefined,
      args: {
        input: {
          voucherAmountInCents: number
          walletId: string
          commissionPercentage: number
        }
      },
    ) => {
      const { commissionPercentage, voucherAmountInCents, walletId } = args.input

      const session = await getServerSession(authOptions)
      const userData = session?.userData
      if (!userData || !userData?.me?.defaultAccount?.wallets) {
        return new Error("Unauthorized")
      }

      if (voucherAmountInCents <= 0) return new Error("Invalid Voucher Amount")
      if (commissionPercentage && commissionPercentage < 0)
        return new Error("Invalid commission percentage")

      const escrowClient = escrowApolloClient()
      const escrowData = await fetchUserData({ client: escrowClient })

      if (escrowData instanceof Error) return escrowData

      const { usdWallet: escrowUsdWallet } = getWalletDetails({
        wallets: escrowData.me?.defaultAccount.wallets as Wallet[],
      })

      if (!escrowUsdWallet || !escrowUsdWallet.id)
        return new Error("Internal Server Error")

      const salesAmountInCents = calculateSalesAmount({
        commissionPercentage,
        voucherAmount: voucherAmountInCents,
      })

      const userWalletDetails = getWalletDetailsFromWalletId({
        wallets: userData.me?.defaultAccount.wallets as Wallet[],
        walletId,
      })

      if (!userWalletDetails) return new Error("Wallet not found")

      if (userWalletDetails.walletCurrency === WalletCurrency.Btc) {
        const realtimePrice = await getRealtimePriceQuery({ client: escrowClient })

        if (realtimePrice instanceof Error) return realtimePrice

        const amountInSats = convertCentsToSats({
          response: realtimePrice,
          cents: voucherAmountInCents,
        })

        if (amountInSats > userWalletDetails.balance)
          return new Error("amount is more than wallet balance")

        const createWithdrawLinkResponse = await createWithdrawLinkMutation({
          commissionPercentage,
          voucherAmountInCents,
          salesAmountInCents,
          userId: userData.me.id,
        })

        if (createWithdrawLinkResponse instanceof Error) return createWithdrawLinkResponse

        const btcPaymentResponse = await intraLedgerBtcPaymentSend({
          token: session.accessToken,
          amount: amountInSats,
          memo: createMemo({
            voucherAmountInCents,
            commissionPercentage,
            identifierCode: createWithdrawLinkResponse.identifierCode,
          }),
          recipientWalletId: escrowUsdWallet?.id,
          walletId: walletId,
        })

        if (btcPaymentResponse instanceof Error) return btcPaymentResponse

        if (btcPaymentResponse.intraLedgerPaymentSend.errors.length > 0)
          return new Error(btcPaymentResponse.intraLedgerPaymentSend.errors[0].message)

        if (
          btcPaymentResponse.intraLedgerPaymentSend.status === PaymentSendResult.Success
        ) {
          const response = await updateWithdrawLinkStatus({
            id: createWithdrawLinkResponse.id,
            status: Status.Active,
          })
          return response
        }

        return new Error("Payment failed")
      } else if (userWalletDetails.walletCurrency === WalletCurrency.Usd) {
        if (voucherAmountInCents > userWalletDetails.balance)
          return new Error("amount is more than wallet balance")

        const createWithdrawLinkResponse = await createWithdrawLinkMutation({
          commissionPercentage,
          voucherAmountInCents,
          salesAmountInCents,
          userId: userData.me.id,
        })

        if (createWithdrawLinkResponse instanceof Error) return createWithdrawLinkResponse

        const usdPaymentResponse = await intraLedgerUsdPaymentSend({
          token: session.accessToken,
          amount: voucherAmountInCents,
          memo: createMemo({
            voucherAmountInCents,
            commissionPercentage,
            identifierCode: createWithdrawLinkResponse.identifierCode,
          }),
          recipientWalletId: escrowUsdWallet?.id,
          walletId: walletId,
        })

        if (usdPaymentResponse instanceof Error) return usdPaymentResponse

        if (usdPaymentResponse.intraLedgerUsdPaymentSend.errors.length > 0)
          return new Error(usdPaymentResponse.intraLedgerUsdPaymentSend.errors[0].message)

        if (
          usdPaymentResponse.intraLedgerUsdPaymentSend.status ===
          PaymentSendResult.Success
        ) {
          const response = await updateWithdrawLinkStatus({
            id: createWithdrawLinkResponse.id,
            status: Status.Active,
          })
          return response
        }

        return new Error("Payment failed")
      } else {
        return new Error("Invalid wallet Id for user")
      }
    },
    redeemWithdrawLinkOnChain: async (
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

      const { usdWallet: escrowUsdWallet } = getWalletDetails({
        wallets: escrowData.me?.defaultAccount.wallets as Wallet[],
      })

      if (!escrowUsdWallet || !escrowUsdWallet.id)
        return new Error("Internal Server Error")

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

      if (
        onChainUsdTxFeeResponse.onChainUsdTxFee.amount >=
        getWithdrawLinkBySecretResponse.voucherAmountInCents
      )
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
          amount: getWithdrawLinkBySecretResponse.voucherAmountInCents,
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
        onChainUsdPaymentSendResponse.onChainUsdPaymentSend.status ===
        PaymentSendResult.Success
      ) {
        return {
          status: RedeemWithdrawLinkOnChainResultStatus.Success,
          message: "Payment successful",
        }
      }
    },
  },
}

export default resolvers

const getWalletDetailsFromWalletId = ({
  wallets,
  walletId,
}: {
  wallets: Wallet[]
  walletId: string
}) => {
  return wallets.find((wallet) => wallet.id === walletId)
}

function calculateSalesAmount({
  commissionPercentage,
  voucherAmount,
}: {
  commissionPercentage: number
  voucherAmount: number
}) {
  return voucherAmount / (1 - commissionPercentage / 100)
}

const isValidVoucherSecret = (voucherSecret: string) => {
  if (!voucherSecret) {
    return false
  }

  if (voucherSecret.length !== 12) {
    return false
  }

  if (!voucherSecret.match(/^[0-9a-zA-Z]+$/)) {
    return false
  }

  return true
}
