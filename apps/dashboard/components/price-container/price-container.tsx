import React from "react";
import { Box } from "@mui/joy";
import PriceContainerCard from "./price-card-container";
export interface WalletData {
  id: string;
  walletCurrency: string;
  balance: number;
  pendingIncomingBalance: number;
}

export interface PriceContainerProps {
  defaultAccountId: string;
  accountDetails: WalletData[];
}

const PriceContainer: React.FC<PriceContainerProps> = ({ accountDetails }) => {
  const btcWallet = accountDetails.find(
    (wallet) => wallet.walletCurrency === "BTC"
  );
  const usdWallet = accountDetails.find(
    (wallet) => wallet.walletCurrency === "USD"
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
            balance={btcWallet.balance}
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
            balance={usdWallet.balance}
            pendingIncomingBalance={usdWallet.pendingIncomingBalance / 100}
            currencySymbol="USD"
          />
        )}
      </Box>
    </Box>
  );
};

export default PriceContainer;
