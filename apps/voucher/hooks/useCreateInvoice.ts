import { useState } from "react";
import {
  useLnInvoiceCreateOnBehalfOfRecipientMutation,
  useLnUsdInvoiceCreateOnBehalfOfRecipientMutation,
} from "@/utils/generated/graphql";
import { env } from "@/env";
const { NEXT_PUBLIC_ESCROW_WALLET_BTC, NEXT_PUBLIC_ESCROW_WALLET_USD } = env;

interface Props {
  recipientWalletCurrency: string;
}

export const useCreateInvoice = ({ recipientWalletCurrency }: Props) => {
  const currency = recipientWalletCurrency;

  const [
    createLnInvoice,
    { loading: lnBTCInvoiceLoading, error: lnBTCInvoiceError },
  ] = useLnInvoiceCreateOnBehalfOfRecipientMutation();

  const [
    createLnUsdInvoice,
    { loading: lnUSDInvoiceLoading, error: lnUSDInvoiceError },
  ] = useLnUsdInvoiceCreateOnBehalfOfRecipientMutation();

  const handleCreateInvoice = async (amount: number, memo: string) => {
    if (currency === "USD") {
      const result = await createLnUsdInvoice({
        variables: {
          input: {
            recipientWalletId: `${NEXT_PUBLIC_ESCROW_WALLET_USD}`,
            amount: amount,
            memo: memo,
          },
        },
        context: {
          endpoint: "MAINNET",
        },
      });

      return {
        data: result.data?.lnUsdInvoiceCreateOnBehalfOfRecipient.invoice,
        error: result.data?.lnUsdInvoiceCreateOnBehalfOfRecipient.errors,
      };
    } else {
      const result = await createLnInvoice({
        variables: {
          input: {
            recipientWalletId: `${NEXT_PUBLIC_ESCROW_WALLET_BTC}`,
            amount: amount,
            memo: memo,
          },
        },
        context: {
          endpoint: "MAINNET",
        },
      });
      return {
        data: result.data?.lnInvoiceCreateOnBehalfOfRecipient.invoice,
        error: result.data?.lnInvoiceCreateOnBehalfOfRecipient.errors,
      };
    }
  };

  return {
    handleCreateInvoice,
    loading: currency === "BTC" ? lnBTCInvoiceLoading : lnUSDInvoiceLoading,
    error: currency === "BTC" ? lnBTCInvoiceError : lnUSDInvoiceError,
  };
};
