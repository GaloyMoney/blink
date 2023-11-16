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
  Select,
  Option,
  Radio,
  RadioGroup,
} from "@mui/joy"

import InfoOutlined from "@mui/icons-material/InfoOutlined"

import AddIcon from "@mui/icons-material/Add"
import CopyIcon from "@mui/icons-material/CopyAll"
import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line no-implicit-any error
  experimental_useFormState as useFormState,
} from "react-dom"

import FormSubmitButton from "../form-submit-button"

import { createApiKeyServerAction } from "@/app/api-keys/server-actions"

const ApiKeyCreate = () => {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [state, formAction] = useFormState(createApiKeyServerAction, {
    error: null,
    message: null,
    data: null,
  })
  const [enableCustomExpiresInDays, setEnableCustomExpiresInDays] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null)

  const handleModalClose = () => {
    setOpen(false)
    setEnableCustomExpiresInDays(false)
    setExpiresInDays(null)
    state.error = null
    state.message = null
    state.data = null
    console.log("Modal has been closed")
    router.refresh()
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

          {state?.data?.apiKeySecret ? (
            <>
              <Box
                sx={{
                  maxWidth: "20em",
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
                    overflow: "scroll",
                  }}
                  fontFamily="monospace"
                >
                  {state?.data?.apiKeySecret}
                </Typography>
                <Tooltip
                  sx={{ cursor: "pointer" }}
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
                  width: "100%",
                  borderRadius: "0.5em",
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2em",
                    }}
                  >
                    <Typography>Name</Typography>
                    <Input
                      name="apiKeyName"
                      id="apiKeyName"
                      sx={{
                        padding: "0.6em",
                        width: "100%",
                      }}
                      placeholder="API Key Name *"
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2em",
                    }}
                  >
                    <Typography>Expires In</Typography>
                    <Input
                      name="apiKeyExpiresInDays"
                      id="apiKeyExpiresInDays"
                      sx={{ display: "none", padding: "0.6em" }}
                    />
                    <Select
                      sx={{
                        padding: "0.6em",
                      }}
                      placeholder="Expires In"
                      onChange={(_, v) => {
                        if (v === "custom") {
                          setEnableCustomExpiresInDays(true)
                          setExpiresInDays(30)
                        }
                        if (v && v !== "custom") setExpiresInDays(parseInt(String(v)))
                      }}
                    >
                      <Option value="30">30 days</Option>
                      <Option value="90">90 days</Option>
                      <Option value="custom">Custom</Option>
                    </Select>
                  </Box>

                  {enableCustomExpiresInDays && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        columnGap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Input
                        sx={{
                          width: "100%",
                          padding: "0.6em",
                        }}
                        onChange={(e) => {
                          if (e.target.value && parseInt(e.target.value) > 0)
                            setExpiresInDays(parseInt(e.target.value))
                          else setExpiresInDays(0)
                        }}
                        type="number"
                        value={String(expiresInDays)}
                      />
                      <Typography>days</Typography>
                    </Box>
                  )}

                  {state.error ? (
                    <FormHelperText>
                      <InfoOutlined />
                      {state.message}
                    </FormHelperText>
                  ) : null}
                  <Box>
                    <Typography>Scope</Typography>
                    <RadioGroup defaultValue="readAndWrite" name="apiScope">
                      <Radio value="readAndWrite" label="Read and Write" />
                      <FormHelperText>
                        Full access: read and write account details.
                      </FormHelperText>
                      <Radio value="readOnly" label="Read Only" />
                      <FormHelperText>Limited access: view data only.</FormHelperText>
                    </RadioGroup>
                  </Box>
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
