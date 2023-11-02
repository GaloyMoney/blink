"use client"

import {
  Box,
  Button,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  Sheet,
  Typography,
} from "@mui/joy"
import AddIcon from "@mui/icons-material/Add"
import CopyIcon from "@mui/icons-material/CopyAll"
import { useState } from "react"

const ApiKeyCreate = () => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [apiKeySecret, setApiKeySecret] = useState("")
  const [error, setError] = useState("")

  const close = () => {
    setOpen(false)
    setName("")
    setApiKeySecret("")
    setError("")
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="solid" color="primary">
        {<AddIcon />}
      </Button>
      <Modal
        open={open}
        onClose={close}
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
            Create API Key
          </Typography>

          <Typography id="modal-desc" textColor="text.tertiary" textAlign="left">
            Talk to the Blink Servers using this token.
          </Typography>

          {apiKeySecret ? (
            <>
              <p>API Secret:</p>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 2,
                }}
              >
                <Typography fontFamily="monospace">{apiKeySecret}</Typography>
                <Button
                  variant="soft"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeySecret)
                    alert("Copied API Key to your clipboard. Keep it safe!")
                  }}
                >
                  <CopyIcon />
                </Button>
              </Box>
              <Typography variant="outlined" color="success" fontSize={14}>
                The API Key Secret will be shown only once here.
                <br /> Please save it somewhere safely!
              </Typography>
            </>
          ) : (
            <>
              <FormLabel sx={{ marginBottom: -1 }}>Name</FormLabel>

              <Input
                color={error ? "danger" : "primary"}
                disabled={false}
                variant="outlined"
                placeholder="API Key Name..."
                fullWidth
                value={name}
                onChange={(t) => setName(t.target.value)}
              />

              {error && <Typography textColor="danger.400">{error}</Typography>}
            </>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={async () => {
              if (apiKeySecret) {
                close()
                return
              }

              const r = await fetch("/api/api-keys", {
                method: "POST",
                body: JSON.stringify({ name }),
                headers: { "Content-Type": "application/json" },
              })
              if (r.ok) {
                const { secret }: { secret: string } = await r.json()
                setApiKeySecret(secret)
              } else {
                const { error }: { error: string } = await r.json()
                setError(error)
              }
            }}
            sx={{
              width: "100%",
            }}
          >
            {apiKeySecret ? "Close" : "Create"}
          </Button>
        </Sheet>
      </Modal>
    </>
  )
}

export default ApiKeyCreate
