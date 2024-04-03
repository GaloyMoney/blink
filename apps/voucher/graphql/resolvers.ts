import { errorArrayToString } from "@/utils/helpers"
import {
  getAllWithdrawLinksQuery,
  createWithdrawLinkMutation,
  updateWithdrawLinkMutation,
  deleteWithdrawLinkMutation,
  getWithdrawLinkByIdQuery,
  getWithdrawLinkByUniqueHashQuery,
  getWithdrawLinkByK1Query,
  getWithdrawLinkByPaymentHashQuery,
  getWithdrawLinksByUserIdQuery,
  updateWithdrawLinkStatus,
  getWithdrawLinkBySecret,
} from "@/services/db"
import {
  getOnChainTxFeeBTC,
  getOnChainTxFeeUSD,
  sendOnChainPaymentBTC,
  sendOnChainPaymentUSD,
} from "@/services/galoy"
// import { CustomError, createCustomError } from "@/utils/errorHandler";
// import { messageCode } from "@/utils/errorHandler";
//TODO need to send and handel errors

const resolvers = {
  Query: {
    getWithdrawLink: async (args: {
      id: string
      uniqueHash: string
      k1: string
      paymentHash: string
      secretCode: string
    }) => {
      const { id, uniqueHash, k1, paymentHash, secretCode } = args
      let data
      if (id) {
        data = await getWithdrawLinkByIdQuery({ id })
      } else if (uniqueHash) {
        data = await getWithdrawLinkByUniqueHashQuery({ uniqueHash })
      } else if (k1) {
        data = await getWithdrawLinkByK1Query({ k1 })
      } else if (paymentHash) {
        data = await getWithdrawLinkByPaymentHashQuery({ paymentHash })
      } else if (secretCode) {
        data = await getWithdrawLinkBySecret({ secretCode })
      } else {
        throw new Error("input not provided")
      }
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    getAllWithdrawLinks: async () => {
      const data = await getAllWithdrawLinksQuery()
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    getWithdrawLinksByUserId: async (args: {
      userId: string
      status: string
      limit: number
      offset: number
    }) => {
      const { userId, status, limit, offset } = args
      if (!userId) {
        throw new Error("userId is not provided")
      }
      const data = await getWithdrawLinksByUserIdQuery({ userId, status, limit, offset })
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    getOnChainPaymentFees: async (args: { id: string; btc_wallet_address: string }) => {
      const { id, btc_wallet_address } = args
      const data = await getWithdrawLinkByIdQuery({ id })
      const { escrowWallet, accountType, voucherAmount: amount } = data
      if (accountType === "BTC") {
        const result = await getOnChainTxFeeBTC(escrowWallet, btc_wallet_address, amount)
        const errorMessage = errorArrayToString(result.errors)
        if (errorMessage) {
          throw new Error(errorMessage)
        }
        return { fees: result.data.onChainTxFee.amount }
      } else {
        console.log("USD")
        const result = await getOnChainTxFeeUSD(escrowWallet, btc_wallet_address, amount)
        const errorMessage = errorArrayToString(result.errors)
        if (errorMessage) {
          throw new Error(errorMessage)
        }
        return { fees: result.data.onChainUsdTxFee.amount }
      }
    },
  },

  Mutation: {
    createWithdrawLink: async (args: {
      input: {
        paymentHash: string
        userId: string
        paymentRequest: string
        paymentSecret: string
        salesAmount: number
        accountType: string
        escrowWallet: string
        title: string
        voucherAmount: number
        uniqueHash: string
        k1: string
        commissionPercentage: number
      }
    }) => {
      const { input } = args
      const data = await createWithdrawLinkMutation({
        ...input,
      })
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    updateWithdrawLink: async (args: {
      id: string
      input: {
        paymentHash: string
        userId: string
        paymentRequest: string
        paymentSecret: string
        salesAmount: number
        accountType: string
        escrowWallet: string
        title: string
        voucherAmount: number
        uniqueHash: string
        k1: string
        commissionPercentage: number
      }
    }) => {
      const { id, input } = args
      if (!id) {
        throw new Error("id is not provided")
      }
      const data = await updateWithdrawLinkMutation({ id, input })
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    deleteWithdrawLink: async (args: { id: string }) => {
      const { id } = args
      if (!id) {
        throw new Error("id is not provided")
      }
      const data: any = await deleteWithdrawLinkMutation({ id })
      if (data instanceof Error) {
        throw new Error("Internal server error")
      }
      return data
    },
    sendPaymentOnChain: async (args: { id: string; btc_wallet_address: string }) => {
      const { id, btc_wallet_address } = args
      const data = await getWithdrawLinkByIdQuery({ id })
      const { escrowWallet, accountType, voucherAmount: amount, title, status } = data

      if (accountType === "BTC") {
        const fees_result = await getOnChainTxFeeBTC(
          escrowWallet,
          btc_wallet_address,
          amount,
        )
        const final_amount = amount - fees_result.data.onChainTxFee.amount
        if (final_amount <= 0) {
          throw new Error("Amount is less than fees")
        }
        if (status === "PAID") {
          throw new Error("Payment already sent")
        }
        await updateWithdrawLinkStatus({ id, status: "PAID" })
        const result = await sendOnChainPaymentBTC(
          escrowWallet,
          btc_wallet_address,
          final_amount,
          title,
        )
        const errorMessage = errorArrayToString(result.errors)
        if (errorMessage) {
          throw new Error(errorMessage)
        }
        return {
          status: result.data.onChainPaymentSend.status,
          amount: final_amount,
        }
      } else {
        const fees_result = await getOnChainTxFeeUSD(
          escrowWallet,
          btc_wallet_address,
          amount,
        )
        const final_amount = amount - fees_result.data.onChainUsdTxFee.amount
        if (final_amount <= 0) {
          throw new Error("Amount is less than fees")
        }
        if (status === "PAID") {
          throw new Error("Payment already sent")
        }
        await updateWithdrawLinkStatus({ id, status: "PAID" })
        const result = await sendOnChainPaymentUSD(
          escrowWallet,
          btc_wallet_address,
          final_amount,
          title,
        )
        const errorMessage = errorArrayToString(result.errors)
        if (errorMessage) {
          throw new Error(errorMessage)
        }
        return {
          status: result.data.onChainUsdPaymentSend.status,
          amount: final_amount,
        }
      }
    },
  },
}

export default resolvers
