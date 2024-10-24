import { Modal, Sheet, ModalClose, Typography } from "@mui/joy"

import ApiKeyForm from "./form"
import ApiKeyResult from "./result"

import { ApiKeyResponse } from "@/app/api-keys/api-key.types"

type ApiKeyModalProps = {
  open: boolean
  onClose: () => void
  state: ApiKeyResponse
  formAction: (formData: FormData) => Promise<void>
  usdWalletId: string | undefined
  btcWalletId: string | undefined
}

const ApiKeyModal = ({
  open,
  onClose,
  state,
  formAction,
  usdWalletId,
  btcWalletId,
}: ApiKeyModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        <ModalClose variant="plain" sx={{ alignSelf: "flex-end" }} />
        <Typography
          component="h2"
          id="modal-title"
          level="h4"
          textColor="inherit"
          fontWeight="lg"
        >
          Create API key
        </Typography>
        <Typography id="modal-desc" textColor="text.tertiary" textAlign="left">
          Talk to the Blink Servers using this token.
        </Typography>

        {state?.responsePayload?.apiKeySecret ? (
          <ApiKeyResult
            apiKeySecret={state.responsePayload.apiKeySecret}
            btcWalletId={btcWalletId}
            usdWalletId={usdWalletId}
            onClose={onClose}
          />
        ) : (
          <ApiKeyForm state={state} formAction={formAction} />
        )}
      </Sheet>
    </Modal>
  )
}

export default ApiKeyModal
