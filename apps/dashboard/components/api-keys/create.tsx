"use client"

import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Input,
  Modal,
  ModalClose,
  Sheet,
  Typography,
  Tooltip,
} from "@mui/joy"

import InfoOutlined from "@mui/icons-material/InfoOutlined"

import AddIcon from "@mui/icons-material/Add"
import CopyIcon from "@mui/icons-material/CopyAll"
import { useState } from "react"

import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line no-implicit-any error
  experimental_useFormState as useFormState,
} from "react-dom"

import FormSubmitButton from "../form-submit-button"

import { createApiKeyServerAction } from "@/app/api-keys/server-actions"

const ApiKeyCreate = () => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [state, formAction] = useFormState(createApiKeyServerAction, {
    error: null,
    message: null,
    data: null,
  })

  const handleModalClose = () => {
    setOpen(false)
    state.error = null
    state.message = null
    state.data = null
    console.log("Modal has been closed")
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="solid" color="primary">
        {<AddIcon />}
      </Button>
      <Modal
        open={open}
        onClose={handleModalClose}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 600,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
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

          {state?.data?.apiKeySecret ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  columnGap: 2,
                  backgroundColor: "neutral.solidDisabledBg",
                  padding: "0.6em",
                  borderRadius: "0.5em",
                }}
              >
                <Typography
                  sx={{
                    width: "100%",
                  }}
                  fontFamily="monospace"
                >
                  {state?.data?.apiKeySecret}
                </Typography>
                <Tooltip
                  open={copied}
                  title="Copied to Clipboard"
                  variant="plain"
                  onClick={() => {
                    setCopied(true)
                    setTimeout(() => {
                      setCopied(false)
                    }, 2000)
                    navigator.clipboard.writeText(state?.data?.apiKeySecret)
                  }}
                >
                  <CopyIcon />
                </Tooltip>
              </Box>
              <Typography
                sx={{
                  p: "1em",
                }}
                variant="outlined"
                color="success"
                fontSize={14}
              >
                The API Key Secret will be shown only once here.
                <br /> Please save it somewhere safely!
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                type="submit"
                onClick={handleModalClose}
                sx={{
                  width: "100%",
                }}
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <FormControl
                sx={{
                  width: "100%",
                }}
                error={state.error}
              >
                <form
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1em",
                  }}
                  action={formAction}
                >
                  <Input
                    name="apiKeyName"
                    id="apiKeyName"
                    sx={{
                      padding: "0.6em",
                      width: "100%",
                    }}
                    placeholder="API Key Name..."
                  />
                  {state.error ? (
                    <FormHelperText>
                      <InfoOutlined />
                      {state.message}
                    </FormHelperText>
                  ) : null}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <FormSubmitButton
                      variant="outlined"
                      color="primary"
                      type="submit"
                      sx={{
                        width: "100%",
                      }}
                    >
                      Create
                    </FormSubmitButton>
                  </Box>
                </form>
              </FormControl>
            </>
          )}
        </Sheet>
      </Modal>
    </>
  )
}

export default ApiKeyCreate
