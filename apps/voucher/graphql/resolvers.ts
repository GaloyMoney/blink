import { errorArrayToString } from "@/utils/helpers";
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
  GetWithdrawLinkBySecret,
} from "../utils/crud";
import {
  getOnChainTxFeeBTC,
  getOnChainTxFeeUSD,
  sendOnChainPaymentBTC,
  sendOnChainPaymentUSD,
} from "@/services/galoy";
// import { CustomError, createCustomError } from "@/utils/errorHandler";
// import { messageCode } from "@/utils/errorHandler";
//TODO need to send and handel errors

const resolvers = {
  Query: {
    getWithdrawLink: async (parent: any, args: any, context: any) => {
      const { id, unique_hash, k1, payment_hash, secret_code } = args;
      let data;
      if (id) {
        data = await getWithdrawLinkByIdQuery(id);
      } else if (unique_hash) {
        data = await getWithdrawLinkByUniqueHashQuery(unique_hash);
      } else if (k1) {
        data = await getWithdrawLinkByK1Query(k1);
      } else if (payment_hash) {
        data = await getWithdrawLinkByPaymentHashQuery(payment_hash);
      } else if (secret_code) {
        data = await GetWithdrawLinkBySecret(secret_code);
      } else {
        throw new Error("input not provided");
      }
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    getAllWithdrawLinks: async (parent: any, args: any, context: any) => {
      const data = await getAllWithdrawLinksQuery();
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    getWithdrawLinksByUserId: async (parent: any, args: any, context: any) => {
      const { user_id, status, limit, offset } = args;
      if (!user_id) {
        throw new Error("user_id is not provided");
      }
      const data = await getWithdrawLinksByUserIdQuery(
        user_id,
        status,
        limit,
        offset
      );
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    getOnChainPaymentFees: async (parent: any, args: any, context: any) => {
      const { id, btc_wallet_address } = args;
      const data = await getWithdrawLinkByIdQuery(id);
      const { escrow_wallet, account_type, voucher_amount: amount } = data;
      if (account_type === "BTC") {
        const result = await getOnChainTxFeeBTC(
          escrow_wallet,
          btc_wallet_address,
          amount
        );
        const errorMessage = errorArrayToString(result.errors);
        if (errorMessage) {
          throw new Error(errorMessage);
        }
        return { fees: result.data.onChainTxFee.amount };
      } else {
        console.log("USD");
        const result = await getOnChainTxFeeUSD(
          escrow_wallet,
          btc_wallet_address,
          amount
        );
        const errorMessage = errorArrayToString(result.errors);
        if (errorMessage) {
          throw new Error(errorMessage);
        }
        return { fees: result.data.onChainUsdTxFee.amount };
      }
    },
  },

  Mutation: {
    createWithdrawLink: async (parent: any, args: any, context: any) => {
      const { input } = args;
      const data = await createWithdrawLinkMutation(input);
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    updateWithdrawLink: async (parent: any, args: any, context: any) => {
      const { id, input } = args;
      if (!id) {
        throw new Error("id is not provided");
      }
      const data = await updateWithdrawLinkMutation(id, input);
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    deleteWithdrawLink: async (parent: any, args: any, context: any) => {
      const { id } = args;
      if (!id) {
        throw new Error("id is not provided");
      }
      const data: any = await deleteWithdrawLinkMutation(id);
      if (data instanceof Error) {
        throw new Error("Internal server error");
      }
      return data;
    },
    sendPaymentOnChain: async (parent: any, args: any, context: any) => {
      const { id, btc_wallet_address } = args;
      const data = await getWithdrawLinkByIdQuery(id);
      const {
        escrow_wallet,
        account_type,
        voucher_amount: amount,
        title,
        status,
      } = data;

      if (account_type === "BTC") {
        const fees_result = await getOnChainTxFeeBTC(
          escrow_wallet,
          btc_wallet_address,
          amount
        );
        const final_amount = amount - fees_result.data.onChainTxFee.amount;
        if (final_amount <= 0) {
          throw new Error("Amount is less than fees");
        }
        if (status === "PAID") {
          throw new Error("Payment already sent");
        }
        await updateWithdrawLinkStatus(id, "PAID");
        const result = await sendOnChainPaymentBTC(
          escrow_wallet,
          btc_wallet_address,
          final_amount,
          title
        );
        const errorMessage = errorArrayToString(result.errors);
        if (errorMessage) {
          throw new Error(errorMessage);
        }
        return {
          status: result.data.onChainPaymentSend.status,
          amount: final_amount,
        };
      } else {
        const fees_result = await getOnChainTxFeeUSD(
          escrow_wallet,
          btc_wallet_address,
          amount
        );
        const final_amount = amount - fees_result.data.onChainUsdTxFee.amount;
        if (final_amount <= 0) {
          throw new Error("Amount is less than fees");
        }
        if (status === "PAID") {
          throw new Error("Payment already sent");
        }
        await updateWithdrawLinkStatus(id, "PAID");
        const result = await sendOnChainPaymentUSD(
          escrow_wallet,
          btc_wallet_address,
          final_amount,
          title
        );
        const errorMessage = errorArrayToString(result.errors);
        if (errorMessage) {
          throw new Error(errorMessage);
        }
        return {
          status: result.data.onChainUsdPaymentSend.status,
          amount: final_amount,
        };
      }
    },
  },
};

export default resolvers;
