import React from "react"
import Card from "@mui/joy/Card"
import CardContent from "@mui/joy/CardContent"
import Typography from "@mui/joy/Typography"
import { Box } from "@mui/joy"

export interface WalletBalanceCardProps {
  id: string
  walletCurrency: string
  balance: number
  pendingIncomingBalance: number
  currencySymbol: string
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  id,
  walletCurrency,
  balance,
  pendingIncomingBalance,
  currencySymbol,
}) => (
  <Card
    key={id}
    sx={{
      minWidth: { xs: "100%", md: "49%" },
      boxShadow: "md",
    }}
  >
    <CardContent>
      <Typography
        level="body-md"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography>{walletCurrency}</Typography>
      </Typography>
      <Typography level="h2">
        {balance} {currencySymbol}
      </Typography>
      <Typography level="body-sm">Pending Amount {pendingIncomingBalance}</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5em",
          justifyContent: "space-between",
          padding: "0.4em",
          borderRadius: "0.5em",
          backgroundColor: "neutral.solidDisabledBg",
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
          }}
          level="body-xs"
        >
          Wallet Id
        </Typography>
        <Typography
          sx={{
            fontWeight: "560",
          }}
          level="body-sm"
        >
          {" "}
          {id}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

export default WalletBalanceCard
