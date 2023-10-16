import React from "react";
import { Box } from "@mui/joy";
import PriceContainerCard from "./price-card-container";
export interface WalletData {
  __typename: string;
  accountId: string;
  balance: number;
  id: string;
  pendingIncomingBalance: number;
  walletCurrency: "BTC" | "USD";
}

export interface PriceContainerProps {
  walletDetails: ReadonlyArray<WalletData>;
}

const PriceContainer: React.FC<PriceContainerProps> = ({ walletDetails }) => {
  const btcWallet = walletDetails.find(
    (wallet) => wallet.walletCurrency === "BTC",
  );
  const usdWallet = walletDetails.find(
    (wallet) => wallet.walletCurrency === "USD",
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: "1em",
          flexWrap: "wrap",
        }}
      >
        {btcWallet && (
          <PriceContainerCard
            id={btcWallet.id}
            walletCurrency={btcWallet.walletCurrency}
            balance={btcWallet.balance / 100000000}
            pendingIncomingBalance={
              btcWallet.pendingIncomingBalance / 100000000
            }
            currencySymbol="BTC"
          />
        )}
        {usdWallet && (
          <PriceContainerCard
            id={usdWallet.id}
            walletCurrency={usdWallet.walletCurrency}
            balance={usdWallet.balance / 100}
            pendingIncomingBalance={usdWallet.pendingIncomingBalance / 100}
            currencySymbol="USD"
          />
        )}
      </Box>
    </Box>
  );
};

export default PriceContainer;
