"use client"

import { Box, Button, Modal, ModalClose, Sheet, Typography } from "@mui/joy"
import React, { useState } from "react"

type Props = {
  id: string
}

const RevokeKey = ({ id }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outlined" color="danger">
        <Typography>Revoke</Typography>
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              component="h2"
              id="modal-title"
              level="h4"
              textColor="inherit"
              fontWeight="lg"
            >
              Revoke API Key
            </Typography>
          </Box>

          <Typography id="modal-desc" textColor="text.tertiary" textAlign="left">
            WARNING! You will no longer be able to authenticate with this API Key.
          </Typography>

          <Typography id="modal-desc-2" textColor="text.tertiary" textAlign="left">
            API Key ID: {id}
          </Typography>

          <Button
            variant="solid"
            color="danger"
            onClick={async () => {
              await fetch("/api/api-keys", {
                method: "DELETE",
                body: JSON.stringify({ id }),
                headers: { "Content-Type": "application/json" },
              })
              setOpen(false)
            }}
            sx={{
              width: "100%",
            }}
          >
            Revoke
          </Button>
        </Sheet>
      </Modal>
    </>
  )
}

export default RevokeKey
