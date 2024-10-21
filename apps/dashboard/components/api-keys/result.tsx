import { useState } from "react"
import { Box, Typography, Tooltip, Button } from "@mui/joy"
import CopyIcon from "@mui/icons-material/CopyAll"

import BtcPayConnectionGroup from "./btc-pay-tabs"

type ApiKeyResultProps = {
  apiKeySecret: string
  btcWalletId: string | undefined
  usdWalletId: string | undefined
  onClose: () => void
}

const ApiKeyResult = ({
  apiKeySecret,
  btcWalletId,
  usdWalletId,
  onClose,
}: ApiKeyResultProps) => {
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  const handleCopyClick = () => {
    setApiKeyCopied(true)
    setTimeout(() => setApiKeyCopied(false), 2000)
    navigator.clipboard.writeText(apiKeySecret)
  }

  return (
    <>
      <ApiKeyDisplay
        apiKeySecret={apiKeySecret}
        onCopy={handleCopyClick}
        copied={apiKeyCopied}
      />
      {btcWalletId && usdWalletId && (
        <BtcPayConnectionGroup
          apiKeySecret={apiKeySecret}
          btcWalletId={btcWalletId}
          usdWalletId={usdWalletId}
        />
      )}
      <WarningMessage />
      <CloseButton onClick={onClose} />
    </>
  )
}

const ApiKeyDisplay = ({
  apiKeySecret,
  onCopy,
  copied,
}: {
  apiKeySecret: string
  onCopy: () => void
  copied: boolean
}) => (
  <Box
    sx={{
      maxWidth: "20em",
      display: "flex",
      alignItems: "center",
      width: "100%",
      columnGap: 2,
      backgroundColor: "neutral.solidDisabledBg",
      padding: "0.4em",
      borderRadius: "0.5em",
      wordBreak: "break-all",
    }}
  >
    <Typography sx={{ fontSize: "0.82em" }} fontFamily="monospace">
      {apiKeySecret}
    </Typography>
    <Tooltip
      sx={{ cursor: "pointer", position: "relative", fontSize: "1.1em" }}
      open={copied}
      title="Copied to Clipboard"
      variant="plain"
      onClick={onCopy}
    >
      <CopyIcon />
    </Tooltip>
  </Box>
)

const WarningMessage = () => (
  <Typography
    sx={{
      p: "1em",
      borderRadius: "0.5em",
    }}
    variant="outlined"
    color="success"
    fontSize={14}
  >
    The API Key Secret will be shown only once here.
    <br /> Please save it somewhere safely!
  </Typography>
)

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    data-testid="create-api-close-btn"
    variant="outlined"
    color="primary"
    onClick={onClick}
    sx={{ width: "100%" }}
  >
    Close
  </Button>
)

export default ApiKeyResult
