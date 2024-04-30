import React, { useState } from "react"
import Box from "@mui/joy/Box"
import Typography from "@mui/joy/Typography"
import Tooltip from "@mui/joy/Tooltip"
import CopyIcon from "@mui/icons-material/CopyAll"

type Props = {
  apiKeySecret: string
  btcWalletId: string
  usdWalletId: string
}

const BtcPayConnectionGroup = ({ apiKeySecret, btcWalletId, usdWalletId }: Props) => {
  const [btcPayCopiedUsdWallet, setBtcPayCopiedUsdWallet] = useState(false)
  const [btcPayCopiedBtcWallet, setBtcPayCopiedBtcWallet] = useState(false)

  const handleBtcPayCopy = (walletId: string, walletType: string) => {
    if (walletType === "BTC") {
      setBtcPayCopiedBtcWallet(true)
      setTimeout(() => {
        setBtcPayCopiedBtcWallet(false)
      }, 2000)
    } else {
      setBtcPayCopiedUsdWallet(true)
      setTimeout(() => {
        setBtcPayCopiedUsdWallet(false)
      }, 2000)
    }
    navigator.clipboard.writeText(
      `type=blink;server=https://api.blink.sv/graphql;api-key=${apiKeySecret};wallet-id=${walletId}`,
    )
  }

  const renderConnectionStringBox = ({
    walletId,
    walletType,
  }: {
    walletId: string
    walletType: string
  }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: "neutral.solidDisabledBg",
        padding: "0.5em",
        borderRadius: "0.5em",
      }}
    >
      <Typography>BTCPay connection string {walletType} Wallet</Typography>
      <Tooltip
        title="Copied to Clipboard"
        open={walletType === "BTC" ? btcPayCopiedBtcWallet : btcPayCopiedUsdWallet}
        onClick={() => handleBtcPayCopy(walletId, walletType)}
        sx={{
          cursor: "pointer",
        }}
      >
        <CopyIcon
          sx={{
            fontSize: "1.2em",
          }}
        />
      </Tooltip>
    </Box>
  )

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1em",
      }}
    >
      {renderConnectionStringBox({
        walletId: btcWalletId,
        walletType: "BTC",
      })}
      {renderConnectionStringBox({
        walletId: usdWalletId,
        walletType: "USD",
      })}
    </Box>
  )
}

export default BtcPayConnectionGroup
