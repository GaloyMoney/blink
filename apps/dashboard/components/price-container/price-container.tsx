import React from "react"
import { Box } from "@mui/joy"

import PriceContainerCard from "./price-card-container"

export interface WalletData {
  __typename: string
  accountId: string
  balance: number
  id: string
  pendingIncomingBalance: number
  walletCurrency: "BTC" | "USD"
}

export interface PriceContainerProps {
  walletDetails: ReadonlyArray<WalletData>
}

const formatBalance = (
  balance: number,
  walletCurrency: "BTC" | "USD",
): [number, string] => {
  if (walletCurrency === "BTC") {
    const btcBalance = balance / 100000000
    if (btcBalance < 0.00001) {
      return [balance, "sats"]
    } else {
      return [btcBalance, "BTC"]
    }
  } else {
    const usdBalance = balance / 100
    return [usdBalance, "USD"]
  }
}

const PriceContainer: React.FC<PriceContainerProps> = ({ walletDetails }) => {
  const btcWallet = walletDetails.find((wallet) => wallet.walletCurrency === "BTC")
  const usdWallet = walletDetails.find((wallet) => wallet.walletCurrency === "USD")

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
        {btcWallet &&
          (() => {
            const [balance, currencySymbol] = formatBalance(
              btcWallet.balance,
              btcWallet.walletCurrency,
            )
            const [pendingBalance] = formatBalance(
              btcWallet.pendingIncomingBalance,
              btcWallet.walletCurrency,
            )
            return (
              <PriceContainerCard
                id={btcWallet.id}
                walletCurrency={btcWallet.walletCurrency}
                balance={balance}
                pendingIncomingBalance={pendingBalance}
                currencySymbol={currencySymbol}
              />
            )
          })()}
        {usdWallet &&
          (() => {
            const [balance, currencySymbol] = formatBalance(
              usdWallet.balance,
              usdWallet.walletCurrency,
            )
            const [pendingBalance] = formatBalance(
              usdWallet.pendingIncomingBalance,
              usdWallet.walletCurrency,
            )
            return (
              <PriceContainerCard
                id={usdWallet.id}
                walletCurrency={usdWallet.walletCurrency}
                balance={balance}
                pendingIncomingBalance={pendingBalance}
                currencySymbol={currencySymbol}
              />
            )
          })()}
      </Box>
    </Box>
  )
}

export default PriceContainer
